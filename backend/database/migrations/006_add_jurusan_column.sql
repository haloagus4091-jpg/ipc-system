-- Migration: Add jurusan column to users table
-- This separates the jurusan (program/stream) from the class (X/XI/XII)
-- Class will be automatically calculated based on tahun_pelajaran

ALTER TABLE users
    ADD COLUMN jurusan VARCHAR(50) DEFAULT NULL COMMENT 'Student program/stream (e.g., TKJ 1, TO 2)' AFTER grha;

-- Create index for jurusan for performance
CREATE INDEX idx_jurusan ON users(jurusan);
