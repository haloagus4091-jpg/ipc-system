-- Database Schema for IPC School System
-- Complete Schema - Import this file AFTER selecting database 'ipc_school' in phpMyAdmin
-- This file contains all tables: users, permissions, prestasi, organisasi, event, pelanggaran, perilaku, 
-- ipc configuration, activity_logs, ipc_history, wali_kelas_assignment, approvals,
-- notifications, drive_links, input_access_control

-- Disable foreign key checks to allow dropping tables in any order
SET FOREIGN_KEY_CHECKS=0;

-- ==================== CORE TABLES ====================

-- Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE,
    nip VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'guru', 'siswa') NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    jurusan VARCHAR(50) DEFAULT NULL COMMENT 'Student program/stream (e.g., TKJ 1, TO 2)',
    wali_kelas VARCHAR(50),
    ipc_total INT DEFAULT 80,
    ipc_awal INT DEFAULT 80,
    alamat TEXT,
    no_hp VARCHAR(20),
    detail VARCHAR(100), -- Legacy database column; stores teacher jabatan
    foto VARCHAR(255),
    tahun_pelajaran VARCHAR(9) DEFAULT NULL COMMENT 'Academic year when student first enrolled (YYYY-YYYY format)',
    is_graduated TINYINT(1) DEFAULT 0 COMMENT 'Whether student has graduated (0=active, 1=graduated)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions Table
DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    can_input_prestasi BOOLEAN DEFAULT FALSE,
    can_input_organisasi BOOLEAN DEFAULT FALSE,
    can_input_event BOOLEAN DEFAULT FALSE,
    can_input_pelanggaran BOOLEAN DEFAULT FALSE,
    can_input_perilaku BOOLEAN DEFAULT FALSE,
    can_view_all_data BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== IPC CONFIGURATION TABLES ====================

-- Organization options managed by IPC configuration
DROP TABLE IF EXISTS ipc_organisasi;
CREATE TABLE ipc_organisasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS ipc_perilaku_karakter;
CREATE TABLE ipc_perilaku_karakter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS ipc_perilaku_tingkat;
CREATE TABLE ipc_perilaku_tingkat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Main IPC point configuration
DROP TABLE IF EXISTS ipc_config;
CREATE TABLE ipc_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    field1 VARCHAR(100) DEFAULT NULL,
    field2 VARCHAR(100) DEFAULT NULL,
    field3 VARCHAR(100) DEFAULT NULL COMMENT 'Legacy compatibility column',
    point_value INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT DEFAULT NULL,
    UNIQUE KEY unique_config (category, field1, field2, field3),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Pelanggaran configuration is split into levels and coarse details
DROP TABLE IF EXISTS ipc_pelanggaran_detail;
DROP TABLE IF EXISTS ipc_pelanggaran_level;
CREATE TABLE ipc_pelanggaran_level (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    point_value INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ipc_pelanggaran_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    level_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES ipc_pelanggaran_level(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ==================== DATA TABLES ====================

-- Prestasi Table
DROP TABLE IF EXISTS prestasi;
CREATE TABLE prestasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    jenis ENUM('akademik', 'nonakademik') NOT NULL,
    nama_lomba VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    kelas VARCHAR(50),
    pembina VARCHAR(100),
    grha VARCHAR(50),
    juara VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config prestasi.field2',
    kategori VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config prestasi.field1 (tingkat)',
    point INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organisasi Table
DROP TABLE IF EXISTS organisasi;
CREATE TABLE organisasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    jabatan_organisasi VARCHAR(100) NOT NULL,
    foto VARCHAR(255),
    kategori_organisasi VARCHAR(100),
    point INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Kepanitiaan Table
DROP TABLE IF EXISTS kepanitiaan;
CREATE TABLE kepanitiaan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    jabatan_kepanitiaan VARCHAR(100) NOT NULL,
    foto VARCHAR(255),
    kategori_kepanitiaan VARCHAR(100),
    point INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event Table
DROP TABLE IF EXISTS event;
CREATE TABLE event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    nama_event VARCHAR(255) NOT NULL,
    tingkat VARCHAR(100) NOT NULL COMMENT 'Driven by ipc_config event.field1',
    foto VARCHAR(255),
    point INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pelanggaran Table
DROP TABLE IF EXISTS pelanggaran;
CREATE TABLE pelanggaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    keterangan TEXT NOT NULL,
    foto VARCHAR(255),
    jenis_pelanggaran VARCHAR(100) NOT NULL,
    point_dikurangi INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Perilaku Table
DROP TABLE IF EXISTS perilaku;
CREATE TABLE perilaku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    karakter_siswa TEXT NOT NULL,
    point INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== LOGGING & HISTORY TABLES ====================

-- Activity Logs Table
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- IPC History Table
DROP TABLE IF EXISTS ipc_history;
CREATE TABLE ipc_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    jenis_perubahan ENUM('prestasi', 'organisasi', 'kepanitiaan', 'event', 'pelanggaran', 'perilaku', 'initial', 'manual') NOT NULL,
    point_change INT NOT NULL,
    ipc_sebelum INT NOT NULL,
    ipc_sesudah INT NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== WALI KELAS TABLES ====================

-- Wali Kelas Assignment Table
DROP TABLE IF EXISTS wali_kelas_assignment;
CREATE TABLE wali_kelas_assignment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guru_kelas (guru_id, kelas, tahun_ajaran),
    UNIQUE KEY unique_kelas_tahun_ajaran (kelas, tahun_ajaran)
);

-- ==================== APPROVAL TABLES ====================

-- Prestasi Approvals Table
DROP TABLE IF EXISTS prestasi_approvals;
CREATE TABLE prestasi_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    jenis ENUM('akademik', 'nonakademik') DEFAULT 'akademik',
    nama_lomba VARCHAR(255) NOT NULL,
    kelas VARCHAR(50),
    pembina VARCHAR(255),
    grha VARCHAR(50),
    juara VARCHAR(50),
    kategori VARCHAR(50),
    foto_path VARCHAR(255),
    pembina_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pembina_id INT NULL,
    pembina_approved_at TIMESTAMP NULL,
    superadmin_approved_at TIMESTAMP NULL,
    pembina_notes TEXT,
    superadmin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pembina_id) REFERENCES users(id)
);

