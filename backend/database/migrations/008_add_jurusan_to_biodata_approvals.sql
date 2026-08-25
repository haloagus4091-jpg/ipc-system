-- Migration: Add jurusan and tahun_pelajaran to biodata_update_approvals table
-- This ensures biodata update approvals also include jurusan and tahun_pelajaran information

ALTER TABLE biodata_update_approvals
    ADD COLUMN jurusan_baru VARCHAR(50) DEFAULT NULL COMMENT 'New jurusan value' AFTER kelas_baru;

ALTER TABLE biodata_update_approvals
    ADD COLUMN jurusan_lama VARCHAR(50) DEFAULT NULL COMMENT 'Old jurusan value' AFTER grha_lama;

ALTER TABLE biodata_update_approvals
    ADD COLUMN tahun_pelajaran_baru VARCHAR(9) DEFAULT NULL COMMENT 'New tahun_pelajaran value' AFTER jurusan_baru;

ALTER TABLE biodata_update_approvals
    ADD COLUMN tahun_pelajaran_lama VARCHAR(9) DEFAULT NULL COMMENT 'Old tahun_pelajaran value' AFTER jurusan_lama;
