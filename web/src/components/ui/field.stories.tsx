import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Field, Input, Textarea } from './field'
import { Select } from './select'

const meta: Meta = { title: 'Design System/Form' }
export default meta

function FieldsDemo() {
  const [kind, setKind] = useState('expense')
  return (
    <div className="grid max-w-sm gap-4">
      <Field label="Descrição" hint="Como aparece no extrato.">
        {(p) => <Input placeholder="Ex.: Almoço" {...p} />}
      </Field>
      <Field label="Valor (R$)" error="Informe um valor maior que zero, como 45,90">
        {(p) => <Input className="tabular" defaultValue="0" {...p} />}
      </Field>
      <Field label="Tipo">
        {(p) => (
          <Select
            {...p}
            value={kind}
            onValueChange={setKind}
            options={[
              { value: 'expense', label: 'Gasto' },
              { value: 'income', label: 'Entrada' }
            ]}
          />
        )}
      </Field>
      <Field label="Observações">{(p) => <Textarea rows={3} {...p} />}</Field>
    </div>
  )
}

export const Fields: StoryObj = { render: () => <FieldsDemo /> }
