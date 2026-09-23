import { useState } from 'react'
import { formatBRL, formatCompact } from '@/lib/money'
import { ChartTooltip } from './Tooltip'
import { niceMax, useWidth } from './useSize'

interface Props {
  points: { day: number; value: number }[]
  budget?: number | null
  lastDay: number
  today?: number | null
  color: string
  title: string
  height?: number
}

const PAD = { top: 14, right: 12, bottom: 26, left: 66 }

export function CumulativeLine({ points, budget, lastDay, today, color, title, height = 220 }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const visible = today ? points.filter((p) => p.day <= today) : points
  const max = niceMax(Math.max(1, budget ?? 0, ...visible.map((p) => p.value)))
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom
  const x = (day: number) => PAD.left + ((day - 1) / Math.max(1, lastDay - 1)) * innerW
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const line = visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const area = visible.length ? `${line}L${x(visible[visible.length - 1].day)},${y(0)}L${x(visible[0].day)},${y(0)}Z` : ''
  const ticks = [0, 0.5, 1].map((t) => t * max)
  const hovered = hover !== null ? visible.find((p) => p.day === hover) : undefined

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const day = Math.round(((e.clientX - rect.left - PAD.left) / innerW) * (lastDay - 1)) + 1
    setHover(Math.min(Math.max(day, 1), visible.length ? visible[visible.length - 1].day : 1))
  }

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 ? (
          <svg width={width} height={height} role="img" aria-label={title} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
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
            {budget ? (
              <g>
                <line x1={x(1)} y1={y(0)} x2={x(lastDay)} y2={y(budget)} stroke="var(--ink-3)" strokeDasharray="4 4" strokeWidth={1.5} />
                <text x={x(lastDay)} y={y(budget) - 6} textAnchor="end" className="fill-ink-2 text-[11px]">
                  ritmo do orçamento
                </text>
              </g>
            ) : null}
            <path d={area} fill={color} opacity={0.12} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {[1, Math.ceil(lastDay / 2), lastDay].map((d) => (
              <text
                key={d}
                x={x(d)}
                y={height - 8}
                textAnchor={d === 1 ? 'start' : d === lastDay ? 'end' : 'middle'}
                className="fill-ink-2 text-[11px]"
              >
                dia {d}
              </text>
            ))}
            {hovered ? (
              <g>
                <line x1={x(hovered.day)} x2={x(hovered.day)} y1={PAD.top} y2={y(0)} stroke="var(--ink-3)" />
                <circle cx={x(hovered.day)} cy={y(hovered.value)} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
              </g>
            ) : null}
          </svg>
        ) : null}
        {hovered ? (
          <ChartTooltip x={x(hovered.day)} y={y(hovered.value)} width={width}>
            <p className="font-medium text-ink">Até o dia {hovered.day}</p>
            <p className="tabular text-ink-2">{formatBRL(hovered.value)} gastos</p>
          </ChartTooltip>
        ) : null}
      </div>
    </figure>
  )
}
