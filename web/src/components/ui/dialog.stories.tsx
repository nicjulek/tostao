import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'
import { Field, Input } from './field'

const meta: Meta = { title: 'Design System/Dialog' }
export default meta

function DialogDemo() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Nova regra"
        description="Quando a descrição combinar com o texto, a transação entra na categoria escolhida."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setOpen(false)}>Criar regra</Button>
          </>
        }
      >
        <Field label="Texto">{(p) => <Input placeholder="Ex.: ifood" {...p} />}</Field>
      </Dialog>
    </>
  )
}

export const Basico: StoryObj = { render: () => <DialogDemo /> }
