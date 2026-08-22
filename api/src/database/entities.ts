import { Account } from '../modules/accounts/account.entity'
import { Category } from '../modules/categories/category.entity'
import { Notification } from '../modules/notifications/notification.entity'
import { ImportBatch } from '../modules/imports/import-batch.entity'
import { Rule } from '../modules/rules/rule.entity'
import { Transaction } from '../modules/transactions/transaction.entity'
import { User } from '../modules/users/user.entity'

export const ENTITIES = [User, Account, Category, ImportBatch, Transaction, Rule, Notification]
