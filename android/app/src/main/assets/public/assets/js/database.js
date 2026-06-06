/* ============================================
   Nexalife - Database Module (SQLite)
   Menggunakan SQLite via Capacitor
   ============================================ */

const isNative = () => {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
};

class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;

    try {
      if (isNative()) {
        const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
        const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        const ret = await sqliteConnection.checkConnectionsConsistency();
        const dbName = 'nexalife_db';
        this.db = await sqliteConnection.createConnection(
          dbName, false, 'no-encryption', 1, false
        );
        await this.db.open();
      } else {
        if (typeof openDatabase === 'function') {
          console.warn('Running in web mode - using WebSQL');
          this.db = new WebSQLFallback();
        } else {
          console.warn('Running in web mode - using localStorage fallback');
          this.db = new InMemoryFallback();
        }
      }

      await this.createTables();
      await this.seedDatabase();
      this.isInitialized = true;
      return this.db;
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = new InMemoryFallback();
      await this.createTables();
      await this.seedDatabase();
      this.isInitialized = true;
      return this.db;
    }
  }

  async createTables() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL DEFAULT 'Mahasiswa KKN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`);

    await this.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'sedang' CHECK(priority IN ('tinggi', 'sedang', 'rendah')),
        deadline DATE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'selesai')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);

    await this.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async run(sql, params = []) {
    if (!this.db) await this.init();
    return this.db.run(sql, params);
  }

  async query(sql, params = []) {
    if (!this.db) await this.init();
    return this.db.query(sql, params);
  }

  async get(sql, params = []) {
    if (!this.db) await this.init();
    const results = await this.db.query(sql, params);
    return results && results.length > 0 ? results[0] : null;
  }

  async getAll(storeName) {
    const sql = `SELECT * FROM ${storeName}`;
    return this.query(sql, []);
  }

  async getById(tableName, id) {
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    return this.get(sql, [id]);
  }

  async add(tableName, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(',');
    const columns = keys.join(',');
    const values = keys.map(key => data[key]);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    const result = await this.run(sql, values);
    return result.lastId || result.insertId;
  }

  async update(tableName, id, data) {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(',');
    const values = [...keys.map(key => data[key]), id];

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.run(sql, values);
    return result.changes || result.rowsAffected;
  }

  async put(tableName, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(',');
    const columns = keys.join(',');
    const values = keys.map(key => data[key]);

    const sql = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    const result = await this.run(sql, values);
    return result.lastId || result.insertId || result.changes;
  }

  async delete(tableName, id, keyColumn = 'id') {
    const sql = `DELETE FROM ${tableName} WHERE ${keyColumn} = ?`;
    const result = await this.run(sql, [id]);
    return result.changes || result.rowsAffected;
  }

  async getSettings() {
    const sql = `SELECT key, value FROM settings`;
    const results = await this.query(sql, []);
    const settings = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  async saveSetting(key, value) {
    const sql = `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `;
    return this.run(sql, [key, value]);
  }

  async seedDatabase() {
    const settings = await this.getSettings();

    if (Object.keys(settings).length === 0) {
      await this.run(`INSERT INTO users (name) VALUES (?)`, ['Mahasiswa KKN']);

      await this.saveSetting('dark_mode', '0');
      await this.saveSetting('username', 'Mahasiswa KKN');

      const today = new Date().toISOString().split('T')[0];

      await this.run(`
        INSERT INTO transactions (type, category, amount, note, transaction_date)
        VALUES (?, ?, ?, ?, ?)
      `, ['income', 'Uang Saku', 500000, 'Uang saku bulan ini', today]);

      await this.run(`
        INSERT INTO transactions (type, category, amount, note, transaction_date)
        VALUES (?, ?, ?, ?, ?)
      `, ['expense', 'Makan', 15000, 'Nasi goreng + es teh', today]);

      await this.run(`
        INSERT INTO transactions (type, category, amount, note, transaction_date)
        VALUES (?, ?, ?, ?, ?)
      `, ['expense', 'Transportasi', 10000, 'Angkutan umum', today]);

      await this.run(`
        INSERT INTO transactions (type, category, amount, note, transaction_date)
        VALUES (?, ?, ?, ?, ?)
      `, ['expense', 'Pulsa/Internet', 50000, 'Paket data 10GB', today]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureDate7 = new Date();
      futureDate7.setDate(futureDate7.getDate() + 7);
      const futureDateStr7 = futureDate7.toISOString().split('T')[0];

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      await this.run(`
        INSERT INTO tasks (title, description, priority, deadline, status)
        VALUES (?, ?, ?, ?, ?)
      `, ['Laporan BHP', 'Buat laporan bulanan BHP', 'tinggi', futureDateStr, 'pending']);

      await this.run(`
        INSERT INTO tasks (title, description, priority, deadline, status)
        VALUES (?, ?, ?, ?, ?)
      `, ['Program Kerja', 'Persiapan acara proker', 'sedang', futureDateStr7, 'pending']);

      await this.run(`
        INSERT INTO tasks (title, description, priority, deadline, status)
        VALUES (?, ?, ?, ?, ?)
      `, ['Beli ATK', 'Membeli alat tulis kantor', 'rendah', pastDateStr, 'selesai']);
    }
  }
}

// WebSQL Fallback (for browsers that still support it)
class WebSQLFallback {
  constructor() {
    this.dbName = 'nexalife_db';
    this.version = '1.0';
    this.displayName = 'Nexalife Database';
    this.dbSize = 2 * 1024 * 1024;
    this.db = null;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        this.db = openDatabase(this.dbName, this.version, this.displayName, this.dbSize);
        resolve(this.db);
      } catch (e) {
        reject(e);
      }
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(sql, params, (tx, result) => {
          resolve({
            lastId: result.insertId,
            changes: result.rowsAffected,
            rowsAffected: result.rowsAffected
          });
        }, (tx, error) => {
          reject(error);
        });
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(sql, params, (tx, result) => {
          const rows = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows);
        }, (tx, error) => {
          reject(error);
        });
      });
    });
  }
}

