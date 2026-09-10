-- IPC Configuration Schema
-- Standalone seed / upgrade file for ipc point configuration tables.
-- Safe to run after core tables exist (users must exist for FK on updated_by when inserting with updated_by).
-- Prefer full install via skema.sql; use this to re-seed or upgrade an existing DB.

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

CREATE TABLE IF NOT EXISTS ipc_perilaku_tingkat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ipc_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT 'prestasi, organisasi, kepanitiaan, event, pelanggaran, perilaku',
    field1 VARCHAR(100) DEFAULT NULL COMMENT 'tingkat lomba, nama karakter, jenis pelanggaran, nama organisasi',
    field2 VARCHAR(100) DEFAULT NULL COMMENT 'juara, tingkat penilaian, jabatan',
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
    FOREIGN KEY (level_id) REFERENCES ipc_pelanggaran_level(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Allow config-driven values (no hard ENUM lock)
ALTER TABLE prestasi
    MODIFY juara VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config prestasi.field2',
    MODIFY kategori VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config prestasi.field1';

ALTER TABLE event
    MODIFY tingkat VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config event.field1';

-- ==================== DEFAULT CONFIGURATION DATA ====================
-- Only inserts when table is empty for ipc_config (avoids duplicate unique key errors on re-run)

INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active)
SELECT * FROM (
    SELECT 'ringan' AS name, -1 AS point_value, 'Point untuk pelanggaran ringan' AS description, TRUE AS is_active
    UNION ALL SELECT 'sedang', -5, 'Point untuk pelanggaran sedang', TRUE
    UNION ALL SELECT 'berat', -25, 'Point untuk pelanggaran berat', TRUE
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM ipc_pelanggaran_level LIMIT 1);

