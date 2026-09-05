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
        
        // Total by kelas
        const [byKelas] = await db.query(`
            SELECT kelas, COUNT(*) as count 
            FROM users 
            WHERE role = 'siswa' AND kelas IS NOT NULL AND is_graduated = 0
            GROUP BY kelas
            ORDER BY kelas
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
        
        // Total organisasi
        const [totalOrganisasi] = await db.query("SELECT COUNT(*) as count FROM organisasi WHERE status = 'approved'");
        
        // Total kepanitiaan
        const [totalKepanitiaan] = await db.query("SELECT COUNT(*) as count FROM kepanitiaan WHERE status = 'approved'");
        
        // Total event
        const [totalEvent] = await db.query("SELECT COUNT(*) as count FROM event WHERE status = 'approved'");
        
        // Total perilaku
        const [totalPerilaku] = await db.query("SELECT COUNT(*) as count FROM perilaku WHERE status = 'approved'");
        
        // IPC Statistics
        const [ipcStats] = await db.query(`
            SELECT 
                AVG(ipc_total) as rata_rata,
                MAX(ipc_total) as tertinggi,
                MIN(ipc_total) as terendah
            FROM users 
            WHERE role = 'siswa' AND is_graduated = 0 AND ipc_total IS NOT NULL
        `);
        
        // Siswa dengan IPC tertinggi
        const [topIpcStudents] = await db.query(`
            SELECT id, nama, nis, kelas, grha, ipc_total 
            FROM users 
            WHERE role = 'siswa' AND is_graduated = 0 AND ipc_total IS NOT NULL
            ORDER BY ipc_total DESC 
            LIMIT 5
        `);

        res.json({
            total_students: totalStudents[0].count,
            total_teachers: totalTeachers[0].count,
            by_grha: byGrha,
            by_kelas: byKelas,
            prestasi_akademik: prestasiAkademik[0].count,
            prestasi_nonakademik: prestasiNonAkademik[0].count,
            pelanggaran_by_grha: pelanggaranByGrha,
            total_pelanggaran: totalPelanggaran[0].count,
            total_organisasi: totalOrganisasi[0].count,
            total_kepanitiaan: totalKepanitiaan[0].count,
            total_event: totalEvent[0].count,
            total_perilaku: totalPerilaku[0].count,
            ipc_stats: {
                rata_rata: Math.round(ipcStats[0].rata_rata || 0),
                tertinggi: ipcStats[0].tertinggi || 0,
                terendah: ipcStats[0].terendah || 0
            },
            top_ipc_students: topIpcStudents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
