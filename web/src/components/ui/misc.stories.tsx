import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { BudgetBar } from './budget-bar'
import { Badge, CategoryDot, EmptyState, ErrorState, Money, Panel, PanelTitle, Skeleton } from './misc'

const meta: Meta = { title: 'Design System/Feedback e dados' }
export default meta

export const Valores: StoryObj = {
  render: () => (
    <div className="grid gap-2 text-lg">
      <Money cents={-4590} signed />
      <Money cents={320000} signed />
      <Money cents={123456} />
    </div>
  )
}

export const Orcamento: StoryObj = {
  render: () => (
    <Panel className="grid max-w-md gap-5">
      <PanelTitle>Para onde foi o dinheiro</PanelTitle>
      {[
        { name: 'Alimentação', color: '#d9824b', spent: 21000, budget: 45000 },
        { name: 'Assinaturas', color: '#8a5cc2', spent: 7900, budget: 9000 },
        { name: 'Mercado', color: '#6c9a3c', spent: 96700, budget: 60000 }
      ].map((c) => (
        <div key={c.name} className="grid gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <CategoryDot color={c.color} />
              {c.name}
            </span>
            <span className="tabular">
              <Money cents={c.spent} /> de <Money cents={c.budget} />
            </span>
          </div>
          <BudgetBar spent={c.spent} budget={c.budget} color={c.color} />
        </div>
      ))}
    </Panel>
  )
}

export const Estados: StoryObj = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <div className="flex gap-2">
        <Badge>neutro</Badge>
        <Badge tone="brand">Extrato da conta Nubank</Badge>
        <Badge tone="warning">perto do limite</Badge>
        <Badge tone="danger">acima do orçamento</Badge>
      </div>
      <EmptyState title="Nenhuma transação neste mês" action={<Button>Importar extrato</Button>}>
        Importe o extrato do banco ou adicione uma transação à mão.
      </EmptyState>
      <ErrorState error={new Error('Sem conexão com o servidor. Confira se a API está rodando.')} onRetry={() => undefined} />
      <Skeleton className="h-16" />
    </div>
  )
}
