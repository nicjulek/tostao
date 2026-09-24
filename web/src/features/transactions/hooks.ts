import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { accountsApi, categoriesApi, transactionsApi, type TransactionInput } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import type { Category, Transaction, TransactionFilters, TransactionPage } from '@/lib/types'

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: categoriesApi.list, staleTime: 5 * 60_000 })
}

export function useAccounts() {
  return useQuery({ queryKey: qk.accounts, queryFn: accountsApi.list })
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: qk.transactions(filters),
    queryFn: ({ signal }) => transactionsApi.list({ ...filters, pageSize: 1000 }, signal),
    placeholderData: keepPreviousData
  })
}

function useInvalidateMoney() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
    void queryClient.invalidateQueries({ queryKey: qk.reports })
    void queryClient.invalidateQueries({ queryKey: qk.accounts })
  }
}

export function useUpdateCategory(filters: TransactionFilters, categories: Category[]) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string | null }) => transactionsApi.update(id, { categoryId }),
    onMutate: async ({ id, categoryId }) => {
      const key = qk.transactions(filters)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<TransactionPage>(key)
      if (previous) {
        const category = categories.find((c) => c.id === categoryId) ?? null
        queryClient.setQueryData<TransactionPage>(key, {
          ...previous,
          items: previous.items.map((t) => (t.id === id ? { ...t, categoryId, category } : t))
        })
      }
      return { previous, key }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous)
    },
    onSettled: invalidate
  })
}

export function useBulkCategorize() {
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) => transactionsApi.bulkCategorize(ids, categoryId),
    onSuccess: (r) => {
      toast.success(`${r.updated} transações atualizadas`)
      invalidate()
    }
  })
}

export function useSaveTransaction() {
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TransactionInput }) => {
      if (!id) return transactionsApi.create(input)
      const { accountId: _accountId, ...rest } = input
      void _accountId
      return transactionsApi.update(id, rest)
    },
    onSuccess: (_t, { id }) => {
      toast.success(id ? 'Transação atualizada' : 'Transação adicionada')
      invalidate()
    }
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney()
  return useMutation({
    mutationFn: (t: Transaction) => transactionsApi.remove(t.id),
    onSuccess: () => {
      toast.success('Transação apagada')
      invalidate()
    }
  })
}
