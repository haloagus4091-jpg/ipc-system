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
                field1,
                field2,
                field3,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            ORDER BY category, field1, field2, field3
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
                field1,
                field2,
                field3,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            WHERE category = ?
            ORDER BY field1, field2, field3
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
            SELECT category, field1, field2, field3, point_value
            FROM ipc_config
            WHERE is_active = TRUE
            ORDER BY category, field1, field2, field3
        `);
        
        // Group by category for easier access
        const grouped = {};
        configs.forEach(config => {
            if (!grouped[config.category]) {
                grouped[config.category] = [];
            }
            grouped[config.category].push({
                field1: config.field1,
                field2: config.field2,
                field3: config.field3,
                point_value: config.point_value
            });
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
                field1,
                field2,
                field3,
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
        const { category, field1, field2, field3, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        
        if (!category || !field1 || point_value === undefined) {
            return res.status(400).json({ message: 'Category, field1, and point_value are required' });
        }
        
        const [result] = await db.query(`
            INSERT INTO ipc_config (category, field1, field2, field3, point_value, description, is_active, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [category, field1, field2 || null, field3 || null, point_value, description || null, is_active !== undefined ? is_active : true, userId]);
        
        const [newConfig] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [result.insertId]);
        res.status(201).json(newConfig[0]);
    } catch (error) {
        console.error('Error creating IPC configuration:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Configuration with this category, field1, field2, and field3 already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update configuration
router.put('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, field1, field2, field3, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        
        // Check if configuration exists
        const [existing] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        const [result] = await db.query(`
            UPDATE ipc_config
            SET category = ?, field1 = ?, field2 = ?, field3 = ?, point_value = ?, description = ?, is_active = ?, updated_by = ?
            WHERE id = ?
        `, [
            category || existing[0].category,
            field1 || existing[0].field1,
            field2 !== undefined ? field2 : existing[0].field2,
            field3 !== undefined ? field3 : existing[0].field3,
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
            return res.status(400).json({ message: 'Configuration with this category, field1, field2, and field3 already exists' });
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
        
        // Insert default configurations from schema file
        // This should match the data in ipc_config_schema.sql
        const defaults = [
            // PRESTASI - Akademik Kecamatan
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'juara 1', point_value: 50, description: 'Juara 1 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'juara 2', point_value: 40, description: 'Juara 2 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'juara 3', point_value: 30, description: 'Juara 3 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'harapan 1', point_value: 25, description: 'Harapan 1 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'harapan 2', point_value: 20, description: 'Harapan 2 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'harapan 3', point_value: 15, description: 'Harapan 3 akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'finalis', point_value: 10, description: 'Finalis akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'akademik', field2: 'kecamatan', field3: 'peserta', point_value: 5, description: 'Peserta akademik tingkat kecamatan' },
            // PRESTASI - Akademik Kabupaten
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'juara 1', point_value: 60, description: 'Juara 1 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'juara 2', point_value: 50, description: 'Juara 2 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'juara 3', point_value: 40, description: 'Juara 3 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'harapan 1', point_value: 35, description: 'Harapan 1 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'harapan 2', point_value: 30, description: 'Harapan 2 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'harapan 3', point_value: 25, description: 'Harapan 3 akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'finalis', point_value: 15, description: 'Finalis akademik tingkat kabupaten' },
            { category: 'prestasi', field1: 'akademik', field2: 'kabupaten', field3: 'peserta', point_value: 8, description: 'Peserta akademik tingkat kabupaten' },
            // PRESTASI - Non-Akademik Kecamatan
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'juara 1', point_value: 40, description: 'Juara 1 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'juara 2', point_value: 30, description: 'Juara 2 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'juara 3', point_value: 25, description: 'Juara 3 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'harapan 1', point_value: 20, description: 'Harapan 1 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'harapan 2', point_value: 15, description: 'Harapan 2 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'harapan 3', point_value: 10, description: 'Harapan 3 non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'finalis', point_value: 8, description: 'Finalis non-akademik tingkat kecamatan' },
            { category: 'prestasi', field1: 'nonakademik', field2: 'kecamatan', field3: 'peserta', point_value: 4, description: 'Peserta non-akademik tingkat kecamatan' },
            
            // PERILAKU
            { category: 'perilaku', field1: 'tanggung_jawab', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter tanggung jawab sangat baik' },
            { category: 'perilaku', field1: 'tanggung_jawab', field2: 'baik', field3: null, point_value: 4, description: 'Karakter tanggung jawab baik' },
            { category: 'perilaku', field1: 'tanggung_jawab', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter tanggung jawab cukup baik' },
            { category: 'perilaku', field1: 'tanggung_jawab', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter tanggung jawab kurang baik' },
            { category: 'perilaku', field1: 'disiplin', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter disiplin sangat baik' },
            { category: 'perilaku', field1: 'disiplin', field2: 'baik', field3: null, point_value: 4, description: 'Karakter disiplin baik' },
            { category: 'perilaku', field1: 'disiplin', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter disiplin cukup baik' },
            { category: 'perilaku', field1: 'disiplin', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter disiplin kurang baik' },
            { category: 'perilaku', field1: 'kepedulian', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter kepedulian sangat baik' },
            { category: 'perilaku', field1: 'kepedulian', field2: 'baik', field3: null, point_value: 4, description: 'Karakter kepedulian baik' },
            { category: 'perilaku', field1: 'kepedulian', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter kepedulian cukup baik' },
            { category: 'perilaku', field1: 'kepedulian', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter kepedulian kurang baik' },
            { category: 'perilaku', field1: 'kemandirian', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter kemandirian sangat baik' },
            { category: 'perilaku', field1: 'kemandirian', field2: 'baik', field3: null, point_value: 4, description: 'Karakter kemandirian baik' },
            { category: 'perilaku', field1: 'kemandirian', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter kemandirian cukup baik' },
            { category: 'perilaku', field1: 'kemandirian', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter kemandirian kurang baik' },
            { category: 'perilaku', field1: 'spiritual', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter spiritual sangat baik' },
            { category: 'perilaku', field1: 'spiritual', field2: 'baik', field3: null, point_value: 4, description: 'Karakter spiritual baik' },
            { category: 'perilaku', field1: 'spiritual', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter spiritual cukup baik' },
            { category: 'perilaku', field1: 'spiritual', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter spiritual kurang baik' },
            { category: 'perilaku', field1: 'kejujuran', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter kejujuran sangat baik' },
            { category: 'perilaku', field1: 'kejujuran', field2: 'baik', field3: null, point_value: 4, description: 'Karakter kejujuran baik' },
            { category: 'perilaku', field1: 'kejujuran', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter kejujuran cukup baik' },
            { category: 'perilaku', field1: 'kejujuran', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter kejujuran kurang baik' },
            { category: 'perilaku', field1: 'kepercayaan_diri', field2: 'sangat baik', field3: null, point_value: 5, description: 'Karakter kepercayaan diri sangat baik' },
            { category: 'perilaku', field1: 'kepercayaan_diri', field2: 'baik', field3: null, point_value: 4, description: 'Karakter kepercayaan diri baik' },
            { category: 'perilaku', field1: 'kepercayaan_diri', field2: 'cukup baik', field3: null, point_value: 3, description: 'Karakter kepercayaan diri cukup baik' },
            { category: 'perilaku', field1: 'kepercayaan_diri', field2: 'kurang baik', field3: null, point_value: 1, description: 'Karakter kepercayaan diri kurang baik' },
            
            // PELANGGARAN
            { category: 'pelanggaran', field1: 'ringan', field2: null, field3: null, point_value: -1, description: 'Point untuk pelanggaran ringan' },
            { category: 'pelanggaran', field1: 'sedang', field2: null, field3: null, point_value: -5, description: 'Point untuk pelanggaran sedang' },
            { category: 'pelanggaran', field1: 'berat', field2: null, field3: null, point_value: -25, description: 'Point untuk pelanggaran berat' },
            
            // KEPANITIAAN
            { category: 'kepanitiaan', field1: 'ketua', field2: null, field3: null, point_value: 10, description: 'Ketua kepanitiaan' },
            { category: 'kepanitiaan', field1: 'wakil ketua', field2: null, field3: null, point_value: 8, description: 'Wakil ketua kepanitiaan' },
            { category: 'kepanitiaan', field1: 'sekretaris', field2: null, field3: null, point_value: 7, description: 'Sekretaris kepanitiaan' },
            { category: 'kepanitiaan', field1: 'bendahara', field2: null, field3: null, point_value: 7, description: 'Bendahara kepanitiaan' },
            { category: 'kepanitiaan', field1: 'koordinator', field2: null, field3: null, point_value: 5, description: 'Koordinator kepanitiaan' },
            { category: 'kepanitiaan', field1: 'anggota', field2: null, field3: null, point_value: 3, description: 'Anggota kepanitiaan' },
            
            // ORGANISASI
            { category: 'organisasi', field1: 'OSIS', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua OSIS' },
            { category: 'organisasi', field1: 'OSIS', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua OSIS' },
            { category: 'organisasi', field1: 'OSIS', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris OSIS' },
            { category: 'organisasi', field1: 'OSIS', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara OSIS' },
            { category: 'organisasi', field1: 'OSIS', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator OSIS' },
            { category: 'organisasi', field1: 'OSIS', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota OSIS' },
            { category: 'organisasi', field1: 'KY', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua KY' },
            { category: 'organisasi', field1: 'KY', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua KY' },
            { category: 'organisasi', field1: 'KY', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris KY' },
            { category: 'organisasi', field1: 'KY', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara KY' },
            { category: 'organisasi', field1: 'KY', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator KY' },
            { category: 'organisasi', field1: 'KY', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota KY' },
            { category: 'organisasi', field1: 'MPK', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua MPK' },
            { category: 'organisasi', field1: 'MPK', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua MPK' },
            { category: 'organisasi', field1: 'MPK', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris MPK' },
            { category: 'organisasi', field1: 'MPK', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara MPK' },
            { category: 'organisasi', field1: 'MPK', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator MPK' },
            { category: 'organisasi', field1: 'MPK', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota MPK' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua PRAMUKA' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua PRAMUKA' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris PRAMUKA' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara PRAMUKA' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator PRAMUKA' },
            { category: 'organisasi', field1: 'PRAMUKA', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota PRAMUKA' },
            { category: 'organisasi', field1: 'PKS', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua PKS' },
            { category: 'organisasi', field1: 'PKS', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua PKS' },
            { category: 'organisasi', field1: 'PKS', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris PKS' },
            { category: 'organisasi', field1: 'PKS', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara PKS' },
            { category: 'organisasi', field1: 'PKS', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator PKS' },
            { category: 'organisasi', field1: 'PKS', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota PKS' },
            { category: 'organisasi', field1: 'PMR', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua PMR' },
            { category: 'organisasi', field1: 'PMR', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua PMR' },
            { category: 'organisasi', field1: 'PMR', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris PMR' },
            { category: 'organisasi', field1: 'PMR', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara PMR' },
            { category: 'organisasi', field1: 'PMR', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator PMR' },
            { category: 'organisasi', field1: 'PMR', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota PMR' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'ketua', field3: null, point_value: 10, description: 'Ketua PASKIBRAKA' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'wakil ketua', field3: null, point_value: 8, description: 'Wakil ketua PASKIBRAKA' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'sekretaris', field3: null, point_value: 7, description: 'Sekretaris PASKIBRAKA' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'bendahara', field3: null, point_value: 7, description: 'Bendahara PASKIBRAKA' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'koordinator', field3: null, point_value: 5, description: 'Koordinator PASKIBRAKA' },
            { category: 'organisasi', field1: 'PASKIBRAKA', field2: 'anggota', field3: null, point_value: 3, description: 'Anggota PASKIBRAKA' },
            
            // EVENT
            { category: 'event', field1: 'sekolah', field2: null, field3: null, point_value: 5, description: 'Event tingkat sekolah' },
            { category: 'event', field1: 'kecamatan', field2: null, field3: null, point_value: 10, description: 'Event tingkat kecamatan' },
            { category: 'event', field1: 'kabupaten', field2: null, field3: null, point_value: 15, description: 'Event tingkat kabupaten' },
            { category: 'event', field1: 'provinsi', field2: null, field3: null, point_value: 20, description: 'Event tingkat provinsi' },
            { category: 'event', field1: 'nasional', field2: null, field3: null, point_value: 25, description: 'Event tingkat nasional' },
            { category: 'event', field1: 'internasional', field2: null, field3: null, point_value: 30, description: 'Event tingkat internasional' }
        ];
        
        for (const config of defaults) {
            await db.query(`
                INSERT INTO ipc_config (category, field1, field2, field3, point_value, description, is_active, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
            `, [config.category, config.field1, config.field2, config.field3, config.point_value, config.description, userId]);
        }
        
        res.json({ message: 'Configurations reset to defaults successfully' });
    } catch (error) {
        console.error('Error resetting IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;