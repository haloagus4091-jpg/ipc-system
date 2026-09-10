-- IPC Configuration Schema
-- Tabel untuk menyimpan konfigurasi point IPC yang bisa diubah oleh superadmin

-- ==================== IPC CONFIGURATION TABLES ====================

CREATE TABLE IF NOT EXISTS ipc_organisasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ipc_perilaku_karakter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Main IPC Configuration Table
DROP TABLE IF EXISTS ipc_config;
CREATE TABLE ipc_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT 'prestasi, organisasi, kepanitiaan, event, pelanggaran, perilaku',
    field1 VARCHAR(100) DEFAULT NULL COMMENT 'tingkat lomba, nama karakter, jenis pelanggaran, nama organisasi',
    field2 VARCHAR(100) DEFAULT NULL COMMENT 'tingkat (kecamatan/nasional), juara (juara 1/2/3), tingkat jabatan, event level',
    field3 VARCHAR(100) DEFAULT NULL COMMENT 'legacy compatibility column',
    point_value INT NOT NULL COMMENT 'nilai point',
    description TEXT COMMENT 'deskripsi tambahan',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT COMMENT 'user id yang terakhir update',
    UNIQUE KEY unique_config (category, field1, field2, field3),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==================== DEFAULT CONFIGURATION DATA ====================

-- PRESTASI Configuration
-- Format: field1=tingkat lomba, field2=juara lomba, field3=NULL
INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
('prestasi', 'kecamatan', 'juara 1', NULL, 50, 'Juara 1 tingkat kecamatan'),
('prestasi', 'kecamatan', 'juara 2', NULL, 40, 'Juara 2 tingkat kecamatan'),
('prestasi', 'kecamatan', 'juara 3', NULL, 30, 'Juara 3 tingkat kecamatan'),
('prestasi', 'kecamatan', 'juara harapan 1', NULL, 25, 'Juara Harapan 1 tingkat kecamatan'),
('prestasi', 'kecamatan', 'juara harapan 2', NULL, 20, 'Juara Harapan 2 tingkat kecamatan'),
('prestasi', 'kecamatan', 'juara harapan 3', NULL, 15, 'Juara Harapan 3 tingkat kecamatan'),
('prestasi', 'kecamatan', 'finalis', NULL, 10, 'Finalis tingkat kecamatan'),
('prestasi', 'kecamatan', 'peserta', NULL, 5, 'Peserta tingkat kecamatan'),
('prestasi', 'kabupaten', 'juara 1', NULL, 60, 'Juara 1 tingkat kabupaten'),
('prestasi', 'kabupaten', 'juara 2', NULL, 50, 'Juara 2 tingkat kabupaten'),
('prestasi', 'kabupaten', 'juara 3', NULL, 40, 'Juara 3 tingkat kabupaten'),
('prestasi', 'kabupaten', 'juara harapan 1', NULL, 35, 'Juara Harapan 1 tingkat kabupaten'),
('prestasi', 'kabupaten', 'juara harapan 2', NULL, 30, 'Juara Harapan 2 tingkat kabupaten'),
('prestasi', 'kabupaten', 'juara harapan 3', NULL, 25, 'Juara Harapan 3 tingkat kabupaten'),
('prestasi', 'kabupaten', 'finalis', NULL, 15, 'Finalis tingkat kabupaten'),
('prestasi', 'kabupaten', 'peserta', NULL, 8, 'Peserta tingkat kabupaten');

-- PERILAKU Configuration
-- Format: field1=nama karakter, field2=tingkat penilaian
INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
-- Tanggung Jawab
('perilaku', 'tanggung_jawab', 'sangat baik', NULL, 5, 'Karakter tanggung jawab sangat baik'),
('perilaku', 'tanggung_jawab', 'baik', NULL, 4, 'Karakter tanggung jawab baik'),
('perilaku', 'tanggung_jawab', 'cukup baik', NULL, 3, 'Karakter tanggung jawab cukup baik'),
('perilaku', 'tanggung_jawab', 'kurang baik', NULL, 1, 'Karakter tanggung jawab kurang baik'),

-- Disiplin
('perilaku', 'disiplin', 'sangat baik', NULL, 5, 'Karakter disiplin sangat baik'),
('perilaku', 'disiplin', 'baik', NULL, 4, 'Karakter disiplin baik'),
('perilaku', 'disiplin', 'cukup baik', NULL, 3, 'Karakter disiplin cukup baik'),
('perilaku', 'disiplin', 'kurang baik', NULL, 1, 'Karakter disiplin kurang baik'),

