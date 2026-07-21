import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the BenchPilot no-key landing path", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>BenchPilot — Turn experiments into evidence<\/title>/i,
  );
  assert.match(html, /Messy experiment\. Clear next move\./);
  assert.match(html, /Load zinc-air demo/);
  assert.match(html, /Capture the evidence/);
  assert.match(html, /Public Build Week replay · no paid API/);
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Your site is taking shape/i,
  );
});

test("sets production evidence metadata and security-minded defaults", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(
    html,
    /Turn messy physical experiments into reproducible evidence/,
  );
  assert.match(html, /og\.png/);
  assert.match(html, /favicon\.svg/);
  assert.match(
    html,
    /Photos and rough notes are treated as evidence, never instructions/,
  );
  assert.doesNotMatch(html, /OPENAI_API_KEY\s*=/);
});
