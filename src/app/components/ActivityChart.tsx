import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 81 },
  { day: "Fri", value: 73 },
  { day: "Sat", value: 48 },
  { day: "Sun", value: 90 },
];

export function ActivityChart() {
  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Activity</p>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Last 7 days</p>
        </div>
        <span
          className="rounded px-2 py-0.5"
          style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--accent)", color: "var(--muted-foreground)" }}
        >
          +18.4%
        </span>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="activityChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b8cff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6b8cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--foreground)",
              }}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6b8cff"
              strokeWidth={1.5}
              fill="url(#activityChartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
