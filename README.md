# Tostão

Finanças pessoais a partir do extrato do banco. Você exporta o CSV ou OFX do Nubank, solta no app, e ele separa tudo por categoria, mostra para onde foi o dinheiro, encontra suas assinaturas e avisa por e-mail antes de cada cobrança.

![Resumo do mês](docs/resumo.webp)

## Funcionalidades

- **Importação de extratos**: reconhece sozinho o extrato da conta Nubank (CSV), a fatura do cartão Nubank (CSV), OFX de qualquer banco e CSV genérico com colunas em português. Mostra uma prévia antes de importar e **nunca duplica** ao importar o mesmo arquivo de novo.
- **Importação em tempo real**: o processamento roda em segundo plano, orientado a eventos, e a tela acompanha cada etapa por Server-Sent Events.
- **Categorização automática**: palavras-chave para os serviços mais comuns no Brasil (iFood, Uber, 99, Spotify, Netflix, Mercado Livre, farmácias, contas de luz e água…) e **regras suas** com prioridade sobre as automáticas.
- **Sem contar duas vezes**: pagamento de fatura, aplicação e resgate viram "movimentação interna" e ficam fora dos totais.
- **Resumo do mês**: uma frase com entradas, saídas e o que sobrou, comparação com o mês anterior, gastos por categoria com orçamento, gasto acumulado contra o ritmo do orçamento e onde você mais gastou.
- **Assinaturas e contas fixas**: detecta cobranças que se repetem por pelo menos 3 meses com valor parecido e calcula a próxima data.
- **Avisos por e-mail e no app**: 2 dias antes de cada cobrança e quando uma assinatura fica mais cara.
- **Transações**: busca, filtros na URL, lista virtualizada (milhares de linhas sem travar), recategorização na linha com atualização otimista, seleção em lote e "criar regra a partir desta transação".
- **Desfazer importação** inteira com um clique.
- Tema claro e escuro, responsivo, navegável por teclado.

| Transações | Importar |
| --- | --- |
| ![Transações](docs/transacoes.webp) | ![Importar](docs/importar.webp) |

| Assinaturas e avisos | Tema escuro |
| --- | --- |
| ![Assinaturas](docs/assinaturas.webp) | ![Tema escuro](docs/escuro.webp) |

<p align="center"><img src="docs/celular.webp" alt="Tostão no celular" width="300" /></p>

## Stack

| Camada | Tecnologias |
| --- | --- |
| Front-end | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, TanStack Virtual, React Hook Form, Zod |
| Design System | Componentes próprios sobre Radix UI e `class-variance-authority`, tokens de cor e tipografia, documentação no Storybook |
| Back-end | NestJS 10 (controllers, services, módulos, DTOs, guards), TypeORM, PostgreSQL |
| Eventos e tempo real | `@nestjs/event-emitter`, Server-Sent Events, tarefas agendadas com `@nestjs/schedule` |
| Observabilidade | Logs estruturados com Pino e `x-request-id`, Web Vitals e erros do front enviados para a API, ErrorBoundary, health check |
| Testes | Jest e Supertest (API), Vitest, Testing Library e MSW (front), Playwright (ponta a ponta, desktop e celular) |
| Qualidade e entrega | ESLint, Prettier, GitHub Actions, Docker multi-stage |

## Arquitetura

```
tostao/
├── api/                    NestJS
│   ├── src/
│   │   ├── common/         guards, decorators, utilitários (dinheiro, datas, texto)
│   │   ├── config/         validação das variáveis de ambiente
│   │   ├── database/       data source, migrations, seed
│   │   └── modules/
│   │       ├── auth/            cadastro, login, JWT
│   │       ├── accounts/        contas e saldos
│   │       ├── categories/      categorias, orçamentos e palavras-chave padrão
│   │       ├── transactions/    listagem com filtros, edição, lote
│   │       ├── imports/         parsers, prévia, processamento por eventos
│   │       ├── rules/           regras do usuário e categorizador
│   │       ├── reports/         resumo, tendência, recorrências
│   │       ├── notifications/   avisos, e-mail, tarefa diária
│   │       ├── realtime/        stream SSE por usuário
│   │       ├── telemetry/       Web Vitals e erros do front
│   │       └── health/
│   └── test/               testes de integração com banco real
├── web/                    React
│   ├── src/
│   │   ├── app/            rotas, layout, guards, error boundary
│   │   ├── components/
│   │   │   ├── ui/         Design System (Button, Field, Select, Dialog…)
│   │   │   └── charts/     gráficos em SVG com tooltip
│   │   ├── features/       uma pasta por tela: páginas, hooks e componentes
│   │   ├── lib/            cliente HTTP tipado, query keys, telemetria, SSE
│   │   └── styles/         tokens do tema claro e escuro
│   ├── e2e/                Playwright
│   └── .storybook/
├── exemplos/               extratos de exemplo com dados inventados
└── docker-compose.yml
```

Cada módulo da API segue `controller → service → repository (TypeORM)`, com DTOs validados por `class-validator`. Toda consulta filtra pelo usuário logado, e acessar dado de outra pessoa devolve 404.

### Fluxo de importação

