import { describe, it, expect, beforeEach } from 'vitest'

class MockDb {
  constructor() {
    this.tables = { transactions: [] }
    this.sequences = { transactions: 0 }
  }

  getAll(table) {
    return [...this.tables[table]]
  }

  getById(table, id) {
    return this.tables[table].find(r => r.id === id) || null
  }

  add(table, data) {
    this.sequences[table]++
    const row = { id: this.sequences[table], ...data }
    this.tables[table].push(row)
    return row.id
  }

  put(table, data) {
    const idx = this.tables[table].findIndex(r => r.id === data.id)
    if (idx >= 0) {
      this.tables[table][idx] = data
    } else {
      this.sequences[table]++
      data.id = this.sequences[table]
      this.tables[table].push(data)
    }
    return data.id
  }

  delete(table, id) {
    this.tables[table] = this.tables[table].filter(r => r.id !== id)
    return 1
  }
}

class TransactionManager {
  constructor(db) {
    this.db = db
  }

  async getAllTransactions(month = null, category = null, limit = null) {
    let transactions = await this.db.getAll('transactions')
    if (month) {
      transactions = transactions.filter(t => t.transaction_date.startsWith(month))
    }
    if (category) {
      transactions = transactions.filter(t => t.category === category)
    }
    transactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    if (limit) {
      transactions = transactions.slice(0, limit)
    }
    return transactions
  }

  async addTransaction(transaction) {
    return await this.db.add('transactions', transaction)
  }

  async updateTransaction(id, transactionData) {
    const existing = await this.db.getById('transactions', id)
    if (!existing) throw new Error('Transaction not found')
    const updated = { ...existing, ...transactionData }
    return await this.db.put('transactions', updated)
  }

  async deleteTransaction(id) {
    return await this.db.delete('transactions', id)
  }

  async getMonthlySummary(month) {
    const transactions = await this.getAllTransactions(month)
    let totalIncome = 0
    let totalExpense = 0
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount
      } else {
        totalExpense += t.amount
      }
    })
    return { total_income: totalIncome, total_expense: totalExpense, balance: totalIncome - totalExpense }
  }

  async getStatistics() {
    const transactions = await this.db.getAll('transactions')
    const monthly = {}
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    transactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7)
      if (month >= sixMonthsAgo.toISOString().substring(0, 7)) {
        if (!monthly[month]) monthly[month] = { income: 0, expense: 0 }
        if (t.type === 'income') {
          monthly[month].income += t.amount
        } else {
          monthly[month].expense += t.amount
        }
      }
    })
    const monthlyArray = Object.keys(monthly).sort().map(month => ({
      month, income: monthly[month].income, expense: monthly[month].expense
    }))
    const categories = {}
    transactions.forEach(t => {
      if (t.type === 'expense') {
        if (!categories[t.category]) categories[t.category] = 0
        categories[t.category] += t.amount
      }
    })
    const categoriesArray = Object.keys(categories)
      .map(category => ({ category, total: categories[category] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
    return { monthly: monthlyArray, categories: categoriesArray }
  }

  async exportData() {
    const transactions = await this.db.getAll('transactions')
    return { export_date: new Date().toISOString(), data: { transactions } }
  }

  async importData(data) {
    const stores = ['transactions']
    for (const store of stores) {
      const items = await this.db.getAll(store)
      for (const item of items) {
        await this.db.delete(store, item.id)
      }
    }
    if (data.transactions) {
      for (const t of data.transactions) {
        delete t.id
        await this.db.add('transactions', t)
      }
    }
    return true
  }
}

describe('TransactionManager', () => {
  let db
  let tm

  beforeEach(() => {
    db = new MockDb()
    tm = new TransactionManager(db)
  })

  it('should add a transaction', async () => {
    const id = await tm.addTransaction({
      type: 'income', category: 'Uang Saku',
      amount: 500000, note: 'Bulanan', transaction_date: '2026-06-01'
    })
    expect(id).toBe(1)
    const all = await tm.getAllTransactions()
    expect(all).toHaveLength(1)
  })

  it('should calculate monthly summary', async () => {
    await tm.addTransaction({ type: 'income', category: 'Gaji', amount: 1000000, transaction_date: '2026-06-15' })
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 50000, transaction_date: '2026-06-10' })
    await tm.addTransaction({ type: 'expense', category: 'Transport', amount: 20000, transaction_date: '2026-06-05' })

    const summary = await tm.getMonthlySummary('2026-06')
    expect(summary.total_income).toBe(1000000)
    expect(summary.total_expense).toBe(70000)
    expect(summary.balance).toBe(930000)
  })

  it('should filter transactions by category', async () => {
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 15000, transaction_date: '2026-06-01' })
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 25000, transaction_date: '2026-06-02' })
    await tm.addTransaction({ type: 'expense', category: 'Transport', amount: 10000, transaction_date: '2026-06-03' })

    const makan = await tm.getAllTransactions(null, 'Makan')
    expect(makan).toHaveLength(2)
  })

  it('should return statistics with monthly and category breakdown', async () => {
    await tm.addTransaction({ type: 'income', category: 'Gaji', amount: 1000000, transaction_date: '2026-06-01' })
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 50000, transaction_date: '2026-06-02' })
    await tm.addTransaction({ type: 'expense', category: 'Transport', amount: 20000, transaction_date: '2026-06-03' })

    const stats = await tm.getStatistics()
    expect(stats.monthly.length).toBeGreaterThanOrEqual(1)
    expect(stats.categories.length).toBeGreaterThanOrEqual(1)

    const foodCat = stats.categories.find(c => c.category === 'Makan')
    expect(foodCat.total).toBe(50000)
  })

  it('should update a transaction', async () => {
    const id = await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 15000, transaction_date: '2026-06-01' })
    await tm.updateTransaction(id, { amount: 20000 })
    const updated = await db.getById('transactions', id)
    expect(updated.amount).toBe(20000)
  })

  it('should throw on update non-existent transaction', async () => {
    await expect(tm.updateTransaction(999, { amount: 100 })).rejects.toThrow('Transaction not found')
  })

  it('should delete a transaction', async () => {
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 15000, transaction_date: '2026-06-01' })
    await tm.deleteTransaction(1)
    const all = await tm.getAllTransactions()
    expect(all).toHaveLength(0)
  })

  it('should export all data', async () => {
    await tm.addTransaction({ type: 'income', category: 'Gaji', amount: 500000, transaction_date: '2026-06-01' })
    const exported = await tm.exportData()
    expect(exported.data.transactions).toHaveLength(1)
    expect(exported.export_date).toBeDefined()
  })

  it('should import data after clearing', async () => {
    await tm.addTransaction({ type: 'expense', category: 'Makan', amount: 10000, transaction_date: '2026-06-01' })
    const importData = {
      transactions: [
        { type: 'income', category: 'Baru', amount: 999999, transaction_date: '2026-07-01' }
      ]
    }
    await tm.importData(importData)
    const all = await tm.getAllTransactions()
    expect(all).toHaveLength(1)
    expect(all[0].category).toBe('Baru')
  })
})