// InMemory Fallback using localStorage (works everywhere)
class InMemoryFallback {
  constructor() {
    this._data = {};
    this._sequences = {};
    this._load();
  }

  init() {
    return Promise.resolve();
  }

  _load() {
    try {
      const saved = localStorage.getItem('nexalife_db_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        this._data = parsed.data || {};
        this._sequences = parsed.sequences || {};
      }
    } catch (e) {
    }
  }

  _save() {
    try {
      localStorage.setItem('nexalife_db_data', JSON.stringify({
        data: this._data,
        sequences: this._sequences
      }));
    } catch (e) {
    }
  }

  _table(name) {
    if (!this._data[name]) {
      this._data[name] = [];
    }
    return this._data[name];
  }

  _nextId(table) {
    if (!this._sequences[table]) this._sequences[table] = 0;
    return ++this._sequences[table];
  }

  _runSql(sql, params) {
    const s = sql.replace(/\s+/g, ' ').trim();
    const u = s.toUpperCase();

    if (u.startsWith('CREATE TABLE') || u.startsWith('CREATE INDEX')) {
      return { changes: 0 };
    }

    const insertReplace = s.match(/INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertReplace) {
      const table = insertReplace[1];
      const cols = insertReplace[2].split(',').map(c => c.trim());
      const row = {};
      cols.forEach((c, i) => row[c] = params[i]);
      const tbl = this._table(table);
      const idIdx = cols.indexOf('id');
      if (idIdx >= 0 && params[idIdx]) {
        const idx = tbl.findIndex(r => String(r.id) === String(params[idIdx]));
        if (idx >= 0) {
          tbl[idx] = { ...tbl[idx], ...row };
          this._save();
          return { changes: 1 };
        }
      }
      if (!row.id) row.id = this._nextId(table);
      tbl.push(row);
      this._save();
      return { changes: 1, lastId: row.id, insertId: row.id };
    }

    if (u.includes('INSERT INTO') && u.includes('ON CONFLICT')) {
      const m = s.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (m) {
        const table = m[1];
        const cols = m[2].split(',').map(c => c.trim());
        const row = {};
        cols.forEach((c, i) => row[c] = params[i] !== undefined ? params[i] : null);
        const tbl = this._table(table);
        const keyIdx = cols.indexOf('key');
        if (keyIdx >= 0) {
          const idx = tbl.findIndex(r => r.key === params[keyIdx]);
          if (idx >= 0) {
            tbl[idx] = { ...tbl[idx], ...row };
            this._save();
            return { changes: 1 };
          }
        }
        tbl.push(row);
        this._save();
        return { changes: 1 };
      }
    }

    const insertMatch = s.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const table = insertMatch[1];
      const cols = insertMatch[2].split(',').map(c => c.trim());
      const row = {};
      cols.forEach((c, i) => row[c] = params[i] !== undefined ? params[i] : null);
      if (!row.id) row.id = this._nextId(table);
      this._table(table).push(row);
      this._save();
      return { changes: 1, lastId: row.id, insertId: row.id };
    }

