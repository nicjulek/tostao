import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/lib/telemetry'
import { Button } from '@/components/ui'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(Object.assign(error, { stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}` }), 'react.render')
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md px-5">
        <h1 className="text-2xl font-semibold text-ink">Esta tela quebrou</h1>
        <p className="mt-2 text-sm text-ink-2">O erro foi registrado. Recarregue a página para continuar de onde parou.</p>
        <Button className="mt-6" onClick={() => location.reload()}>
          Recarregar
        </Button>
      </div>
    )
  }
}
