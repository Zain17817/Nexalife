# AGENTS — Aturan untuk Semua AI Model

> Dokumen ini WAJIB dibaca dan dipatuhi oleh **semua AI model** (OpenCode, Cursor, Copilot, dll.)
> yang bekerja pada repositori **Nexalife**.

---

## 1. Workflow Pengembangan Wajib

Setiap perubahan kode HARUS mengikuti pipeline ini:

```
┌─────────────────────────────────────────────────────────────┐
│  1. UPDATE kode di localhost                                │
│     → Edit file, tambah fitur, perbaiki bug                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  2. TEST di localhost                                        │
│     → npm test          (web app - Vitest)                   │
│     → python AGENT.py --test  (agent - Python unittest)      │
│                                                              │
│     ⚠️ SEMUA test HARUS lolos sebelum lanjut                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼ (jika lolos)
┌──────────────────────────────────────────────────────────────┐
│  3. PUSH COMMIT ke GitHub                                    │
│     → git add .                                              │
│     → git commit -m "pesan jelas"                            │
│     → git push                                               │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  4. CI/CD auto-test di GitHub Actions                        │
│     → Menjalankan npm test + python AGENT.py --test          │
│     → Hasil terlihat di tab Actions repository               │
└──────────────────────┬──────────────────────────────────────┘
                       ▼ (jika gagal)
┌──────────────────────────────────────────────────────────────┐
│  5. ANALISA & RETEST                                         │
│     → Baca log error dari GitHub Actions                     │
│     → Perbaiki kode di localhost                             │
│     → Ulangi dari langkah 2                                  │
└──────────────────────────────────────────────────────────────┘
```

**⚠️ Aturan Penting:**
- JANGAN pernah push jika test lokal gagal
- JANGAN skip langkah testing
- JANGAN commit langsung ke `main` tanpa pull request (kecuali perubahan minor)

---

## 2. Standar Kode

### 2.1 Naming Convention
| Entitas | Convention | Contoh |
|---------|-----------|--------|
| JavaScript | camelCase | `taskManager`, `getAllTasks()` |
| CSS class | kebab-case | `task-item`, `stat-card` |
| Python | snake_case | `input_validator`, `run_tests()` |
| File JS | kebab-case | `chart-config.js` |
| File Python | snake_case | `AGENT.py` |
| Git branch | kebab-case | `fix/dashboard-bug`, `feat/export-csv` |

### 2.2 Struktur Folder
```
www/
├── index.html            # Entry point SPA
├── pages/                # Halaman HTML partial
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   ├── icons/            # PWA icons
│   └── images/           # Gambar/logo
├── sw.js                 # Service Worker
└── manifest.json         # PWA manifest
```

### 2.3 Commit Convention
Gunakan format: `tipe(scope): deskripsi`
- `feat(dashboard): tambah grafik pengeluaran`
- `fix(transaksi): perbaiki perhitungan saldo`
- `test(agent): tambah test untuk input validator`
- `ci: setup github actions workflow`
- `docs: update AGENTS.md`

---

## 3. Aturan untuk AI Model

### 3.1 Sebelum Menulis Kode
1. Baca file yang relevan terlebih dahulu — pahami konteks
2. Cek apakah ada fungsi/library yang sudah ada sebelum buat baru
3. Ikuti pola kode yang sudah ada (jangan buat gaya baru)
4. JANGAN generate dependency/library baru tanpa verifikasi package.json

### 3.2 Saat Menulis Kode
1. Setiap fungsi baru WAJIB memiliki test (unit test untuk logic, integration test untuk flow)
2. JANGAN tambah komentar yang tidak perlu — kode harus self-documenting
3. Handle error — setiap async function harus punya try-catch
4. JANGAN hardcode credential/key apapun
5. JANGAN hapus kode yang sudah ada tanpa verifikasi dampaknya

### 3.3 Setelah Menulis Kode
1. Jalankan `npm test` — pastikan semua test lolos
2. Jalankan `python AGENT.py --test` — pastikan agent test lolos
3. Jika diminta push, ikuti workflow di atas
4. Jika ada test gagal, analisa dan perbaiki SEBELUM push

### 3.4 Saat Debugging
1. Cek console browser (F12) untuk error JavaScript
2. Cek file `agent_v3_audit.log` untuk agent audit trail
3. Cek GitHub Actions tab untuk CI/CD error
4. JANGAN tebak-nebak — baca error message dengan teliti

---

## 4. Testing

### 4.1 Web App (Vitest)
```bash
npm test             # Jalankan semua test
npx vitest run       # Run sekali (CI mode)
npx vitest           # Watch mode
```

Test file berada di `tests/` dengan nama `*.test.js`.

### 4.2 Agent (Python unittest)
```bash
python AGENT.py --test   # Jalankan 39 unit test
```

---

## 5. CI/CD (GitHub Actions)

Setiap push ke `main` akan otomatis:
1. Install dependencies (`npm ci`)
2. Jalankan web app tests (`npm test`)
3. Jalankan agent tests (`python AGENT.py --test`)
4. Tampilkan hasil di tab Actions

Jika CI/CD gagal:
1. Buka tab Actions di GitHub
2. Klik workflow yang gagal
3. Baca step log untuk melihat error detail
4. Perbaiki di lokal, push ulang

---

## 6. Referensi

| File | Deskripsi |
|------|-----------|
| `AGENT.py` | Python AI Agent (input validation, tool registry, audit logging) |
| `AGENTS.md` | **File ini** — aturan untuk AI model |
| `opencode.json` | Konfigurasi OpenCode AI assistant |
| `.github/workflows/test.yml` | GitHub Actions CI/CD pipeline |
| `tests/` | Folder test web app (Vitest) |
