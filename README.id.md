[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | **Bahasa Indonesia** | [Tiếng Việt](README.vi.md)

# Naia ADK

**Perancah ruang kerja yang sudah dirapikan untuk tempat agen coding AI bekerja.**

Ketika memakai perkakas coding AI seperti Claude Code atau Codex, setiap perkakas menyimpan file
aturannya di tempat yang berbeda, dan pertanyaan seperti “apakah dokumen ini boleh dipublikasikan?”
atau “skill ditaruh di mana?” dijawab secara ad hoc. Naia ADK menggelar kerangka itu di muka. Sama
seperti menyiapkan lingkungan pengembangan di laptop baru, ia menyerahkan meja yang rapi kepada agen
AI untuk mulai bekerja. Ia juga menyertakan dasbor agar keadaan ruang kerja terlihat sekilas.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Jalan dalam 5 menit

Anda butuh **Node 22+** dan **pnpm 9+**.

```bash
pnpm install    # memasang dependensi ruang kerja
pnpm dev        # menjalankan server API (:3141) dan dasbor (:3142) bersamaan
```

Buka `http://localhost:3142` di peramban untuk melihat dasbor. Tiga hal langsung terlihat:

- **Ruang kerja** — proyek dan submodule, pohon file, dan tingkat
  keterbukaan setiap item.
- **Katalog skill** — daftar skill yang terdaftar di ruang kerja ini, dan isinya.
- **Pengaturan / pemantauan** — konfigurasi server, status klien, direktori data.

Dasbor meneruskan permintaan `/api/*` ke server API di port 3141. Untuk menjalankan salah satunya
saja, gunakan `pnpm dev:server` (→ 3141) atau `pnpm dev:dashboard` (→ 3142). Skrip peluncur
`./start.sh` (Linux/macOS) dan `start.bat` (Windows) sama-sama menjalankan `pnpm dev`. CLI server
menerima `--port`, `--host`, dan `--root`; misalnya, untuk mengarah ke ruang kerja lain:
`pnpm serve -- --root /path/to/workspace`.

## Apa isinya

### Perancah ruang kerja

Ia memberi agen AI sekumpulan direktori dengan tempat tetap untuk segalanya, sehingga bisa langsung
bekerja. Konteks untuk AI tinggal di `.agents/` (Inggris, JSON/YAML), dan cermin yang terbaca manusia
tinggal di `.users/` (Korea, Markdown). Cermin itu sebagian, bukan salinan penuh — ia menyimpan
dokumen yang perlu dibaca manusia (misalnya skill bersifat kanonis di `.agents/skills/`, dan hanya
sebagian yang dicerminkan ke `.users/skills/`). Skill, data, dan proyek semuanya punya lokasi
tetap, sehingga ruang kerja tampak sama apa pun perkakas yang membukanya.

### Dasbor dan API

Dasbor Next.js mengelola ruang kerja secara visual, didukung server API Fastify. API memaparkan
metadata ruang kerja (`/api/workspace`), katalog skill (`/api/skills`), baca/tulis file
(`/api/files`), dan WebSocket yang mengalirkan peristiwa perubahan file (`/api/ws`). Berkat API ini,
program selain dasbor pun dapat menjangkau ruang kerja.

### Sistem skill

Tugas berulang dibundel menjadi skill yang dapat dipakai ulang. Setiap skill didefinisikan oleh satu
`SKILL.md`, dan server API memindai `skills/` untuk membangun katalog. Jika satu saja skill melanggar
format, seluruh katalog melempar kesalahan (fail-closed): alih-alih membuang diam-diam skill yang
rusak dan menyajikan sisanya, operator dipaksa memperbaikinya saat itu juga. Ini pilihan sadar agar
tak sengaja merilis katalog yang tidak lengkap.

### Aturan dan tata kelola minimum

Bahkan ruang kerja yang dipakai sendiri butuh aturan minimum begitu AI dan otomatisasi menyentuhnya.
Naia ADK memisahkan `read`, `write`, `execute`, dan `publish` sebagai kepentingan yang berbeda, dan
menempelkan tingkat keterbukaan pada setiap dokumen. Tindakan yang sulit dibatalkan — perubahan
produksi, penanganan rahasia, klaim publik — dipisahkan dari edit lokal biasa dan dilewatkan gerbang
persetujuan.

Keterbukaan punya empat tingkat. `public` aman dikirim apa adanya ke situs publik atau repo sumber
terbuka; `controlled` boleh dibagikan ke luar setelah ditinjau; `internal` tetap di dalam ruang
kerja; `confidential` mencakup materi sensitif seperti kontrak, kredensial, dan data pribadi.
Kredensial biasanya tinggal di luar git, tetapi menurut tingkatnya tetap `confidential`.

> **Penegakan kontrak sesi dimatikan dalam rilis ini.** Penanda `.claude/no-harness` di-commit,
> sehingga gerbang kontrak sesi tidak memblokir apa pun. Bila dinyalakan, sesi tanpa kontrak
> diblokir dari setiap perintah shell yang bermutasi — termasuk `npm test` — sehingga klon baru pun
> tak bisa menjalankan rangkaian ujinya sendiri. Jalur edit file dibuka karena alasan yang sama;
> jalur shell belum mendapat perlakuan yang sama. Penjaga force-push, git destruktif, deploy, dan
> pesan keluar tidak terpengaruh dan tetap berjalan. Kemajuan dilacak di
> [#34](https://github.com/nextain/naia-template-project/issues/34), rinciannya di
> `.claude/no-harness`. Bagian batas sesi di `AGENTS.md` menggambarkan desain yang dimaksud, bukan
> perilaku runtime saat ini.

### Adapter LLM (naia-anyllm)

Untuk fitur yang perlu menjangkau LLM, adapter `naia-anyllm` sudah built-in. Ia terhubung melalui
gateway [any-llm](https://github.com/nextain/any-llm), atau langsung ke penyedia seperti OpenAI,
Anthropic, dan Google. Bawaan adalah akun Naia: taruh kunci yang diterbitkan di
[naia.nextain.io](https://naia.nextain.io) pada variabel lingkungan `NAIA_KEY` maka kredit akun
langsung bisa dipakai. Tanpa kunci, ia melempar kesalahan sebelum panggilan berbayar apa pun. Untuk
berganti penyedia atau model, salin
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example), dan simpan
kunci API di variabel lingkungan atau keystore sistem operasi, bukan di file konfigurasi.
`naia-settings/llm.json` hanya mencatat `apiKeyRef: "NAIA_KEY"`, tidak pernah nilai kuncinya. Bila
fork pribadi butuh cadangan jangka panjang, gunakan vault terenkripsi age di `data-private/key/`
(lihat [`.env.example`](.env.example)).

Untuk mendaftar model yang didukung dan harga terkini, serta menerjemahkan PDF panjang, gunakan skill
`translate-doc`. Pencarian model dan harga berjalan tanpa kunci; penerjemahan menunjukkan estimasi
biaya lebih dulu dan dapat dilanjutkan dari titik berhenti.

## Mengapa dibangun begini

### Format adalah kontraknya

Jantung Naia ADK bukan perkakas tertentu melainkan **format**. Tata letak direktori (`.agents/`,
`.users/`, `skills/`, `data-*/`) dan skema file (`agents-rules.json`, `SKILL.md`) adalah kesepakatan
tetap, dan perkakas apa pun yang bisa membaca kesepakatan itu dapat mengonsumsi ruang kerja yang
sama. Claude Code, opencode, Codex, dan naia-agent masing-masing membaca ruang kerja yang sama tanpa
menanamkan kode satu sama lain. Jadi Anda bisa berganti perkakas atau mencampur beberapa, dan ruang
kerja tetap berjalan.

Penegakan aturan itu sendiri juga tidak terikat perkakas. Inti netral-host (`.agents/hooks/core/`)
dan kebijakan (`.agents/hooks/policies/`) menggerakkan hook Claude Code maupun ekstensi pi dengan
aturan yang sama.

### Basis pribadi sebelum tumbuh menjadi tim

Naia ADK murni untuk satu pengguna, pemakaian pribadi. Bagan organisasi perusahaan, aturan
tenant, dan rantai persetujuan yang didelegasikan termasuk lapisan yang lebih tinggi. Yang
diberikannya adalah satu tempat untuk menulis disiplin konteks sebelum ruang kerja tumbuh ke skala
tim atau perusahaan.

Ketika kolaborasi tim dan pengetahuan bersama dibutuhkan, perluas ke
[Naia Business ADK](https://nextain.io/adk). Perluasan itu melebarkan baseline ke tata kelola aset,
proses, dan izin, serta menambah kepemilikan tim dan persetujuan yang didelegasikan.

### Rantai fork

Naia ADK dimaksudkan untuk di-fork menjadi milik Anda. Individu mem-fork `naia-adk` langsung;
organisasi melalui `naia-business-adk` untuk menginstansiasi ruang kerja perusahaan dan anggota.

```
naia-adk                  ← basis pribadi (publik, Apache 2.0)
  └── {org}-adk           ← fork org: data perusahaan + submodule bisnis
        └── {user}-adk    ← fork pribadi: data pribadi + submodule proyek
```

Rantai nyata Nextain berjalan `naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Struktur

Repo terbagi menjadi kode runtime (`packages/`), aturan dan konteks (`.agents/`, `.users/`), skill
(`skills/`, `.agents/skills/`), dan direktori data yang diisi tiap fork.

| Direktori | Tujuan |
|-----------|---------|
| `.agents/` | Konteks untuk AI (Inggris, JSON/YAML) — sumber kebenaran tunggal untuk aturan |
| `.users/` | Cermin terbaca manusia (Korea, Markdown) |
| `.claude/` | Konfigurasi Claude Code, hook, symlink skill |
| `skills/` | Skill operasional/runtime (disajikan API dasbor) |
| `scripts/` | Skrip utilitas |
| `templates/` | Templat dokumen |
| `docs/` | Dok arsitektur, spec desain |
| `packages/` | Paket runtime (workspace pnpm) |

### Paket runtime (packages/, 10 paket)

Tiga adalah program yang benar-benar berjalan; sisanya paket tipis yang mendefinisikan format dan
spec.

- `core` — mesin yang memparsing ruang kerja dan skill.
- `server` — API REST/WebSocket Fastify.
- `dashboard` — UI dasbor Next.js.
- `skill-spec` — kontrak format skill yang netral perkakas (`SkillDescriptor`, `SkillLoader`).
- `skills-builtin` — katalog skill generik.
- `openclaw-compat` — perkakas yang memigrasi skill OpenClaw ke format naia.
- `persona` — spec konvensi system-prompt.
- `process` — spec pola alur kerja (tinjau → putuskan → eksekusi, pengembangan berbasis isu,
  dan sebagainya).
- `naia-anyllm` — adapter LLM gateway any-llm / penyedia langsung.
- `artifacts-spec` — skema standar artefak perizinan (RBAC) dan siklus hidup pengembangan
  (SDLC). Mendefinisikan 15 jenis artefak sebagai JSON Schema dan menetapkan, untuk masing-masing,
  apakah instansinya dilacak git atau terbatas sesi.

### Direktori data (diabaikan git, diisi per fork)

Keempatnya tidak pernah di-commit. Siapa pun yang mem-fork repo mengisi datanya sendiri.

| Direktori | Cakupan | Isi |
|-----------|-------|---------|
| `data-company/` | Perusahaan | Dok seluruh perusahaan, sumber daya bersama |
| `data-teams/` | Tim | Dokumen tim (strategi, akuntansi, dll.) |
| `data-private/` | Pribadi | Data pribadi, file env, dok privat |
| `projects/` | Pribadi | Repo proyek (submodule) |

### Dua pohon skill

Skill tinggal di dua tempat, dikonsumsi pihak yang berbeda.

- `.agents/skills/` — skill bantuan AI dan alur kerja. Claude Code memakainya via symlink
  `.claude/skills/`. Mencakup tinjauan (`review-pass`), verifikasi (`verify-implementation`),
  gabung worktree (`merge-worktree`), ekstraksi dokumen (`read-doc`), skill bisnis seperti
  paten/hak cipta/penggajian, dan lainnya seperti `finetune-persona`, `secret-vault`, dan
  `youtube-upload`.
- `skills/` — skill operasional/runtime. Server API memindai `skills/**/SKILL.md` dan
  menyajikannya ke dasbor. Ini mencakup pengiriman email/SMS/notifikasi, pengelolaan kanal,
  pemantauan layanan dan web, dan pembuatan dokumen; `skills/business/` memuat skill org seperti
  `press-release`.

Daftar paling akurat adalah katalog skill di dasbor. Tabel teks juga disimpan di
[AGENTS.en.md](AGENTS.en.md#skills).

## Memulai

### Pribadi

1. Fork `naia-adk` ke akun Anda sendiri (privat bila bisa).
2. Klon: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Tambahkan upstream: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Buat direktori data: `mkdir -p data-private projects`
5. Tambahkan proyek, konfigurasikan `.agents/`, dan mulai bekerja.
6. Bila memakai sumber daya akun Naia, set `NAIA_KEY` sebagai variabel lingkungan.
7. Sinkronkan berkala: `git fetch upstream && git merge upstream/main`

### Perusahaan

1. [Hubungi kami](https://nextain.io/contact) untuk akses ke `naia-business-adk`.
2. Fork `naia-business-adk` secara privat ke akun org, lalu klon.
3. Tambahkan upstream: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Isi data perusahaan dan submodule proyek: `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Setiap anggota mem-fork ulang ADK org sebagai ruang kerja pribadi.

### Integrasi Naia Shell (opsional)

Bila memakai aplikasi desktop [Naia Shell](https://github.com/nextain/naia-shell), arahkan path
ruang kerjanya ke direktori ADK Anda. Skill dan data disajikan lewat API.

## Berkontribusi

Tulis issue, PR, dan diskusi dalam bahasa yang Anda nyaman; AI memediasi komunikasi. Hanya saja
rekam git (commit, konteks, artefak bersama) tetap dalam bahasa Inggris. Untuk proses dan aturan
lengkap, lihat [CONTRIBUTING.md](CONTRIBUTING.md). Pengembangan baku berbasis isu; alur rinci ada di
[AGENTS.en.md](AGENTS.en.md) dan [`.agents/workflows/`](.agents/workflows/).

## Peta jalan

Berikut ini yang direncanakan, bukan fitur yang berfungsi hari ini.

- **Atom pengetahuan** — konteks kini berbasis file, sehingga menemukan satu informasi saja harus
  memuat seluruh file dan membuang token. Idenya adalah memecah konteks menjadi unit bermakna
  terkecil, menautkannya dengan tag, dan menarik tepat potongan yang dibutuhkan. Akses lewat CLI
  atau MCP agar tetap netral perkakas.

## Lisensi

Apache License 2.0. Lihat [LICENSE](LICENSE) untuk rinciannya.

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Ekosistem Naia

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (klien shell desktop & web)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (runtime agen & orkestrasi perkakas)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (memori agen persisten)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (kompiler basis pengetahuan untuk konteks terstruktur)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (kit pengembangan AI)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
