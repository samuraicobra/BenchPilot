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
    ).toHaveTextContent(/fan current/i);
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
  it("replays validated analysis without invoking fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<BenchPilotApp />);
    fireEvent.change(
      screen.getByPlaceholderText(/paste readings, materials/i),
      { target: { value: "A".repeat(20_000) } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /replay demo analysis/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Build Week demo replay · validated GPT-5.6 evidence/i),
    ).toBeInTheDocument();
  });

  it("supports arrow-key navigation through the workflow tabs", async () => {
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));

    const capture = screen.getByRole("tab", { name: /capture/i });
    capture.focus();
    fireEvent.keyDown(capture, { key: "ArrowRight" });
    await act(async () => vi.runAllTimersAsync());

    const structure = screen.getByRole("tab", { name: /structure/i });
    expect(structure).toHaveAttribute("aria-selected", "true");
    expect(structure).toHaveFocus();
  });

  it("exports a report containing the displayed validated values", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));

    fireEvent.click(
      screen.getAllByRole("button", { name: /experiment report|report/i })[0],
    );
    const report = screen.getByRole("dialog", {
      name: /latest sustained output/i,
    });
    expect(report).toHaveTextContent("1.692 V");
    expect(report).toHaveTextContent("1.1 V");
    fireEvent.click(screen.getByRole("button", { name: /print \/ save PDF/i }));
    expect(print).toHaveBeenCalledOnce();
  });

  it("shows the transient and calculation limits without overstating evidence", async () => {
    render(<BenchPilotApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /load zinc-air demo/i }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(450));
    fireEvent.click(screen.getByRole("tab", { name: /structure/i }));

    expect(screen.getByText(/minimum near -0\.460 V/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not evidence of proven cell reversal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /current, internal resistance, and output power cannot be calculated/i,
      ),
    ).toBeInTheDocument();
  });
});
