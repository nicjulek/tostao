import { useState } from 'react'
import { formatBRL, formatCompact } from '@/lib/money'
import { ChartTooltip } from './Tooltip'
import { niceMax, useWidth } from './useSize'

export interface BarSeries {
  key: string
  label: string
  color: string
}

interface Props {
  data: { label: string; values: Record<string, number> }[]
  series: BarSeries[]
  height?: number
  title: string
}

const PAD = { top: 12, right: 8, bottom: 26, left: 66 }

export function GroupedBars({ data, series, height = 220, title }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => Math.abs(d.values[s.key] ?? 0)))))
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom
  const group = data.length ? innerW / data.length : 0
  const gap = 2
  const barW = Math.max(4, Math.min(28, (group * 0.62 - gap * (series.length - 1)) / series.length))
  const y = (v: number) => PAD.top + innerH - (Math.abs(v) / max) * innerH
  const ticks = [0, 0.5, 1].map((t) => t * max)

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-2" aria-hidden>
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 ? (
          <svg width={width} height={height} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--line)"
                  strokeDasharray={t === 0 ? undefined : '2 4'}
                />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular">
                  {formatCompact(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const gx = PAD.left + i * group + (group - (barW * series.length + gap * (series.length - 1))) / 2
              return (
                <g key={d.label}>
                  {hover === i ? <rect x={PAD.left + i * group} y={PAD.top} width={group} height={innerH} fill="var(--surface-2)" /> : null}
                  {series.map((s, k) => {
                    const v = Math.abs(d.values[s.key] ?? 0)
                    const top = y(v)
                    const h = Math.max(0, PAD.top + innerH - top)
                    const r = Math.min(4, barW / 2, h)
                    const x = gx + k * (barW + gap)
                    return h > 0 ? (
                      <path
                        key={s.key}
                        d={`M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top + r}V${top + h}Z`}
                        fill={s.color}
                      />
                    ) : null
                  })}
                  <text
                    x={PAD.left + i * group + group / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-ink-2 text-[11px] capitalize"
                  >
                    {d.label}
                  </text>
                  <rect
                    x={PAD.left + i * group}
                    y={PAD.top}
                    width={group}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    aria-label={`${d.label}: ${series.map((s) => `${s.label} ${formatBRL(Math.abs(d.values[s.key] ?? 0))}`).join(', ')}`}
                  />
                </g>
              )
            })}
          </svg>
        ) : null}
        {hover !== null && data[hover] ? (
          <ChartTooltip
            x={PAD.left + hover * group + group / 2}
            y={y(Math.max(...series.map((s) => Math.abs(data[hover].values[s.key] ?? 0))))}
            width={width}
          >
            <p className="mb-1 font-medium capitalize text-ink">{data[hover].label}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="tabular text-ink">{formatBRL(Math.abs(data[hover].values[s.key] ?? 0))}</span>
              </p>
            ))}
          </ChartTooltip>
        ) : null}
      </div>
    </figure>
  )
}
