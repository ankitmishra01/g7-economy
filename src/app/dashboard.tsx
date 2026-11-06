"use client";

import { useMemo, useState } from "react";
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
import type { Observation } from "@/lib/observations";

const SERIES = [
  { key: "inflation", label: "Inflation", color: "var(--series-1)", code: "FP.CPI.TOTL.ZG" },
  { key: "unemployment", label: "Unemployment", color: "var(--series-2)", code: "SL.UEM.TOTL.ZS" },
] as const;

type Point = { year: number; inflation?: number; unemployment?: number };

const pct = (v: number) => `${v.toFixed(1)}%`;

export default function Dashboard({ rows }: { rows: Observation[] }) {
  const countries = useMemo(() => [...new Set(rows.map((r) => r.country))].sort(), [rows]);
  const [country, setCountry] = useState(countries[0] ?? "");

  const points = useMemo(() => {
    const byYear = new Map<number, Point>();
    for (const r of rows) {
      if (r.country !== country) continue;
      const p = byYear.get(r.year) ?? { year: r.year };
      p[r.indicator] = r.value;
      byYear.set(r.year, p);
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }, [rows, country]);

  const latest = SERIES.map((s) => {
    const last = [...points].reverse().find((p) => p[s.key] !== undefined);
    return { ...s, year: last?.year, value: last?.[s.key] };
  });

  return (
    <div className="space-y-8">
      <label className="flex items-center gap-3 text-sm">
        <span className="text-[var(--text-secondary)]">Country</span>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-[var(--text-primary)]"
        >
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <section aria-label={`Inflation and unemployment, ${country}`}>
        <h2 className="mb-3 text-base font-medium">{country}: annual rate, %</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                axisLine={{ stroke: "var(--grid)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => pct(Number(v))}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                contentStyle={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
                cursor={{ stroke: "var(--text-secondary)", strokeDasharray: "3 3" }}
              />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="plainline"
                formatter={(value) => <span style={{ color: "var(--text-primary)" }}>{value}</span>}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: "var(--surface-1)", strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium">Latest values</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
              <th className="py-2 font-medium">Indicator</th>
              <th className="py-2 font-medium">Year</th>
              <th className="py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((s) => (
              <tr key={s.key} className="border-b border-[var(--border)]">
                <td className="py-2">
                  <span
                    aria-hidden
                    className="mr-2 inline-block h-0.5 w-3 align-middle"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </td>
                <td className="py-2 tabular-nums">{s.year ?? "n/a"}</td>
                <td className="py-2 text-right tabular-nums">
                  {s.value !== undefined ? pct(s.value) : "n/a"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          Source: World Bank (World Development Indicators, {SERIES.map((s) => s.code).join(", ")})
        </p>
      </section>
    </div>
  );
}