    const updateMatch = s.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(\w+)\s*=\s*\?/i);
    if (updateMatch) {
      const table = updateMatch[1];
      const sets = updateMatch[2].split(',').map(p => p.trim());
      const whereCol = updateMatch[3];
      const whereVal = params[params.length - 1];
      const row = {};
      sets.forEach((p, i) => {
        const col = p.split('=')[0].trim();
        row[col] = params[i];
      });
      const tbl = this._table(table);
      const idx = tbl.findIndex(r => String(r[whereCol]) === String(whereVal));
      if (idx >= 0) {
        tbl[idx] = { ...tbl[idx], ...row };
        this._save();
        return { changes: 1, rowsAffected: 1 };
      }
      return { changes: 0, rowsAffected: 0 };
    }

    const deleteMatch = s.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
    if (deleteMatch) {
      const table = deleteMatch[1];
      const whereCol = deleteMatch[2];
      const whereVal = params[0];
      const tbl = this._table(table);
      const idx = tbl.findIndex(r => String(r[whereCol]) === String(whereVal));
      if (idx >= 0) {
        tbl.splice(idx, 1);
        this._save();
        return { changes: 1, rowsAffected: 1 };
      }
      return { changes: 0, rowsAffected: 0 };
    }

    return { changes: 0 };
  }

  run(sql, params = []) {
    return Promise.resolve(this._runSql(sql, params));
  }

  query(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();

    const selectWhere = s.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
    if (selectWhere) {
      const cols = selectWhere[1].split(',').map(c => c.trim());
      const table = selectWhere[2];
      const whereCol = selectWhere[3];
      const whereVal = params[0];
      const results = this._table(table).filter(r => String(r[whereCol]) === String(whereVal));
      if (cols.length === 1 && cols[0] === '*') return Promise.resolve(results);
      return Promise.resolve(results.map(r => {
        const obj = {};
        cols.forEach(c => obj[c] = r[c]);
        return obj;
      }));
    }

    const selectAll = s.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
    if (selectAll) {
      const cols = selectAll[1].split(',').map(c => c.trim());
      const table = selectAll[2];
      const results = [...this._table(table)];
      if (cols.length === 1 && cols[0] === '*') return Promise.resolve(results);
      return Promise.resolve(results.map(r => {
        const obj = {};
        cols.forEach(c => obj[c] = r[c]);
        return obj;
      }));
    }

    return Promise.resolve([]);
  }
}

// Initialize database instance
const db = new Database();

// Export for use in other modules
window.db = db;