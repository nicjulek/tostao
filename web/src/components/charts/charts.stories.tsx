import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from '../ui'
import { CumulativeLine } from './CumulativeLine'
import { GroupedBars } from './GroupedBars'

const meta: Meta = { title: 'Gráficos' }
export default meta

export const EntradasESaidas: StoryObj = {
  render: () => (
    <Panel className="max-w-2xl">
      <GroupedBars
        title="Entradas e saídas por mês"
        series={[
          { key: 'income', label: 'Entradas', color: 'var(--income)' },
          { key: 'expense', label: 'Saídas', color: 'var(--expense)' }
        ]}
        data={['mai', 'jun', 'jul', 'ago', 'set', 'out'].map((label, i) => ({
          label,
          values: { income: 320000 + i * 4000, expense: -(210000 + ((i * 37) % 7) * 12000) }
        }))}
      />
    </Panel>
  )
}

export const GastoAcumulado: StoryObj = {
  render: () => (
    <Panel className="max-w-2xl">
      <CumulativeLine
        title="Gasto acumulado"
        lastDay={31}
        today={22}
        budget={250000}
        color="var(--expense)"
        points={Array.from({ length: 31 }, (_, i) => ({ day: i + 1, value: Math.round((i + 1) * 7600 + Math.sin(i) * 9000) }))}
      />
    </Panel>
  )
}
