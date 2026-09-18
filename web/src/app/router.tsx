import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth/AuthPages'
import { AppLayout } from './AppLayout'
import { GuestOnly, NotFound, RequireAuth } from './guards'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage'))
const ImportPage = lazy(() => import('@/features/imports/ImportPage'))
const RecurringPage = lazy(() => import('@/features/recurring/RecurringPage'))
const RulesPage = lazy(() => import('@/features/rules/RulesPage'))
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'))
const AccountsPage = lazy(() => import('@/features/accounts/AccountsPage'))

export const router = createBrowserRouter(
  [
    {
      element: <GuestOnly />,
      children: [
        { path: '/entrar', element: <LoginPage /> },
        { path: '/criar-conta', element: <RegisterPage /> }
      ]
    },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: 'transacoes', element: <TransactionsPage /> },
            { path: 'importar', element: <ImportPage /> },
            { path: 'assinaturas', element: <RecurringPage /> },
            { path: 'regras', element: <RulesPage /> },
            { path: 'categorias', element: <CategoriesPage /> },
            { path: 'contas', element: <AccountsPage /> },
            { path: '*', element: <NotFound /> }
          ]
        }
      ]
    }
  ],
  { future: { v7_relativeSplatPath: true } }
)
