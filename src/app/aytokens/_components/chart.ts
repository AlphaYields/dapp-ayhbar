/**
 * Share-price curve builders for the token pages.
 *
 * Two sources, same renderer:
 *  - `buildPanelChart` / `buildSparkChart` synthesize a deterministic curve
 *    from a strategy's start/end share price. Ported verbatim from the designs
 *    (`AlphaYields ayUSD/ayFLOW.dc.html`, `All ayTOKENs.dc.html`). NOT live.
 *  - `buildPanelChartFromHistory` / `buildSparkChartFromHistory` plot the real
 *    `historical_data` share-price series from `/api/vaultdata`.
 *
 * Callers prefer the history variants and fall back to the synthetic ones when
 * the API returns no usable series (offline, or a vault with no blocks yet).
 */

function smooth(x: number): number {
  return x * x * (3 - 2 * x);
}

/** One `historical_data` sample, narrowed to the fields the charts need. */
export type HistoryPoint = { unix_time: number; share_price: number };

const DAY = 86_400;

/** Days of history each timeframe tab shows; `ALL` keeps the full series. */
const FRAME_DAYS: Record<string, number | null> = {
  "7D": 7,
  "1M": 30,
  "3M": 90,
  ALL: null,
};

/**
 * Usable, chronologically-sorted share-price samples within `frameKey`'s
 * window. The window is measured back from the newest sample (not `Date.now()`)
 * so a lagging collector still renders a full-width curve. Returns `[]` when
 * there is nothing plottable, which signals callers to use the synthetic curve.
 */
export function sliceHistory(
  points: HistoryPoint[] | undefined,
  frameKey: string,
): HistoryPoint[] {
  if (!Array.isArray(points) || points.length === 0) return [];
  const clean = points
    .filter(
      (p) =>
        p &&
        Number.isFinite(p.share_price) &&
        p.share_price > 0 &&
        Number.isFinite(p.unix_time),
    )
    .sort((a, b) => a.unix_time - b.unix_time);
  if (clean.length < 2) return [];

  const days = FRAME_DAYS[frameKey] ?? null;
  if (days == null) return clean;
  const cutoff = clean[clean.length - 1].unix_time - days * DAY;
  const windowed = clean.filter((p) => p.unix_time >= cutoff);
  // A window thinner than 2 points can't draw a line — fall back to the series.
  return windowed.length >= 2 ? windowed : clean;
}

/** Even stride down to at most `max` samples, always keeping first and last. */
function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

/** Shared path builder: values → SVG line/area plus the y-axis range. */
function plot(vals: number[], W: number, H: number, padFactor: number) {
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = (hi - lo) * padFactor || 0.001;
  lo -= pad;
  hi += pad;
  const n = vals.length;
  const X = (i: number) => (i / (n - 1)) * W;
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  let line = "";
  vals.forEach((v, i) => {
    line += (i === 0 ? "M" : "L") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " ";
  });
  return { line: line.trim(), area: line + `L ${W} ${H} L 0 ${H} Z`, lo, hi, Y };
}

export type FrameParams = {
  start: number;
  end: number;
  lin: number;
  amp: number;
  freq: number;
  phase: number;
};

export type PanelChart = {
  line: string;
  area: string;
  yLabels: string[];
};

/** Large performance-panel curve (viewBox 1000×300), 48 samples. */
export function buildPanelChart(c: FrameParams): PanelChart {
  const n = 48;
  const span = c.end - c.start;
  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const base = (1 - c.lin) * smooth(u) + c.lin * u;
    const wig =
      c.amp *
      span *
      (Math.sin(u * c.freq + c.phase) * 0.6 +
        Math.sin(u * c.freq * 2.3 + c.phase * 1.7) * 0.4) *
      (1 - u * 0.55);
    vals.push(c.start + span * base + wig);
  }
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const padR = (hi - lo) * 0.12 || 0.001;
  lo -= padR;
  hi += padR;
  const W = 1000;
  const H = 300;
  const X = (i: number) => (i / (n - 1)) * W;
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  let line = "";
  vals.forEach((v, i) => {
    line += (i === 0 ? "M" : "L") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " ";
  });
  const area = line + `L ${W} ${H} L 0 ${H} Z`;
  const yLabels = [0, 1, 2, 3, 4].map((k) =>
    (hi - (k * (hi - lo)) / 4).toFixed(3),
  );
  return { line: line.trim(), area, yLabels };
}

