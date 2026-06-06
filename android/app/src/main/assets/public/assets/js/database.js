/* ============================================
   Nexalife - Database Module (SQLite)
   Menggunakan SQLite via Capacitor
   ============================================ */

// Check if running in Capacitor environment
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
        // Use Capacitor SQLite plugin for native
        const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
        const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        
        // Check if database exists
        const ret = await sqliteConnection.checkConnectionsConsistency();
        const dbName = 'nexalife_db';
        
        // Create or open database
        this.db = await sqliteConnection.createConnection(
          dbName,
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open();
      } else {
        // Fallback to Web SQL or localStorage for web testing
        console.warn('Running in web mode - using localStorage fallback');
        this.db = new WebSQLFallback();
      }
      
      await this.createTables();
      await this.seedDatabase();
      this.isInitialized = true;
      return this.db;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Fallback to Web SQL
      this.db = new WebSQLFallback();
      await this.createTables();
      await this.seedDatabase();
      this.isInitialized = true;
      return this.db;
    }
  }

  async createTables() {
    // Users table
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL DEFAULT 'Mahasiswa KKN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
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

    // Create indexes for transactions
    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`);

    // Tasks table
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

    // Create indexes for tasks
    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);

    // Settings table
    await this.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Core database methods using run for INSERT, UPDATE, DELETE
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
    const sql = `SELECT * FROM ${storeName} ORDER BY id DESC`;
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

  async delete(tableName, id) {
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
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
    // Check if settings already exist
    const settings = await this.getSettings();
    
    if (Object.keys(settings).length === 0) {
      // Insert default user
      await this.run(`INSERT INTO users (name) VALUES (?)`, ['Mahasiswa KKN']);
      
      // Insert default settings
      await this.saveSetting('dark_mode', '0');
      await this.saveSetting('username', 'Mahasiswa KKN');
      
      // Insert sample transactions
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
      
      // Insert sample tasks
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

// WebSQL Fallback for testing without Capacitor
class WebSQLFallback {
  constructor() {
    this.dbName = 'nexalife_db';
    this.version = '1.0';
    this.displayName = 'Nexalife Database';
    this.dbSize = 2 * 1024 * 1024; // 2MB
    this.db = null;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = openDatabase(this.dbName, this.version, this.displayName, this.dbSize);
      resolve(this.db);
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

// Initialize database instance
const db = new Database();

// Export for use in other modules
window.db = db;
