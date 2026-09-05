const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { movePhotoToApprovedFolder } = require('../utils/fileUtils');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/event/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const { calculateEventPoints } = require('../constants/points');

// Get all event (for approvals)
router.get('/all', auth, async (req, res) => {
    try {
        const [events] = await db.query(`
            SELECT e.*, u.nama as user_name 
            FROM event e 
            JOIN users u ON e.user_id = u.id 
            ORDER BY e.created_at DESC
        `);
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's event
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const [events] = await db.query(
            'SELECT * FROM event WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
            [req.params.userId, 'approved']
        );
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create event
router.post('/', auth, upload.single('foto'), async (req, res) => {
    try {
        const { nama, nis, kelas, grha, nama_event, tingkat } = req.body;
        let foto = req.file ? req.file.filename : null;

        // Rename file to NIS_Nama Event format
        if (req.file && foto) {
            const oldPath = path.join('uploads/event', foto);
            const ext = path.extname(req.file.originalname);
            const newFileName = `${nis}_${nama_event}${ext}`;
            const newPath = path.join('uploads/event', newFileName);

            // Rename the file
            fs.renameSync(oldPath, newPath);
            foto = newFileName;
        }

        const point = calculateEventPoints(tingkat);

        const [result] = await db.query(
            'INSERT INTO event (user_id, nama, nis, kelas, grha, nama_event, tingkat, foto, point) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, nama, nis, kelas, grha, nama_event, tingkat, foto, point]
        );

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Submit Event', `Submitted event: ${nama_event}`]
        );

        res.status(201).json({ message: 'Event submitted for approval', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve event
router.put('/:id/approve', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const [event] = await db.query('SELECT * FROM event WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const eventData = event[0];
        let newFotoPath = eventData.foto;
        
        // Move photo to approved folder if it exists
        if (eventData.foto) {
            const movedPath = movePhotoToApprovedFolder(path.join('uploads/event', eventData.foto), 'event');
            if (movedPath) {
                newFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
            }
        }
        
        // Update status and photo path
        await db.query('UPDATE event SET status = ?, foto = ? WHERE id = ?', ['approved', newFotoPath, eventId]);
        
        // Update user IPC (can go negative due to pelanggaran, can recover with event)
        const [user] = await db.query('SELECT ipc_total FROM users WHERE id = ?', [eventData.user_id]);
        const ipcSebelum = user[0].ipc_total;
        const ipcSesudah = ipcSebelum + eventData.point;
        
        await db.query('UPDATE users SET ipc_total = ? WHERE id = ?', [ipcSesudah, eventData.user_id]);
        
        await db.query(
            'INSERT INTO ipc_history (user_id, jenis_perubahan, point_change, ipc_sebelum, ipc_sesudah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
            [eventData.user_id, 'event', eventData.point, ipcSebelum, ipcSesudah, `Event: ${eventData.nama_event}`]
        );

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Approve Event', `Approved event ID ${eventId}`]
        );

        res.json({ message: 'Event approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject event
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const { rejection_reason } = req.body;
        const eventId = req.params.id;
        
        await db.query('UPDATE event SET status = ?, rejection_reason = ? WHERE id = ?', ['rejected', rejection_reason, eventId]);

        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Reject Event', `Rejected event ID ${eventId}`]
        );

        res.json({ message: 'Event rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update event
router.put('/:id', auth, upload.single('foto'), async (req, res) => {
    try {
        const eventId = req.params.id;
        const { nama, nis, kelas, grha, nama_event, tingkat } = req.body;
        
        const [event] = await db.query('SELECT * FROM event WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const eventData = event[0];
        let foto = eventData.foto;

        // Handle new photo upload
        if (req.file) {
            // Delete old photo if exists
            if (foto) {
                const oldPath = path.join('uploads/event', foto);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            
            // Rename new file
            const ext = path.extname(req.file.originalname);
            const newFileName = `${nis}_${nama_event}${ext}`;
            const oldPath = path.join('uploads/event', req.file.filename);
            const newPath = path.join('uploads/event', newFileName);
            fs.renameSync(oldPath, newPath);
            foto = newFileName;
        }

        // Recalculate points if tingkat changed
        const point = calculateEventPoints(tingkat);

        await db.query(
            'UPDATE event SET nama = ?, nis = ?, kelas = ?, grha = ?, nama_event = ?, tingkat = ?, foto = ?, point = ? WHERE id = ?',
            [nama, nis, kelas, grha, nama_event, tingkat, foto, point, eventId]
        );

        // If status is approved and point changed, update user IPC
        if (eventData.status === 'approved' && eventData.point !== point) {
            const pointDiff = point - eventData.point;
            const [userBefore] = await db.query('SELECT ipc_total FROM users WHERE id = ?', [eventData.user_id]);
            const ipcSebelum = userBefore[0].ipc_total;
            const ipcSesudah = ipcSebelum + pointDiff;
            
            await db.query('UPDATE users SET ipc_total = ? WHERE id = ?', [ipcSesudah, eventData.user_id]);
            
            await db.query(
                'INSERT INTO ipc_history (user_id, jenis_perubahan, point_change, ipc_sebelum, ipc_sesudah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [eventData.user_id, 'event_update', pointDiff, ipcSebelum, ipcSesudah, `Update Event: ${nama_event}`]
            );
        }

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Update Event', `Updated event ID ${eventId}`]
        );

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete event (superadmin only)
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const [event] = await db.query('SELECT * FROM event WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const eventData = event[0];

        // If approved, revert IPC change
        if (eventData.status === 'approved') {
            const [user] = await db.query('SELECT ipc_total FROM users WHERE id = ?', [eventData.user_id]);
            const ipcSebelum = user[0].ipc_total;
            const ipcSesudah = ipcSebelum - eventData.point;
            
            await db.query('UPDATE users SET ipc_total = ? WHERE id = ?', [ipcSesudah, eventData.user_id]);
            
            // Log IPC history
            await db.query(
                'INSERT INTO ipc_history (user_id, jenis_perubahan, point_change, ipc_sebelum, ipc_sesudah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [eventData.user_id, 'event_delete', -eventData.point, ipcSebelum, ipcSesudah, `Delete Event: ${eventData.nama_event}`]
            );
        }

        // Delete photo file if exists
        if (eventData.foto) {
            const photoPath = path.join('uploads', eventData.foto);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Delete from database
        await db.query('DELETE FROM event WHERE id = ?', [eventId]);

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Delete Event', `Deleted event ID ${eventId}`]
        );

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
