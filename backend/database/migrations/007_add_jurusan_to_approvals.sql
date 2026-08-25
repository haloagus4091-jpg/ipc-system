-- Migration: Add jurusan column to student_creation_approvals table
-- This ensures teacher approval requests also include jurusan information

ALTER TABLE student_creation_approvals
    ADD COLUMN jurusan VARCHAR(50) DEFAULT NULL COMMENT 'Student program/stream (e.g., TKJ 1, TO 2)' AFTER grha;
