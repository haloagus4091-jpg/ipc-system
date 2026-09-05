const express = require('express');
const router = express.Router();
const { auth, superAdminOnly, teacherOnly } = require('../middleware/auth');
const db = require('../config/database');

// Get all wali kelas assignments (Superadmin)
router.get('/', auth, superAdminOnly, async (req, res) => {
    try {
        const [assignments] = await db.query(`
            SELECT wka.*, u.nama as guru_nama, u.nip, u.foto as guru_foto, u.id as guru_id
            FROM wali_kelas_assignment wka 
            JOIN users u ON wka.guru_id = u.id
            ORDER BY wka.tahun_ajaran DESC, wka.kelas ASC
        `);
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available teachers (not assigned as wali kelas)
router.get('/available-teachers', auth, superAdminOnly, async (req, res) => {
    try {
        const [teachers] = await db.query(`
            SELECT u.id, u.nama, u.nip, u.detail 
            FROM users u
            WHERE u.role = 'guru'
            AND u.id NOT IN (
                SELECT guru_id FROM wali_kelas_assignment 
                WHERE tahun_ajaran = YEAR(CURDATE())
            )
        `);
        res.json(teachers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get class statistics (Superadmin - shows all classes)
router.get('/class-statistics', auth, superAdminOnly, async (req, res) => {
    try {
        // Get all classes with wali kelas
        const [classes] = await db.query(`
            SELECT 
                wka.kelas,
                wka.guru_id,
                u.nama as wali_nama,
                u.nip as wali_nip,
                u.foto as wali_foto
            FROM wali_kelas_assignment wka
            LEFT JOIN users u ON wka.guru_id = u.id
            WHERE wka.tahun_ajaran = YEAR(CURDATE())
            ORDER BY wka.kelas ASC
        `);

        // Get statistics for each class
        const classStats = await Promise.all(
            classes.map(async (cls) => {
                // Get students in this class
                const [students] = await db.query(`
                    SELECT id, nama, nis, nisn, grha, ipc_total, foto, tahun_pelajaran, jurusan
                    FROM users 
                    WHERE role = 'siswa' AND kelas = ? AND (is_graduated = 0 OR is_graduated IS NULL)
                    ORDER BY nama ASC
                `, [cls.kelas]);

                const studentIds = students.map(s => s.id);

                // Get total prestasi
                let totalPrestasi = 0;
                if (studentIds.length > 0) {
                    const [prestasiResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM prestasi 
                        WHERE user_id IN (?) AND status = 'approved'
                    `, [studentIds]);
                    totalPrestasi = prestasiResult[0]?.total || 0;
                }

                // Get total event
                let totalEvent = 0;
                if (studentIds.length > 0) {
                    const [eventResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM event 
                        WHERE user_id IN (?) AND status = 'approved'
                    `, [studentIds]);
                    totalEvent = eventResult[0]?.total || 0;
                }

                // Get total organisasi
                let totalOrganisasi = 0;
                if (studentIds.length > 0) {
                    const [orgResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM organisasi 
                        WHERE user_id IN (?) AND status = 'approved'
                    `, [studentIds]);
                    totalOrganisasi = orgResult[0]?.total || 0;
                }

                // Get total kepanitiaan
                let totalKepanitiaan = 0;
                if (studentIds.length > 0) {
                    const [kepResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM kepanitiaan 
                        WHERE user_id IN (?) AND status = 'approved'
                    `, [studentIds]);
                    totalKepanitiaan = kepResult[0]?.total || 0;
                }

                // Get total pelanggaran
                let totalPelanggaran = 0;
                if (studentIds.length > 0) {
                    const [pelanggaranResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM pelanggaran 
                        WHERE user_id IN (?) AND status = 'approved'
                    `, [studentIds]);
                    totalPelanggaran = pelanggaranResult[0]?.total || 0;
                }

                // Get average IPC
                let avgIpc = 80;
                if (students.length > 0) {
                    const totalIpc = students.reduce((sum, s) => sum + (s.ipc_total || 80), 0);
                    avgIpc = Math.round(totalIpc / students.length);
                }

                return {
                    kelas: cls.kelas,
                    wali: {
                        id: cls.guru_id,
                        nama: cls.wali_nama,
                        nip: cls.wali_nip,
                        foto: cls.wali_foto
                    },
                    totalSiswa: students.length,
                    totalPrestasi,
                    totalEvent,
                    totalOrganisasi,
                    totalKepanitiaan,
                    totalPelanggaran,
                    rataRataIPC: avgIpc,
                    students
                };
            })
        );

        res.json(classStats);
    } catch (error) {
        console.error('Error fetching class statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get my class info (Teacher - wali kelas)
router.get('/my-class', auth, teacherOnly, async (req, res) => {
    try {
        const guruId = req.user.id;

        // Check if this teacher is assigned as wali kelas
        const [assignment] = await db.query(`
            SELECT * FROM wali_kelas_assignment 
            WHERE guru_id = ? AND tahun_ajaran = YEAR(CURDATE())
            LIMIT 1
        `, [guruId]);

        if (assignment.length === 0) {
            return res.status(404).json({ message: 'Anda belum ditunjuk sebagai wali kelas' });
        }

        const kelas = assignment[0].kelas;

        // Get students in this class with full details
        const [students] = await db.query(`
            SELECT 
                u.id, u.nama, u.nis, u.nisn, u.grha, u.ipc_total, u.ipc_awal,
                u.alamat, u.no_hp, u.wali_kelas, u.foto, u.created_at, u.tahun_pelajaran, u.jurusan
            FROM users u
            WHERE u.role = 'siswa' AND u.kelas = ? AND (u.is_graduated = 0 OR u.is_graduated IS NULL)
            ORDER BY u.nama ASC
        `, [kelas]);

        // Get detailed stats for each student
        const studentsWithStats = await Promise.all(
            students.map(async (student) => {
                // Prestasi count
                const [prestasiCount] = await db.query(`
                    SELECT COUNT(*) as total FROM prestasi 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                // Event count
                const [eventCount] = await db.query(`
                    SELECT COUNT(*) as total FROM event 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                // Organisasi count
                const [orgCount] = await db.query(`
                    SELECT COUNT(*) as total FROM organisasi 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                // Kepanitiaan count
                const [kepCount] = await db.query(`
                    SELECT COUNT(*) as total FROM kepanitiaan 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                // Pelanggaran count
                const [pelanggaranCount] = await db.query(`
                    SELECT COUNT(*) as total FROM pelanggaran 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                // Perilaku count
                const [perilakuCount] = await db.query(`
                    SELECT COUNT(*) as total FROM perilaku 
                    WHERE user_id = ? AND status = 'approved'
                `, [student.id]);

                return {
                    ...student,
                    stats: {
                        prestasi: prestasiCount[0].total,
                        event: eventCount[0].total,
                        organisasi: orgCount[0].total,
                        kepanitiaan: kepCount[0].total,
                        pelanggaran: pelanggaranCount[0].total,
                        perilaku: perilakuCount[0].total
                    }
                };
            })
        );

        // Calculate class totals
        const totalPrestasi = studentsWithStats.reduce((sum, s) => sum + s.stats.prestasi, 0);
        const totalEvent = studentsWithStats.reduce((sum, s) => sum + s.stats.event, 0);
        const totalOrganisasi = studentsWithStats.reduce((sum, s) => sum + s.stats.organisasi, 0);
        const totalKepanitiaan = studentsWithStats.reduce((sum, s) => sum + s.stats.kepanitiaan, 0);
        const totalPelanggaran = studentsWithStats.reduce((sum, s) => sum + s.stats.pelanggaran, 0);
        const avgIpc = students.length > 0 
            ? Math.round(students.reduce((sum, s) => sum + (s.ipc_total || 80), 0) / students.length)
            : 80;

        res.json({
            kelas,
            tahunAjaran: assignment[0].tahun_ajaran,
            totalSiswa: students.length,
            totalPrestasi,
            totalEvent,
            totalOrganisasi,
            totalKepanitiaan,
            totalPelanggaran,
            rataRataIPC: avgIpc,
            students: studentsWithStats
        });
    } catch (error) {
        console.error('Error fetching my class:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create wali kelas assignment
router.post('/', auth, superAdminOnly, async (req, res) => {
    try {
        const { guru_id, kelas, tahun_ajaran } = req.body;

        // Get guru info for notification
        const [guru] = await db.query('SELECT nama, nip FROM users WHERE id = ?', [guru_id]);
        const guruNama = guru[0]?.nama || 'Guru';

        const [result] = await db.query(
            'INSERT INTO wali_kelas_assignment (guru_id, kelas, tahun_ajaran) VALUES (?, ?, ?)',
            [guru_id, kelas, tahun_ajaran]
        );

        // Update user's wali_kelas field
        await db.query('UPDATE users SET wali_kelas = ? WHERE id = ?', [kelas, guru_id]);

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Assign Wali Kelas', `Assigned teacher ${guruNama} as wali kelas for ${kelas}`]
        );

        // Notify all pembina (gurus)
        const [pembinas] = await db.query('SELECT id FROM users WHERE role = "guru"');
        for (const pembina of pembinas) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
                 VALUES (?, 'wali_kelas_assigned', 'Wali Kelas Baru', ?, ?, 'wali_kelas')`,
                [pembina.id, `${guruNama} ditunjuk sebagai Wali Kelas ${kelas}`, result.insertId]
            );
        }

        // Notify the assigned teacher
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
             VALUES (?, 'wali_kelas_assigned', 'Anda Ditunjuk sebagai Wali Kelas', ?, ?, 'wali_kelas')`,
            [guru_id, `Anda telah ditunjuk sebagai Wali Kelas ${kelas} untuk tahun ajaran ${tahun_ajaran}. Sekarang Anda dapat mengakses menu Wali Kelas.`, result.insertId]
        );

        res.status(201).json({ 
            message: `Wali kelas berhasil ditunjuk. ${guruNama} sekarang adalah Wali Kelas ${kelas}`,
            assignmentId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get students with class mismatches (for debugging)
router.get('/class-mismatches', auth, superAdminOnly, async (req, res) => {
    try {
        const { calculateFullClass } = require('../utils/academicYear');
        
        // Get all students
        const [students] = await db.query(`
            SELECT id, nama, nis, nisn, kelas, tahun_pelajaran, jurusan, is_graduated
            FROM users 
            WHERE role = 'siswa' AND (is_graduated = 0 OR is_graduated IS NULL)
        `);
        
        const mismatches = [];
        
        for (const student of students) {
            if (student.tahun_pelajaran && student.jurusan) {
                const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
                
                if (calculatedClass && calculatedClass !== student.kelas) {
                    mismatches.push({
                        id: student.id,
                        nama: student.nama,
                        nis: student.nis,
                        current_kelas: student.kelas,
                        expected_kelas: calculatedClass,
                        tahun_pelajaran: student.tahun_pelajaran,
                        jurusan: student.jurusan
                    });
                }
            }
        }
        
        res.json({
            totalStudents: students.length,
            mismatchCount: mismatches.length,
            mismatches
        });
    } catch (error) {
        console.error('Error fetching class mismatches:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete wali kelas assignment
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const [assignment] = await db.query(
            'SELECT guru_id, kelas FROM wali_kelas_assignment WHERE id = ?', 
            [assignmentId]
        );

        if (assignment.length === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const guruId = assignment[0].guru_id;
        const kelas = assignment[0].kelas;

        // Get guru info
        const [guru] = await db.query('SELECT nama FROM users WHERE id = ?', [guruId]);
        const guruNama = guru[0]?.nama || 'Guru';

        // Remove wali_kelas from user
        await db.query('UPDATE users SET wali_kelas = NULL WHERE id = ?', [guruId]);

        // Delete assignment
        await db.query('DELETE FROM wali_kelas_assignment WHERE id = ?', [assignmentId]);

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Remove Wali Kelas', `Removed ${guruNama} as wali kelas for ${kelas}`]
        );

        // Notify the removed teacher
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
             VALUES (?, 'wali_kelas_removed', 'Anda Dicopot sebagai Wali Kelas', ?, ?, 'wali_kelas')`,
            [guruId, `Anda telah dicopot dari jabatan Wali Kelas ${kelas}. Menu Wali Kelas tidak lagi tersedia.`, assignmentId]
        );

        res.json({ 
            message: `${guruNama} berhasil dicopot dari jabatan Wali Kelas ${kelas}` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
