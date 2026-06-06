/* ============================================
   Nexalife - Transaction Module
   ============================================ */

class TransactionManager {
  constructor(db) {
    this.db = db;
  }

  async getAllTransactions(month = null, category = null, limit = null) {
    let transactions = await this.db.getAll('transactions');
    
    // Filter by month
    if (month) {
      transactions = transactions.filter(t => 
        t.transaction_date.startsWith(month)
      );
    }
    
    // Filter by category
    if (category) {
      transactions = transactions.filter(t => t.category === category);
    }
    
    // Sort by date desc
    transactions.sort((a, b) => 
      new Date(b.transaction_date) - new Date(a.transaction_date)
    );
    
    // Apply limit
    if (limit) {
      transactions = transactions.slice(0, limit);
    }
    
    return transactions;
  }

  async addTransaction(transaction) {
    return await this.db.add('transactions', transaction);
  }

  async updateTransaction(id, transactionData) {
    const existing = await this.db.getById('transactions', id);
    if (!existing) throw new Error('Transaction not found');
    
    const updated = { ...existing, ...transactionData };
    return await this.db.put('transactions', updated);
  }

  async deleteTransaction(id) {
    return await this.db.delete('transactions', id);
  }

  async getMonthlySummary(month) {
    const transactions = await this.getAllTransactions(month);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    
    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  }

  async getStatistics() {
    const transactions = await this.db.getAll('transactions');
    
    // Monthly stats for last 6 months
    const monthly = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    transactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7);
      if (month >= sixMonthsAgo.toISOString().substring(0, 7)) {
        if (!monthly[month]) {
          monthly[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          monthly[month].income += t.amount;
        } else {
          monthly[month].expense += t.amount;
        }
      }
    });
    
    const monthlyArray = Object.keys(monthly)
      .sort()
      .map(month => ({
        month,
        income: monthly[month].income,
        expense: monthly[month].expense
      }));
    
    // Category stats for expenses
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        if (!categories[t.category]) {
          categories[t.category] = 0;
        }
        categories[t.category] += t.amount;
      }
    });
    
    const categoriesArray = Object.keys(categories)
      .map(category => ({
        category,
        total: categories[category]
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    
    return {
      monthly: monthlyArray,
      categories: categoriesArray
    };
  }

  async getSettings() {
    const settings = await this.db.getAll('settings');
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    return result;
  }

  async saveSetting(key, value) {
    return await this.db.put('settings', { key, value });
  }

  async exportData() {
    const transactions = await this.db.getAll('transactions');
    const tasks = await this.db.getAll('tasks');
    const settings = await this.db.getAll('settings');
    const users = await this.db.getAll('users');
    
    return {
      export_date: new Date().toISOString(),
      data: {
        transactions,
        tasks,
        settings,
        users
      }
    };
  }

  async importData(data) {
    // Clear existing data
    const stores = ['transactions', 'tasks', 'settings', 'users'];
    for (const store of stores) {
      const items = await this.db.getAll(store);
      for (const item of items) {
        const keyCol = store === 'settings' ? 'key' : 'id';
        const keyVal = store === 'settings' ? item.key : item.id;
        await this.db.delete(store, keyVal, keyCol);
      }
    }
    
    // Import new data
    if (data.transactions) {
      for (const t of data.transactions) {
        delete t.id;
        await this.db.add('transactions', t);
      }
    }
    
    if (data.tasks) {
      for (const t of data.tasks) {
        delete t.id;
        await this.db.add('tasks', t);
      }
    }
    
    if (data.settings) {
      for (const s of data.settings) {
        await this.db.put('settings', s);
      }
    }
    
    if (data.users) {
      for (const u of data.users) {
        delete u.id;
        await this.db.add('users', u);
      }
    }
    
    return true;
  }
}

// Initialize transaction manager
const transactionManager = new TransactionManager(db);
