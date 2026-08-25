# IPC School System

Sistem Indeks Prestasi dan Karakter untuk sekolah dengan fitur lengkap untuk mengelola prestasi, organisasi, event, pelanggaran, dan perilaku siswa.

## Fitur Utama

### Input Data
- **Input Prestasi**: Mencatat prestasi akademik dan non-akademik dengan sistem poin berdasarkan juara dan kategori (kecamatan, kabupaten, provinsi, nasional, internasional)
- **Input Organisasi**: Mencatat keanggotaan organisasi dengan poin berdasarkan jabatan
- **Input Event**: Mencatat partisipasi event dengan poin berdasarkan tingkat
- **Input Pelanggaran**: Mencatat pelanggaran dengan pengurangan poin IPC
- **Input Perilaku**: Mencatat karakter siswa dengan penambahan poin

### Sistem Approval
- Semua data input memerlukan approval dari Superadmin sebelum disimpan ke database
- Superadmin dapat approve atau reject dengan memberikan alasan
- User mendapatkan notifikasi status approval

### Manajemen Akun
- **Superadmin**: Akun tertinggi dengan akses penuh
- **Guru**: Dapat input data sesuai izin dari superadmin
- **Siswa**: Dapat melihat data dan input sesuai izin dari superadmin

### Sistem Izin (Permissions)
- Superadmin dapat mengatur izin input untuk setiap user
- Bulk permission untuk semua siswa
- Individual permission per user

### Fitur Lainnya
- Dashboard statistik untuk semua user
- Search siswa untuk melihat prestasi
- Profile dengan biodata dan riwayat IPC
- Activity logs untuk audit
- Manajemen Wali Kelas
- Poin IPC otomatis dihitung

## Teknologi

### Backend
- Node.js (Express.js)
- MySQL
- JWT Authentication
- Multer (file upload)
- Bcrypt (password hashing)

### Frontend
- React.js
- React Router
- Axios

## Instalasi

### Prasyarat
- Node.js (v14 atau lebih tinggi)
- MySQL / XAMPP
- npm atau yarn

### Langkah-langkah

#### 1. Setup Database
1. Buka phpMyAdmin
2. Buat database baru bernama `ipc_school`
3. Import file `backend/database/skema.sql` ke database `ipc_school`
4. Pastikan database berhasil dibuat dengan semua tabel

**Catatan**: Gunakan file `skema.sql` untuk instalasi baru. File `ipc_school.sql` berisi data contoh dan `biodata_approval_schema.sql` sudah termasuk dalam skema.sql.

#### 2. Setup Backend
```bash
cd backend
npm install
```

#### 3. Konfigurasi Backend
Edit file `backend/.env` sesuai konfigurasi database Anda:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ipc_school
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

#### 4. Setup Frontend
```bash
cd frontend
npm install
```

#### 5. Jalankan Backend
```bash
cd backend
npm start
```
Atau untuk development dengan auto-reload:
```bash
npm run dev
```

