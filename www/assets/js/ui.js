/* ============================================
   Nexalife - UI Module (Full Working Version)
   ============================================ */

class UIManager {
  constructor() {
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalBody = document.getElementById('modalBody');
    this.appRoot = document.getElementById('app-root');
    this.pageTitle = document.getElementById('pageTitle');
    this.currentPage = 'dashboard';
    this.transactionFilter = { month: '', category: '' };
  }

  showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  openModal(html) {
    this.modalBody.innerHTML = html;
    this.modalOverlay.classList.add('show');
  }

  closeModal() {
    this.modalOverlay.classList.remove('show');
    this.modalBody.innerHTML = '';
  }

  async loadPage(pageId) {
    this.currentPage = pageId;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.classList.remove('active');
    });
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      transactions: 'Keuangan',
      tasks: 'Tugas',
      reports: 'Statistik',
      settings: 'Pengaturan',
      profile: 'Profil'
    };
    if (this.pageTitle) this.pageTitle.textContent = titles[pageId] || 'Nexalife';
    
    // Load page content directly (no external HTML files needed)
    if (pageId === 'dashboard') {
      await this.renderDashboard();
    } else if (pageId === 'transactions') {
      await this.renderTransactions();
    } else if (pageId === 'tasks') {
      await this.renderTasks();
    } else if (pageId === 'reports') {
      await this.renderReports();
    } else if (pageId === 'settings') {
      await this.renderSettings();
    }
  }

  // ==================== DASHBOARD ====================
  async renderDashboard() {
    const settings = await transactionManager.getSettings();
    const username = settings.username || 'Mahasiswa KKN';
    const currentMonth = this.getCurrentMonth();
    const summary = await transactionManager.getMonthlySummary(currentMonth);
    const taskStats = await taskManager.getTaskStats();
    
    this.appRoot.innerHTML = `
      <div class="page active">
        <div class="dashboard-greeting">
          <div class="dashboard-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div class="dashboard-greeting-text">Halo,</div>
            <div class="dashboard-name">${this.escapeHtml(username)}</div>
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div class="stat-label">Saldo</div>
            <div class="stat-value ${summary.balance >= 0 ? 'income' : 'expense'}">Rp ${this.formatNumber(summary.balance)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-label">Pemasukan</div>
            <div class="stat-value income">Rp ${this.formatNumber(summary.total_income)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-label">Pengeluaran</div>
            <div class="stat-value expense">Rp ${this.formatNumber(summary.total_expense)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div class="stat-label">Tugas Aktif</div>
            <div class="stat-value">${taskStats.pending}</div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">Progress Tugas</div>
          <div class="card-value" style="font-size:1rem;margin-bottom:8px;">${taskStats.done}/${taskStats.total} selesai</div>
          <div class="progress">
            <div class="progress-bar ${taskStats.progress === 100 ? 'success' : taskStats.progress > 50 ? 'warning' : ''}" style="width:${taskStats.progress}%"></div>
          </div>
          <div class="progress-info">
            <span>${taskStats.progress}%</span>
            <span>${taskStats.pending} tersisa</span>
          </div>
        </div>
        
        <div class="section-title">Transaksi Terbaru</div>
        <div id="recentTransactions"></div>
      </div>
    `;
    
    await this.loadRecentTransactions();
  }

  async loadRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    const transactions = await transactionManager.getAllTransactions(null, null, 5);
    
    if (transactions.length === 0) {
      container.innerHTML = '<div class="card"><p class="text-muted">Belum ada transaksi</p></div>';
      return;
    }
    
    container.innerHTML = transactions.map(t => `
      <div class="transaction-item">
        <div class="transaction-icon ${t.type}">
          ${t.type === 'income' ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>' : 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
          }
        </div>
        <div class="transaction-info">
          <div class="transaction-category">${this.escapeHtml(t.category)}</div>
          <div class="transaction-note">${this.escapeHtml(t.note || '-')}</div>
          <div class="transaction-date">${t.transaction_date}</div>
        </div>
        <div class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}Rp ${this.formatNumber(t.amount)}</div>
      </div>
    `).join('');
  }

  // ==================== TRANSACTIONS (KEUANGAN) ====================
  async renderTransactions() {
    this.transactionFilter = { month: this.getCurrentMonth(), category: '' };
    
    this.appRoot.innerHTML = `
      <div class="page active">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <h2 class="page-title" style="margin-bottom:0;">Keuangan</h2>
        </div>
        <p class="page-subtitle">Catat pemasukan dan pengeluaran harian</p>
        <div id="transactionsList"></div>
        <button class="fab" onclick="window.ui.showAddTransaction()" title="Tambah transaksi">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    `;
    
    await this.loadTransactionsList();
  }

  async loadTransactionsList() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    const transactions = await transactionManager.getAllTransactions(
      this.transactionFilter.month, 
      this.transactionFilter.category
    );
    const summary = await transactionManager.getMonthlySummary(this.transactionFilter.month);
    
    let html = `
      <div class="transaction-stats">
        <div class="transaction-stat-card">
          <div class="transaction-stat-label">Pemasukan</div>
          <div class="transaction-stat-value income">Rp ${this.formatNumber(summary.total_income)}</div>
        </div>
        <div class="transaction-stat-card">
          <div class="transaction-stat-label">Pengeluaran</div>
          <div class="transaction-stat-value expense">Rp ${this.formatNumber(summary.total_expense)}</div>
        </div>
      </div>
      
      <div class="filter-section">
        <div class="month-filter">
          <button class="filter-btn ${this.transactionFilter.month === this.getCurrentMonth() ? 'active' : ''}" onclick="window.ui.changeTransactionMonth('${this.getCurrentMonth()}')">Bulan Ini</button>
          <button class="filter-btn ${this.transactionFilter.month === this.getLastMonth() ? 'active' : ''}" onclick="window.ui.changeTransactionMonth('${this.getLastMonth()}')">Bulan Lalu</button>
        </div>
        <div class="filter-bar">
          <button class="filter-btn ${!this.transactionFilter.category ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('')">Semua</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Makan' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Makan')">Makan</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Transportasi' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Transportasi')">Transportasi</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Pulsa/Internet' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Pulsa/Internet')">Pulsa</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Belanja' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Belanja')">Belanja</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Program Kerja' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Program Kerja')">Proker</button>
          <button class="filter-btn ${this.transactionFilter.category === 'Uang Saku' ? 'active' : ''}" onclick="window.ui.changeTransactionCategory('Uang Saku')">Uang Saku</button>
        </div>
      </div>
    `;
    
    const grouped = this.groupTransactions(transactions);
    if (Object.keys(grouped).length === 0) {
      html += '<div class="card"><p class="text-muted">Belum ada transaksi</p></div>';
    } else {
      Object.keys(grouped).forEach(date => {
        html += `<div class="date-group">
          <div class="date-group-header">${this.formatDateHeader(date)}</div>`;
        grouped[date].forEach(t => {
          html += `
            <div class="transaction-item">
              <div class="transaction-icon ${t.type}">
                ${t.type === 'income' ? 
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>' : 
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
                }
              </div>
              <div class="transaction-info">
                <div class="transaction-category">${this.escapeHtml(t.category)}</div>
                <div class="transaction-note">${this.escapeHtml(t.note || '-')}</div>
              </div>
              <div class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}Rp ${this.formatNumber(t.amount)}</div>
              <div class="transaction-actions">
                <button class="btn btn-sm btn-outline" onclick="window.ui.editTransaction(${t.id})" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.ui.deleteTransaction(${t.id})" title="Hapus">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>`;
        });
        html += '</div>';
      });
    }
    
    container.innerHTML = html;
  }

  showAddTransaction() {
    this.openModal(`
      <div class="modal-header">
        <h2>Tambah Transaksi</h2>
        <button class="modal-close" onclick="window.ui.closeModal()">&times;</button>
      </div>
      <form id="transactionForm" onsubmit="window.ui.saveTransaction(event)">
        <input type="hidden" name="id" id="transId" value="">
        <div class="form-group">
          <label class="form-label">Tipe</label>
          <select class="form-select" name="type" id="transType" required onchange="window.ui.toggleCategory()">
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" name="category" id="transCategory" required></select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah (Rp)</label>
          <input class="form-input" type="number" name="amount" id="transAmount" min="0" step="500" required placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Catatan</label>
          <input class="form-input" type="text" name="note" id="transNote" placeholder="Opsional">
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input class="form-input" type="date" name="transaction_date" id="transDate" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Simpan</button>
      </form>
    `);
    
    document.getElementById('transDate').value = this.todayDate();
    this.toggleCategory();
  }

  toggleCategory() {
    const type = document.getElementById('transType').value;
    const sel = document.getElementById('transCategory');
    const incomeCats = ['Uang Saku', 'Transfer Orang Tua', 'Lainnya'];
    const expenseCats = ['Makan', 'Transportasi', 'Program Kerja', 'Pulsa/Internet', 'Belanja', 'Lainnya'];
    const cats = type === 'income' ? incomeCats : expenseCats;
    sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  async saveTransaction(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const data = {
      type: form.type.value,
      category: form.category.value,
      amount: parseFloat(form.amount.value),
      note: form.note.value,
      transaction_date: form.transaction_date.value
    };
    
    try {
      if (id) {
        await transactionManager.updateTransaction(parseInt(id), data);
        this.showToast('Transaksi diupdate');
      } else {
        await transactionManager.addTransaction(data);
        this.showToast('Transaksi ditambahkan');
      }
      this.closeModal();
      await this.loadTransactionsList();
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal menyimpan', 'error');
    }
  }

  async editTransaction(id) {
    const transactions = await transactionManager.getAllTransactions();
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    
    this.openModal(`
      <div class="modal-header">
        <h2>Edit Transaksi</h2>
        <button class="modal-close" onclick="window.ui.closeModal()">&times;</button>
      </div>
      <form id="transactionForm" onsubmit="window.ui.saveTransaction(event)">
        <input type="hidden" name="id" id="transId" value="${t.id}">
        <div class="form-group">
          <label class="form-label">Tipe</label>
          <select class="form-select" name="type" id="transType" required onchange="window.ui.toggleCategoryEdit()">
            <option value="income" ${t.type === 'income' ? 'selected' : ''}>Pemasukan</option>
            <option value="expense" ${t.type === 'expense' ? 'selected' : ''}>Pengeluaran</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" name="category" id="transCategory" required></select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah (Rp)</label>
          <input class="form-input" type="number" name="amount" id="transAmount" min="0" step="500" required value="${t.amount}">
        </div>
        <div class="form-group">
          <label class="form-label">Catatan</label>
          <input class="form-input" type="text" name="note" id="transNote" value="${this.escapeHtml(t.note || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input class="form-input" type="date" name="transaction_date" id="transDate" value="${t.transaction_date}" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Simpan</button>
      </form>
    `);
    
    window.ui.toggleCategoryEdit = () => {
      const type = document.getElementById('transType').value;
      const sel = document.getElementById('transCategory');
      const incomeCats = ['Uang Saku', 'Transfer Orang Tua', 'Lainnya'];
      const expenseCats = ['Makan', 'Transportasi', 'Program Kerja', 'Pulsa/Internet', 'Belanja', 'Lainnya'];
      const cats = type === 'income' ? incomeCats : expenseCats;
      sel.innerHTML = cats.map(c => `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`).join('');
    };
    window.ui.toggleCategoryEdit();
  }

  async deleteTransaction(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await transactionManager.deleteTransaction(id);
      this.showToast('Transaksi dihapus');
      await this.loadTransactionsList();
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal menghapus', 'error');
    }
  }

  changeTransactionMonth(month) {
    this.transactionFilter.month = month;
    this.loadTransactionsList();
  }

  changeTransactionCategory(category) {
    this.transactionFilter.category = category;
    this.loadTransactionsList();
  }

  // ==================== TASKS (TUGAS) ====================
  async renderTasks() {
    this.appRoot.innerHTML = `
      <div class="page active">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <h2 class="page-title" style="margin-bottom:0;">Tugas</h2>
        </div>
        <p class="page-subtitle">Kelola tugas harian KKN</p>
        <div id="tasksList"></div>
        <button class="fab" onclick="window.ui.showAddTask()" title="Tambah tugas">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    `;
    
    await this.loadTasksList();
  }

  async loadTasksList() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    
    const tasks = await taskManager.getAllTasks();
    const stats = await taskManager.getTaskStats();
    
    let html = `
      <div class="card">
        <div class="card-title">Progress Tugas</div>
        <div class="progress" style="margin:12px 0 8px;">
          <div class="progress-bar ${stats.progress === 100 ? 'success' : ''}" style="width:${stats.progress}%"></div>
        </div>
        <div class="progress-info">
          <span>${stats.done}/${stats.total} selesai (${stats.progress}%)</span>
        </div>
      </div>
    `;
    
    if (tasks.length === 0) {
      html += `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <h3>Belum ada tugas</h3>
          <p>Tambah tugas pertama Anda</p>
        </div>`;
    } else {
      const today = this.todayDate();
      tasks.forEach(t => {
        const isDone = t.status === 'selesai';
        const isOverdue = t.deadline && t.deadline < today && !isDone;
        const deadlineStr = t.deadline ? this.formatDateDisplay(t.deadline) : '-';
        
        html += `
          <div class="task-item">
            <button class="task-check ${isDone ? 'done' : ''}" onclick="window.ui.toggleTask(${t.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <div class="task-info">
              <div class="task-title ${isDone ? 'done-text' : ''}">${this.escapeHtml(t.title)}</div>
              <div class="task-meta">
                <span class="priority-dot ${t.priority}"></span>
                <span class="badge badge-${t.priority}">${t.priority}</span>
                <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:2px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  ${deadlineStr}
                </span>
              </div>
            </div>
            <div class="task-actions">
              <button class="btn btn-sm btn-outline" onclick="window.ui.editTask(${t.id})" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-sm btn-danger" onclick="window.ui.deleteTask(${t.id})" title="Hapus">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>`;
      });
    }
    
    container.innerHTML = html;
  }

  showAddTask() {
    this.openModal(`
      <div class="modal-header">
        <h2>Tambah Tugas</h2>
        <button class="modal-close" onclick="window.ui.closeModal()">&times;</button>
      </div>
      <form onsubmit="window.ui.saveTask(event)">
        <input type="hidden" name="id" id="taskId" value="">
        <div class="form-group">
          <label class="form-label">Judul Tugas</label>
          <input class="form-input" type="text" name="title" id="taskTitle" required placeholder="Contoh: Laporan BHP">
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea class="form-textarea" name="description" id="taskDesc" placeholder="Opsional"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Prioritas</label>
          <select class="form-select" name="priority" id="taskPriority" required>
            <option value="rendah">Rendah</option>
            <option value="sedang" selected>Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input class="form-input" type="date" name="deadline" id="taskDeadline">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Simpan</button>
      </form>
    `);
  }

  async saveTask(e) {
    e.preventDefault();
    const id = e.target.id.value;
    const data = {
      title: e.target.title.value,
      description: e.target.description.value,
      priority: e.target.priority.value,
      deadline: e.target.deadline.value || null
    };
    
    try {
      if (id) {
        await taskManager.updateTask(parseInt(id), data);
        this.showToast('Tugas diupdate');
      } else {
        await taskManager.addTask(data);
        this.showToast('Tugas ditambahkan');
      }
      this.closeModal();
      await this.loadTasksList();
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal menyimpan', 'error');
    }
  }

  async editTask(id) {
    const tasks = await taskManager.getAllTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    
    this.openModal(`
      <div class="modal-header">
        <h2>Edit Tugas</h2>
        <button class="modal-close" onclick="window.ui.closeModal()">&times;</button>
      </div>
      <form onsubmit="window.ui.saveTask(event)">
        <input type="hidden" name="id" id="taskId" value="${t.id}">
        <div class="form-group">
          <label class="form-label">Judul Tugas</label>
          <input class="form-input" type="text" name="title" id="taskTitle" required value="${this.escapeHtml(t.title)}">
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea class="form-textarea" name="description" id="taskDesc">${this.escapeHtml(t.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Prioritas</label>
          <select class="form-select" name="priority" id="taskPriority" required>
            <option value="rendah" ${t.priority === 'rendah' ? 'selected' : ''}>Rendah</option>
            <option value="sedang" ${t.priority === 'sedang' ? 'selected' : ''}>Sedang</option>
            <option value="tinggi" ${t.priority === 'tinggi' ? 'selected' : ''}>Tinggi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input class="form-input" type="date" name="deadline" id="taskDeadline" value="${t.deadline || ''}">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Simpan</button>
      </form>
    `);
  }

  async toggleTask(id) {
    try {
      await taskManager.toggleTaskStatus(id);
      await this.loadTasksList();
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal mengubah status', 'error');
    }
  }

  async deleteTask(id) {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await taskManager.deleteTask(id);
      this.showToast('Tugas dihapus');
      await this.loadTasksList();
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal menghapus', 'error');
    }
  }

  // ==================== REPORTS (STATISTIK) ====================
  async renderReports() {
    this.appRoot.innerHTML = `
      <div class="page active">
        <h2 class="page-title">Statistik</h2>
        <p class="page-subtitle">Visualisasi data keuangan dan tugas</p>
        <div id="reportsContent"></div>
      </div>
    `;
    
    await this.loadReportsContent();
  }

  async loadReportsContent() {
    const container = document.getElementById('reportsContent');
    if (!container) return;
    
    const stats = await transactionManager.getStatistics();
    const taskStats = await taskManager.getTaskStats();
    
    container.innerHTML = `
      <div class="chart-container">
        <div class="chart-title">Pemasukan vs Pengeluaran (6 Bulan)</div>
        <canvas id="chartIncomeExpense"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-title">Kategori Pengeluaran</div>
        <canvas id="chartCategories"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-title">Status Tugas</div>
        <canvas id="chartTasks"></canvas>
      </div>
    `;
    
    // Wait for DOM to update then create charts
    setTimeout(() => {
      this.createIncomeExpenseChart(stats.monthly);
      this.createCategoryChart(stats.categories);
      this.createTaskChart(taskStats);
    }, 100);
  }

  createIncomeExpenseChart(monthly) {
    const ctx = document.getElementById('chartIncomeExpense');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const labels = monthly.map(m => {
      const [y, mth] = m.month.split('-');
      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      return `${months[parseInt(mth)-1]} ${y}`;
    });
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan',
            data: monthly.map(m => m.income),
            backgroundColor: '#10B981',
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: 'Pengeluaran',
            data: monthly.map(m => m.expense),
            backgroundColor: '#EF4444',
            borderRadius: 6,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 11 },
              usePointStyle: true,
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 10 },
              callback: v => 'Rp' + v.toLocaleString('id-ID')
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  createCategoryChart(categories) {
    const ctx = document.getElementById('chartCategories');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const colors = ['#EF4444', '#F59E0B', '#2563EB', '#10B981', '#8B5CF6', '#EC4899'];
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.category),
        datasets: [{
          data: categories.map(c => c.total),
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 11 },
              usePointStyle: true,
            }
          }
        }
      }
    });
  }

  createTaskChart(stats) {
    const ctx = document.getElementById('chartTasks');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const done = stats.done;
    const pending = stats.pending;
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Belum Selesai'],
        datasets: [{
          data: [done, pending],
          backgroundColor: ['#10B981', '#E2E8F0'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 11 },
              usePointStyle: true,
            }
          }
        }
      }
    });
  }

  // ==================== SETTINGS (PENGATURAN) ====================
  async renderSettings() {
    const settings = await transactionManager.getSettings();
    const darkMode = settings.dark_mode === '1';
    
    this.appRoot.innerHTML = `
      <div class="page active">
        <h2 class="page-title">Pengaturan</h2>
        <p class="page-subtitle">Sesuaikan aplikasi sesuai kebutuhan</p>
        <div id="settingsContent">
          <div class="card">
            <div class="section-title">Profil</div>
            <div class="settings-item">
              <div>
                <div class="settings-label">Nama Pengguna</div>
                <div class="settings-desc">Nama yang ditampilkan di dashboard</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="settingsUsername" value="${this.escapeHtml(settings.username || 'Mahasiswa KKN')}" placeholder="Nama kamu" style="flex:1;">
              <button class="btn btn-primary" onclick="window.ui.saveUsername()">Simpan</button>
            </div>
          </div>
          
          <div class="card">
            <div class="section-title">Tampilan</div>
            <div class="settings-item">
              <div>
                <div class="settings-label">Dark Mode</div>
                <div class="settings-desc">Tampilan gelap untuk kenyamanan mata</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="darkModeToggle" ${darkMode ? 'checked' : ''} onchange="window.ui.toggleDarkMode(this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          

          
          <div class="card">
            <div class="section-title">Tentang</div>
            <div class="settings-item">
              <div>
                <div class="settings-label" style="margin-bottom:4px;">Nexalife</div>
                <div class="settings-desc">Versi 1.0 - Aplikasi manajemen keuangan dan to do list</div>
                <div class="settings-desc">Created by Ahmad Zainul Ishlah</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Setup import file listener
    const importFile = document.getElementById('importFile');
    if (importFile) {
      importFile.onchange = (e) => this.importData(e);
    }
  }

  async saveUsername() {
    const name = document.getElementById('settingsUsername').value.trim();
    if (!name) return this.showToast('Nama tidak boleh kosong', 'error');
    
    try {
      await transactionManager.saveSetting('username', name);
      this.showToast('Nama berhasil disimpan');
      if (this.currentPage === 'dashboard') await this.renderDashboard();
    } catch (error) {
      this.showToast('Gagal menyimpan', 'error');
    }
  }

  async toggleDarkMode(enabled) {
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    localStorage.setItem('nexalife-dark-mode', enabled ? '1' : '0');
    await transactionManager.saveSetting('dark_mode', enabled ? '1' : '0');
  }

  async exportData() {
    try {
      const data = await transactionManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexalife-data-${this.todayDate()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Data berhasil diexport');
    } catch (error) {
      this.showToast('Gagal export data', 'error');
    }
  }

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await transactionManager.importData(data.data);
      this.showToast('Data berhasil diimport');
      if (this.currentPage === 'dashboard') await this.renderDashboard();
      if (this.currentPage === 'settings') await this.renderSettings();
    } catch (error) {
      this.showToast('File JSON tidak valid', 'error');
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  getLastMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  todayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatNumber(n) {
    return parseFloat(n || 0).toLocaleString('id-ID');
  }

  formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.getTime() === today.getTime()) return 'Hari Ini';
    if (d.getTime() === yesterday.getTime()) return 'Kemarin';
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  groupTransactions(transactions) {
    const groups = {};
    transactions.forEach(t => {
      if (!groups[t.transaction_date]) groups[t.transaction_date] = [];
      groups[t.transaction_date].push(t);
    });
    return groups;
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Initialize UI
const ui = new UIManager();
window.ui = ui;