-- Event Approvals Table
DROP TABLE IF EXISTS event_approvals;
CREATE TABLE event_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    pembina VARCHAR(255),
    nama_event VARCHAR(255) NOT NULL,
    tingkat VARCHAR(50),
    foto_path VARCHAR(255),
    pembina_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pembina_id INT NULL,
    pembina_approved_at TIMESTAMP NULL,
    superadmin_approved_at TIMESTAMP NULL,
    pembina_notes TEXT,
    superadmin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pembina_id) REFERENCES users(id)
);

-- Organisasi Approvals Table
DROP TABLE IF EXISTS organisasi_approvals;
CREATE TABLE organisasi_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    pembina VARCHAR(255),
    jabatan_organisasi VARCHAR(100),
    kategori_organisasi VARCHAR(255),
    foto_path VARCHAR(255),
    pembina_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pembina_id INT NULL,
    pembina_approved_at TIMESTAMP NULL,
    superadmin_approved_at TIMESTAMP NULL,
    pembina_notes TEXT,
    superadmin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pembina_id) REFERENCES users(id)
);

-- Kepanitiaan Approvals Table
DROP TABLE IF EXISTS kepanitiaan_approvals;
CREATE TABLE kepanitiaan_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    pembina VARCHAR(255),
    jabatan_kepanitiaan VARCHAR(100),
    kategori_kepanitiaan VARCHAR(255),
    foto_path VARCHAR(255),
    pembina_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pembina_id INT NULL,
    pembina_approved_at TIMESTAMP NULL,
    superadmin_approved_at TIMESTAMP NULL,
    pembina_notes TEXT,
    superadmin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pembina_id) REFERENCES users(id)
);

-- Siswa Approvals Table (for new student accounts created by guru)
DROP TABLE IF EXISTS siswa_approvals;
CREATE TABLE siswa_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    kelas VARCHAR(50),
    grha VARCHAR(50),
    password_hash VARCHAR(255),
    ipc_awal INT DEFAULT 80,
    created_by INT NOT NULL,
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_approved_at TIMESTAMP NULL,
    superadmin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Biodata Update Approvals Table
DROP TABLE IF EXISTS biodata_update_approvals;
CREATE TABLE biodata_update_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama_baru VARCHAR(100),
    nis_baru VARCHAR(20),
    kelas_baru VARCHAR(50),
    jurusan_baru VARCHAR(50) DEFAULT NULL COMMENT 'New jurusan value',
    tahun_pelajaran_baru VARCHAR(9) DEFAULT NULL COMMENT 'New tahun_pelajaran value',
    grha_baru VARCHAR(50),
    nama_lama VARCHAR(100),
    nis_lama VARCHAR(20),
    kelas_lama VARCHAR(50),
    jurusan_lama VARCHAR(50) DEFAULT NULL COMMENT 'Old jurusan value',
    tahun_pelajaran_lama VARCHAR(9) DEFAULT NULL COMMENT 'Old tahun_pelajaran value',
    grha_lama VARCHAR(50),
    requested_by INT NOT NULL,
    pembina_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pembina_notes TEXT,
    superadmin_notes TEXT,
    pembina_approved_at TIMESTAMP NULL,
    superadmin_approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Student Creation Approvals Table