-- Kepedulian
('perilaku', 'kepedulian', 'sangat baik', NULL, 5, 'Karakter kepedulian sangat baik'),
('perilaku', 'kepedulian', 'baik', NULL, 4, 'Karakter kepedulian baik'),
('perilaku', 'kepedulian', 'cukup baik', NULL, 3, 'Karakter kepedulian cukup baik'),
('perilaku', 'kepedulian', 'kurang baik', NULL, 1, 'Karakter kepedulian kurang baik'),

-- Kemandirian
('perilaku', 'kemandirian', 'sangat baik', NULL, 5, 'Karakter kemandirian sangat baik'),
('perilaku', 'kemandirian', 'baik', NULL, 4, 'Karakter kemandirian baik'),
('perilaku', 'kemandirian', 'cukup baik', NULL, 3, 'Karakter kemandirian cukup baik'),
('perilaku', 'kemandirian', 'kurang baik', NULL, 1, 'Karakter kemandirian kurang baik'),

-- Spiritual
('perilaku', 'spiritual', 'sangat baik', NULL, 5, 'Karakter spiritual sangat baik'),
('perilaku', 'spiritual', 'baik', NULL, 4, 'Karakter spiritual baik'),
('perilaku', 'spiritual', 'cukup baik', NULL, 3, 'Karakter spiritual cukup baik'),
('perilaku', 'spiritual', 'kurang baik', NULL, 1, 'Karakter spiritual kurang baik'),

-- Kejujuran
('perilaku', 'kejujuran', 'sangat baik', NULL, 5, 'Karakter kejujuran sangat baik'),
('perilaku', 'kejujuran', 'baik', NULL, 4, 'Karakter kejujuran baik'),
('perilaku', 'kejujuran', 'cukup baik', NULL, 3, 'Karakter kejujuran cukup baik'),
('perilaku', 'kejujuran', 'kurang baik', NULL, 1, 'Karakter kejujuran kurang baik'),

-- Kepercayaan Diri
('perilaku', 'kepercayaan_diri', 'sangat baik', NULL, 5, 'Karakter kepercayaan diri sangat baik'),
('perilaku', 'kepercayaan_diri', 'baik', NULL, 4, 'Karakter kepercayaan diri baik'),
('perilaku', 'kepercayaan_diri', 'cukup baik', NULL, 3, 'Karakter kepercayaan diri cukup baik'),
('perilaku', 'kepercayaan_diri', 'kurang baik', NULL, 1, 'Karakter kepercayaan diri kurang baik');

INSERT IGNORE INTO ipc_perilaku_karakter (name)
SELECT DISTINCT field1 FROM ipc_config
WHERE category = 'perilaku' AND field1 IS NOT NULL;

-- PELANGGARAN Configuration
CREATE TABLE IF NOT EXISTS ipc_pelanggaran_level (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    point_value INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ipc_pelanggaran_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    level_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES ipc_pelanggaran_level(id) ON DELETE RESTRICT
);

INSERT IGNORE INTO ipc_pelanggaran_level (name, point_value, description) VALUES
('ringan', -1, 'Point untuk pelanggaran ringan'),
('sedang', -5, 'Point untuk pelanggaran sedang'),
('berat', -25, 'Point untuk pelanggaran berat');

-- KEPANITIAAN Configuration
-- Format: field1=jabatan, field2=NULL, field3=NULL
INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
('kepanitiaan', 'ketua', NULL, NULL, 10, 'Ketua kepanitiaan'),
('kepanitiaan', 'wakil ketua', NULL, NULL, 8, 'Wakil ketua kepanitiaan'),
('kepanitiaan', 'sekretaris', NULL, NULL, 7, 'Sekretaris kepanitiaan'),
('kepanitiaan', 'bendahara', NULL, NULL, 7, 'Bendahara kepanitiaan'),
('kepanitiaan', 'koordinator', NULL, NULL, 5, 'Koordinator kepanitiaan'),
('kepanitiaan', 'anggota', NULL, NULL, 3, 'Anggota kepanitiaan');

-- ORGANISASI Configuration
-- Format: field1=nama organisasi, field2=jabatan, field3=NULL
INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
-- OSIS
('organisasi', 'OSIS', 'ketua', NULL, 10, 'Ketua OSIS'),
('organisasi', 'OSIS', 'wakil ketua', NULL, 8, 'Wakil ketua OSIS'),
('organisasi', 'OSIS', 'sekretaris', NULL, 7, 'Sekretaris OSIS'),
('organisasi', 'OSIS', 'bendahara', NULL, 7, 'Bendahara OSIS'),
('organisasi', 'OSIS', 'koordinator', NULL, 5, 'Koordinator OSIS'),
('organisasi', 'OSIS', 'anggota', NULL, 3, 'Anggota OSIS'),

