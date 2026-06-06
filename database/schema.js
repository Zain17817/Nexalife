/* ============================================
   Nexalife - Database Schema Definition
   ============================================ */

const DB_SCHEMA = {
  name: 'nexalife_db',
  version: 1,
  stores: {
    users: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'name', keyPath: 'name', unique: false }
      ]
    },
    transactions: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'transaction_date', keyPath: 'transaction_date', unique: false }
      ]
    },
    tasks: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'status', keyPath: 'status', unique: false },
        { name: 'priority', keyPath: 'priority', unique: false },
        { name: 'deadline', keyPath: 'deadline', unique: false }
      ]
    },
    settings: {
      keyPath: 'key',
      autoIncrement: false,
      indexes: []
    }
  }
};

export default DB_SCHEMA;