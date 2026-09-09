const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../config/database');
const { getStudentRecords } = require('../utils/studentRecords');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
        }
    }
});

// Get user profile
router.get('/', auth, async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT id, nama, nis, nip, role, kelas, grha, wali_kelas, ipc_total, ipc_awal, alamat, no_hp, detail, detail AS jabatan, foto, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = user[0];
        
        // If user is a student, fetch wali kelas information
        if (userData.role === 'siswa' && userData.kelas) {
            const [waliData] = await db.query(`
                SELECT u.nama as wali_kelas_nama, u.nip as wali_kelas_nip
                FROM wali_kelas_assignment wka
                JOIN users u ON wka.guru_id = u.id
                WHERE wka.kelas = ? AND wka.tahun_ajaran = YEAR(CURDATE())
                ORDER BY wka.id DESC
                LIMIT 1
            `, [userData.kelas]);
            
            if (waliData.length > 0) {
                userData.wali_kelas_nama = waliData[0].wali_kelas_nama;
                userData.wali_kelas_nip = waliData[0].wali_kelas_nip;
            }
        }

        res.json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const avatarPath = '/uploads/avatars/' + req.file.filename;

        // Delete old avatar if exists
        const [user] = await db.query('SELECT foto FROM users WHERE id = ?', [req.user.id]);
        if (user.length > 0 && user[0].foto) {
            const oldAvatarPath = path.join(__dirname, '..', user[0].foto);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Update user avatar in database
        await db.query(
            'UPDATE users SET foto = ? WHERE id = ?',
            [avatarPath, req.user.id]
        );

        res.json({ message: 'Avatar uploaded successfully', avatarPath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete avatar
router.delete('/avatar', auth, async (req, res) => {
    try {
        const [user] = await db.query('SELECT foto FROM users WHERE id = ?', [req.user.id]);
        
        if (user.length > 0 && user[0].foto) {
            const oldAvatarPath = path.join(__dirname, '..', user[0].foto);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        await db.query(
            'UPDATE users SET foto = NULL WHERE id = ?',
            [req.user.id]
        );

        res.json({ message: 'Avatar deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user IPC history
router.get('/ipc-history', auth, async (req, res) => {
    try {
        const [history] = await db.query(
            'SELECT * FROM ipc_history WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's approved data summary
router.get('/summary', auth, async (req, res) => {
    try {
        const records = await getStudentRecords(req.user.id);
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Get user with current password
        const [user] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user[0].password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
