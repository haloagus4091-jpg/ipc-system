-- IPC Configuration Schema
-- Tabel untuk menyimpan konfigurasi point IPC yang bisa diubah oleh superadmin

-- ==================== IPC CONFIGURATION TABLES ====================

-- Main IPC Configuration Table
DROP TABLE IF EXISTS ipc_config;
CREATE TABLE ipc_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT 'prestasi, organisasi, kepanitiaan, event, pelanggaran, perilaku',
    indicator VARCHAR(100) NOT NULL COMMENT 'nama indikator (juara, jabatan, tingkat, jenis, karakter)',
    sub_indicator VARCHAR(100) DEFAULT NULL COMMENT 'sub-indikator (kategori, jabatan detail)',
    point_value INT NOT NULL COMMENT 'nilai point',
    description TEXT COMMENT 'deskripsi indikator',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT COMMENT 'user id yang terakhir update',
    UNIQUE KEY unique_config (category, indicator, sub_indicator),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==================== DEFAULT CONFIGURATION DATA ====================

-- PRESTASI Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
-- Juara Configuration
('prestasi', 'juara', 'juara 1', 8, 'Juara 1 - prestasi tertinggi'),
('prestasi', 'juara', 'juara 2', 6, 'Juara 2 - prestasi tinggi'),
('prestasi', 'juara', 'juara 3', 5, 'Juara 3 - prestasi baik'),
('prestasi', 'juara', 'juara harapan 1', 4, 'Juara Harapan 1'),
('prestasi', 'juara', 'juara harapan 2', 3, 'Juara Harapan 2'),
('prestasi', 'juara', 'juara harapan 3', 2, 'Juara Harapan 3'),
('prestasi', 'juara', 'finalis', 2, 'Finalis'),
('prestasi', 'juara', 'peserta', 1, 'Peserta'),

-- Kategori Configuration (multiplier)
('prestasi', 'kategori', 'kecamatan', 1, 'Multiplier untuk tingkat kecamatan'),
('prestasi', 'kategori', 'kabupaten', 2, 'Multiplier untuk tingkat kabupaten'),
('prestasi', 'kategori', 'provinsi', 3, 'Multiplier untuk tingkat provinsi'),
('prestasi', 'kategori', 'nasional', 4, 'Multiplier untuk tingkat nasional'),
('prestasi', 'kategori', 'internasional', 5, 'Multiplier untuk tingkat internasional');

-- ORGANISASI Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('organisasi', 'jabatan', 'ketua', 5, 'Ketua Organisasi'),
('organisasi', 'jabatan', 'wakil ketua', 4, 'Wakil Ketua Organisasi'),
('organisasi', 'jabatan', 'sekretaris', 4, 'Sekretaris Organisasi'),
('organisasi', 'jabatan', 'bendahara', 3, 'Bendahara Organisasi'),
('organisasi', 'jabatan', 'koordinator', 2, 'Koordinator Organisasi'),
('organisasi', 'jabatan', 'anggota', 1, 'Anggota Organisasi');

-- KEPANITIAAN Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('kepanitiaan', 'jabatan', 'ketua', 5, 'Ketua Kepanitiaan'),
('kepanitiaan', 'jabatan', 'wakil ketua', 4, 'Wakil Ketua Kepanitiaan'),
('kepanitiaan', 'jabatan', 'sekretaris', 4, 'Sekretaris Kepanitiaan'),
('kepanitiaan', 'jabatan', 'bendahara', 3, 'Bendahara Kepanitiaan'),
('kepanitiaan', 'jabatan', 'koordinator', 2, 'Koordinator Kepanitiaan'),
('kepanitiaan', 'jabatan', 'anggota', 1, 'Anggota Kepanitiaan');

-- EVENT Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('event', 'tingkat', 'sekolah', 2, 'Event tingkat sekolah'),
('event', 'tingkat', 'kecamatan', 4, 'Event tingkat kecamatan'),
('event', 'tingkat', 'kabupaten', 6, 'Event tingkat kabupaten'),
('event', 'tingkat', 'provinsi', 8, 'Event tingkat provinsi'),
('event', 'tingkat', 'nasional', 10, 'Event tingkat nasional'),
('event', 'tingkat', 'internasional', 12, 'Event tingkat internasional');

-- PELANGGARAN Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('pelanggaran', 'jenis', 'ringan', -1, 'Pelanggaran ringan'),
('pelanggaran', 'jenis', 'sedang', -5, 'Pelanggaran sedang'),
('pelanggaran', 'jenis', 'berat', -25, 'Pelanggaran berat');

-- PERILAKU Configuration
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('perilaku', 'karakter', 'kurang baik', 1, 'Penilaian karakter kurang baik'),
('perilaku', 'karakter', 'cukup baik', 2, 'Penilaian karakter cukup baik'),
('perilaku', 'karakter', 'baik', 3, 'Penilaian karakter baik'),
('perilaku', 'karakter', 'sangat baik', 4, 'Penilaian karakter sangat baik');

-- PERILAKU Indicators
INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description) VALUES
('perilaku', 'indikator', 'tanggung_jawab', 1, 'Indikator tanggung jawab'),
('perilaku', 'indikator', 'disiplin', 1, 'Indikator disiplin'),
('perilaku', 'indikator', 'kepedulian', 1, 'Indikator kepedulian'),
('perilaku', 'indikator', 'kemandirian', 1, 'Indikator kemandirian'),
('perilaku', 'indikator', 'spiritual', 1, 'Indikator spiritual'),
('perilaku', 'indikator', 'kejujuran', 1, 'Indikator kejujuran'),
('perilaku', 'indikator', 'kepercayaan_diri', 1, 'Indikator kepercayaan diri');

-- ==================== INDEXES ====================
CREATE INDEX idx_ipc_config_category ON ipc_config(category);
CREATE INDEX idx_ipc_config_indicator ON ipc_config(indicator);
CREATE INDEX idx_ipc_config_active ON ipc_config(is_active);