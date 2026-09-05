const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, teacherOnly } = require('../middleware/auth');
const { buildIpcCardBreakdown } = require('../utils/ipcCardBreakdown');
const { calculateFullClass } = require('../utils/academicYear');

// Helper function to check if teacher is wali kelas and get their class
const getTeacherWaliKelasClass = async (guruId) => {
    const [assignment] = await db.query(
        `SELECT kelas FROM wali_kelas_assignment 
         WHERE guru_id = ? AND tahun_ajaran = YEAR(CURDATE())
         LIMIT 1`,
        [guruId]
    );
    return assignment.length > 0 ? assignment[0].kelas : null;
};

// Get all students for reports (grouped by class) with full IPC breakdown
router.get('/students', auth, async (req, res) => {
    try {
        let query = `
            SELECT 
                id,
                nama,
                nis,
                nisn,
                kelas,
                ipc_total,
                ipc_awal,
                tahun_pelajaran,
                jurusan,
                is_graduated
            FROM users 
            WHERE role = 'siswa' AND (is_graduated = 0 OR is_graduated IS NULL)
        `;
        
        let queryParams = [];
        
        // If user is a teacher (guru), restrict to their wali kelas class
        if (req.user.role === 'guru') {
            const waliKelasClass = await getTeacherWaliKelasClass(req.user.id);
            if (waliKelasClass) {
                query += ` AND kelas = ?`;
                queryParams.push(waliKelasClass);
            } else {
                // If teacher is not a wali kelas, return empty array
                return res.json([]);
            }
        }
        
        query += ` ORDER BY kelas, nama`;
        
        const [students] = await db.query(query, queryParams);
        
        // Calculate current class for each student based on tahun_pelajaran
        const studentsWithCalculatedClass = students.map(student => {
            if (student.tahun_pelajaran && student.jurusan) {
                const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
                return {
                    ...student,
                    kelas: calculatedClass || student.kelas // Use calculated class, fallback to stored
                };
            }
            return student;
        });
        
        // Get full IPC breakdown for each student to ensure synchronization
        const studentsWithBreakdown = await Promise.all(
            studentsWithCalculatedClass.map(async (student) => {
                const cardData = await buildIpcCardBreakdown(student.id);
                if (cardData) {
                    return {
                        ...student,
                        points: cardData.points,
                        ipc_total: cardData.ipc_total,
                        breakdown_total: cardData.breakdown_total
                    };
                }
                return student;
            })
        );
        
        res.json(studentsWithBreakdown);
    } catch (error) {
        console.error('Error fetching students for reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get students filtered by class with full IPC breakdown
router.get('/students/class/:kelas', auth, async (req, res) => {
    try {
        const { kelas } = req.params;
        const query = `
            SELECT 
                id,
                nama,
                nis,
                nisn,
                kelas,
                ipc_total,
                ipc_awal,
                tahun_pelajaran,
                jurusan,
                is_graduated
            FROM users 
            WHERE role = 'siswa' AND kelas = ? AND (is_graduated = 0 OR is_graduated IS NULL)
            ORDER BY nama
        `;
        
        const [students] = await db.query(query, [kelas]);
        
        // Calculate current class for each student based on tahun_pelajaran
        const studentsWithCalculatedClass = students.map(student => {
            if (student.tahun_pelajaran && student.jurusan) {
                const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
                return {
                    ...student,
                    kelas: calculatedClass || student.kelas // Use calculated class, fallback to stored
                };
            }
            return student;
        });
        
        // Get full IPC breakdown for each student to ensure synchronization
        const studentsWithBreakdown = await Promise.all(
            studentsWithCalculatedClass.map(async (student) => {
                const cardData = await buildIpcCardBreakdown(student.id);
                if (cardData) {
                    return {
                        ...student,
                        points: cardData.points,
                        ipc_total: cardData.ipc_total,
                        breakdown_total: cardData.breakdown_total
                    };
                }
                return student;
            })
        );
        
        res.json(studentsWithBreakdown);
    } catch (error) {
        console.error('Error fetching students by class:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get class statistics
router.get('/statistics', auth, async (req, res) => {
    try {
        const query = `
            SELECT
                kelas,
                COUNT(*) as total_siswa,
                AVG(ipc_total) as rata_rata_ipc,
                MAX(ipc_total) as ipc_tertinggi,
                MIN(ipc_total) as ipc_terendah
            FROM users
            WHERE role = 'siswa' AND kelas IS NOT NULL
            GROUP BY kelas
            ORDER BY kelas
        `;

        const [stats] = await db.query(query);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching class statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get class IPC report (students sorted by NIS with IPC totals and full breakdown)
router.get('/class-ipc/:kelas', auth, async (req, res) => {
    try {
        const { kelas } = req.params;
        
        // If user is a teacher, check if they can access this class
        if (req.user.role === 'guru') {
            const waliKelasClass = await getTeacherWaliKelasClass(req.user.id);
            if (!waliKelasClass || waliKelasClass !== kelas) {
                return res.status(403).json({ message: 'Anda hanya dapat mengakses kelas Anda sendiri' });
            }
        }
        
        const query = `
            SELECT
                id,
                nama,
                nis,
                nisn,
                kelas,
                ipc_total,
                ipc_awal,
                tahun_pelajaran,
                jurusan,
                is_graduated
            FROM users
            WHERE role = 'siswa' AND kelas = ? AND (is_graduated = 0 OR is_graduated IS NULL)
            ORDER BY CAST(nis AS UNSIGNED) ASC
        `;

        const [students] = await db.query(query, [kelas]);
        
        // Calculate current class for each student based on tahun_pelajaran
        const studentsWithCalculatedClass = students.map(student => {
            if (student.tahun_pelajaran && student.jurusan) {
                const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
                return {
                    ...student,
                    kelas: calculatedClass || student.kelas // Use calculated class, fallback to stored
                };
            }
            return student;
        });
        
        // Get full IPC breakdown for each student to ensure synchronization
        const studentsWithBreakdown = await Promise.all(
            studentsWithCalculatedClass.map(async (student) => {
                const cardData = await buildIpcCardBreakdown(student.id);
                if (cardData) {
                    return {
                        ...student,
                        points: cardData.points,
                        ipc_total: cardData.ipc_total,
                        breakdown_total: cardData.breakdown_total
                    };
                }
                return student;
            })
        );
        
        res.json(studentsWithBreakdown);
    } catch (error) {
        console.error('Error fetching class IPC report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Individual Point Card data for print (superadmin / guru)
router.get('/ipc-card/:userId', auth, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ message: 'ID siswa tidak valid' });
        }

        // If user is a teacher, check if the student is in their wali kelas class
        if (req.user.role === 'guru') {
            const waliKelasClass = await getTeacherWaliKelasClass(req.user.id);
            if (!waliKelasClass) {
                return res.status(403).json({ message: 'Anda bukan wali kelas' });
            }
            
            // Check if the student belongs to their class
            const [studentCheck] = await db.query(
                `SELECT kelas FROM users WHERE id = ? AND role = 'siswa'`,
                [userId]
            );
            
            if (studentCheck.length === 0) {
                return res.status(404).json({ message: 'Siswa tidak ditemukan' });
            }
            
            if (studentCheck[0].kelas !== waliKelasClass) {
                return res.status(403).json({ message: 'Anda hanya dapat mengakses siswa di kelas Anda' });
            }
        }

        const cardData = await buildIpcCardBreakdown(userId);
        if (!cardData) {
            return res.status(404).json({ message: 'Siswa tidak ditemukan' });
        }

        const { student } = cardData;
        
        // Calculate current class based on tahun_pelajaran
        let calculatedClass = student.kelas;
        if (student.tahun_pelajaran && student.jurusan) {
            calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan) || student.kelas;
        }
        
        // Update student object with calculated class
        student.kelas = calculatedClass;

        const [waliRows] = await db.query(
            `SELECT u.nama AS wali_nama, u.nip AS wali_nip, wka.tahun_ajaran
             FROM wali_kelas_assignment wka
             JOIN users u ON wka.guru_id = u.id
             WHERE wka.kelas = ? AND wka.tahun_ajaran = YEAR(CURDATE())
             ORDER BY wka.id DESC
             LIMIT 1`,
            [calculatedClass]
        );

        const wali = waliRows.length
            ? { nama: waliRows[0].wali_nama, nip: waliRows[0].wali_nip, tahun_ajaran: waliRows[0].tahun_ajaran }
            : null;

        const [history] = await db.query(
            `SELECT id, jenis_perubahan, point_change, ipc_sebelum, ipc_sesudah, keterangan, created_at
             FROM ipc_history
             WHERE user_id = ?
             ORDER BY created_at ASC, id ASC`,
            [userId]
        );

        res.json({
            student,
            wali,
            points: cardData.points,
            ipc_total: cardData.ipc_total,
            breakdown_total: cardData.breakdown_total,
            history
        });
    } catch (error) {
        console.error('Error fetching IPC card data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
