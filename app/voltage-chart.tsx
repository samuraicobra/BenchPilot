"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { sortMeasurements, type ExperimentRun } from "@/lib/domain";

function formatDuration(seconds: number): string {
  if (seconds === 0) return "Start";
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function buildVoltageChartData(runs: ExperimentRun[]) {
  const voltages = runs.map((run) => ({
    run,
    readings: sortMeasurements(
      run.measurements.filter(
        (item): item is typeof item & { elapsedSeconds: number } =>
          item.unit === "V" && item.elapsedSeconds !== null,
      ),
    ),
  }));
  const times = [
    ...new Set(
      voltages.flatMap(({ readings }) =>
        readings.map((item) => item.elapsedSeconds),
      ),
    ),
  ].sort((a, b) => a - b);

  return times.map((elapsedSeconds) => {
    const point: Record<string, number> = { elapsedSeconds };
    for (const { run, readings } of voltages) {
      const reading = readings.find(
        (item) => item.elapsedSeconds === elapsedSeconds,
      );
      if (reading) point[run.id] = reading.value;
    }
    return point;
  });
}

export function VoltageChart({ runs }: { runs: ExperimentRun[] }) {
  const data = useMemo(() => buildVoltageChartData(runs), [runs]);
  const colors = ["#3f7081", "#83ad62", "#b77933"];

  return (
    <div
      className="chart-shell"
      role="img"
      aria-label="Voltage versus elapsed time for validated experiment runs"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 18, left: -8, bottom: 8 }}
        >
          <CartesianGrid
            stroke="#d9ddd4"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="elapsedSeconds"
            tickFormatter={(value: number) => formatDuration(value)}
            tick={{ fill: "#68736d", fontSize: 11 }}
            axisLine={{ stroke: "#c5ccc1" }}
            tickLine={false}
          />
          <YAxis
            unit=" V"
            domain={[0, "auto"]}
            tick={{ fill: "#68736d", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            labelFormatter={(value) =>
              `Elapsed: ${formatDuration(Number(value))}`
            }
            contentStyle={{
              border: "1px solid #d9ddd4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(23,51,42,.09)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          {runs.map((run, index) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.id}
              name={run.title}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              connectNulls={false}
              animationDuration={450}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
