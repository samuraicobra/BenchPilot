import {
  ANALYZE_LIMITS,
  AnalysisError,
  analyzeExperiment,
  type AnalyzeResult,
} from "@/server/analyze";

import { ANALYSIS_API_CONTRACT_VERSION } from "@/lib/domain";

export const runtime = "edge";

export const ANALYZE_ROUTE_LIMITS = Object.freeze({
  maxRequestsPerWindow: 8,
  rateLimitWindowMs: 60_000,
  requestTimeoutMs: 120_000,
});

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface AnalyzeHandlerDependencies {
  analyze?: (
    input: unknown,
    options: { signal?: AbortSignal },
  ) => Promise<AnalyzeResult>;
  rateLimiter?: RateLimiter;
  timeoutMs?: number;
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-benchpilot-contract-version": ANALYSIS_API_CONTRACT_VERSION,
      ...extraHeaders,
    },
  });
}

function createRateLimiter(
  maxRequests = ANALYZE_ROUTE_LIMITS.maxRequestsPerWindow,
  windowMs = ANALYZE_ROUTE_LIMITS.rateLimitWindowMs,
): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key) {
      const now = Date.now();

      if (buckets.size > 5_000) {
        for (const [bucketKey, bucket] of buckets) {
          if (bucket.resetAt <= now) buckets.delete(bucketKey);
        }
      }

      const current = buckets.get(key);
      if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (current.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((current.resetAt - now) / 1_000),
          ),
        };
      }

      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

function requestRateLimitKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

async function readLimitedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (
      Number.isFinite(declaredBytes) &&
      declaredBytes > ANALYZE_LIMITS.maxRequestBytes
    ) {
      throw new AnalysisError(
        "PAYLOAD_TOO_LARGE",
        "The analysis request is too large.",
        {
          status: 413,
        },
      );
    }
  }

  if (!request.body) {
    throw new AnalysisError(
      "INVALID_REQUEST",
      "A JSON request body is required.",
      {
        status: 400,
      },
    );
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > ANALYZE_LIMITS.maxRequestBytes) {
      await reader.cancel("request body limit exceeded");
      throw new AnalysisError(
        "PAYLOAD_TOO_LARGE",
        "The analysis request is too large.",
        {
          status: 413,
        },
      );
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  const body = chunks.join("");
  if (!body.trim()) {
    throw new AnalysisError(
      "INVALID_REQUEST",
      "A JSON request body is required.",
      {
        status: 400,
      },
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new AnalysisError(
      "INVALID_REQUEST",
      "The request body must be valid JSON.",
      {
        status: 400,
        cause: error,
      },
    );
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof AnalysisError) {
    const retryAfter = error.details?.retryAfterSeconds;
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      error.status,
      typeof retryAfter === "number"
        ? { "retry-after": String(retryAfter) }
        : {},
    );
  }

  console.error("BenchPilot route failed", {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return jsonResponse(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "The analysis request could not be completed.",
        retryable: true,
      },
    },
    500,
  );
}

export function createAnalyzeHandler(
  dependencies: AnalyzeHandlerDependencies = {},
): (request: Request) => Promise<Response> {
  const analyze =
    dependencies.analyze ??
    ((input, options) => analyzeExperiment(input, options));
  const rateLimiter = dependencies.rateLimiter ?? createRateLimiter();
  const timeoutMs =
    dependencies.timeoutMs ?? ANALYZE_ROUTE_LIMITS.requestTimeoutMs;

  return async function handleAnalyze(request: Request): Promise<Response> {
    if (
      request.headers.get("x-benchpilot-contract-version") !==
      ANALYSIS_API_CONTRACT_VERSION
    ) {
      return errorResponse(
        new AnalysisError(
          "CLIENT_UPDATE_REQUIRED",
          "BenchPilot was updated. Refresh this page, then retry; your notes and images are still here.",
          { status: 409 },
        ),
      );
    }

    const rateLimit = rateLimiter.check(requestRateLimitKey(request));
    if (!rateLimit.allowed) {
      return errorResponse(
        new AnalysisError(
          "RATE_LIMITED",
          "Too many analysis requests. Please retry shortly.",
          {
            status: 429,
            retryable: true,
            details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
          },
        ),
      );
    }

    const analysisController = new AbortController();
    const abortFromRequest = () =>
      analysisController.abort(request.signal.reason);
    request.signal.addEventListener("abort", abortFromRequest, { once: true });

    let timedOut = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        timedOut = true;
        analysisController.abort();
        reject(
          new AnalysisError(
            "REQUEST_TIMEOUT",
            "Live analysis took too long. Please retry with fewer or smaller images.",
            { status: 504, retryable: true },
          ),
        );
      }, timeoutMs);
    });

    try {
      const input = await readLimitedJson(request);
      const result = await Promise.race([
        analyze(input, { signal: analysisController.signal }),
        timeoutPromise,
      ]);
      return jsonResponse(result, 200);
    } catch (error) {
      if (timedOut) {
        return errorResponse(
          new AnalysisError(
            "REQUEST_TIMEOUT",
            "Live analysis took too long. Please retry with fewer or smaller images.",
            { status: 504, retryable: true },
          ),
        );
      }
      return errorResponse(error);
    } finally {
      if (timeout) clearTimeout(timeout);
      request.signal.removeEventListener("abort", abortFromRequest);
    }
  };
}

export const POST = createAnalyzeHandler();
