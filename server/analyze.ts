import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { z, ZodError } from "zod";

import { analysisSchema } from "@/lib/domain";
import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_SYSTEM_PROMPT,
  buildExperimentEvidencePrompt,
} from "@/server/prompts";

const MEBIBYTE = 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/;

export const ANALYZE_LIMITS = Object.freeze({
  maxRequestBytes: 21 * MEBIBYTE,
  maxNotesCharacters: 20_000,
  maxImages: 4,
  maxImageBytes: 5 * MEBIBYTE,
  maxTotalImageBytes: 15 * MEBIBYTE,
  allowedImageMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
});

type AllowedImageMime = (typeof ANALYZE_LIMITS.allowedImageMimeTypes)[number];

export type AnalysisErrorCode =
  | "INVALID_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "MODEL_UNAVAILABLE"
  | "MODEL_REFUSAL"
  | "EMPTY_MODEL_OUTPUT"
  | "MALFORMED_MODEL_OUTPUT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "REQUEST_TIMEOUT"
  | "REQUEST_ABORTED";

export class AnalysisError extends Error {
  readonly code: AnalysisErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AnalysisErrorCode,
    message: string,
    options: {
      status: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AnalysisError";
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

interface ParsedResponseEnvelope {
  output_parsed: unknown;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      refusal?: string | null;
    }>;
  }>;
  status?: string;
  incomplete_details?: { reason?: string | null } | null;
  _request_id?: string | null;
}

export interface ResponsesClientPort {
  responses: {
    parse: (
      request: ResponseCreateParamsNonStreaming,
      options?: { signal?: AbortSignal },
    ) => Promise<ParsedResponseEnvelope>;
  };
}

export interface SafeLogger {
  error(message: string, metadata: Record<string, unknown>): void;
}

export interface AnalyzeDependencies {
  /** Pass null in tests to explicitly simulate an unconfigured environment. */
  apiKey?: string | null;
  model?: string;
  client?: ResponsesClientPort;
  createClient?: (apiKey: string) => ResponsesClientPort;
  logger?: SafeLogger;
}

export interface AnalyzeOptions {
  signal?: AbortSignal;
  dependencies?: AnalyzeDependencies;
}

const imageDataUrlSchema = z.string().superRefine((dataUrl, context) => {
  const inspection = inspectImageDataUrl(dataUrl);

  if (!inspection.ok) {
    context.addIssue({
      code: "custom",
      message: inspection.message,
    });
    return;
  }

  if (inspection.bytes > ANALYZE_LIMITS.maxImageBytes) {
    context.addIssue({
      code: "custom",
      message: `Each image must be ${ANALYZE_LIMITS.maxImageBytes / MEBIBYTE} MiB or smaller.`,
    });
  }
});

export const analyzeRequestSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .min(1, "Experiment notes are required.")
      .max(
        ANALYZE_LIMITS.maxNotesCharacters,
        `Experiment notes may not exceed ${ANALYZE_LIMITS.maxNotesCharacters.toLocaleString()} characters.`,
      ),
    images: z
      .array(imageDataUrlSchema)
      .max(ANALYZE_LIMITS.maxImages)
      .default([]),
  })
  .strict()
  .superRefine(({ images }, context) => {
    const totalBytes = images.reduce((total, image) => {
      const inspection = inspectImageDataUrl(image);
      return total + (inspection.ok ? inspection.bytes : 0);
    }, 0);

    if (totalBytes > ANALYZE_LIMITS.maxTotalImageBytes) {
      context.addIssue({
        code: "custom",
        path: ["images"],
        message: `Combined images must be ${ANALYZE_LIMITS.maxTotalImageBytes / MEBIBYTE} MiB or smaller.`,
      });
    }
  });

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type ExperimentAnalysis = z.infer<typeof analysisSchema>;

export interface AnalyzeResult {
  analysis: ExperimentAnalysis;
  meta: {
    model: string;
    promptVersion: typeof ANALYSIS_PROMPT_VERSION;
  };
}

type ImageInspection =
  | { ok: true; mime: AllowedImageMime; bytes: number }
  | { ok: false; message: string };

