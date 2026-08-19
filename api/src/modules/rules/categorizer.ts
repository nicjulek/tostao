import { normalize } from '../../common/utils/text'
import { DEFAULT_CATEGORIES, FALLBACK } from '../categories/defaults'
import { MatchType } from './rule.entity'

export interface RuleLike {
  pattern: string
  matchType: MatchType
  categoryId: string
  priority: number
}

export interface CategoryLike {
  id: string
  name: string
}

export interface Categorization {
  categoryId: string | null
  source: 'rule' | 'default' | 'fallback' | 'none'
}

export function matches(description: string, rule: Pick<RuleLike, 'pattern' | 'matchType'>): boolean {
  const text = normalize(description)
  const pattern = normalize(rule.pattern)
  if (!pattern) return false
  if (rule.matchType === 'exact') return text === pattern
  if (rule.matchType === 'starts_with') return text.startsWith(pattern)
  return text.includes(pattern)
}

export class Categorizer {
  private readonly rules: RuleLike[]
  private readonly byName: Map<string, string>

  constructor(rules: RuleLike[], categories: CategoryLike[]) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority || b.pattern.length - a.pattern.length)
    this.byName = new Map(categories.map((c) => [normalize(c.name), c.id]))
  }

  categorize(description: string, amount: number): Categorization {
    const userRule = this.rules.find((r) => matches(description, r))
    if (userRule) return { categoryId: userRule.categoryId, source: 'rule' }

    const text = ` ${normalize(description)} `
    const isIncome = amount > 0
    for (const def of DEFAULT_CATEGORIES) {
      if (def.kind === 'income' && !isIncome) continue
      if (def.kind === 'expense' && isIncome) continue
      if (def.keywords.some((k) => text.includes(k))) {
        const id = this.byName.get(normalize(def.name))
        if (id) return { categoryId: id, source: 'default' }
      }
    }

    const fallback = this.byName.get(normalize(isIncome ? FALLBACK.income : FALLBACK.expense))
    return fallback ? { categoryId: fallback, source: 'fallback' } : { categoryId: null, source: 'none' }
  }
}
