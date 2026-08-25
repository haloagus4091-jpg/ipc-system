const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, superAdminOnly, checkInputAccess } = require('../middleware/auth');
const db = require('../config/database');
const {
    calculatePrestasiPoints,
    calculateEventPoints,
    calculateOrganisasiPoints,
    calculateKepanitiaanPoints,
    normalizePrestasiJenis,
    calculatePelanggaranPoints
} = require('../constants/points');
const { resolveStudentIdByNis, applyIpcChange, applyPerilakuIpcChange } = require('../utils/ipc');
const {
    getRowApprovalStatus,
    fetchPendingApprovals,
    approveSubmission,
    rejectSubmission
} = require('../utils/approvalSchema');
const { movePhotoToApprovedFolder } = require('../utils/fileUtils');
// Local file storage only - Google Drive removed

// Configure multer for file uploads - use type-specific folders
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine upload folder based on route
        let uploadDir = 'uploads/approvals';
        if (req.originalUrl.includes('/prestasi/')) {
            uploadDir = 'uploads/prestasi';
        } else if (req.originalUrl.includes('/event/')) {
            uploadDir = 'uploads/event';
        } else if (req.originalUrl.includes('/organisasi/')) {
            uploadDir = 'uploads/organisasi';
        } else if (req.originalUrl.includes('/kepanitiaan/')) {
            uploadDir = 'uploads/kepanitiaan';
        } else if (req.originalUrl.includes('/pelanggaran/')) {
            uploadDir = 'uploads/pelanggaran';
        }
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper function to save file locally - extracts the relative path from full file path
const saveFileLocally = (filePath) => {
    // The file is already saved in the type-specific folder by multer
    // Extract the relative path from the absolute path
    // filePath is absolute like: c:\Users\...\backend\uploads\prestasi\filename.jpg
    // We want: uploads/prestasi/filename.jpg
    
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Find 'uploads' in the path
    const uploadsIndex = normalizedPath.indexOf('uploads');
    if (uploadsIndex !== -1) {
        return normalizedPath.substring(uploadsIndex);
    }
    
    // If uploads not found, use the filename and default to approvals folder
    console.warn('Uploads not found in path, using fallback:', filePath);
    const filename = path.basename(filePath);
    return `uploads/approvals/${filename}`;
};

// ==================== SUBMIT FOR APPROVAL ====================