function inspectImageDataUrl(dataUrl: string): ImageInspection {
  const match = IMAGE_DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    return {
      ok: false,
      message: "Images must be base64-encoded data URLs.",
    };
  }

  const mime = match[1].toLowerCase();
  if (
    !ANALYZE_LIMITS.allowedImageMimeTypes.includes(mime as AllowedImageMime)
  ) {
    return {
      ok: false,
      message: `Unsupported image type. Use ${ANALYZE_LIMITS.allowedImageMimeTypes.join(", ")}.`,
    };
  }

  const base64 = match[2];
  if (base64.length === 0 || base64.length % 4 !== 0) {
    return { ok: false, message: "Image data is not valid base64." };
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = (base64.length / 4) * 3 - padding;

  try {
    const prefixLength = Math.min(base64.length, 24);
    const prefix = Uint8Array.from(
      atob(base64.slice(0, prefixLength)),
      (character) => character.charCodeAt(0),
    );

    if (!hasExpectedImageSignature(mime as AllowedImageMime, prefix)) {
      return {
        ok: false,
        message: "Image contents do not match the declared MIME type.",
      };
    }
  } catch {
    return { ok: false, message: "Image data is not valid base64." };
  }

  return { ok: true, mime: mime as AllowedImageMime, bytes };
}

function hasExpectedImageSignature(
  mime: AllowedImageMime,
  bytes: Uint8Array,
): boolean {
  if (mime === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }

  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function defaultClientFactory(apiKey: string): ResponsesClientPort {
  const client = new OpenAI({
    apiKey,
    maxRetries: 1,
    timeout: 110_000,
  });

  return {
    responses: {
      parse: async (request, options) =>
        (await client.responses.parse(
          request,
          options,
        )) as ParsedResponseEnvelope,
    },
  };
}

function findRefusal(response: ParsedResponseEnvelope): string | undefined {
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) {
        return content.refusal;
      }
    }
  }

  return undefined;
}

function publicValidationIssues(error: ZodError): Array<{
  path: string;
  message: string;
}> {
  return error.issues.slice(0, 8).map((issue) => ({
    path: issue.path.join(".") || "request",
    message: issue.message,
  }));
}

function normalizeUpstreamError(
  error: unknown,
  signal: AbortSignal | undefined,
): AnalysisError {
  if (
    signal?.aborted ||
    getErrorName(error) === "AbortError" ||
    getErrorName(error) === "APIUserAbortError"
  ) {
    return new AnalysisError("REQUEST_ABORTED", "Analysis was cancelled.", {
      status: 499,
      retryable: true,
      cause: error,
    });
  }

  if (
    getErrorName(error) === "APIConnectionTimeoutError" ||
    getErrorName(error) === "APITimeoutError"
  ) {
    return new AnalysisError(
      "REQUEST_TIMEOUT",
      "Live analysis took too long. Please retry with fewer or smaller images.",
      { status: 504, retryable: true, cause: error },
    );
  }

  if (error instanceof ZodError || error instanceof SyntaxError) {
    return new AnalysisError(
      "MALFORMED_MODEL_OUTPUT",
      "The model returned an invalid structured result. Please retry.",
      { status: 502, retryable: true, cause: error },
    );
  }

  const upstreamStatus = getNumericProperty(error, "status");
  const upstreamCode = getStringProperty(error, "code")?.toLowerCase();

  if (upstreamStatus === 401) {
    return new AnalysisError(
      "INVALID_API_KEY",
      "Live analysis credentials were rejected. Ask the site owner to update the server secret.",
      { status: 503, cause: error },
    );
  }

  if (
    upstreamStatus === 404 ||
    upstreamCode === "model_not_found" ||
    upstreamCode === "invalid_model" ||
    upstreamCode === "unsupported_model"
  ) {
    return new AnalysisError(
      "MODEL_UNAVAILABLE",
      "GPT-5.6 is not available to this API project. Check model access and try again.",
      { status: 503, cause: error },
    );
  }

  if (upstreamStatus === 429) {
    return new AnalysisError(
      "RATE_LIMITED",
      "The analysis service is busy. Please retry shortly.",
      {
        status: 429,
        retryable: true,
        cause: error,
      },
    );
  }

  return new AnalysisError(
    "UPSTREAM_ERROR",
    "Live analysis is temporarily unavailable. Your evidence has not been lost.",
    {
      status: 502,
      retryable: upstreamStatus === undefined || upstreamStatus >= 500,
      cause: error,
    },
  );
}

function getErrorName(error: unknown): string | undefined {
  return error instanceof Error ? error.name : undefined;
}

