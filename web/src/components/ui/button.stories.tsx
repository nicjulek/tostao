import type { Meta, StoryObj } from '@storybook/react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  args: { children: 'Importar extrato', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon'] }
  }
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {}
export const Loading: Story = { args: { loading: true, children: 'Salvando' } }

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus /> Nova transação
      </Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="ghost">Limpar filtros</Button>
      <Button variant="danger">
        <Trash2 /> Apagar
      </Button>
      <Button variant="link">Ver todas</Button>
    </div>
  )
}