#### 6. Jalankan Frontend
```bash
cd frontend
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## Login Default

### Superadmin
- **Username**: ADMIN001
- **Password**: admin123

> ⚠️ **PENTING**: Setelah login pertama, password akan otomatis di-hash. Silakan ganti password default untuk keamanan.

## Sistem Poin IPC

### Prestasi
| Juara | Kecamatan | Kabupaten | Provinsi | Nasional | Internasional |
|-------|-----------|-----------|----------|----------|---------------|
| Juara 1 | 8 | 12 | 30 | 40 | 50 |
| Juara 2 | 7 | 10 | 25 | 35 | 45 |
| Juara 3 | 6 | 8 | 20 | 30 | 40 |
| Harapan 1 | 5 | 7 | 15 | 25 | 35 |
| Harapan 2 | 4 | 6 | 12 | 20 | 30 |
| Harapan 3 | 3 | 5 | 10 | 15 | 25 |
| Finalis | 2 | 4 | 8 | 10 | 20 |
| Peserta | 1 | 3 | 5 | 8 | 15 |

### Organisasi
- Ketua Organisasi: 6 poin
- Wakil Ketua: 5 poin
- Sekretaris: 4 poin
- Bendahara: 3 poin
- Koordinator: 2 poin
- Anggota: 1 poin

### Event
- Sekolah: 2 poin
- Kecamatan: 4 poin
- Kabupaten: 6 poin
- Provinsi: 8 poin
- Nasional: 10 poin
- Internasional: 12 poin

### Pelanggaran (Pengurangan)
- Ringan: -1 poin
- Sedang: -5 poin
- Berat: -25 poin

### Perilaku
- Kurang Baik: 1 poin
- Cukup Baik: 2 poin
- Baik: 3 poin
- Sangat Baik: 4 poin

## Kelas Tersedia

Sistem menggunakan jurusan (program/studi) dan kelas dihitung otomatis berdasarkan tahun pelajaran.

### Jurusan Tersedia
- **TKJ** (Teknik Komputer dan Jaringan): TKJ 1, TKJ 2, TKJ 3
- **TO** (Teknik Otomotif): TO 1, TO 2, TO 3
- **DPIB** (Desain Pemodelan dan Informasi Bangunan): DPIB 1, DPIB 2, DPIB 3
- **TBSM** (Teknik Bisnis dan Sepeda Motor): TBSM 1, TBSM 2, TBSM 3

### Kelas Otomatis
Kelas (X, XI, XII) dihitung otomatis berdasarkan tahun pelajaran saat siswa masuk:
- **Tahun 1**: Kelas X (contoh: X TKJ 1)
- **Tahun 2**: Kelas XI (contoh: XI TKJ 1)
- **Tahun 3**: Kelas XII (contoh: XII TKJ 1)
- **Tahun 4+**: Lulus (is_graduated = 1)

## Struktur Project

```
full project ipcs/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── prestasi.js
│   │   ├── organisasi.js
│   │   ├── event.js
│   │   ├── pelanggaran.js
│   │   ├── perilaku.js
│   │   ├── approvals.js
│   │   ├── permissions.js
│   │   ├── logs.js
│   │   ├── dashboard.js
│   │   ├── waliKelas.js
│   │   ├── search.js
│   │   └── profile.js
│   ├── uploads/
│   │   ├── prestasi/
│   │   ├── organisasi/
│   │   ├── event/
│   │   └── pelanggaran/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Navbar.js
│   │   │   ├── Dashboard.js
│   │   │   ├── InputPrestasi.js
│   │   │   ├── InputOrganisasi.js
│   │   │   ├── InputEvent.js
│   │   │   ├── InputPelanggaran.js
│   │   │   ├── InputPerilaku.js
│   │   │   ├── KelolaAkun.js
│   │   │   ├── IzinAkun.js
│   │   │   ├── Search.js
│   │   │   ├── Profile.js
│   │   │   ├── Logs.js
│   │   │   ├── WaliKelas.js
│   │   │   └── Approvals.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── skema.sql
└── README.md
```

## Panduan Penggunaan

### Untuk Superadmin
1. Login dengan akun ADMIN001
2. Buat akun guru dan siswa melalui menu "Kelola Akun"
3. Atur izin input untuk guru dan siswa melalui menu "Izin Akun"
4. Review dan approve/reject submissions melalui menu "Approvals"
5. Monitor aktivitas melalui menu "Logs"
6. Assign wali kelas melalui menu "Wali Kelas"
7. Input data langsung tanpa perlu approval

### Untuk Guru
1. Login dengan NIP
2. Input data sesuai izin yang diberikan superadmin
3. Lihat dashboard statistik
4. Search siswa untuk melihat prestasi
5. Edit biodata sendiri

### Untuk Siswa
1. Login dengan NIS atau NISN
2. Lihat biodata dan IPC di menu Profile
3. Input data sesuai izin yang diberikan superadmin
4. Lihat riwayat IPC
5. Tidak dapat mengedit biodata sendiri

## Troubleshooting

### Database Connection Error
- Pastikan MySQL/XAMPP sedang berjalan
- Cek konfigurasi di file `backend/.env`
- Pastikan database `ipc_school` sudah dibuat

### CORS Error
- Pastikan backend berjalan di port 5000
- Cek konfigurasi CORS di `backend/server.js`

### Upload File Error
- Pastikan folder `uploads` ada di backend
- Pastikan permission folder sudah benar

## Catatan Penting

- Setiap siswa baru otomatis mendapatkan 80 poin IPC awal
- Superadmin dapat mengubah IPC siswa kapan saja
- Data duplikat (NIS/NISN/NIP sama) tidak dapat dibuat
- Semua input data memerlukan approval kecuali dari superadmin
- Foto bukti disimpan di folder `backend/uploads/approvals` di server (local storage)
- Google Drive integration telah dihapus dan diganti dengan penyimpanan lokal server

## Pengembangan Lanjutan

Fitur yang dapat ditambahkan:
- Export laporan ke Excel/PDF
- Print system
- Notifikasi email
- Dashboard grafik lebih interaktif
- Mobile app

## License

Project ini dibuat untuk keperluan sekolah.