DROP TABLE IF EXISTS student_creation_approvals;
CREATE TABLE student_creation_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    grha VARCHAR(50),
    jurusan VARCHAR(50) DEFAULT NULL COMMENT 'Student program/stream (e.g., TKJ 1, TO 2)',
    tahun_pelajaran VARCHAR(9) DEFAULT NULL COMMENT 'Academic year when student first enrolled (YYYY-YYYY format)',
    password VARCHAR(255) NOT NULL,
    requested_by INT NOT NULL,
    superadmin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    superadmin_notes TEXT,
    superadmin_approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== NOTIFICATIONS TABLE ====================

-- Notifications Table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id INT,
    related_type ENUM('prestasi', 'event', 'organisasi', 'kepanitiaan', 'siswa', 'student_creation', 'biodata', 'input_access', 'wali_kelas', 'pelanggaran', 'perilaku') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== DRIVE LINKS TABLE ====================
-- REMOVED: Google Drive integration replaced with local server storage

-- ==================== INPUT ACCESS CONTROL TABLES ====================

-- Input Access Control Table
DROP TABLE IF EXISTS input_access_control;
CREATE TABLE input_access_control (
    id INT AUTO_INCREMENT PRIMARY KEY,
    control_type ENUM('global', 'role') NOT NULL,
    role_target ENUM('siswa', 'guru', 'all') DEFAULT 'all',
    jenis_input ENUM('prestasi', 'organisasi', 'kepanitiaan', 'event', 'pelanggaran', 'perilaku', 'all') NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Input Access Logs Table
DROP TABLE IF EXISTS input_access_logs;
CREATE TABLE input_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    control_type ENUM('global', 'role', 'individual') NOT NULL,
    target_role ENUM('siswa', 'guru', 'all') DEFAULT NULL,
    target_user_id INT DEFAULT NULL,
    jenis_input VARCHAR(50) NOT NULL,
    action ENUM('enabled', 'disabled') NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== INDEXES ====================

-- Indexes for Prestasi Approvals
CREATE INDEX idx_prestasi_user ON prestasi_approvals(user_id);
CREATE INDEX idx_prestasi_status ON prestasi_approvals(pembina_status, superadmin_status);

-- Indexes for Event Approvals
CREATE INDEX idx_event_user ON event_approvals(user_id);
CREATE INDEX idx_event_status ON event_approvals(pembina_status, superadmin_status);

-- Indexes for Organisasi Approvals
CREATE INDEX idx_organisasi_user ON organisasi_approvals(user_id);
CREATE INDEX idx_organisasi_status ON organisasi_approvals(pembina_status, superadmin_status);

-- Indexes for Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Indexes for Academic Year System
CREATE INDEX idx_is_graduated ON users(is_graduated);
CREATE INDEX idx_tahun_pelajaran ON users(tahun_pelajaran);
CREATE INDEX idx_jurusan ON users(jurusan);

-- ==================== DEFAULT DATA ====================

-- Insert Superadmin Account
INSERT INTO users (nama, nis, password, role, ipc_total, ipc_awal) VALUES 
('Super Admin', 'ADMIN001', '$2a$10$YourHashedPasswordHere', 'superadmin', 0, 0);

-- Note: The password 'admin123' needs to be hashed. Run this in Node.js to get the hash:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin123', 10);
-- console.log(hash);

-- Insert default values for input access control (semua input diaktifkan secara default)
INSERT INTO input_access_control (control_type, role_target, jenis_input, is_enabled, updated_by) VALUES
('global', 'all', 'prestasi', TRUE, 1),
('global', 'all', 'organisasi', TRUE, 1),
('global', 'all', 'kepanitiaan', TRUE, 1),
('global', 'all', 'event', TRUE, 1),
('global', 'all', 'pelanggaran', TRUE, 1),
('global', 'all', 'perilaku', TRUE, 1);

-- ==================== DEFAULT IPC POINT CONFIGURATION ====================
-- Matches KonfigurasiIPC reset-defaults / ipc_config_schema.sql

INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active) VALUES
('ringan', -1, 'Point untuk pelanggaran ringan', TRUE),
('sedang', -5, 'Point untuk pelanggaran sedang', TRUE),
('berat', -25, 'Point untuk pelanggaran berat', TRUE);

