-- Remove the obsolete NISN identifier after taking a database backup.
ALTER TABLE users DROP COLUMN nisn;
ALTER TABLE siswa_approvals DROP COLUMN nisn;
ALTER TABLE biodata_update_approvals
    DROP COLUMN nisn_baru,
    DROP COLUMN nisn_lama;
ALTER TABLE student_creation_approvals DROP COLUMN nisn;