export type SparkPoint = {
  xPct: number;
  yPx: number;
  value: string;
  date: string;
};

export type SparkChart = {
  line: string;
  area: string;
  points: SparkPoint[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Date label `i` of `n`, counting back from Jun 16 2026 (design's anchor). */
function dateFor(i: number, n: number): string {
  const end = new Date(2026, 5, 16);
  const d = new Date(end);
  d.setDate(end.getDate() - (n - 1 - i));
  return MONTHS[d.getMonth()] + " " + d.getDate();
}

/** "Jun 16"-style label for a real unix timestamp (seconds). */
function labelFor(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate();
}

/**
 * `count` evenly-spaced x-axis labels spanning a real history window, first and
 * last always included so the axis ends match the plotted curve.
 *
 * Always keeps day precision ("Jul 25"), which guarantees distinct samples get
 * distinct labels. The year is appended ("Jul 25 '26") only when the window
 * actually crosses a calendar year, where a bare month/day would be ambiguous.
 * Dropping the day to make room for a year is what produces duplicate labels
 * (e.g. two May samples both reading "May '26"), so it is never done.
 */
export function historyXLabels(
  points: HistoryPoint[],
  count: number,
): string[] {
  if (points.length === 0 || count <= 0) return [];
  const firstYear = new Date(points[0].unix_time * 1000).getUTCFullYear();
  const lastYear = new Date(
    points[points.length - 1].unix_time * 1000,
  ).getUTCFullYear();
  const crossesYear = firstYear !== lastYear;
  const n = Math.min(count, points.length);
  const step = n === 1 ? 0 : (points.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(points[Math.round(i * step)].unix_time * 1000);
    const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
    return crossesYear
      ? `${base} '${String(d.getUTCFullYear()).slice(-2)}`
      : base;
  });
}

/**
 * Performance-panel curve from the real share-price series. Same 1000×300
 * viewBox and y-label scheme as `buildPanelChart`, so the two are visually
 * interchangeable.
 */
export function buildPanelChartFromHistory(points: HistoryPoint[]): PanelChart {
  // 160 samples is well past the panel's pixel resolution but keeps the path
  // string small for long ALL-time series.
  const vals = downsample(points, 160).map((p) => p.share_price);
  const { line, area, lo, hi } = plot(vals, 1000, 300, 0.12);
  const yLabels = [0, 1, 2, 3, 4].map((k) =>
    (hi - (k * (hi - lo)) / 4).toFixed(3),
  );
  return { line, area, yLabels };
}

/**
 * Index-row sparkline from the real share-price series, with hover samples
 * carrying true values and dates. Same 380×140 viewBox as `buildSparkChart`.
 */
export function buildSparkChartFromHistory(
  points: HistoryPoint[],
  dp: number,
): SparkChart {
  const pts = downsample(points, 60);
  const vals = pts.map((p) => p.share_price);
  const { line, area, Y } = plot(vals, 380, 140, 0.14);
  const n = pts.length;
  const spark: SparkPoint[] = pts.map((p, i) => ({
    xPct: (i / (n - 1)) * 100,
    yPx: Y(p.share_price),
    value: p.share_price.toFixed(dp),
    date: labelFor(p.unix_time),
  }));
  return { line, area, points: spark };
}

/** Index-table sparkline (viewBox 380×140), 30 samples, with hover points. */
export function buildSparkChart(start: number, end: number, dp: number): SparkChart {
  const n = 30;
  const span = end - start;
  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const wig =
      span *
      0.1 *
      (Math.sin(u * 6.2) * 0.6 + Math.sin(u * 13 * 0.9) * 0.4) *
      (1 - u * 0.5);
    vals.push(start + span * smooth(u) + wig);
  }
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = (hi - lo) * 0.14 || 0.001;
  lo -= pad;
  hi += pad;
  const W = 380;
  const H = 140;
  const X = (i: number) => (i / (n - 1)) * W;
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  let line = "";
  vals.forEach((v, i) => {
    line += (i === 0 ? "M" : "L") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " ";
  });
  const points: SparkPoint[] = vals.map((v, i) => ({
    xPct: (i / (n - 1)) * 100,
    yPx: Y(v),
    value: v.toFixed(dp),
    date: dateFor(i, n),
  }));
  return { line: line.trim(), area: line + `L ${W} ${H} L 0 ${H} Z`, points };
}