```mermaid
sequenceDiagram
  participant W as Web
  participant C as ImportsController
  participant E as EventEmitter
  participant P as ImportProcessor
  participant A as RecurringAlerts
  W->>C: POST /imports (arquivo + conta)
  C->>C: detecta o formato e valida
  C-->>W: 201 { status: processing }
  C->>E: import.requested
  E->>P: deduplica, categoriza e salva
  P-->>W: SSE: progresso de cada etapa
  P->>E: transactions.imported
  E->>A: confere se alguma assinatura ficou mais cara
  A-->>W: SSE + e-mail: aviso
```

## Como rodar

Requisitos: **Node 20+** e **Docker Desktop** aberto.

```bash
npm install
cp api/.env.example api/.env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

No PowerShell, troque o `cp` por `copy api\.env.example api\.env`.

| Endereço | O que é |
| --- | --- |
| http://localhost:5173 | o app |
| http://localhost:3000/api/docs | documentação da API (Swagger) |
| http://localhost:6006 | Storybook (`npm run storybook`) |

Conta de demonstração: **demo@tostao.app** / **demo12345**.

## Testando com o seu Nubank

1. No app do Nubank, abra a **Conta**, toque em **Pedir extrato**, escolha o período e o formato **CSV** ou **OFX**. O arquivo chega no seu e-mail.
2. No Tostão, crie sua conta e vá em **Importar**.
3. Solte o arquivo, confira a prévia, escolha a conta e importe.
4. Para o cartão, importe a fatura em CSV na conta "Cartão de crédito".
5. Revise as transações sem categoria e crie regras para as que se repetem.

Seus dados ficam só no seu PostgreSQL. A pasta `extratos/` está no `.gitignore`, então você pode guardar seus arquivos reais nela sem risco de subir para o GitHub.

## Avisos por e-mail

Os avisos sempre aparecem no sininho do app. Para também receber por e-mail com o Gmail:

1. Ative a verificação em duas etapas na sua Conta Google.
2. Em **Segurança → Senhas de app**, crie uma senha para o Tostão.
3. No `api/.env`, preencha (o `@` do e-mail vira `%40`):

```env
SMTP_URL=smtps://seuemail%40gmail.com:senhadeapp@smtp.gmail.com:465
MAIL_FROM="Tostão <seuemail@gmail.com>"
```

4. Reinicie com `npm run dev` e use **Assinaturas → Enviar e-mail de teste**.

A verificação roda todo dia às 8h (horário de Brasília) e depois de cada importação. O botão **Verificar agora** faz a mesma checagem na hora.

## Testes

```bash
npm test                      # unitários da API e do front
npm run test:e2e -w api       # integração da API com PostgreSQL
npm run test:e2e -w web       # Playwright no desktop e no celular
npm run lint
npm run typecheck
npm run format:check
```

Os testes de integração usam o banco `tostao_test`, criado automaticamente pelo `docker-compose`.

## API

Todas as rotas ficam em `/api` e, menos as de autenticação, saúde e telemetria, exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Cadastro e login |
| GET | `/auth/me` | Usuário atual |
| GET, POST, PATCH, DELETE | `/accounts` | Contas com saldo |
| GET, POST, PATCH, DELETE | `/categories` | Categorias e orçamento mensal |
| GET | `/transactions` | Filtros: `from`, `to`, `accountId`, `categoryId` (ou `none`), `type`, `search`, paginação |
| POST, PATCH, DELETE | `/transactions/:id` | Transações manuais e edição |
| PATCH | `/transactions/bulk/category` | Recategorizar em lote |
| POST | `/imports/preview` | Prévia do arquivo |
| POST | `/imports` | Importa (processamento por eventos) |
| GET, DELETE | `/imports/:id` | Status e desfazer |
| GET, POST, PATCH, DELETE | `/rules` | Regras de categorização |
| POST | `/rules/apply` | Reaplica as regras em tudo |
| GET | `/reports/summary`, `/reports/trend`, `/reports/recurring` | Relatórios do mês |
| GET, PATCH | `/notifications` | Avisos e marcar como lido |
| POST | `/notifications/check`, `/notifications/test-email` | Checagem manual e e-mail de teste |
| GET | `/stream?token=` | Eventos em tempo real (SSE) |
| POST | `/telemetry` | Web Vitals e erros do front |
| GET | `/health` | Saúde da API e do banco |

## Deploy

Em produção a API também entrega o front, então é um único serviço:

```bash
docker compose --profile app up --build
```

Para deixar no ar 24h (e os avisos das 8h funcionarem sem o seu computador ligado), dá para usar o Render:

1. Crie um PostgreSQL no Render.
2. Crie um Web Service apontando para o repositório, usando o `Dockerfile`.
3. Defina `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` (a URL do serviço) e, se quiser e-mail, `SMTP_URL` e `MAIL_FROM`.

As migrations rodam sozinhas a cada deploy.

## Decisões técnicas

- **Dinheiro em centavos inteiros** no banco e na API, para não ter erro de arredondamento.
- **Deduplicação por id externo**: usa o `Identificador` do Nubank, o `FITID` do OFX ou um hash estável da linha, com índice único por conta.
- **Eventos em vez de processar na requisição**: o upload responde na hora e o trabalho pesado roda em segundo plano. Trocar o EventEmitter por uma fila como BullMQ não muda os módulos.
- **Regras antes das palavras-chave padrão**: o usuário sempre tem a última palavra sobre a categoria.
- **Lista virtualizada** nas transações, para meses com muitas linhas.
- **Gráficos em SVG próprio**, com cores de entradas e saídas validadas para daltonismo, e tooltip no hover e no foco do teclado.
