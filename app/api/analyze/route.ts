export const runtime = "edge";

const PUBLIC_DEMO_ERROR = Object.freeze({
  error: {
    code: "PUBLIC_DEMO_ONLY",
    message:
      "This public Build Week replay does not run paid analysis. Load the validated zinc-air demo to explore the complete workflow.",
    retryable: false,
  },
});

function disabledAnalysisResponse(): Response {
  return new Response(JSON.stringify(PUBLIC_DEMO_ERROR), {
    status: 403,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

/**
 * The public Build Week project is intentionally compiled without importing
 * the OpenAI SDK or the live analysis service. UI controls are not the security
 * boundary: every direct request is rejected here without reading its body.
 */
export async function POST(): Promise<Response> {
  return disabledAnalysisResponse();
}

export async function GET(): Promise<Response> {
  return disabledAnalysisResponse();
}
