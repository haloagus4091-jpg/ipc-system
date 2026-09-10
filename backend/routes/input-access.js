const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, superAdminOnly } = require('../middleware/auth');

// ==================== GET ACCESS STATUS ====================

// Get global access status for all input types
router.get('/status/global', auth, async (req, res) => {
    try {
        const [controls] = await db.query(
            'SELECT jenis_input, is_enabled FROM input_access_control WHERE control_type = ?',
            ['global']
        );
        
        const status = {};
        controls.forEach(ctrl => {
            status[ctrl.jenis_input] = ctrl.is_enabled;
        });
        
        res.json(status);
    } catch (error) {
        console.error('Error fetching global access status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user's access status
router.get('/status/my-access', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Get global status
        const [globalControls] = await db.query(
            'SELECT jenis_input, is_enabled FROM input_access_control WHERE control_type = ?',
            ['global']
        );
        
        // Get role-specific status
        const [roleControls] = await db.query(
            'SELECT jenis_input, is_enabled FROM input_access_control WHERE control_type = ? AND role_target = ?',
            ['role', userRole]
        );
        
        // Get individual permission from permissions table
        const [individualPerms] = await db.query(
            'SELECT can_input_prestasi, can_input_organisasi, can_input_kepanitiaan, can_input_event, can_input_pelanggaran, can_input_perilaku FROM permissions WHERE user_id = ?',
            [userId]
        );
        
        const access = {
            prestasi: false,
            organisasi: false,
            kepanitiaan: false,
            event: false,
            pelanggaran: false,
            perilaku: false
        };
        
        const permMap = {
            'prestasi': 'can_input_prestasi',
            'organisasi': 'can_input_organisasi',
            'kepanitiaan': 'can_input_kepanitiaan',
            'event': 'can_input_event',
            'pelanggaran': 'can_input_pelanggaran',
            'perilaku': 'can_input_perilaku'
        };
        
        // Check each input type
        for (const jenis of Object.keys(access)) {
            const globalStatus = globalControls.find(c => c.jenis_input === jenis)?.is_enabled;
            const roleStatus = roleControls.find(c => c.jenis_input === jenis)?.is_enabled;
            const individualStatus = individualPerms.length > 0 ? individualPerms[0][permMap[jenis]] : null;
            
            console.log(`[MyAccess] ${jenis}: individual=${individualStatus}, role=${roleStatus}, global=${globalStatus}`);
            
            // Priority: Individual > Role > Global
            // Note: individualStatus can be: true, false, 0, 1, or null
            // We should only use individual if it's explicitly true or false (not null/undefined)
            if (individualStatus === true || individualStatus === 1) {
                access[jenis] = true;
                console.log(`[MyAccess] ${jenis} -> true (from individual)`);
            } else if (individualStatus === false || individualStatus === 0) {
                access[jenis] = false;
                console.log(`[MyAccess] ${jenis} -> false (from individual)`);
            } else if (roleStatus !== undefined) {
                access[jenis] = roleStatus;
                console.log(`[MyAccess] ${jenis} -> ${roleStatus} (from role)`);
            } else {
                access[jenis] = globalStatus !== false; // default true if not set
                console.log(`[MyAccess] ${jenis} -> ${access[jenis]} (from global)`);
            }
        }
        
        res.json(access);
    } catch (error) {
        console.error('Error fetching user access status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== SUPERADMIN CONTROLS ====================

// Update global access (enable/disable for all)
router.post('/admin/global', auth, superAdminOnly, async (req, res) => {
    try {
        const { jenis_input, is_enabled } = req.body; // jenis_input: 'all' or specific type
        const adminId = req.user.id;
        
        if (!jenis_input || is_enabled === undefined) {
            return res.status(400).json({ message: 'jenis_input dan is_enabled diperlukan' });
        }
        
        const jenisList = jenis_input === 'all' 
            ? ['prestasi', 'organisasi', 'kepanitiaan', 'event', 'pelanggaran', 'perilaku']
            : [jenis_input];
        
        for (const jenis of jenisList) {
            // Update or insert global control
            await db.query(
                `INSERT INTO input_access_control (control_type, role_target, jenis_input, is_enabled, updated_by)
                 VALUES (?, 'all', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE is_enabled = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP`,
                ['global', jenis, is_enabled, adminId, is_enabled, adminId]
            );
            
            // Log the change
            await db.query(
                `INSERT INTO input_access_logs (control_type, target_role, jenis_input, action, performed_by)
                 VALUES (?, 'all', ?, ?, ?)`,
                ['global', jenis, is_enabled ? 'enabled' : 'disabled', adminId]
            );
            
            // If enabling globally, delete all individual permissions so global takes effect
            if (is_enabled) {
                try {
                    const colName = `can_input_${jenis}`;
                    // Delete all permissions records that have this column set (either 0, 1, or false/true)
                    const [result] = await db.query(
                        `DELETE FROM permissions WHERE ${colName} IS NOT NULL`
                    );
                    console.log(`[Global Enable] Deleted permissions for ${result.affectedRows} users with ${colName} set`);
                } catch (clearError) {
                    console.error('[Global Enable] Error clearing permissions:', clearError);
                }
            }
        }
        
        // Send notification to all users
        const statusText = is_enabled ? 'diaktifkan' : 'dimatikan';
        const notificationTitle = is_enabled ? '✅ Input Data Diaktifkan' : '❌ Input Data Dimatikan';
        const notificationMessage = is_enabled 
            ? `SuperAdmin telah mengaktifkan input data ${jenis_input === 'all' ? 'semua jenis' : jenis_input}. Anda sekarang dapat menginput data.`
            : `SuperAdmin telah mematikan input data ${jenis_input === 'all' ? 'semua jenis' : jenis_input}. Anda tidak dapat menginput data untuk sementara.`;
        
        // Get all users (siswa and guru)
        const [users] = await db.query('SELECT id, role FROM users WHERE role IN ("siswa", "guru")');
        
        for (const user of users) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_type) 
                 VALUES (?, 'system', ?, ?, 'input_access')`,
                [user.id, notificationTitle, notificationMessage]
            );
        }
        
        res.json({ 
            message: `Akses input ${jenis_input === 'all' ? 'semua jenis' : jenis_input} berhasil ${statusText} untuk semua user`,
            affected_users: users.length
        });
    } catch (error) {
        console.error('Error updating global access:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update role-based access
router.post('/admin/role', auth, superAdminOnly, async (req, res) => {
    try {
        const { role, jenis_input, is_enabled } = req.body; // role: 'siswa' or 'guru'
        const adminId = req.user.id;
        
        if (!role || !jenis_input || is_enabled === undefined) {
            return res.status(400).json({ message: 'role, jenis_input, dan is_enabled diperlukan' });
        }
        
        const jenisList = jenis_input === 'all' 
            ? ['prestasi', 'organisasi', 'kepanitiaan', 'event', 'pelanggaran', 'perilaku']
            : [jenis_input];
        
        for (const jenis of jenisList) {
            // Update or insert role control
            await db.query(
                `INSERT INTO input_access_control (control_type, role_target, jenis_input, is_enabled, updated_by)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE is_enabled = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP`,
                ['role', role, jenis, is_enabled, adminId, is_enabled, adminId]
            );
            
            // Log the change
            await db.query(
                `INSERT INTO input_access_logs (control_type, target_role, jenis_input, action, performed_by)
                 VALUES (?, ?, ?, ?, ?)`,
                ['role', role, jenis, is_enabled ? 'enabled' : 'disabled', adminId]
            );
            
            // If enabling, delete individual permissions records for users with this role so role-based takes effect
            if (is_enabled) {
                try {
                    // Get all users with this role
                    const [usersWithRole] = await db.query('SELECT id FROM users WHERE role = ?', [role]);
                    if (usersWithRole.length > 0) {
                        const userIds = usersWithRole.map(u => u.id);
                        // Delete permissions records for these users - let them use role-based access
                        const [deleteResult] = await db.query(
                            'DELETE FROM permissions WHERE user_id IN (?)',
                            [userIds]
                        );
                        console.log(`[Role Enable] Deleted permissions for ${deleteResult.affectedRows} users with role ${role}`);
                    }
                } catch (clearError) {
                    console.error('[Role Enable] Error clearing individual permissions:', clearError);
                }
            }
        }
        
        // Send notification to users with this role
        const statusText = is_enabled ? 'diaktifkan' : 'dimatikan';
        const roleLabel = role === 'siswa' ? 'Siswa' : 'Guru';
        const notificationTitle = is_enabled ? '✅ Input Data Diaktifkan' : '❌ Input Data Dimatikan';
        const notificationMessage = is_enabled 
            ? `SuperAdmin telah mengaktifkan input data ${jenis_input === 'all' ? 'semua jenis' : jenis_input} untuk ${roleLabel}. Anda sekarang dapat menginput data.`
            : `SuperAdmin telah mematikan input data ${jenis_input === 'all' ? 'semua jenis' : jenis_input} untuk ${roleLabel}. Anda tidak dapat menginput data untuk sementara.`;
        
        const [users] = await db.query('SELECT id FROM users WHERE role = ?', [role]);
        
        for (const user of users) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_type) 
                 VALUES (?, 'system', ?, ?, 'input_access')`,
                [user.id, notificationTitle, notificationMessage]
            );
        }
        
        res.json({ 
            message: `Akses input ${jenis_input === 'all' ? 'semua jenis' : jenis_input} berhasil ${statusText} untuk ${roleLabel}`,
            affected_users: users.length
        });
    } catch (error) {
        console.error('Error updating role access:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update individual user access
router.post('/admin/individual', auth, superAdminOnly, async (req, res) => {
    try {
        const { user_id, permissions } = req.body; // permissions: { can_input_prestasi: true, ... }
        const adminId = req.user.id;
        
        if (!user_id || !permissions) {
            return res.status(400).json({ message: 'user_id dan permissions diperlukan' });
        }
        
        // Get user info for notification
        const [userInfo] = await db.query('SELECT nama, role FROM users WHERE id = ?', [user_id]);
        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        // Check if permission record exists
        const [existingPerm] = await db.query('SELECT id FROM permissions WHERE user_id = ?', [user_id]);
        
        if (existingPerm.length > 0) {
            // Update existing
            await db.query(
                `UPDATE permissions SET 
                    can_input_prestasi = ?,
                    can_input_organisasi = ?,
                    can_input_kepanitiaan = ?,
                    can_input_event = ?,
                    can_input_pelanggaran = ?,
                    can_input_perilaku = ?
                 WHERE user_id = ?`,
                [
                    permissions.can_input_prestasi,
                    permissions.can_input_organisasi,
                    permissions.can_input_kepanitiaan,
                    permissions.can_input_event,
                    permissions.can_input_pelanggaran,
                    permissions.can_input_perilaku,
                    user_id
                ]
            );
        } else {
            // Insert new
            await db.query(
                `INSERT INTO permissions (user_id, can_input_prestasi, can_input_organisasi, can_input_kepanitiaan, can_input_event, can_input_pelanggaran, can_input_perilaku)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    permissions.can_input_prestasi,
                    permissions.can_input_organisasi,
                    permissions.can_input_kepanitiaan,
                    permissions.can_input_event,
                    permissions.can_input_pelanggaran,
                    permissions.can_input_perilaku
                ]
            );
        }
        
        // Log changes
        const enabledTypes = [];
        const disabledTypes = [];
        const permMap = {
            'can_input_prestasi': 'prestasi',
            'can_input_organisasi': 'organisasi',
            'can_input_kepanitiaan': 'kepanitiaan',
            'can_input_event': 'event',
            'can_input_pelanggaran': 'pelanggaran',
            'can_input_perilaku': 'perilaku'
        };
        
        for (const [key, value] of Object.entries(permissions)) {
            if (permMap[key]) {
                await db.query(
                    `INSERT INTO input_access_logs (control_type, target_user_id, jenis_input, action, performed_by)
                     VALUES (?, ?, ?, ?, ?)`,
                    ['individual', user_id, permMap[key], value ? 'enabled' : 'disabled', adminId]
                );
                
                if (value) enabledTypes.push(permMap[key]);
                else disabledTypes.push(permMap[key]);
            }
        }
        
        // Send notification to the user
        let notificationTitle, notificationMessage;
        
        if (enabledTypes.length > 0 && disabledTypes.length === 0) {
            notificationTitle = '✅ Akses Input Data Diberikan';
            notificationMessage = `SuperAdmin telah memberikan Anda akses untuk input data: ${enabledTypes.join(', ')}. Anda sekarang dapat menginput data.`;
        } else if (disabledTypes.length > 0 && enabledTypes.length === 0) {
            notificationTitle = '❌ Akses Input Data Dicabut';
            notificationMessage = `SuperAdmin telah mencabut akses Anda untuk input data: ${disabledTypes.join(', ')}. Anda tidak dapat menginput data tersebut untuk sementara.`;
        } else {
            notificationTitle = '📝 Perubahan Akses Input Data';
            notificationMessage = `SuperAdmin telah mengubah akses input data Anda. Aktif: ${enabledTypes.join(', ') || '-'}. Nonaktif: ${disabledTypes.join(', ') || '-'}.`;
        }
        
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_type) 
             VALUES (?, 'system', ?, ?, 'input_access')`,
            [user_id, notificationTitle, notificationMessage]
        );
        
        res.json({ 
            message: `Izin untuk user ${userInfo[0].nama} berhasil diupdate`,
            enabled: enabledTypes,
            disabled: disabledTypes
        });
    } catch (error) {
        console.error('Error updating individual access:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users with their access status (for superadmin view)
router.get('/admin/users', auth, superAdminOnly, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT u.id, u.nama, u.nis, u.nip, u.role, u.kelas,
                    p.can_input_prestasi, p.can_input_organisasi, p.can_input_kepanitiaan, p.can_input_event, 
                    p.can_input_pelanggaran, p.can_input_perilaku
             FROM users u
             LEFT JOIN permissions p ON u.id = p.user_id
             WHERE u.role IN ('siswa', 'guru')
             ORDER BY u.role, u.nama`
        );
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users with access:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get access logs
router.get('/admin/logs', auth, superAdminOnly, async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT l.*, u.nama as performed_by_name, 
                    target.nama as target_user_name
             FROM input_access_logs l
             JOIN users u ON l.performed_by = u.id
             LEFT JOIN users target ON l.target_user_id = target.id
             ORDER BY l.performed_at DESC
             LIMIT 100`
        );
        
        res.json(logs);
    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug: Check detailed access status for a specific user
router.get('/admin/debug-access/:userId', auth, superAdminOnly, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Get user info
        const [userInfo] = await db.query('SELECT id, nama, role FROM users WHERE id = ?', [userId]);
        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userInfo[0];
        
        // Get global status
        const [globalControls] = await db.query(
            'SELECT jenis_input, is_enabled FROM input_access_control WHERE control_type = ?',
            ['global']
        );
        
        // Get role-specific status
        const [roleControls] = await db.query(
            'SELECT jenis_input, is_enabled FROM input_access_control WHERE control_type = ? AND role_target = ?',
            ['role', user.role]
        );
        
        // Get individual permission
        const [individualPerms] = await db.query(
            'SELECT can_input_prestasi, can_input_organisasi, can_input_kepanitiaan, can_input_event, can_input_pelanggaran, can_input_perilaku FROM permissions WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            user: user,
            global: globalControls.reduce((acc, c) => ({ ...acc, [c.jenis_input]: c.is_enabled }), {}),
            role: roleControls.reduce((acc, c) => ({ ...acc, [c.jenis_input]: c.is_enabled }), {}),
            individual: individualPerms.length > 0 ? individualPerms[0] : null,
            finalAccess: {
                prestasi: individualPerms[0]?.can_input_prestasi ?? roleControls.find(c => c.jenis_input === 'prestasi')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'prestasi')?.is_enabled ?? true,
                organisasi: individualPerms[0]?.can_input_organisasi ?? roleControls.find(c => c.jenis_input === 'organisasi')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'organisasi')?.is_enabled ?? true,
                kepanitiaan: individualPerms[0]?.can_input_kepanitiaan ?? roleControls.find(c => c.jenis_input === 'kepanitiaan')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'kepanitiaan')?.is_enabled ?? true,
                event: individualPerms[0]?.can_input_event ?? roleControls.find(c => c.jenis_input === 'event')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'event')?.is_enabled ?? true,
                pelanggaran: individualPerms[0]?.can_input_pelanggaran ?? roleControls.find(c => c.jenis_input === 'pelanggaran')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'pelanggaran')?.is_enabled ?? true,
                perilaku: individualPerms[0]?.can_input_perilaku ?? roleControls.find(c => c.jenis_input === 'perilaku')?.is_enabled ?? globalControls.find(c => c.jenis_input === 'perilaku')?.is_enabled ?? true
            }
        });
    } catch (error) {
        console.error('Error in debug access:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear individual permissions for specific user
router.post('/admin/clear-user-permissions/:userId', auth, superAdminOnly, async (req, res) => {
    try {
        const userId = req.params.userId;
        const adminId = req.user.id;
        
        // Get user info
        const [userInfo] = await db.query('SELECT nama, role FROM users WHERE id = ?', [userId]);
        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        // Delete permissions for this user
        const [result] = await db.query('DELETE FROM permissions WHERE user_id = ?', [userId]);
        
        // Send notification to user
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_type) 
             VALUES (?, 'system', ?, ?, 'input_access')`,
            [userId, '✅ Akses Diperbarui', 'SuperAdmin telah menghapus individual permission Anda. Akses Anda sekarang mengikuti pengaturan global/role.']
        );
        
        res.json({ 
            message: `Individual permissions untuk ${userInfo[0].nama} berhasil dihapus. User akan menggunakan pengaturan global/role.`,
            deleted_rows: result.affectedRows
        });
    } catch (error) {
        console.error('Error clearing user permissions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset all individual permissions - clear everything and start fresh
router.post('/admin/reset-all', auth, superAdminOnly, async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // Get count before deletion
        const [countBefore] = await db.query('SELECT COUNT(*) as count FROM permissions');
        
        // Delete all records from permissions table
        await db.query('DELETE FROM permissions');
        
        // Reset input_access_control to only have global settings (remove all role-based)
        await db.query("DELETE FROM input_access_control WHERE control_type = 'role'");
        
        // Ensure all global settings are enabled
        const jenisList = ['prestasi', 'organisasi', 'kepanitiaan', 'event', 'pelanggaran', 'perilaku'];
        for (const jenis of jenisList) {
            await db.query(
                `INSERT INTO input_access_control (control_type, role_target, jenis_input, is_enabled, updated_by)
                 VALUES ('global', 'all', ?, TRUE, ?)
                 ON DUPLICATE KEY UPDATE is_enabled = TRUE, updated_by = ?, updated_at = CURRENT_TIMESTAMP`,
                [jenis, adminId, adminId]
            );
        }
        
        // Log the reset
        await db.query(
            `INSERT INTO input_access_logs (control_type, target_role, jenis_input, action, performed_by)
             VALUES ('global', 'all', 'all', 'enabled', ?)`,
            [adminId]
        );
        
        // Send notification to all users
        const [users] = await db.query('SELECT id FROM users WHERE role IN ("siswa", "guru")');
        for (const user of users) {
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, related_type) 
                 VALUES (?, 'system', ?, ?, 'input_access')`,
                [user.id, '✅ Sistem Di-Reset', 'SuperAdmin telah mereset sistem izin. Semua user sekarang dapat menginput data sesuai pengaturan global.']
            );
        }
        
        res.json({ 
            message: `Sistem berhasil di-reset! ${countBefore[0].count} individual permissions dihapus. Semua input data sekarang aktif untuk semua user.`,
            deleted_permissions: countBefore[0].count,
            affected_users: users.length
        });
    } catch (error) {
        console.error('Error resetting permissions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
