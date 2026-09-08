const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');

// Get all IPC configurations
router.get('/all', auth, superAdminOnly, async (req, res) => {
    try {
        const [configs] = await db.query(`
            SELECT 
                id,
                category,
                indicator,
                sub_indicator,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            ORDER BY category, indicator, sub_indicator
        `);
        res.json(configs);
    } catch (error) {
        console.error('Error fetching IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get configurations by category
router.get('/category/:category', auth, superAdminOnly, async (req, res) => {
    try {
        const { category } = req.params;
        const [configs] = await db.query(`
            SELECT 
                id,
                category,
                indicator,
                sub_indicator,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            WHERE category = ?
            ORDER BY indicator, sub_indicator
        `, [category]);
        res.json(configs);
    } catch (error) {
        console.error('Error fetching IPC configurations by category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active configurations for calculation (public - can be used by all authenticated users)
router.get('/active', auth, async (req, res) => {
    try {
        const [configs] = await db.query(`
            SELECT category, indicator, sub_indicator, point_value
            FROM ipc_config
            WHERE is_active = TRUE
            ORDER BY category, indicator, sub_indicator
        `);
        
        // Group by category for easier access
        const grouped = {};
        configs.forEach(config => {
            if (!grouped[config.category]) {
                grouped[config.category] = {};
            }
            if (!grouped[config.category][config.indicator]) {
                grouped[config.category][config.indicator] = {};
            }
            grouped[config.category][config.indicator][config.sub_indicator || 'default'] = config.point_value;
        });
        
        res.json(grouped);
    } catch (error) {
        console.error('Error fetching active IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single configuration
router.get('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const [configs] = await db.query(`
            SELECT 
                id,
                category,
                indicator,
                sub_indicator,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            WHERE id = ?
        `, [id]);
        
        if (configs.length === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        res.json(configs[0]);
    } catch (error) {
        console.error('Error fetching IPC configuration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new configuration
router.post('/', auth, superAdminOnly, async (req, res) => {
    try {
        const { category, indicator, sub_indicator, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        
        if (!category || !indicator || point_value === undefined) {
            return res.status(400).json({ message: 'Category, indicator, and point_value are required' });
        }
        
        const [result] = await db.query(`
            INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description, is_active, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [category, indicator, sub_indicator || null, point_value, description || null, is_active !== undefined ? is_active : true, userId]);
        
        const [newConfig] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [result.insertId]);
        res.status(201).json(newConfig[0]);
    } catch (error) {
        console.error('Error creating IPC configuration:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Configuration with this category, indicator, and sub_indicator already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update configuration
router.put('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, indicator, sub_indicator, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        
        // Check if configuration exists
        const [existing] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        const [result] = await db.query(`
            UPDATE ipc_config
            SET category = ?, indicator = ?, sub_indicator = ?, point_value = ?, description = ?, is_active = ?, updated_by = ?
            WHERE id = ?
        `, [
            category || existing[0].category,
            indicator || existing[0].indicator,
            sub_indicator !== undefined ? sub_indicator : existing[0].sub_indicator,
            point_value !== undefined ? point_value : existing[0].point_value,
            description !== undefined ? description : existing[0].description,
            is_active !== undefined ? is_active : existing[0].is_active,
            userId,
            id
        ]);
        
        const [updatedConfig] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [id]);
        res.json(updatedConfig[0]);
    } catch (error) {
        console.error('Error updating IPC configuration:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Configuration with this category, indicator, and sub_indicator already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete configuration
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query('DELETE FROM ipc_config WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting IPC configuration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset to default configurations
router.post('/reset-defaults', auth, superAdminOnly, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Delete all existing configurations
        await db.query('DELETE FROM ipc_config');
        
        // Insert default configurations
        const defaults = [
            // PRESTASI
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara 1', point_value: 8, description: 'Juara 1 - prestasi tertinggi' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara 2', point_value: 6, description: 'Juara 2 - prestasi tinggi' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara 3', point_value: 5, description: 'Juara 3 - prestasi baik' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara harapan 1', point_value: 4, description: 'Juara Harapan 1' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara harapan 2', point_value: 3, description: 'Juara Harapan 2' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'juara harapan 3', point_value: 2, description: 'Juara Harapan 3' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'finalis', point_value: 2, description: 'Finalis' },
            { category: 'prestasi', indicator: 'juara', sub_indicator: 'peserta', point_value: 1, description: 'Peserta' },
            { category: 'prestasi', indicator: 'kategori', sub_indicator: 'kecamatan', point_value: 1, description: 'Multiplier untuk tingkat kecamatan' },
            { category: 'prestasi', indicator: 'kategori', sub_indicator: 'kabupaten', point_value: 2, description: 'Multiplier untuk tingkat kabupaten' },
            { category: 'prestasi', indicator: 'kategori', sub_indicator: 'provinsi', point_value: 3, description: 'Multiplier untuk tingkat provinsi' },
            { category: 'prestasi', indicator: 'kategori', sub_indicator: 'nasional', point_value: 4, description: 'Multiplier untuk tingkat nasional' },
            { category: 'prestasi', indicator: 'kategori', sub_indicator: 'internasional', point_value: 5, description: 'Multiplier untuk tingkat internasional' },
            
            // ORGANISASI
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'ketua', point_value: 5, description: 'Ketua Organisasi' },
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'wakil ketua', point_value: 4, description: 'Wakil Ketua Organisasi' },
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'sekretaris', point_value: 4, description: 'Sekretaris Organisasi' },
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'bendahara', point_value: 3, description: 'Bendahara Organisasi' },
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'koordinator', point_value: 2, description: 'Koordinator Organisasi' },
            { category: 'organisasi', indicator: 'jabatan', sub_indicator: 'anggota', point_value: 1, description: 'Anggota Organisasi' },
            
            // KEPANITIAAN
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'ketua', point_value: 5, description: 'Ketua Kepanitiaan' },
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'wakil ketua', point_value: 4, description: 'Wakil Ketua Kepanitiaan' },
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'sekretaris', point_value: 4, description: 'Sekretaris Kepanitiaan' },
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'bendahara', point_value: 3, description: 'Bendahara Kepanitiaan' },
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'koordinator', point_value: 2, description: 'Koordinator Kepanitiaan' },
            { category: 'kepanitiaan', indicator: 'jabatan', sub_indicator: 'anggota', point_value: 1, description: 'Anggota Kepanitiaan' },
            
            // EVENT
            { category: 'event', indicator: 'tingkat', sub_indicator: 'sekolah', point_value: 2, description: 'Event tingkat sekolah' },
            { category: 'event', indicator: 'tingkat', sub_indicator: 'kecamatan', point_value: 4, description: 'Event tingkat kecamatan' },
            { category: 'event', indicator: 'tingkat', sub_indicator: 'kabupaten', point_value: 6, description: 'Event tingkat kabupaten' },
            { category: 'event', indicator: 'tingkat', sub_indicator: 'provinsi', point_value: 8, description: 'Event tingkat provinsi' },
            { category: 'event', indicator: 'tingkat', sub_indicator: 'nasional', point_value: 10, description: 'Event tingkat nasional' },
            { category: 'event', indicator: 'tingkat', sub_indicator: 'internasional', point_value: 12, description: 'Event tingkat internasional' },
            
            // PELANGGARAN
            { category: 'pelanggaran', indicator: 'jenis', sub_indicator: 'ringan', point_value: -1, description: 'Pelanggaran ringan' },
            { category: 'pelanggaran', indicator: 'jenis', sub_indicator: 'sedang', point_value: -5, description: 'Pelanggaran sedang' },
            { category: 'pelanggaran', indicator: 'jenis', sub_indicator: 'berat', point_value: -25, description: 'Pelanggaran berat' },
            
            // PERILAKU
            { category: 'perilaku', indicator: 'karakter', sub_indicator: 'kurang baik', point_value: 1, description: 'Penilaian karakter kurang baik' },
            { category: 'perilaku', indicator: 'karakter', sub_indicator: 'cukup baik', point_value: 2, description: 'Penilaian karakter cukup baik' },
            { category: 'perilaku', indicator: 'karakter', sub_indicator: 'baik', point_value: 3, description: 'Penilaian karakter baik' },
            { category: 'perilaku', indicator: 'karakter', sub_indicator: 'sangat baik', point_value: 4, description: 'Penilaian karakter sangat baik' },
            
            // PERILAKU Indicators
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'tanggung_jawab', point_value: 1, description: 'Indikator tanggung jawab' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'disiplin', point_value: 1, description: 'Indikator disiplin' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'kepedulian', point_value: 1, description: 'Indikator kepedulian' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'kemandirian', point_value: 1, description: 'Indikator kemandirian' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'spiritual', point_value: 1, description: 'Indikator spiritual' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'kejujuran', point_value: 1, description: 'Indikator kejujuran' },
            { category: 'perilaku', indicator: 'indikator', sub_indicator: 'kepercayaan_diri', point_value: 1, description: 'Indikator kepercayaan diri' }
        ];
        
        for (const config of defaults) {
            await db.query(`
                INSERT INTO ipc_config (category, indicator, sub_indicator, point_value, description, is_active, updated_by)
                VALUES (?, ?, ?, ?, ?, TRUE, ?)
            `, [config.category, config.indicator, config.sub_indicator, config.point_value, config.description, userId]);
        }
        
        res.json({ message: 'Configurations reset to defaults successfully' });
    } catch (error) {
        console.error('Error resetting IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;