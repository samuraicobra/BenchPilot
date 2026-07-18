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
});
