const express = require('express');
const router = express.Router();
const { auth, checkInputAccess, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');
const {
    calculatePerilakuPoints,
    calculatePerilakuPointsFromFields,
    formatPerilakuKarakter
} = require('../constants/points');
const { resolveStudentIdByNis, applyPerilakuIpcChange } = require('../utils/ipc');
const { movePhotoToApprovedFolder } = require('../utils/fileUtils');

// Get all perilaku (for approvals)
router.get('/all', auth, async (req, res) => {
    try {
        const [perilaku] = await db.query(`
            SELECT p.*, u.nama as user_name 
            FROM perilaku p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `);
        res.json(perilaku);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's perilaku
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const [perilaku] = await db.query(
            'SELECT * FROM perilaku WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
            [req.params.userId, 'approved']
        );
        res.json(perilaku);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create perilaku
router.post('/', auth, checkInputAccess('perilaku'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const {
            nama,
            nis,
            kelas,
            grha,
            karakter_siswa,
            tanggung_jawab,
            disiplin,
            kepedulian,
            kemandirian,
            spiritual,
            kejujuran,
            kepercayaan_diri
        } = req.body;

        const userId = await resolveStudentIdByNis(nis, req.user.id);
        const karakter = karakter_siswa || formatPerilakuKarakter({
            tanggung_jawab,
            disiplin,
            kepedulian,
            kemandirian,
            spiritual,
            kejujuran,
            kepercayaan_diri
        });
        const point = karakter_siswa
            ? await calculatePerilakuPoints(karakter_siswa)
            : await calculatePerilakuPointsFromFields({
                tanggung_jawab,
                disiplin,
                kepedulian,
                kemandirian,
                spiritual,
                kejujuran,
                kepercayaan_diri
            });

        if (userRole === 'superadmin') {
            const [result] = await db.query(
                `INSERT INTO perilaku (user_id, nama, nis, kelas, grha, karakter_siswa, point, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [userId, nama, nis, kelas, grha, karakter, point]
            );

            await applyPerilakuIpcChange(
                userId,
                point,
                `Perilaku: ${karakter}`,
                result.insertId
            );

            await db.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [req.user.id, 'Submit Perilaku', `Directly added perilaku: ${karakter}`]
            );

            return res.status(201).json({
                message: 'Perilaku berhasil ditambahkan',
                id: result.insertId
            });
        }

        const [result] = await db.query(
            'INSERT INTO perilaku (user_id, nama, nis, kelas, grha, karakter_siswa, point) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, nama, nis, kelas, grha, karakter, point]
        );

        const [superadmins] = await db.query('SELECT id FROM users WHERE role = "superadmin"');
        for (const admin of superadmins) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (?, 'approval_needed', 'Persetujuan Perilaku', ?, ?, 'perilaku')`,
                [admin.id, `${nama} (${nis}) mengajukan perilaku`, result.insertId]
            );
        }

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Submit Perilaku', `Submitted perilaku: ${karakter}`]
        );

        res.status(201).json({ message: 'Perilaku berhasil diajukan untuk persetujuan', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Approve perilaku
router.put('/:id/approve', auth, superAdminOnly, async (req, res) => {
    try {
        const perilakuId = req.params.id;
        
        const [perilaku] = await db.query(
            'SELECT * FROM perilaku WHERE id = ? AND status = ?',
            [perilakuId, 'pending']
        );
        if (perilaku.length === 0) {
            return res.status(404).json({ message: 'Perilaku not found or already processed' });
        }

        const perilakuData = perilaku[0];
        
        await db.query(
            'UPDATE perilaku SET status = ? WHERE id = ? AND status = ?',
            ['approved', perilakuId, 'pending']
        );
        
        await applyPerilakuIpcChange(
            perilakuData.user_id,
            perilakuData.point,
            `Perilaku: ${perilakuData.karakter_siswa}`,
            perilakuId
        );

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Approve Perilaku', `Approved perilaku ID ${perilakuId}`]
        );

        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
             VALUES (?, 'approved', 'Pengajuan Disetujui', ?, ?, 'perilaku')`,
            [perilakuData.user_id, 'Pengajuan perilaku Anda telah disetujui', perilakuId]
        );

        res.json({ message: 'Perilaku approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject perilaku
router.put('/:id/reject', auth, superAdminOnly, async (req, res) => {
    try {
        const { rejection_reason } = req.body;
        const perilakuId = req.params.id;
        
        await db.query('UPDATE perilaku SET status = ?, rejection_reason = ? WHERE id = ?', ['rejected', rejection_reason, perilakuId]);

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Reject Perilaku', `Rejected perilaku ID ${perilakuId}`]
        );

        res.json({ message: 'Perilaku rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update perilaku
router.put('/:id', auth, async (req, res) => {
    try {
        const perilakuId = req.params.id;
        const { nama, nis, kelas, grha, karakter_siswa, tanggung_jawab, disiplin, kepedulian, kemandirian, spiritual, kejujuran, kepercayaan_diri } = req.body;
        
        const [perilaku] = await db.query('SELECT * FROM perilaku WHERE id = ?', [perilakuId]);
        if (perilaku.length === 0) {
            return res.status(404).json({ message: 'Perilaku not found' });
        }

        const perilakuData = perilaku[0];
        const karakter = karakter_siswa || formatPerilakuKarakter({
            tanggung_jawab,
            disiplin,
            kepedulian,
            kemandirian,
            spiritual,
            kejujuran,
            kepercayaan_diri
        });
        const point = karakter_siswa
            ? await calculatePerilakuPoints(karakter_siswa)
            : await calculatePerilakuPointsFromFields({
                tanggung_jawab,
                disiplin,
                kepedulian,
                kemandirian,
                spiritual,
                kejujuran,
                kepercayaan_diri
            });

        await db.query(
            'UPDATE perilaku SET nama = ?, nis = ?, kelas = ?, grha = ?, karakter_siswa = ?, point = ? WHERE id = ?',
            [nama, nis, kelas, grha, karakter, point, perilakuId]
        );

        // If status is approved and point changed, update user IPC
        if (perilakuData.status === 'approved' && perilakuData.point !== point) {
            const pointDiff = point - perilakuData.point;
            const [userBefore] = await db.query('SELECT ipc_total FROM users WHERE id = ?', [perilakuData.user_id]);
            const ipcSebelum = userBefore[0].ipc_total;
            const ipcSesudah = ipcSebelum + pointDiff;
            
            // Update user IPC (can go negative due to pelanggaran, can recover with perilaku)
            await db.query('UPDATE users SET ipc_total = ? WHERE id = ?', [ipcSesudah, perilakuData.user_id]);
            
            await db.query(
                'INSERT INTO ipc_history (user_id, jenis_perubahan, point_change, ipc_sebelum, ipc_sesudah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [perilakuData.user_id, 'perilaku_update', pointDiff, ipcSebelum, ipcSesudah, `Update Perilaku: ${karakter}`]
            );
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Update Perilaku', `Updated perilaku ID ${perilakuId}`]
        );

        res.json({ message: 'Perilaku updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
