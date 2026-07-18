import {
  ANALYZE_LIMITS,
  AnalysisError,
  analyzeExperiment,
  type AnalyzeResult,
} from "@/server/analyze";

export const runtime = "edge";

interface AnalyzeHandlerDependencies {
  analyze?: (
    input: unknown,
    options: { signal?: AbortSignal },
  ) => Promise<AnalyzeResult>;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
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

  return async function handleAnalyze(request: Request): Promise<Response> {
    try {
      const input = await readLimitedJson(request);
      const result = await analyze(input, { signal: request.signal });
      return jsonResponse(result, 200);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export const POST = createAnalyzeHandler();