INSERT INTO ipc_config (category, field1, field2, field3, point_value, description) VALUES
-- PRESTASI (field1=tingkat, field2=juara)
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
('prestasi', 'kabupaten', 'peserta', NULL, 8, 'Peserta tingkat kabupaten'),
-- PERILAKU
('perilaku', 'tanggung_jawab', 'sangat baik', NULL, 5, 'Karakter tanggung jawab sangat baik'),
('perilaku', 'tanggung_jawab', 'baik', NULL, 4, 'Karakter tanggung jawab baik'),
('perilaku', 'tanggung_jawab', 'cukup baik', NULL, 3, 'Karakter tanggung jawab cukup baik'),
('perilaku', 'tanggung_jawab', 'kurang baik', NULL, 1, 'Karakter tanggung jawab kurang baik'),
('perilaku', 'disiplin', 'sangat baik', NULL, 5, 'Karakter disiplin sangat baik'),
('perilaku', 'disiplin', 'baik', NULL, 4, 'Karakter disiplin baik'),
('perilaku', 'disiplin', 'cukup baik', NULL, 3, 'Karakter disiplin cukup baik'),
('perilaku', 'disiplin', 'kurang baik', NULL, 1, 'Karakter disiplin kurang baik'),
('perilaku', 'kepedulian', 'sangat baik', NULL, 5, 'Karakter kepedulian sangat baik'),
('perilaku', 'kepedulian', 'baik', NULL, 4, 'Karakter kepedulian baik'),
('perilaku', 'kepedulian', 'cukup baik', NULL, 3, 'Karakter kepedulian cukup baik'),
('perilaku', 'kepedulian', 'kurang baik', NULL, 1, 'Karakter kepedulian kurang baik'),
('perilaku', 'kemandirian', 'sangat baik', NULL, 5, 'Karakter kemandirian sangat baik'),
('perilaku', 'kemandirian', 'baik', NULL, 4, 'Karakter kemandirian baik'),
('perilaku', 'kemandirian', 'cukup baik', NULL, 3, 'Karakter kemandirian cukup baik'),
('perilaku', 'kemandirian', 'kurang baik', NULL, 1, 'Karakter kemandirian kurang baik'),
('perilaku', 'spiritual', 'sangat baik', NULL, 5, 'Karakter spiritual sangat baik'),
('perilaku', 'spiritual', 'baik', NULL, 4, 'Karakter spiritual baik'),
('perilaku', 'spiritual', 'cukup baik', NULL, 3, 'Karakter spiritual cukup baik'),
('perilaku', 'spiritual', 'kurang baik', NULL, 1, 'Karakter spiritual kurang baik'),
('perilaku', 'kejujuran', 'sangat baik', NULL, 5, 'Karakter kejujuran sangat baik'),
('perilaku', 'kejujuran', 'baik', NULL, 4, 'Karakter kejujuran baik'),
('perilaku', 'kejujuran', 'cukup baik', NULL, 3, 'Karakter kejujuran cukup baik'),
('perilaku', 'kejujuran', 'kurang baik', NULL, 1, 'Karakter kejujuran kurang baik'),
('perilaku', 'kepercayaan_diri', 'sangat baik', NULL, 5, 'Karakter kepercayaan diri sangat baik'),
('perilaku', 'kepercayaan_diri', 'baik', NULL, 4, 'Karakter kepercayaan diri baik'),
('perilaku', 'kepercayaan_diri', 'cukup baik', NULL, 3, 'Karakter kepercayaan diri cukup baik'),
('perilaku', 'kepercayaan_diri', 'kurang baik', NULL, 1, 'Karakter kepercayaan diri kurang baik'),
-- KEPANITIAAN
('kepanitiaan', 'ketua', NULL, NULL, 10, 'Ketua kepanitiaan'),
('kepanitiaan', 'wakil ketua', NULL, NULL, 8, 'Wakil ketua kepanitiaan'),
('kepanitiaan', 'sekretaris', NULL, NULL, 7, 'Sekretaris kepanitiaan'),
('kepanitiaan', 'bendahara', NULL, NULL, 7, 'Bendahara kepanitiaan'),
('kepanitiaan', 'koordinator', NULL, NULL, 5, 'Koordinator kepanitiaan'),
('kepanitiaan', 'anggota', NULL, NULL, 3, 'Anggota kepanitiaan'),
-- ORGANISASI
('organisasi', 'OSIS', 'ketua', NULL, 10, 'Ketua OSIS'),
('organisasi', 'OSIS', 'wakil ketua', NULL, 8, 'Wakil ketua OSIS'),
('organisasi', 'OSIS', 'sekretaris', NULL, 7, 'Sekretaris OSIS'),
('organisasi', 'OSIS', 'bendahara', NULL, 7, 'Bendahara OSIS'),
('organisasi', 'OSIS', 'koordinator', NULL, 5, 'Koordinator OSIS'),
('organisasi', 'OSIS', 'anggota', NULL, 3, 'Anggota OSIS'),
('organisasi', 'KY', 'ketua', NULL, 10, 'Ketua KY'),
('organisasi', 'KY', 'wakil ketua', NULL, 8, 'Wakil ketua KY'),
('organisasi', 'KY', 'sekretaris', NULL, 7, 'Sekretaris KY'),
('organisasi', 'KY', 'bendahara', NULL, 7, 'Bendahara KY'),
('organisasi', 'KY', 'koordinator', NULL, 5, 'Koordinator KY'),
('organisasi', 'KY', 'anggota', NULL, 3, 'Anggota KY'),
('organisasi', 'MPK', 'ketua', NULL, 10, 'Ketua MPK'),
('organisasi', 'MPK', 'wakil ketua', NULL, 8, 'Wakil ketua MPK'),
('organisasi', 'MPK', 'sekretaris', NULL, 7, 'Sekretaris MPK'),
('organisasi', 'MPK', 'bendahara', NULL, 7, 'Bendahara MPK'),
('organisasi', 'MPK', 'koordinator', NULL, 5, 'Koordinator MPK'),
('organisasi', 'MPK', 'anggota', NULL, 3, 'Anggota MPK'),
('organisasi', 'PRAMUKA', 'ketua', NULL, 10, 'Ketua PRAMUKA'),
('organisasi', 'PRAMUKA', 'wakil ketua', NULL, 8, 'Wakil ketua PRAMUKA'),
('organisasi', 'PRAMUKA', 'sekretaris', NULL, 7, 'Sekretaris PRAMUKA'),
('organisasi', 'PRAMUKA', 'bendahara', NULL, 7, 'Bendahara PRAMUKA'),
('organisasi', 'PRAMUKA', 'koordinator', NULL, 5, 'Koordinator PRAMUKA'),
('organisasi', 'PRAMUKA', 'anggota', NULL, 3, 'Anggota PRAMUKA'),
('organisasi', 'PKS', 'ketua', NULL, 10, 'Ketua PKS'),
('organisasi', 'PKS', 'wakil ketua', NULL, 8, 'Wakil ketua PKS'),
('organisasi', 'PKS', 'sekretaris', NULL, 7, 'Sekretaris PKS'),
('organisasi', 'PKS', 'bendahara', NULL, 7, 'Bendahara PKS'),
('organisasi', 'PKS', 'koordinator', NULL, 5, 'Koordinator PKS'),
('organisasi', 'PKS', 'anggota', NULL, 3, 'Anggota PKS'),
('organisasi', 'PMR', 'ketua', NULL, 10, 'Ketua PMR'),
('organisasi', 'PMR', 'wakil ketua', NULL, 8, 'Wakil ketua PMR'),
('organisasi', 'PMR', 'sekretaris', NULL, 7, 'Sekretaris PMR'),
('organisasi', 'PMR', 'bendahara', NULL, 7, 'Bendahara PMR'),
('organisasi', 'PMR', 'koordinator', NULL, 5, 'Koordinator PMR'),
('organisasi', 'PMR', 'anggota', NULL, 3, 'Anggota PMR'),
('organisasi', 'PASKIBRAKA', 'ketua', NULL, 10, 'Ketua PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'wakil ketua', NULL, 8, 'Wakil ketua PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'sekretaris', NULL, 7, 'Sekretaris PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'bendahara', NULL, 7, 'Bendahara PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'koordinator', NULL, 5, 'Koordinator PASKIBRAKA'),
('organisasi', 'PASKIBRAKA', 'anggota', NULL, 3, 'Anggota PASKIBRAKA'),
-- EVENT
('event', 'sekolah', NULL, NULL, 5, 'Event tingkat sekolah'),
('event', 'kecamatan', NULL, NULL, 10, 'Event tingkat kecamatan'),
('event', 'kabupaten', NULL, NULL, 15, 'Event tingkat kabupaten'),
('event', 'provinsi', NULL, NULL, 20, 'Event tingkat provinsi'),
('event', 'nasional', NULL, NULL, 25, 'Event tingkat nasional'),
('event', 'internasional', NULL, NULL, 30, 'Event tingkat internasional');

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

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
