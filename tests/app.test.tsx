// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BenchPilotApp } from "@/app/benchpilot-app";
import { loadDemoAnalysis } from "@/lib/demo";
import { ANALYSIS_API_CONTRACT_VERSION } from "@/lib/domain";

describe("BenchPilot demo workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the complete no-key demo and exposes all workflow stages", async () => {
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));

    expect(screen.getByRole("tab", { name: /capture/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /structure/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /challenge/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /test/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /compare/i })).toBeInTheDocument();
    expect(
      screen.getByText(/question under investigation/i),
    ).toBeInTheDocument();
  });

  it("updates the Hypothesis Matrix without adding a simulated chart measurement", async () => {
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));
    fireEvent.click(screen.getByRole("tab", { name: /challenge/i }));

    const update = screen.getByRole("button", {
      name: /add simulated measurement/i,
    });
    fireEvent.click(update);
    expect(screen.getAllByText(/matrix updated/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /add simulated measurement/i }),
    ).not.toBeInTheDocument();
  });

  it("compares the latest real run without inventing time or causal certainty", async () => {
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));
    fireEvent.click(screen.getByRole("tab", { name: /compare/i }));

    expect(
      screen.getByText(/1 validated reading with unrecorded elapsed time/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: /causal attribution warning/i }),
    ).toHaveTextContent(/load current/i);
    expect(
      screen.getByRole("note", { name: /causal attribution warning/i }),
    ).toHaveTextContent(/cathode thickness/i);
    expect(
      screen.getByText(/1\.692 V fresh open circuit/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/approximately 1\.10 V; elapsed time not recorded/i),
    ).toBeInTheDocument();
  });
  it("sends the current analysis contract version with live requests", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ analysis: loadDemoAnalysis() }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<BenchPilotApp />);
    fireEvent.change(
      screen.getByPlaceholderText(/paste readings, materials/i),
      {
        target: { value: "Open-circuit voltage was 1.62 V." },
      },
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /analyze evidence/i }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(
      new Headers(requestInit?.headers).get("x-benchpilot-contract-version"),
    ).toBe(ANALYSIS_API_CONTRACT_VERSION);
  });
});
