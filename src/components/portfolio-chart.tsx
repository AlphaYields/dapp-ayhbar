'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label } from 'recharts';

interface PortfolioChartProps {
  data?: Array<{ date: string; value: number; timestamp?: number }>;
  height?: string;
  currentValue?: number;
  showAxes?: boolean;
  /** Plays the initial left-to-right draw. Parent sets false on period change so the line snaps. */
  animate?: boolean;
}

const TICK = { fill: 'rgba(244,245,242,0.35)', fontSize: 10.5 };

const fmtTs = (ts: number) => new Date(Number(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function PortfolioChart({ data, height = 'h-full', showAxes = true, animate = true }: PortfolioChartProps) {
  const chartData = data && data.length > 0 ? data : [];

  // 6 evenly-spaced x ticks on a numeric time scale (even pixel spacing regardless of sample count)
  const timestamps = chartData.map((d) => d.timestamp ?? 0);
  const minTs = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTs = timestamps.length ? Math.max(...timestamps) : 0;
  const xTicks =
    maxTs > minTs ? Array.from({ length: 6 }, (_, i) => Math.round(minTs + (i * (maxTs - minTs)) / 5)) : undefined;

  if (!showAxes) {
    return (
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A6ED45" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#A6ED45" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#A6ED45"
              strokeWidth={1.5}
              fill="url(#sparkGrad)"
              dot={false}
              animationEasing="linear"
              animationDuration={640}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 36 }}>
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="rgba(255,255,255,0.05)"
            horizontalCoordinatesGenerator={(props: { offset?: { top?: number; height?: number } }) => {
              const top = props.offset?.top ?? 0;
              const h = props.offset?.height ?? 0;
              return [top, top + h / 2, top + h];
            }}
          />

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={xTicks}
            stroke="transparent"
            tick={TICK}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            padding={{ left: 6, right: 16 }}
            tickFormatter={(v) => fmtTs(Number(v))}
          />

          <YAxis
            domain={['dataMin', 'dataMax']}
            stroke="transparent"
            tick={TICK}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `${Number(v).toFixed(4)}`}
            width={54}
          >
            <Label
              value="SHARE PRICE"
              angle={-90}
              position="center"
              dx={-38}
              style={{ fill: 'rgba(244,245,242,0.32)', fontSize: 9.5, letterSpacing: '0.16em' }}
            />
          </YAxis>

          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1f22',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
            }}
            labelStyle={{ color: '#9a9a9a', fontSize: 10, marginBottom: 2 }}
            itemStyle={{ color: '#A6ED45', fontSize: 11, fontWeight: 600 }}
            labelFormatter={(label) => fmtTs(Number(label))}
            formatter={(value: any) => {
              const n = typeof value === 'number' ? value : parseFloat(value);
              return [`${n.toFixed(4)}`, 'Share Price'];
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#A6ED45"
            strokeWidth={2}
            fill="rgba(166,237,69,0.09)"
            dot={false}
            isAnimationActive={animate}
            animationEasing="linear"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