INSERT INTO ipc_config (category, field1, field2, field3, point_value, description)
SELECT v.category, v.field1, v.field2, v.field3, v.point_value, v.description
FROM (
    SELECT 'prestasi' category, 'kecamatan' field1, 'juara 1' field2, NULL field3, 50 point_value, 'Juara 1 tingkat kecamatan' description UNION ALL
    SELECT 'prestasi', 'kecamatan', 'juara 2', NULL, 40, 'Juara 2 tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'juara 3', NULL, 30, 'Juara 3 tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'juara harapan 1', NULL, 25, 'Juara Harapan 1 tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'juara harapan 2', NULL, 20, 'Juara Harapan 2 tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'juara harapan 3', NULL, 15, 'Juara Harapan 3 tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'finalis', NULL, 10, 'Finalis tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kecamatan', 'peserta', NULL, 5, 'Peserta tingkat kecamatan' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara 1', NULL, 60, 'Juara 1 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara 2', NULL, 50, 'Juara 2 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara 3', NULL, 40, 'Juara 3 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara harapan 1', NULL, 35, 'Juara Harapan 1 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara harapan 2', NULL, 30, 'Juara Harapan 2 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'juara harapan 3', NULL, 25, 'Juara Harapan 3 tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'finalis', NULL, 15, 'Finalis tingkat kabupaten' UNION ALL
    SELECT 'prestasi', 'kabupaten', 'peserta', NULL, 8, 'Peserta tingkat kabupaten' UNION ALL
    SELECT 'perilaku', 'tanggung_jawab', 'sangat baik', NULL, 5, 'Karakter tanggung jawab sangat baik' UNION ALL
    SELECT 'perilaku', 'tanggung_jawab', 'baik', NULL, 4, 'Karakter tanggung jawab baik' UNION ALL
    SELECT 'perilaku', 'tanggung_jawab', 'cukup baik', NULL, 3, 'Karakter tanggung jawab cukup baik' UNION ALL
    SELECT 'perilaku', 'tanggung_jawab', 'kurang baik', NULL, 1, 'Karakter tanggung jawab kurang baik' UNION ALL
    SELECT 'perilaku', 'disiplin', 'sangat baik', NULL, 5, 'Karakter disiplin sangat baik' UNION ALL
    SELECT 'perilaku', 'disiplin', 'baik', NULL, 4, 'Karakter disiplin baik' UNION ALL
    SELECT 'perilaku', 'disiplin', 'cukup baik', NULL, 3, 'Karakter disiplin cukup baik' UNION ALL
    SELECT 'perilaku', 'disiplin', 'kurang baik', NULL, 1, 'Karakter disiplin kurang baik' UNION ALL
    SELECT 'perilaku', 'kepedulian', 'sangat baik', NULL, 5, 'Karakter kepedulian sangat baik' UNION ALL
    SELECT 'perilaku', 'kepedulian', 'baik', NULL, 4, 'Karakter kepedulian baik' UNION ALL
    SELECT 'perilaku', 'kepedulian', 'cukup baik', NULL, 3, 'Karakter kepedulian cukup baik' UNION ALL
    SELECT 'perilaku', 'kepedulian', 'kurang baik', NULL, 1, 'Karakter kepedulian kurang baik' UNION ALL
    SELECT 'perilaku', 'kemandirian', 'sangat baik', NULL, 5, 'Karakter kemandirian sangat baik' UNION ALL
    SELECT 'perilaku', 'kemandirian', 'baik', NULL, 4, 'Karakter kemandirian baik' UNION ALL
    SELECT 'perilaku', 'kemandirian', 'cukup baik', NULL, 3, 'Karakter kemandirian cukup baik' UNION ALL
    SELECT 'perilaku', 'kemandirian', 'kurang baik', NULL, 1, 'Karakter kemandirian kurang baik' UNION ALL
    SELECT 'perilaku', 'spiritual', 'sangat baik', NULL, 5, 'Karakter spiritual sangat baik' UNION ALL
    SELECT 'perilaku', 'spiritual', 'baik', NULL, 4, 'Karakter spiritual baik' UNION ALL
    SELECT 'perilaku', 'spiritual', 'cukup baik', NULL, 3, 'Karakter spiritual cukup baik' UNION ALL
    SELECT 'perilaku', 'spiritual', 'kurang baik', NULL, 1, 'Karakter spiritual kurang baik' UNION ALL
    SELECT 'perilaku', 'kejujuran', 'sangat baik', NULL, 5, 'Karakter kejujuran sangat baik' UNION ALL
    SELECT 'perilaku', 'kejujuran', 'baik', NULL, 4, 'Karakter kejujuran baik' UNION ALL
    SELECT 'perilaku', 'kejujuran', 'cukup baik', NULL, 3, 'Karakter kejujuran cukup baik' UNION ALL
    SELECT 'perilaku', 'kejujuran', 'kurang baik', NULL, 1, 'Karakter kejujuran kurang baik' UNION ALL
    SELECT 'perilaku', 'kepercayaan_diri', 'sangat baik', NULL, 5, 'Karakter kepercayaan diri sangat baik' UNION ALL
    SELECT 'perilaku', 'kepercayaan_diri', 'baik', NULL, 4, 'Karakter kepercayaan diri baik' UNION ALL
    SELECT 'perilaku', 'kepercayaan_diri', 'cukup baik', NULL, 3, 'Karakter kepercayaan diri cukup baik' UNION ALL
    SELECT 'perilaku', 'kepercayaan_diri', 'kurang baik', NULL, 1, 'Karakter kepercayaan diri kurang baik' UNION ALL
    SELECT 'kepanitiaan', 'ketua', NULL, NULL, 10, 'Ketua kepanitiaan' UNION ALL
    SELECT 'kepanitiaan', 'wakil ketua', NULL, NULL, 8, 'Wakil ketua kepanitiaan' UNION ALL
    SELECT 'kepanitiaan', 'sekretaris', NULL, NULL, 7, 'Sekretaris kepanitiaan' UNION ALL
    SELECT 'kepanitiaan', 'bendahara', NULL, NULL, 7, 'Bendahara kepanitiaan' UNION ALL
    SELECT 'kepanitiaan', 'koordinator', NULL, NULL, 5, 'Koordinator kepanitiaan' UNION ALL
    SELECT 'kepanitiaan', 'anggota', NULL, NULL, 3, 'Anggota kepanitiaan' UNION ALL
    SELECT 'organisasi', 'OSIS', 'ketua', NULL, 10, 'Ketua OSIS' UNION ALL
    SELECT 'organisasi', 'OSIS', 'wakil ketua', NULL, 8, 'Wakil ketua OSIS' UNION ALL
    SELECT 'organisasi', 'OSIS', 'sekretaris', NULL, 7, 'Sekretaris OSIS' UNION ALL
    SELECT 'organisasi', 'OSIS', 'bendahara', NULL, 7, 'Bendahara OSIS' UNION ALL
    SELECT 'organisasi', 'OSIS', 'koordinator', NULL, 5, 'Koordinator OSIS' UNION ALL
    SELECT 'organisasi', 'OSIS', 'anggota', NULL, 3, 'Anggota OSIS' UNION ALL
    SELECT 'organisasi', 'KY', 'ketua', NULL, 10, 'Ketua KY' UNION ALL
    SELECT 'organisasi', 'KY', 'wakil ketua', NULL, 8, 'Wakil ketua KY' UNION ALL
    SELECT 'organisasi', 'KY', 'sekretaris', NULL, 7, 'Sekretaris KY' UNION ALL
    SELECT 'organisasi', 'KY', 'bendahara', NULL, 7, 'Bendahara KY' UNION ALL
    SELECT 'organisasi', 'KY', 'koordinator', NULL, 5, 'Koordinator KY' UNION ALL
    SELECT 'organisasi', 'KY', 'anggota', NULL, 3, 'Anggota KY' UNION ALL
    SELECT 'organisasi', 'MPK', 'ketua', NULL, 10, 'Ketua MPK' UNION ALL
    SELECT 'organisasi', 'MPK', 'wakil ketua', NULL, 8, 'Wakil ketua MPK' UNION ALL
    SELECT 'organisasi', 'MPK', 'sekretaris', NULL, 7, 'Sekretaris MPK' UNION ALL
    SELECT 'organisasi', 'MPK', 'bendahara', NULL, 7, 'Bendahara MPK' UNION ALL
    SELECT 'organisasi', 'MPK', 'koordinator', NULL, 5, 'Koordinator MPK' UNION ALL
    SELECT 'organisasi', 'MPK', 'anggota', NULL, 3, 'Anggota MPK' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'ketua', NULL, 10, 'Ketua PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'wakil ketua', NULL, 8, 'Wakil ketua PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'sekretaris', NULL, 7, 'Sekretaris PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'bendahara', NULL, 7, 'Bendahara PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'koordinator', NULL, 5, 'Koordinator PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PRAMUKA', 'anggota', NULL, 3, 'Anggota PRAMUKA' UNION ALL
    SELECT 'organisasi', 'PKS', 'ketua', NULL, 10, 'Ketua PKS' UNION ALL
    SELECT 'organisasi', 'PKS', 'wakil ketua', NULL, 8, 'Wakil ketua PKS' UNION ALL
    SELECT 'organisasi', 'PKS', 'sekretaris', NULL, 7, 'Sekretaris PKS' UNION ALL
    SELECT 'organisasi', 'PKS', 'bendahara', NULL, 7, 'Bendahara PKS' UNION ALL
    SELECT 'organisasi', 'PKS', 'koordinator', NULL, 5, 'Koordinator PKS' UNION ALL
    SELECT 'organisasi', 'PKS', 'anggota', NULL, 3, 'Anggota PKS' UNION ALL
    SELECT 'organisasi', 'PMR', 'ketua', NULL, 10, 'Ketua PMR' UNION ALL
    SELECT 'organisasi', 'PMR', 'wakil ketua', NULL, 8, 'Wakil ketua PMR' UNION ALL
    SELECT 'organisasi', 'PMR', 'sekretaris', NULL, 7, 'Sekretaris PMR' UNION ALL
    SELECT 'organisasi', 'PMR', 'bendahara', NULL, 7, 'Bendahara PMR' UNION ALL
    SELECT 'organisasi', 'PMR', 'koordinator', NULL, 5, 'Koordinator PMR' UNION ALL
    SELECT 'organisasi', 'PMR', 'anggota', NULL, 3, 'Anggota PMR' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'ketua', NULL, 10, 'Ketua PASKIBRAKA' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'wakil ketua', NULL, 8, 'Wakil ketua PASKIBRAKA' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'sekretaris', NULL, 7, 'Sekretaris PASKIBRAKA' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'bendahara', NULL, 7, 'Bendahara PASKIBRAKA' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'koordinator', NULL, 5, 'Koordinator PASKIBRAKA' UNION ALL
    SELECT 'organisasi', 'PASKIBRAKA', 'anggota', NULL, 3, 'Anggota PASKIBRAKA' UNION ALL
    SELECT 'event', 'sekolah', NULL, NULL, 5, 'Event tingkat sekolah' UNION ALL
    SELECT 'event', 'kecamatan', NULL, NULL, 10, 'Event tingkat kecamatan' UNION ALL
    SELECT 'event', 'kabupaten', NULL, NULL, 15, 'Event tingkat kabupaten' UNION ALL
    SELECT 'event', 'provinsi', NULL, NULL, 20, 'Event tingkat provinsi' UNION ALL
    SELECT 'event', 'nasional', NULL, NULL, 25, 'Event tingkat nasional' UNION ALL
    SELECT 'event', 'internasional', NULL, NULL, 30, 'Event tingkat internasional'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM ipc_config LIMIT 1);

INSERT IGNORE INTO ipc_organisasi (name)
SELECT DISTINCT field1 FROM ipc_config
WHERE category = 'organisasi' AND field1 IS NOT NULL;

INSERT IGNORE INTO ipc_perilaku_karakter (name)
SELECT DISTINCT field1 FROM ipc_config
WHERE category = 'perilaku' AND field1 IS NOT NULL;

INSERT IGNORE INTO ipc_perilaku_tingkat (name) VALUES
('sangat baik'), ('baik'), ('cukup baik'), ('kurang baik');

CREATE INDEX idx_ipc_config_category ON ipc_config(category);
CREATE INDEX idx_ipc_config_field1 ON ipc_config(field1);
CREATE INDEX idx_ipc_config_field2 ON ipc_config(field2);
CREATE INDEX idx_ipc_config_active ON ipc_config(is_active);