function getNumericProperty(
  error: unknown,
  property: string,
): number | undefined {
  if (typeof error !== "object" || error === null || !(property in error))
    return undefined;
  const value = (error as Record<string, unknown>)[property];
  return typeof value === "number" ? value : undefined;
}

function getStringProperty(
  error: unknown,
  property: string,
): string | undefined {
  if (typeof error !== "object" || error === null || !(property in error))
    return undefined;
  const value = (error as Record<string, unknown>)[property];
  return typeof value === "string" ? value : undefined;
}

function safeLogFailure(
  logger: SafeLogger,
  error: AnalysisError,
  source: unknown,
): void {
  // Deliberately exclude notes, data URLs, API keys, raw model output, and raw
  // upstream messages. Request IDs are safe and useful for provider support.
  logger.error("BenchPilot analysis failed", {
    code: error.code,
    status: error.status,
    retryable: error.retryable,
    sourceName: getErrorName(source) ?? "unknown",
    upstreamStatus: getNumericProperty(source, "status"),
    requestId:
      getStringProperty(source, "request_id") ??
      getStringProperty(source, "_request_id"),
  });
}

export async function analyzeExperiment(
  input: unknown,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const requestResult = analyzeRequestSchema.safeParse(input);
  if (!requestResult.success) {
    throw new AnalysisError(
      "INVALID_REQUEST",
      "The experiment evidence is invalid.",
      {
        status: 400,
        details: { issues: publicValidationIssues(requestResult.error) },
      },
    );
  }

  const dependencies = options.dependencies ?? {};
  const apiKey =
    dependencies.apiKey === undefined
      ? process.env.OPENAI_API_KEY
      : dependencies.apiKey;

  if (!apiKey?.trim()) {
    throw new AnalysisError(
      "MISSING_API_KEY",
      "Live analysis is not configured. Use the zinc-air demo or ask the site owner to add the server credential.",
      { status: 503 },
    );
  }

  const model = dependencies.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6";
  // Construct the SDK client only after validation and the server-only
  // environment check. This module is reachable exclusively from the API route.
  const client =
    dependencies.client ??
    (dependencies.createClient ?? defaultClientFactory)(apiKey);
  const logger = dependencies.logger ?? console;
  const { notes, images } = requestResult.data;

  const request = {
    model,
    reasoning: { effort: "none" },
    instructions: ANALYSIS_SYSTEM_PROMPT,
    input: [
      {
        role: "user" as const,
        content: [
          {
            type: "input_text" as const,
            text: buildExperimentEvidencePrompt(notes, images.length),
          },
          ...images.map((imageUrl) => ({
            type: "input_image" as const,
            image_url: imageUrl,
            detail: "high" as const,
          })),
        ],
      },
    ],
    text: {
      format: zodTextFormat(analysisSchema, "benchpilot_experiment_analysis"),
    },
    max_output_tokens: 10_000,
    store: false,
  } satisfies ResponseCreateParamsNonStreaming;

  try {
    const response = await client.responses.parse(request, {
      signal: options.signal,
    });
    const refusal = findRefusal(response);

    if (refusal) {
      throw new AnalysisError(
        "MODEL_REFUSAL",
        "The model could not analyze this evidence. Revise the submission and try again.",
        { status: 422 },
      );
    }

    if (
      response.output_parsed === null ||
      response.output_parsed === undefined
    ) {
      throw new AnalysisError(
        "EMPTY_MODEL_OUTPUT",
        response.status === "incomplete"
          ? "The analysis ended before a complete result was produced. Please retry."
          : "The model returned no structured result. Please retry.",
        { status: 502, retryable: true },
      );
    }

    // The SDK parses against this schema once; this second boundary validation
    // protects callers and tests even when a client implementation is substituted.
    const validated = analysisSchema.safeParse(response.output_parsed);
    if (!validated.success) {
      throw new AnalysisError(
        "MALFORMED_MODEL_OUTPUT",
        "The model returned an invalid structured result. Please retry.",
        { status: 502, retryable: true },
      );
    }

    return {
      analysis: validated.data,
      meta: {
        model,
        promptVersion: ANALYSIS_PROMPT_VERSION,
      },
    };
  } catch (error) {
    const normalized =
      error instanceof AnalysisError
        ? error
        : normalizeUpstreamError(error, options.signal);

    if (normalized.status >= 500 || normalized.code === "RATE_LIMITED") {
      safeLogFailure(logger, normalized, error);
    }

    throw normalized;
  }
}
