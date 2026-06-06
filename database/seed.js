/* ============================================
   Nexalife - Database Seed Data
   ============================================ */

const SEED_DATA = {
  users: [
    { name: 'Mahasiswa KKN' }
  ],
  settings: [
    { key: 'dark_mode', value: '0' },
    { key: 'username', value: 'Mahasiswa KKN' }
  ],
  transactions: [
    {
      type: 'income',
      category: 'Uang Saku',
      amount: 500000,
      note: 'Uang saku bulan ini',
      transaction_date: new Date().toISOString().split('T')[0]
    },
    {
      type: 'expense',
      category: 'Makan',
      amount: 15000,
      note: 'Nasi goreng + es teh',
      transaction_date: new Date().toISOString().split('T')[0]
    },
    {
      type: 'expense',
      category: 'Transportasi',
      amount: 10000,
      note: 'Angkutan umum',
      transaction_date: new Date().toISOString().split('T')[0]
    },
    {
      type: 'expense',
      category: 'Pulsa/Internet',
      amount: 50000,
      note: 'Paket data 10GB',
      transaction_date: new Date().toISOString().split('T')[0]
    }
  ],
  tasks: [
    {
      title: 'Laporan BHP',
      description: 'Buat laporan bulanan BHP',
      priority: 'tinggi',
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
      })(),
      status: 'pending'
    },
    {
      title: 'Program Kerja',
      description: 'Persiapan acara proker',
      priority: 'sedang',
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      })(),
      status: 'pending'
    },
    {
      title: 'Beli ATK',
      description: 'Membeli alat tulis kantor',
      priority: 'rendah',
      deadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
      })(),
      status: 'selesai'
    }
  ]
};

export default SEED_DATA;