// Submit Prestasi for Approval (or Direct Submit for Superadmin)
router.post('/prestasi/submit', auth, checkInputAccess('prestasi'), upload.single('foto'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const { nama, nis, jenis, nama_lomba, pembina, grha, juara, kategori } = req.body;
        const userId = await resolveStudentIdByNis(nis, req.user.id);
        let fotoPath = req.file ? saveFileLocally(req.file.path) : null;
        console.log('Prestasi - Using local path:', fotoPath);
        
        // Get student's calculated class from database
        const [studentData] = await db.query('SELECT kelas FROM users WHERE id = ?', [userId]);
        const calculatedClass = studentData[0]?.kelas || '';
        
        // SUPERADMIN: Direct submit to main table
        if (userRole === 'superadmin') {
            console.log('Prestasi - Superadmin direct submission');
            const point = calculatePrestasiPoints(juara, kategori);
            
            // Move photo to organized folder if exists
            let finalFotoPath = fotoPath;
            if (fotoPath) {
                const movedPath = movePhotoToApprovedFolder(fotoPath, 'prestasi');
                if (movedPath) {
                    finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
                }
            }
            
            const [result] = await db.query(
                `INSERT INTO prestasi 
                (user_id, nama, nis, jenis, nama_lomba, kelas, pembina, grha, juara, kategori, foto, point, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [userId, nama, nis, jenis, nama_lomba, calculatedClass, pembina, grha, juara, kategori, finalFotoPath, point]
            );
            
            await applyIpcChange(userId, 'prestasi', point, `Prestasi: ${nama_lomba} - ${juara} ${kategori}`);
            
            console.log('Prestasi - Directly added by superadmin:', result.insertId);
            
            return res.status(201).json({ 
                message: 'Prestasi berhasil ditambahkan', 
                id: result.insertId 
            });
        }

        // SISWA/GURU: Submit for approval (superadmin only)
        const [result] = await db.query(
            `INSERT INTO prestasi_approvals
            (user_id, nama, nis, jenis, nama_lomba, kelas, pembina, grha, juara, kategori, foto_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, nama, nis, jenis, nama_lomba, calculatedClass, pembina, grha, juara, kategori, fotoPath]
        );

        // Create notification for superadmin only
        const [superadmins] = await db.query('SELECT id FROM users WHERE role = "superadmin"');
        console.log('Prestasi - Superadmins found:', superadmins.length);
        for (const admin of superadmins) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (?, 'approval_needed', 'Persetujuan Prestasi', ?, ?, 'prestasi')`,
                [admin.id, `${nama} (${nis}) mengajukan prestasi: ${nama_lomba}`, result.insertId]
            );
            console.log('Prestasi - Notification sent to superadmin:', admin.id);
        }

        res.status(201).json({
            message: 'Prestasi berhasil diajukan untuk persetujuan',
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Submit Pelanggaran for Approval (or Direct Submit for Superadmin)
router.post('/pelanggaran/submit', auth, checkInputAccess('pelanggaran'), upload.single('foto'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const { nama, nis, grha, keterangan, jenis_pelanggaran } = req.body;
        const userId = await resolveStudentIdByNis(nis, req.user.id);
        let foto_path = req.file ? saveFileLocally(req.file.path) : null;
        console.log('Pelanggaran - Using local path:', foto_path);
        console.log('Pelanggaran - Superadmin direct submission');
        const point = calculatePelanggaranPoints(jenis_pelanggaran);
        
        // Get student's calculated class from database
        const [studentData] = await db.query('SELECT kelas FROM users WHERE id = ?', [userId]);
        const calculatedClass = studentData[0]?.kelas || '';
        
        // Move photo to organized folder if exists
        let finalFotoPath = foto_path;
        if (foto_path) {
            const movedPath = movePhotoToApprovedFolder(foto_path, 'pelanggaran');
            if (movedPath) {
                finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
            }
        }
        
        const [result] = await db.query(
            `INSERT INTO pelanggaran 
            (user_id, nama, nis, kelas, grha, keterangan, foto, jenis_pelanggaran, point_dikurangi, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
            [userId, nama, nis, calculatedClass, grha, keterangan, finalFotoPath, jenis_pelanggaran, point]
        );
        
        await applyIpcChange(userId, 'pelanggaran', point, `Pelanggaran: ${jenis_pelanggaran}`);
        
        console.log('Pelanggaran - Directly added by superadmin:', result.insertId);
        
        return res.status(201).json({ 
            message: 'Pelanggaran berhasil ditambahkan', 
            id: result.insertId 
        });
        
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

router.post('/event/submit', auth, checkInputAccess('event'), upload.single('foto'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const { nama, nis, grha, pembina, nama_event, tingkat } = req.body;
        const userId = await resolveStudentIdByNis(nis, req.user.id);
        let foto_path = req.file ? saveFileLocally(req.file.path) : null;
        console.log('Event - Using local path:', foto_path);
        
        // Get student's calculated class from database
        const [studentData] = await db.query('SELECT kelas FROM users WHERE id = ?', [userId]);
        const calculatedClass = studentData[0]?.kelas || '';
        
        // SUPERADMIN: Direct submit to main table
        if (userRole === 'superadmin') {
            console.log('Event - Superadmin direct submission');
            const point = calculateEventPoints(tingkat);
            
            // Move photo to organized folder if exists
            let finalFotoPath = foto_path;
            if (foto_path) {
                const movedPath = movePhotoToApprovedFolder(foto_path, 'event');
                if (movedPath) {
                    finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
                }
            }
            
            const [result] = await db.query(
                `INSERT INTO event 
                (user_id, nama, nis, kelas, grha, nama_event, tingkat, foto, point, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [userId, nama, nis, calculatedClass, grha, nama_event, tingkat, finalFotoPath, point]
            );
            
            await applyIpcChange(userId, 'event', point, `Event: ${nama_event} - ${tingkat}`);
            
            console.log('Event - Directly added by superadmin:', result.insertId);
            
            return res.status(201).json({ 
                message: 'Event berhasil ditambahkan', 
                id: result.insertId 
            });
        }

        // SISWA/GURU: Submit for approval (superadmin only)
        const [result] = await db.query(
            `INSERT INTO event_approvals
            (user_id, nama, nis, kelas, grha, pembina, nama_event, tingkat, foto_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, nama, nis, kelas, grha, pembina, nama_event, tingkat, foto_path]
        );

        // Create notification for superadmin only
        const [superadmins] = await db.query('SELECT id FROM users WHERE role = "superadmin"');
        console.log('Event - Superadmins found:', superadmins.length);
        for (const admin of superadmins) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (?, 'approval_needed', 'Persetujuan Event', ?, ?, 'event')`,
                [admin.id, `${nama} (${nis}) mengajukan event: ${nama_event}`, result.insertId]
            );
            console.log('Event - Notification sent to superadmin:', admin.id);
        }

        res.status(201).json({
            message: 'Event berhasil diajukan untuk persetujuan',
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Submit Organisasi for Approval (or Direct Submit for Superadmin)
router.post('/organisasi/submit', auth, checkInputAccess('organisasi'), upload.single('foto'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const { nama, nis, grha, pembina, jabatan_organisasi, kategori_organisasi } = req.body;
        const userId = await resolveStudentIdByNis(nis, req.user.id);
        let foto_path = req.file ? saveFileLocally(req.file.path) : null;
        console.log('Organisasi - Using local path:', foto_path);
        
        // Get student's calculated class from database
        const [studentData] = await db.query('SELECT kelas FROM users WHERE id = ?', [userId]);
        const calculatedClass = studentData[0]?.kelas || '';
        
        // SUPERADMIN: Direct submit to main table
        if (userRole === 'superadmin') {
            console.log('Organisasi - Superadmin direct submission');
            const point = calculateOrganisasiPoints(jabatan_organisasi);
            
            // Move photo to organized folder if exists
            let finalFotoPath = foto_path;
            if (foto_path) {
                const movedPath = movePhotoToApprovedFolder(foto_path, 'organisasi');
                if (movedPath) {
                    finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
                }
            }
            
            const [result] = await db.query(
                `INSERT INTO organisasi 
                (user_id, nama, nis, kelas, grha, jabatan_organisasi, foto, kategori_organisasi, point, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [userId, nama, nis, calculatedClass, grha, jabatan_organisasi, finalFotoPath, kategori_organisasi, point]
            );
            
            await applyIpcChange(
                userId,
                'organisasi',
                point,
                `Organisasi: ${kategori_organisasi} - ${jabatan_organisasi}`
            );
            
            console.log('Organisasi - Directly added by superadmin:', result.insertId);
            
            return res.status(201).json({ 
                message: 'Organisasi berhasil ditambahkan', 
                id: result.insertId 
            });
        }
        
        // SISWA/GURU: Submit for approval (superadmin only)
        const [result] = await db.query(
            `INSERT INTO organisasi_approvals
            (user_id, nama, nis, kelas, grha, pembina, jabatan_organisasi, kategori_organisasi, foto_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, nama, nis, calculatedClass, grha, pembina, jabatan_organisasi, kategori_organisasi, foto_path]
        );

        // Create notification for superadmin only
        const [superadmins] = await db.query('SELECT id FROM users WHERE role = "superadmin"');
        console.log('Organisasi - Superadmins found:', superadmins.length);
        for (const admin of superadmins) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (?, 'approval_needed', 'Persetujuan Organisasi', ?, ?, 'organisasi')`,
                [admin.id, `${nama} (${nis}) mengajukan organisasi: ${kategori_organisasi}`, result.insertId]
            );
            console.log('Organisasi - Notification sent to superadmin:', admin.id);
        }

        res.status(201).json({
            message: 'Organisasi berhasil diajukan untuk persetujuan',
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Submit Kepanitiaan for Approval (or Direct Submit for Superadmin)
router.post('/kepanitiaan/submit', auth, checkInputAccess('kepanitiaan'), upload.single('foto'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const { nama, nis, grha, pembina, jabatan_kepanitiaan, kategori_kepanitiaan } = req.body;
        const userId = await resolveStudentIdByNis(nis, req.user.id);
        let foto_path = req.file ? saveFileLocally(req.file.path) : null;
        console.log('Kepanitiaan - Using local path:', foto_path);
        
        // Get student's calculated class from database
        const [studentData] = await db.query('SELECT kelas FROM users WHERE id = ?', [userId]);
        const calculatedClass = studentData[0]?.kelas || '';
        
        // SUPERADMIN: Direct submit to main table
        if (userRole === 'superadmin') {
            console.log('Kepanitiaan - Superadmin direct submission');
            const point = calculateKepanitiaanPoints(jabatan_kepanitiaan);
            
            // Move photo to organized folder if exists
            let finalFotoPath = foto_path;
            if (foto_path) {
                const movedPath = movePhotoToApprovedFolder(foto_path, 'kepanitiaan');
                if (movedPath) {
                    finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
                }
            }
            
            const [result] = await db.query(
                `INSERT INTO kepanitiaan 
                (user_id, nama, nis, kelas, grha, jabatan_kepanitiaan, foto, kategori_kepanitiaan, point, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
                [userId, nama, nis, calculatedClass, grha, jabatan_kepanitiaan, finalFotoPath, kategori_kepanitiaan, point]
            );
            
            await applyIpcChange(
                userId,
                'kepanitiaan',
                point,
                `Kepanitiaan: ${kategori_kepanitiaan} - ${jabatan_kepanitiaan}`
            );
            
            console.log('Kepanitiaan - Directly added by superadmin:', result.insertId);
            
            return res.status(201).json({ 
                message: 'Kepanitiaan berhasil ditambahkan', 
                id: result.insertId 
            });
        }
        
        // SISWA/GURU: Submit for approval (superadmin only)
        const [result] = await db.query(
            `INSERT INTO kepanitiaan_approvals
            (user_id, nama, nis, kelas, grha, pembina, jabatan_kepanitiaan, kategori_kepanitiaan, foto_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, nama, nis, calculatedClass, grha, pembina, jabatan_kepanitiaan, kategori_kepanitiaan, foto_path]
        );

        // Create notification for superadmin only
        const [superadmins] = await db.query('SELECT id FROM users WHERE role = "superadmin"');
        console.log('Kepanitiaan - Superadmins found:', superadmins.length);
        for (const admin of superadmins) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (?, 'approval_needed', 'Persetujuan Kepanitiaan', ?, ?, 'kepanitiaan')`,
                [admin.id, `${nama} (${nis}) mengajukan kepanitiaan: ${kategori_kepanitiaan}`, result.insertId]
            );
            console.log('Kepanitiaan - Notification sent to superadmin:', admin.id);
        }

        res.status(201).json({
            message: 'Kepanitiaan berhasil diajukan untuk persetujuan',
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// ==================== APPROVAL ACTIONS ====================

// REMOVED: Pembina approval route - now only superadmin approval

// SuperAdmin Approve/Reject (single-step approval)
router.put('/superadmin/:type/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status, notes } = req.body;

        console.log(`SuperAdmin ${status} request: type=${type}, id=${id}`);

        if (type === 'pelanggaran' || type === 'perilaku') {
            return handleLegacyApproval(type, id, status, notes, req.user.id, res);
        }

        let table, pointField, pointType;
        switch(type) {
            case 'prestasi':
                table = 'prestasi_approvals';
                pointField = 'juara';
                pointType = 'Prestasi';
                break;
            case 'event':
                table = 'event_approvals';
                pointField = 'tingkat';
                pointType = 'Event';
                break;
            case 'organisasi':
                table = 'organisasi_approvals';
                pointField = 'jabatan_organisasi';
                pointType = 'Organisasi';
                break;
            case 'kepanitiaan':
                table = 'kepanitiaan_approvals';
                pointField = 'jabatan_kepanitiaan';
                pointType = 'Kepanitiaan';
                break;
            default:
                return res.status(400).json({ message: 'Invalid type' });
        }

        // Get submission data
        const [submission] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        if (submission.length === 0) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const data = submission[0];
        console.log('Submission data:', data);

        const approvalStatus = getRowApprovalStatus(data);
        if (approvalStatus !== 'pending') {
            return res.status(400).json({ message: 'Pengajuan ini sudah diproses' });
        }

        if (status === 'approved') {
            // Calculate points
            let pointChange = 0;
            if (type === 'prestasi') {
                pointChange = calculatePrestasiPoints(data.juara, data.kategori);
            } else if (type === 'event') {
                pointChange = calculateEventPoints(data.tingkat);
            } else if (type === 'kepanitiaan') {
                pointChange = calculateKepanitiaanPoints(data[pointField]);
            } else {
                pointChange = calculateOrganisasiPoints(data[pointField]);
            }

            // Move photo to organized folder if exists
            let finalFotoPath = data.foto_path;
            if (data.foto_path) {
                const movedPath = movePhotoToApprovedFolder(data.foto_path, type);
                if (movedPath) {
                    finalFotoPath = path.join('uploads', movedPath).replace(/\\/g, '/');
                }
            }

            // Insert to actual table
            let insertQuery, insertParams;
            if (type === 'prestasi') {
                insertQuery = `INSERT INTO prestasi (user_id, nama, nis, jenis, nama_lomba, kelas, pembina, grha, juara, kategori, foto, point, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`;
                insertParams = [data.user_id, data.nama || 'Unknown', data.nis || '', normalizePrestasiJenis(data.jenis || 'akademik'), data.nama_lomba || '', data.kelas || '', data.pembina || '', data.grha || '', data.juara || '', data.kategori || '', finalFotoPath || null, pointChange];
            } else if (type === 'event') {
                insertQuery = `INSERT INTO event (user_id, nama, nis, kelas, grha, nama_event, tingkat, foto, point, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`;
                insertParams = [data.user_id, data.nama || 'Unknown', data.nis || '', data.kelas || '', data.grha || '', data.nama_event || '', data.tingkat || '', finalFotoPath || null, pointChange];
            } else if (type === 'kepanitiaan') {
                insertQuery = `INSERT INTO kepanitiaan (user_id, nama, nis, kelas, grha, jabatan_kepanitiaan, kategori_kepanitiaan, foto, point, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`;
                insertParams = [data.user_id, data.nama || 'Unknown', data.nis || '', data.kelas || '', data.grha || '', data.jabatan_kepanitiaan || '', data.kategori_kepanitiaan || '', finalFotoPath || null, pointChange];
            } else {
                insertQuery = `INSERT INTO organisasi (user_id, nama, nis, kelas, grha, jabatan_organisasi, kategori_organisasi, foto, point, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`;
                insertParams = [data.user_id, data.nama || 'Unknown', data.nis || '', data.kelas || '', data.grha || '', data.jabatan_organisasi || '', data.kategori_organisasi || '', finalFotoPath || null, pointChange];
            }

            await db.query(insertQuery, insertParams);

            await applyIpcChange(
                data.user_id,
                type,
                pointChange,
                `Poin dari ${pointType}: ${data[pointField]}`
            );

            await approveSubmission(table, id, notes || 'Disetujui oleh SuperAdmin');

            // Notify student
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, 'approved', 'Pengajuan Disetujui', ?, ?, ?)`,
                [data.user_id, `Pengajuan ${type} Anda telah disetujui`, id, type]
            );

            res.json({ message: `${type} berhasil disetujui` });
        } else {
            await rejectSubmission(table, id, notes || 'Ditolak oleh SuperAdmin');

            // Notify student of rejection
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, 'rejected', 'Pengajuan Ditolak', ?, ?, ?)`,
                [data.user_id, `Pengajuan ${type} Anda ditolak: ${notes || 'Tanpa alasan'}`, id, type]
            );

            res.json({ message: `${type} berhasil ditolak` });
        }
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

async function handleLegacyApproval(type, id, status, notes, approverId, res) {
    const table = type;
    try {
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const data = rows[0];

        if (data.status !== 'pending') {
            return res.status(400).json({ message: 'Pengajuan ini sudah diproses' });
        }

        if (status === 'approved') {
            await db.query(`UPDATE ${table} SET status = 'approved' WHERE id = ? AND status = 'pending'`, [id]);

            if (type === 'pelanggaran') {
                await applyIpcChange(
                    data.user_id,
                    'pelanggaran',
                    -data.point_dikurangi,
                    `Pelanggaran: ${data.jenis_pelanggaran}`
                );
            } else {
                await applyPerilakuIpcChange(
                    data.user_id,
                    data.point,
                    `Perilaku: ${data.karakter_siswa}`,
                    id
                );
            }

            await db.query(
                `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
                [approverId, `Approve ${type}`, `Approved ${type} ID ${id}`]
            );

            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, 'approved', 'Pengajuan Disetujui', ?, ?, ?)`,
                [data.user_id, `Pengajuan ${type} Anda telah disetujui`, id, type]
            );

            return res.json({ message: `${type} berhasil disetujui` });
        }

        await db.query(
            `UPDATE ${table} SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
            [notes || 'Ditolak oleh SuperAdmin', id]
        );

        await db.query(
            `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
            [approverId, `Reject ${type}`, `Rejected ${type} ID ${id}`]
        );

        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, 'rejected', 'Pengajuan Ditolak', ?, ?, ?)`,
            [data.user_id, `Pengajuan ${type} Anda ditolak: ${notes || 'Tanpa alasan'}`, id, type]
        );

        return res.json({ message: `${type} berhasil ditolak` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

// ==================== GET APPROVALS ====================

// Get all approvals for SuperAdmin
router.get('/all', auth, superAdminOnly, async (req, res) => {
    try {
        const [prestasi, event, organisasi, kepanitiaan] = await Promise.all([
            fetchPendingApprovals('prestasi_approvals', 'p'),
            fetchPendingApprovals('event_approvals', 'e'),
            fetchPendingApprovals('organisasi_approvals', 'o'),
            fetchPendingApprovals('kepanitiaan_approvals', 'k')
        ]);

        const [pelanggaran] = await db.query(`
            SELECT p.*, u.nama as user_name
            FROM pelanggaran p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'pending'
        `);

        const [perilaku] = await db.query(`
            SELECT p.*, u.nama as user_name
            FROM perilaku p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'pending'
        `);

        res.json({
            prestasi: prestasi.map(p => ({ ...p, type: 'prestasi', status: getRowApprovalStatus(p) })),
            event: event.map(e => ({ ...e, type: 'event', status: getRowApprovalStatus(e) })),
            organisasi: organisasi.map(o => ({ ...o, type: 'organisasi', status: getRowApprovalStatus(o) })),
            kepanitiaan: kepanitiaan.map(k => ({ ...k, type: 'kepanitiaan', status: getRowApprovalStatus(k) })),
            pelanggaran: pelanggaran.map(p => ({ ...p, type: 'pelanggaran' })),
            perilaku: perilaku.map(p => ({ ...p, type: 'perilaku' }))
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Get approvals for Pembina (Guru) - REMOVED: No longer needed

// Get user's submissions
router.get('/user-submissions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [prestasi] = await db.query(`
            SELECT *, 'prestasi' as type FROM prestasi_approvals WHERE user_id = ? ORDER BY created_at DESC
        `, [userId]);
        
        const [event] = await db.query(`
            SELECT *, 'event' as type FROM event_approvals WHERE user_id = ? ORDER BY created_at DESC
        `, [userId]);
        
        const [organisasi] = await db.query(`
            SELECT *, 'organisasi' as type FROM organisasi_approvals WHERE user_id = ? ORDER BY created_at DESC
        `, [userId]);
        
        const [kepanitiaan] = await db.query(`
            SELECT *, 'kepanitiaan' as type FROM kepanitiaan_approvals WHERE user_id = ? ORDER BY created_at DESC
        `, [userId]);
        
        res.json({
            prestasi,
            event,
            organisasi,
            kepanitiaan
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// ==================== NOTIFICATIONS ====================

// Get unread notifications count
router.get('/notifications/count', auth, async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Get all notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const [notifications] = await db.query(
            `SELECT n.*, 
                CASE 
                    WHEN n.related_type = 'prestasi' THEN (SELECT nama_lomba FROM prestasi_approvals WHERE id = n.related_id)
                    WHEN n.related_type = 'event' THEN (SELECT nama_event FROM event_approvals WHERE id = n.related_id)
                    WHEN n.related_type = 'organisasi' THEN (SELECT kategori_organisasi FROM organisasi_approvals WHERE id = n.related_id)
                    WHEN n.related_type = 'student_creation' THEN (SELECT nama FROM student_creation_approvals WHERE id = n.related_id)
                    WHEN n.related_type = 'biodata' THEN (SELECT u.nama FROM biodata_update_approvals b JOIN users u ON b.user_id = u.id WHERE b.id = n.related_id)
                    WHEN n.related_type = 'pelanggaran' THEN (SELECT keterangan FROM pelanggaran WHERE id = n.related_id)
                    WHEN n.related_type = 'perilaku' THEN (SELECT karakter_siswa FROM perilaku WHERE id = n.related_id)
                END as detail_name
             FROM notifications n 
             WHERE n.user_id = ? 
             ORDER BY n.created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );
        
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Mark single notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

// Mark all notifications as read
router.put('/notifications/read-all', auth, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
});

module.exports = router;
