import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, Undo2, UploadCloud, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, EmptyState, ErrorState, Field, Money, PageHeader, Panel, PanelTitle, Select, Skeleton } from '@/components/ui'
import { useAccounts } from '@/features/transactions/hooks'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, formatDayMonth } from '@/lib/dates'
import { prettyDescription } from '@/lib/describe'
import { importsApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import type { ImportBatch, ImportProgress } from '@/lib/types'
import { onImportProgress } from '@/lib/useEventStream'

const ACCEPT = '.csv,.ofx,text/csv,application/x-ofx'

export default function ImportPage() {
  const accounts = useAccounts()
  const [file, setFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState<string | undefined>()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)

  const preview = useMutation({
    mutationFn: ({ file, accountId }: { file: File; accountId?: string }) => importsApi.preview(file, accountId),
    meta: { silent: true }
  })

  const start = useMutation({
    mutationFn: ({ file, accountId }: { file: File; accountId: string }) => importsApi.start(file, accountId),
    onSuccess: (batch) => {
      setBatchId(batch.id)
      setProgress({ batchId: batch.id, stage: 'received', percent: 5, message: 'Arquivo recebido' })
    }
  })

  useEffect(
    () =>
      onImportProgress((p) => {
        if (p.batchId === batchId) setProgress(p)
      }),
    [batchId]
  )

  useEffect(() => {
    if (!preview.data || accountId || !accounts.data) return
    const kind = preview.data.suggestedAccountKind
    const match = accounts.data.find((a) => a.kind === kind)
    if (match) setAccountId(match.id)
  }, [preview.data, accounts.data, accountId])

  useEffect(() => {
    if (file) preview.mutate({ file, accountId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, accountId])

  const reset = () => {
    setFile(null)
    setProgress(null)
    setBatchId(null)
    preview.reset()
    start.reset()
  }

  const done = progress?.stage === 'done' || progress?.stage === 'failed'
  const queryClient = useQueryClient()
  const polled = useQuery({
    queryKey: ['import', batchId],
    queryFn: () => importsApi.get(batchId as string),
    enabled: !!batchId && !done,
    refetchInterval: 1500
  })

  useEffect(() => {
    const b = polled.data
    if (!b || done || b.status === 'processing') return
    setProgress({
      batchId: b.id,
      stage: b.status === 'done' ? 'done' : 'failed',
      percent: 100,
      message: b.status === 'done' ? `${b.importedCount} transações importadas` : (b.error ?? 'Não foi possível concluir a importação'),
      imported: b.importedCount,
      duplicates: b.duplicateCount,
      categorized: b.categorizedCount
    })
    for (const key of [qk.imports, qk.transactionsAll, qk.reports, qk.accounts]) void queryClient.invalidateQueries({ queryKey: key })
  }, [polled.data, done, queryClient])

  return (
    <div>
      <PageHeader
        title="Importar extrato"
        description="Aceita o CSV e o OFX do Nubank e de outros bancos. Importar o mesmo arquivo de novo não duplica nada."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          {progress ? (
            <ProgressPanel progress={progress} onReset={reset} />
          ) : (
            <>
              <DropZone
                file={file}
                onFile={(f) => {
                  setFile(f)
                  setAccountId(undefined)
                }}
              />
              {file ? (
                <Panel>
                  {preview.isPending ? (
                    <div className="grid gap-3" aria-busy="true" aria-label="Lendo o arquivo">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-24" />
                    </div>
                  ) : preview.isError ? (
                    <ErrorState error={preview.error instanceof ApiError ? preview.error : new Error('Não consegui ler este arquivo')} />
                  ) : preview.data ? (
                    <div className="grid gap-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Badge tone="brand">{preview.data.label}</Badge>
                          <p className="mt-2 text-lg font-semibold text-ink">
                            {preview.data.total} transações
                            {preview.data.periodStart && preview.data.periodEnd
                              ? ` de ${formatDate(preview.data.periodStart)} a ${formatDate(preview.data.periodEnd)}`
                              : ''}
                          </p>
                          <p className="mt-1 text-sm text-ink-2">
                            Entradas <Money cents={preview.data.income} className="font-medium text-ink" /> · Saídas{' '}
                            <Money cents={Math.abs(preview.data.expense)} className="font-medium text-ink" />
                          </p>
                        </div>
                      </div>

                      <Field label="Em qual conta?" hint="Use a conta para o extrato da conta e o cartão para a fatura.">
                        {(p) => (
                          <Select
                            {...p}
                            value={accountId}
                            onValueChange={setAccountId}
                            placeholder="Escolha a conta"
                            options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                          />
                        )}
                      </Field>

                      {preview.data.duplicates ? (
                        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-ink">
                          {preview.data.duplicates === preview.data.total
                            ? 'Todas essas transações já foram importadas nesta conta.'
                            : `${preview.data.duplicates} dessas transações já estão nesta conta e serão ignoradas.`}
                        </p>
                      ) : null}

                      <div>
                        <p className="mb-2 text-sm font-medium text-ink">Primeiras linhas</p>
                        <ul className="divide-y divide-line rounded-md border border-line">
                          {preview.data.sample.map((t, i) => (
                            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                              <span className="tabular w-16 shrink-0 whitespace-nowrap text-ink-2">{formatDayMonth(t.date)}</span>
                              <span className="min-w-0 flex-1 truncate text-ink" title={t.description}>
                                {prettyDescription(t.description)}
                              </span>
                              <Money cents={t.amount} signed className="font-medium" />
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="lg"
                          disabled={!accountId || preview.data.duplicates === preview.data.total}
                          loading={start.isPending}
                          onClick={() => file && accountId && start.mutate({ file, accountId })}
                        >
                          Importar {preview.data.total - (preview.data.duplicates ?? 0)} transações
                        </Button>
                        <Button size="lg" variant="ghost" onClick={reset}>
                          Escolher outro arquivo
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Panel>
              ) : null}
            </>
          )}
          <History />
        </div>
        <NubankGuide />
      </div>
    </div>
  )
}

function DropZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (!/\.(csv|ofx)$/i.test(f.name)) {
      toast.error('Envie um arquivo .csv ou .ofx')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('O arquivo passa de 5 MB')
      return
    }
    onFile(f)
  }
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        pick(e.dataTransfer.files)
      }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
        over ? 'border-brand bg-brand-soft/50' : 'border-line bg-surface'
      )}
    >
      {file ? <FileText className="size-8 text-ink-2" aria-hidden /> : <UploadCloud className="size-8 text-ink-2" aria-hidden />}
      <div>
        <p className="font-semibold text-ink">{file ? file.name : 'Solte o arquivo do extrato aqui'}</p>
        <p className="mt-1 text-sm text-ink-2">CSV ou OFX, até 5 MB</p>
      </div>
      <Button variant="secondary" onClick={() => input.current?.click()}>
        {file ? 'Trocar arquivo' : 'Escolher arquivo'}
      </Button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Arquivo do extrato"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

const STAGES: { stage: ImportProgress['stage']; label: string }[] = [
  { stage: 'received', label: 'Arquivo lido' },
  { stage: 'deduplicating', label: 'Duplicadas removidas' },
  { stage: 'categorizing', label: 'Categorias aplicadas' },
  { stage: 'saving', label: 'Transações salvas' }
]

function ProgressPanel({ progress, onReset }: { progress: ImportProgress; onReset: () => void }) {
  const order = ['received', 'deduplicating', 'categorizing', 'saving', 'done']
  const current = order.indexOf(progress.stage)
  const failed = progress.stage === 'failed'
  const done = progress.stage === 'done'
  return (
    <Panel aria-live="polite">
      <div className="flex items-start gap-3">
        {done ? (
          <CheckCircle2 className="size-6 shrink-0 text-brand" aria-hidden />
        ) : failed ? (
          <XCircle className="size-6 shrink-0 text-danger" aria-hidden />
        ) : (
          <Loader2 className="size-6 shrink-0 animate-spin text-ink-2" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-ink">{done ? 'Importação concluída' : failed ? 'A importação falhou' : 'Importando…'}</p>
          <p className="text-sm text-ink-2">{progress.message}</p>
        </div>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-label="Progresso da importação"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', failed ? 'bg-danger' : 'bg-brand')}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <ol className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
        {STAGES.map((s, i) => (
          <li key={s.stage} className={cn('flex items-center gap-2', i < current || done ? 'text-ink' : 'text-ink-3')}>
            <CheckCircle2 className={cn('size-4', i < current || done ? 'text-brand' : 'text-line')} aria-hidden />
            {s.label}
          </li>
        ))}
      </ol>
      {done ? (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3 rounded-md bg-surface-2 p-4 text-center">
            <div>
              <dt className="text-xs text-ink-2">Novas</dt>
              <dd className="tabular text-xl font-semibold text-ink">{progress.imported ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-2">Já existiam</dt>
              <dd className="tabular text-xl font-semibold text-ink">{progress.duplicates ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-2">Categorizadas</dt>
              <dd className="tabular text-xl font-semibold text-ink">{progress.categorized ?? 0}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/">Ver resumo</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/transacoes?categoria=none">Revisar sem categoria</Link>
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Importar outro
            </Button>
          </div>
        </>
      ) : failed ? (
        <Button className="mt-5" variant="secondary" onClick={onReset}>
          Tentar de novo
        </Button>
      ) : null}
    </Panel>
  )
}

function History() {
  const queryClient = useQueryClient()
  const list = useQuery({ queryKey: qk.imports, queryFn: importsApi.list })
  const undo = useMutation({
    mutationFn: (b: ImportBatch) => importsApi.undo(b.id),
    onSuccess: (r) => {
      toast.success(`Importação desfeita: ${r.removed} transações removidas`)
      void queryClient.invalidateQueries({ queryKey: qk.imports })
      void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
      void queryClient.invalidateQueries({ queryKey: qk.reports })
      void queryClient.invalidateQueries({ queryKey: qk.accounts })
    }
  })
  return (
    <Panel>
      <PanelTitle>Importações anteriores</PanelTitle>
      {list.isPending ? (
        <Skeleton className="h-24" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.length ? (
        <EmptyState title="Nenhuma importação ainda">
          O histórico aparece aqui, e dá para desfazer uma importação inteira se algo vier errado.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {list.data.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{b.filename}</p>
                <p className="text-xs text-ink-3">
                  {b.account?.name} · {formatDate(b.createdAt.slice(0, 10))} ·{' '}
                  {b.status === 'done'
                    ? `${b.importedCount} novas, ${b.duplicateCount} repetidas`
                    : b.status === 'failed'
                      ? 'falhou'
                      : 'em andamento'}
                </p>
              </div>
              {b.status === 'done' && b.importedCount > 0 ? (
                <Button variant="ghost" size="sm" loading={undo.isPending && undo.variables?.id === b.id} onClick={() => undo.mutate(b)}>
                  <Undo2 /> Desfazer
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function NubankGuide() {
  return (
    <aside className="grid content-start gap-6">
      <Panel>
        <PanelTitle>Como exportar do Nubank</PanelTitle>
        <h3 className="text-sm font-semibold text-ink">Extrato da conta</h3>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm text-ink-2">
          <li>No app, abra a tela da Conta.</li>
          <li>Toque em “Pedir extrato” e escolha o período.</li>
          <li>Escolha o formato CSV ou OFX.</li>
          <li>O arquivo chega no seu e-mail. Baixe e solte aqui.</li>
        </ol>
        <h3 className="mt-5 text-sm font-semibold text-ink">Fatura do cartão</h3>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm text-ink-2">
          <li>Abra a fatura que quer importar.</li>
          <li>Use a opção de exportar ou enviar a fatura por e-mail em CSV.</li>
          <li>Importe na conta do cartão.</li>
        </ol>
        <p className="mt-5 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-2">
          O pagamento da fatura aparece na conta e no cartão. O Tostão marca os dois como movimentação interna, então nada é contado duas
          vezes.
        </p>
      </Panel>
      <Panel>
        <PanelTitle>Quer só testar?</PanelTitle>
        <p className="text-sm text-ink-2">
          A pasta <code className="rounded-sm bg-surface-2 px-1 py-0.5 text-ink">exemplos/</code> do projeto tem um extrato de conta, uma
          fatura e um OFX com dados inventados.
        </p>
      </Panel>
    </aside>
  )
}