-- KY
('organisasi', 'KY', 'ketua', NULL, 10, 'Ketua KY'),
('organisasi', 'KY', 'wakil ketua', NULL, 8, 'Wakil ketua KY'),
('organisasi', 'KY', 'sekretaris', NULL, 7, 'Sekretaris KY'),
('organisasi', 'KY', 'bendahara', NULL, 7, 'Bendahara KY'),
('organisasi', 'KY', 'koordinator', NULL, 5, 'Koordinator KY'),
('organisasi', 'KY', 'anggota', NULL, 3, 'Anggota KY'),

-- MPK
('organisasi', 'MPK', 'ketua', NULL, 10, 'Ketua MPK'),
('organisasi', 'MPK', 'wakil ketua', NULL, 8, 'Wakil ketua MPK'),
('organisasi', 'MPK', 'sekretaris', NULL, 7, 'Sekretaris MPK'),
('organisasi', 'MPK', 'bendahara', NULL, 7, 'Bendahara MPK'),
('organisasi', 'MPK', 'koordinator', NULL, 5, 'Koordinator MPK'),
('organisasi', 'MPK', 'anggota', NULL, 3, 'Anggota MPK'),

-- PRAMUKA
('organisasi', 'PRAMUKA', 'ketua', NULL, 10, 'Ketua PRAMUKA'),
('organisasi', 'PRAMUKA', 'wakil ketua', NULL, 8, 'Wakil ketua PRAMUKA'),
('organisasi', 'PRAMUKA', 'sekretaris', NULL, 7, 'Sekretaris PRAMUKA'),
('organisasi', 'PRAMUKA', 'bendahara', NULL, 7, 'Bendahara PRAMUKA'),
('organisasi', 'PRAMUKA', 'koordinator', NULL, 5, 'Koordinator PRAMUKA'),
('organisasi', 'PRAMUKA', 'anggota', NULL, 3, 'Anggota PRAMUKA'),

-- PKS
('organisasi', 'PKS', 'ketua', NULL, 10, 'Ketua PKS'),
('organisasi', 'PKS', 'wakil ketua', NULL, 8, 'Wakil ketua PKS'),
('organisasi', 'PKS', 'sekretaris', NULL, 7, 'Sekretaris PKS'),
('organisasi', 'PKS', 'bendahara', NULL, 7, 'Bendahara PKS'),
('organisasi', 'PKS', 'koordinator', NULL, 5, 'Koordinator PKS'),
('organisasi', 'PKS', 'anggota', NULL, 3, 'Anggota PKS'),

-- PMR
('organisasi', 'PMR', 'ketua', NULL, 10, 'Ketua PMR'),
('organisasi', 'PMR', 'wakil ketua', NULL, 8, 'Wakil ketua PMR'),
('organisasi', 'PMR', 'sekretaris', NULL, 7, 'Sekretaris PMR'),
('organisasi', 'PMR', 'bendahara', NULL, 7, 'Bendahara PMR'),
('organisasi', 'PMR', 'koordinator', NULL, 5, 'Koordinator PMR'),
('organisasi', 'PMR', 'anggota', NULL, 3, 'Anggota PMR'),

-- PASKIBRAKA
('organisasi', 'PASKIBRAKA', 'ketua', NULL, 10, 'Ketua PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'wakil ketua', NULL, 8, 'Wakil ketua PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'sekretaris', NULL, 7, 'Sekretaris PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'bendahara', NULL, 7, 'Bendahara PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'koordinator', NULL, 5, 'Koordinator PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'anggota', NULL, 3, 'Anggota PASKIBRAKA');

-- EVENT Configuration
-- Format: field1=event level, field2=NULL, field3=NULL
INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
('event', 'sekolah', NULL, NULL, 5, 'Event tingkat sekolah'),
('event', 'kecamatan', NULL, NULL, 10, 'Event tingkat kecamatan'),
('event', 'kabupaten', NULL, NULL, 15, 'Event tingkat kabupaten'),
('event', 'provinsi', NULL, NULL, 20, 'Event tingkat provinsi'),
('event', 'nasional', NULL, NULL, 25, 'Event tingkat nasional'),
('event', 'internasional', NULL, NULL, 30, 'Event tingkat internasional');

-- ==================== INDEXES ====================
CREATE INDEX idx_ipc_config_category ON ipc_config(category);
CREATE INDEX idx_ipc_config_field1 ON ipc_config(field1);
CREATE INDEX idx_ipc_config_field2 ON ipc_config(field2);
CREATE INDEX idx_ipc_config_active ON ipc_config(is_active);