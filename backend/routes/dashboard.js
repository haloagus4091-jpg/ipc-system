const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../config/database');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
    try {
        // Total students
        const [totalStudents] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'siswa'");
        
        // Total teachers
        const [totalTeachers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'guru'");
        
        // Total by grha
        const [byGrha] = await db.query(`
            SELECT grha, COUNT(*) as count 
            FROM users 
            WHERE role = 'siswa' AND grha IS NOT NULL 
            GROUP BY grha
        `);
        
        // Total prestasi akademik
        const [prestasiAkademik] = await db.query(`
            SELECT COUNT(*) as count 
            FROM prestasi 
            WHERE jenis = 'akademik' AND status = 'approved'
        `);
        
        // Total prestasi nonakademik
        const [prestasiNonAkademik] = await db.query(`
            SELECT COUNT(*) as count 
            FROM prestasi 
            WHERE jenis = 'nonakademik' AND status = 'approved'
        `);
        
        // Total pelanggaran by grha
        const [pelanggaranByGrha] = await db.query(`
            SELECT u.grha, COUNT(p.id) as count 
            FROM users u 
            LEFT JOIN pelanggaran p ON u.id = p.user_id AND p.status = 'approved'
            WHERE u.role = 'siswa' AND u.grha IS NOT NULL 
            GROUP BY u.grha
        `);
        
        // Total pelanggaran
        const [totalPelanggaran] = await db.query("SELECT COUNT(*) as count FROM pelanggaran WHERE status = 'approved'");

        // Total by kelas
        const [byKelas] = await db.query(`
            SELECT kelas, COUNT(*) as count 
            FROM users 
            WHERE role = 'siswa' AND kelas IS NOT NULL AND is_graduated = 0
            GROUP BY kelas
            ORDER BY kelas
        `);

        res.json({
            total_students: totalStudents[0].count,
            total_teachers: totalTeachers[0].count,
            by_grha: byGrha,
            prestasi_akademik: prestasiAkademik[0].count,
            prestasi_nonakademik: prestasiNonAkademik[0].count,
            pelanggaran_by_grha: pelanggaranByGrha,
            total_pelanggaran: totalPelanggaran[0].count,
            by_kelas: byKelas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
