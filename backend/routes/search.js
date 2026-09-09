const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../config/database');

// Search students by name or NIS
router.get('/students', auth, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const [students] = await db.query(`
            SELECT id, nama, nis, kelas, grha, ipc_total
            FROM users 
            WHERE role = 'siswa' 
            AND (nama LIKE ? OR nis LIKE ?)
            LIMIT 20
        `, [`%${query}%`, `%${query}%`, `%${query}%`]);

        // Get prestasi counts for each student
        const studentsWithPrestasi = await Promise.all(
            students.map(async (student) => {
                const [akademik] = await db.query(
                    'SELECT COUNT(*) as count FROM prestasi WHERE user_id = ? AND jenis = ? AND status = ?',
                    [student.id, 'akademik', 'approved']
                );
                const [nonakademik] = await db.query(
                    'SELECT COUNT(*) as count FROM prestasi WHERE user_id = ? AND jenis = ? AND status = ?',
                    [student.id, 'nonakademik', 'approved']
                );
                
                return {
                    ...student,
                    total_prestasi_akademik: akademik[0].count,
                    total_prestasi_nonakademik: nonakademik[0].count
                };
            })
        );

        res.json(studentsWithPrestasi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student details with achievements
router.get('/student/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        const [student] = await db.query(
            'SELECT id, nama, nis, kelas, grha, ipc_total FROM users WHERE id = ? AND role = ?',
            [userId, 'siswa']
        );

        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const [prestasi] = await db.query(
            'SELECT * FROM prestasi WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
            [userId, 'approved']
        );

        const [organisasi] = await db.query(
            'SELECT * FROM organisasi WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
            [userId, 'approved']
        );

        const [event] = await db.query(
            'SELECT * FROM event WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
            [userId, 'approved']
        );

        const akademikCount = prestasi.filter(p => p.jenis === 'akademik').length;
        const nonakademikCount = prestasi.filter(p => p.jenis === 'nonakademik').length;

        res.json({
            student: student[0],
            prestasi,
            organisasi,
            event,
            total_prestasi_akademik: akademikCount,
            total_prestasi_nonakademik: nonakademikCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get leaderboard - Akademik (Top 20)
router.get('/leaderboard/akademik', auth, async (req, res) => {
    try {
        // Get students with total counts
        const [students] = await db.query(`
            SELECT 
                u.id,
                u.nama,
                u.nis,
                u.kelas,
                u.grha,
                u.foto,
                COUNT(p.id) as total_prestasi,
                SUM(p.point) as total_point
            FROM users u
            LEFT JOIN prestasi p ON u.id = p.user_id 
                AND p.jenis = 'akademik' 
                AND p.status = 'approved'
            WHERE u.role = 'siswa'
            GROUP BY u.id, u.nama, u.nis, u.kelas, u.grha, u.foto
            HAVING total_prestasi > 0
            ORDER BY total_prestasi DESC, total_point DESC, u.nama ASC
            LIMIT 20
        `);

        console.log('Akademik students:', students.length);

        // Get detailed competition info for each student
        const studentsWithDetails = await Promise.all(
            students.map(async (student, index) => {
                const [competitions] = await db.query(`
                    SELECT 
                        nama_lomba,
                        kategori,
                        juara
                    FROM prestasi
                    WHERE user_id = ? 
                        AND jenis = 'akademik' 
                        AND status = 'approved'
                    ORDER BY created_at DESC
                `, [student.id]);

                console.log(`Student ${student.nama} (${student.id}) has ${competitions.length} competitions`);

                // Format competitions list
                const keterangan = competitions.map(c => 
                    `${c.nama_lomba} (${c.kategori}) - ${c.juara}`
                ).join(', ');

                // Get unique kategori levels
                const kategoriSet = new Set(competitions.map(c => c.kategori));
                const kategoriList = Array.from(kategoriSet).join(', ');

                return {
                    ...student,
                    rank: index + 1,
                    kategori: kategoriList,
                    keterangan: keterangan,
                    detail_prestasi: competitions
                };
            })
        );

        console.log('Final akademik data:', studentsWithDetails);
        res.json(studentsWithDetails);
    } catch (error) {
        console.error('Error fetching akademik leaderboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get leaderboard - Non-Akademik (Top 20)
router.get('/leaderboard/nonakademik', auth, async (req, res) => {
    try {
        // Get students with total counts
        const [students] = await db.query(`
            SELECT 
                u.id,
                u.nama,
                u.nis,
                u.kelas,
                u.grha,
                u.foto,
                COUNT(p.id) as total_prestasi,
                SUM(p.point) as total_point
            FROM users u
            LEFT JOIN prestasi p ON u.id = p.user_id 
                AND p.jenis = 'nonakademik' 
                AND p.status = 'approved'
            WHERE u.role = 'siswa'
            GROUP BY u.id, u.nama, u.nis, u.kelas, u.grha, u.foto
            HAVING total_prestasi > 0
            ORDER BY total_prestasi DESC, total_point DESC, u.nama ASC
            LIMIT 20
        `);

        // Get detailed competition info for each student
        const studentsWithDetails = await Promise.all(
            students.map(async (student, index) => {
                const [competitions] = await db.query(`
                    SELECT 
                        nama_lomba,
                        kategori,
                        juara
                    FROM prestasi
                    WHERE user_id = ? 
                        AND jenis = 'nonakademik' 
                        AND status = 'approved'
                    ORDER BY created_at DESC
                `, [student.id]);

                // Format competitions list
                const keterangan = competitions.map(c => 
                    `${c.nama_lomba} (${c.kategori}) - Juara ${c.juara}`
                ).join(', ');

                // Get unique kategori levels
                const kategoriSet = new Set(competitions.map(c => c.kategori));
                const kategoriList = Array.from(kategoriSet).join(', ');

                return {
                    ...student,
                    rank: index + 1,
                    tingkat: kategoriList,
                    keterangan: keterangan,
                    detail_prestasi: competitions
                };
            })
        );

        res.json(studentsWithDetails);
    } catch (error) {
        console.error('Error fetching non-akademik leaderboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
