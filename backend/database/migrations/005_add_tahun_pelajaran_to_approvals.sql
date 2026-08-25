-- Migration: Add tahun_pelajaran to student_creation_approvals table
-- This ensures teacher approval requests also include academic year information

ALTER TABLE student_creation_approvals
    ADD COLUMN tahun_pelajaran VARCHAR(9) DEFAULT NULL COMMENT 'Academic year when student first enrolled (YYYY-YYYY format)' AFTER grha;
