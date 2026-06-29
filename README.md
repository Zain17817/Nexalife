<<<<<<< HEAD
# Nexalife - Aplikasi manajemen Keuangan dan to do list (mobile-first SPA)

Aplikasi manajemen keuangan dan tugas berbasis web yang dirancang khusus untuk mahasiswa KKN (Kuliah Kerja Nyata). Dibangun sebagai **mobile-first Single Page Application (SPA)** dengan dukungan **PWA** dan **hybrid mobile** (Capacitor).

## Fitur

- **Dashboard** — Lihat ringkasan saldo, pemasukan, pengeluaran, dan tugas aktif dalam satu tampilan
- **Manajemen Keuangan** — Catat pemasukan dan pengeluaran per kategori (Makan, Transportasi, Pulsa/Internet, Belanja, Program Kerja, dll.)
- **Manajemen Tugas** — Kelola tugas KKN dengan prioritas (Tinggi/Sedang/Rendah) dan deadline, lengkap dengan deteksi tugas terlambat
- **Statistik & Grafik** — Visualisasi pemasukan vs pengeluaran (bar chart) dan distribusi kategori (doughnut chart) menggunakan Chart.js
- **Dark Mode** — Tema gelap/terang yang dapat diubah dan tersimpan secara persisten
- **PWA Offline** — Dapat diinstal dan berjalan offline dengan Service Worker
- **Responsive** — Tampilan bottom navigation di mobile, sidebar di desktop

## Tech Stack

| Teknologi | Fungsi |
|---|---|
| HTML5 / CSS3 / JavaScript (Vanilla) | Core SPA — tanpa framework |
| Chart.js 4.5.1 | Grafik dan visualisasi data |
| SQLite / WebSQL / localStorage | Database dengan fallback berlapis |
| Capacitor 7 | Wrapper native Android & iOS |
| PWA (Service Worker + Manifest) | Instalasi dan offline support |
| Vitest | Unit testing JavaScript |
| Python unittest | Testing AGENT.py (39 test) |
| GitHub Actions | CI/CD otomatis |

## Instalasi

### Prasyarat

- Node.js v20+
- Python 3.12+ (untuk AGENT.py)

### Langkah

```bash
# Clone repository
git clone https://github.com/zeynnnn/nexalife.git
cd nexalife

# Install dependencies
npm install

# Jalankan web app
npm start

# Jalankan test web app
npm test

# Jalankan test agent Python
python AGENT.py --test
```

### Build Mobile (Opsional)

```bash
npx cap sync
npx cap add android   # Android
npx cap add ios       # iOS
npm run android       # Buka Android Studio
npm run ios           # Buka Xcode
```

## Struktur Proyek

```
nexalife/
├── www/                      # Root web app (SPA)
│   ├── index.html            # Entry point
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker
│   ├── pages/                # Halaman HTML partial
│   │   ├── dashboard.html
│   │   ├── transactions.html
│   │   ├── tasks.html
│   │   ├── reports.html
│   │   └── settings.html
│   └── assets/
│       ├── css/              # Stylesheets
│       ├── js/               # Modul JavaScript
│       │   ├── app.js        # Entry point & navigasi
│       │   ├── database.js   # Database layer
│       │   ├── task.js       # TaskManager
│       │   ├── transaction.js# TransactionManager
│       │   └── ui.js         # UIManager (render semua halaman)
│       ├── icons/            # PWA icons
│       └── images/           # Logo & gambar
├── database/                 # Schema & seed data
│   ├── schema.js
│   └── seed.js
├── tests/                    # Unit test web app (Vitest)
│   ├── task.test.js
│   └── transaction.test.js
├── AGENT.py                  # Python AI agent (validasi, audit, CLI)
├── AGENTS.md                 # Aturan pengembangan untuk AI model
├── .github/workflows/test.yml# GitHub Actions CI/CD
└── package.json
```

## Testing

```bash
# Web app tests (Vitest)
npm test

# Agent tests (Python)
python AGENT.py --test
```

Setiap push ke branch `main` akan otomatis menjalankan seluruh test melalui GitHub Actions.

## Kontributor

- **Ahmad Zainul Ishlah (Zeynn)** — Pengembang

## Lisensi

MIT
=======
Nama   :Ahmad Zainul Ishlah
NIM    : 101230074
Kelas  : TF23A
>>>>>>> 2e9859c62b9a7fbe5f277616d6516b383eb25673
