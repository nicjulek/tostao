import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button, Field, Input } from '@/components/ui'
import { ApiError } from '@/lib/api'
import { authApi } from '@/lib/endpoints'
import { useAuth } from './context'

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha')
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Seu nome precisa ter pelo menos 2 letras').max(80),
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres').max(72)
})

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand p-12 text-brand-ink lg:flex lg:flex-col lg:justify-between">
        <p className="text-lg font-semibold tracking-tight">Tostão</p>
        <div className="max-w-md">
          <p className="text-[3.25rem] font-semibold leading-[1.02] tracking-[-0.035em]">Cada tostão no lugar certo.</p>
          <p className="mt-5 text-lg leading-relaxed opacity-85">
            Exporte o extrato do Nubank, solte aqui e veja para onde foi seu dinheiro, categoria por categoria.
          </p>
        </div>
        <p className="text-sm opacity-70">Seus dados ficam no seu servidor. Nada é enviado para terceiros.</p>
        <svg className="pointer-events-none absolute -right-24 -top-24 size-[420px] opacity-[0.08]" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M36 36h28M50 36v32" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <p className="mb-8 text-lg font-semibold tracking-tight text-ink lg:hidden">Tostão</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}

export function LoginPage() {
  const { signIn } = useAuth()
  const location = useLocation()
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const login = useMutation({
    mutationFn: authApi.login,
    meta: { silent: true },
    onSuccess: (result) => signIn(result, (location.state as { from?: string } | null)?.from ?? '/')
  })
  const error = login.error instanceof ApiError ? login.error.message : login.error ? 'Não foi possível entrar' : null

  return (
    <AuthShell title="Entrar" subtitle="Bom te ver de novo.">
      <form className="grid gap-4" noValidate onSubmit={form.handleSubmit((v) => login.mutate(v))}>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" {...p} {...form.register('email')} />}
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          {(p) => <Input type="password" autoComplete="current-password" {...p} {...form.register('password')} />}
        </Field>
        {error ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={login.isPending} className="mt-2">
          Entrar
        </Button>
        <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-2">
          Conta de demonstração: <strong className="text-ink">demo@tostao.app</strong> / <strong className="text-ink">demo12345</strong>
        </p>
        <p className="text-sm text-ink-2">
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="font-medium text-ink underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { signIn } = useAuth()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' }
  })
  const register = useMutation({
    mutationFn: authApi.register,
    meta: { silent: true },
    onSuccess: (result) => signIn(result, '/importar'),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) form.setError('email', { message: error.message })
    }
  })
  const error = register.error instanceof ApiError && register.error.status !== 409 ? register.error.message : null

  return (
    <AuthShell title="Criar conta" subtitle="Leva menos de um minuto. Depois é só importar o primeiro extrato.">
      <form className="grid gap-4" noValidate onSubmit={form.handleSubmit((v) => register.mutate(v))}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          {(p) => <Input autoComplete="given-name" {...p} {...form.register('name')} />}
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" {...p} {...form.register('email')} />}
        </Field>
        <Field label="Senha" hint="Pelo menos 8 caracteres." error={form.formState.errors.password?.message}>
          {(p) => <Input type="password" autoComplete="new-password" {...p} {...form.register('password')} />}
        </Field>
        {error ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={register.isPending} className="mt-2">
          Criar conta
        </Button>
        <p className="text-sm text-ink-2">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-medium text-ink underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
