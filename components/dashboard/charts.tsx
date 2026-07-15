"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const COLORS: Record<string, string> = {
  blue: "#3563eb", green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  violet: "#8b5cf6", slate: "#64748b", gray: "#9ca3af",
};

export function StatusDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[d.color] ?? "#64748b"} />)}
        </Pie>
        <Tooltip formatter={(v: number, n: string) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBar({
  data, color = "blue", height = 220,
}: {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" fill={COLORS[color]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[d.color] ?? "#ef4444"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
