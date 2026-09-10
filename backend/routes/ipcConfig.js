const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');

async function getOrganisasiOptions(activeOnly = false) {
    const [rows] = await db.query(
        `SELECT id, name, is_active, created_at, updated_at
         FROM ipc_organisasi
         ${activeOnly ? 'WHERE is_active = TRUE' : ''}
         ORDER BY name`
    );
    return rows;
}

async function getPerilakuCharacters(activeOnly = false) {
    const [rows] = await db.query(
        `SELECT id, name, is_active, created_at, updated_at
         FROM ipc_perilaku_karakter
         ${activeOnly ? 'WHERE is_active = TRUE' : ''}
         ORDER BY name`
    );
    return rows;
}

async function getPerilakuRatings(activeOnly = false) {
    const [rows] = await db.query(
        `SELECT id, name, is_active, created_at, updated_at
         FROM ipc_perilaku_tingkat
         ${activeOnly ? 'WHERE is_active = TRUE' : ''}
         ORDER BY name`
    );
    return rows;
}

async function getPelanggaranConfigs(activeOnly = false) {
    const activeClause = activeOnly ? 'WHERE l.is_active = TRUE' : '';
    const [rows] = await db.query(`
        SELECT CONCAT('level-', l.id) id, 'pelanggaran' category,
               l.name field1, NULL field2, l.point_value,
               l.description, l.is_active, l.created_at, l.updated_at
        FROM ipc_pelanggaran_level l ${activeClause}
        UNION ALL
        SELECT CONCAT('detail-', d.id), 'pelanggaran',
               d.name, l.name, l.point_value,
               NULL, d.is_active, d.created_at, d.updated_at
        FROM ipc_pelanggaran_detail d
        JOIN ipc_pelanggaran_level l ON l.id = d.level_id
        ${activeOnly ? 'WHERE d.is_active = TRUE AND l.is_active = TRUE' : ''}
        ORDER BY category, field1
    `);
    return rows;
}

function parsePelanggaranId(id) {
    const match = /^(level|detail)-(\d+)$/.exec(String(id));
    return match ? { type: match[1], value: Number(match[2]) } : null;
}

// Get all IPC configurations
router.get('/all', auth, superAdminOnly, async (req, res) => {
    try {
        const [configs] = await db.query(`
            SELECT 
                id,
                category,
                field1,
                field2,
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            ORDER BY category, field1, field2
        `);
        res.json(configs.concat(await getPelanggaranConfigs()));
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
                point_value,
                description,
                is_active,
                created_at,
                updated_at,
                updated_by,
                (SELECT nama FROM users WHERE id = ipc_config.updated_by) as updated_by_name
            FROM ipc_config
            WHERE category = ?
            ORDER BY field1, field2
        `, [category]);
        res.json(category === 'pelanggaran' ? await getPelanggaranConfigs() : configs);
    } catch (error) {
        console.error('Error fetching IPC configurations by category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active configurations for calculation (public - can be used by all authenticated users)
router.get('/active', auth, async (req, res) => {
    try {
        const [configs] = await db.query(`
            SELECT category, field1, field2, point_value
            FROM ipc_config
            WHERE is_active = TRUE
            ORDER BY category, field1, field2
        `);
        
        // Group by category for easier access
        const grouped = {};
        const allConfigs = configs.concat(await getPelanggaranConfigs(true));
        allConfigs.forEach(config => {
            if (!grouped[config.category]) {
                grouped[config.category] = [];
            }
            grouped[config.category].push({
                field1: config.field1,
                field2: config.field2,
                point_value: config.point_value
            });

        });
        
        res.json(grouped);
    } catch (error) {
        console.error('Error fetching active IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/organisasi-options', auth, async (req, res) => {
    try {
        res.json((await getOrganisasiOptions()).filter(option => option.is_active));
    } catch (error) {
        console.error('Error fetching organisasi options:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/organisasi-options', auth, superAdminOnly, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Nama organisasi wajib diisi' });
        const [result] = await db.query(
            'INSERT INTO ipc_organisasi (name, is_active) VALUES (?, TRUE)', [name.trim()]
        );
        const options = await getOrganisasiOptions();
        res.status(201).json(options.find(option => option.id === result.insertId));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Organisasi sudah terdaftar' });
        console.error('Error creating organisasi option:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/organisasi-options/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const [option] = await db.query('SELECT name FROM ipc_organisasi WHERE id = ?', [req.params.id]);
        if (!option.length) return res.status(404).json({ message: 'Organisasi tidak ditemukan' });
        const [configs] = await db.query(
            `SELECT COUNT(*) count FROM ipc_config WHERE category = 'organisasi' AND field1 = ?`,
            [option[0].name]
        );
        if (configs[0].count > 0) {
            return res.status(409).json({
                message: `Organisasi ${option[0].name} tidak dapat dihapus karena masih memiliki konfigurasi point IPC`
            });
        }
        await db.query('DELETE FROM ipc_organisasi WHERE id = ?', [req.params.id]);
        res.json({ message: 'Organisasi berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting organisasi option:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/perilaku-characters', auth, async (req, res) => {
    try {
        res.json(await getPerilakuCharacters(true));
    } catch (error) {
        console.error('Error fetching perilaku characters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/perilaku-characters', auth, superAdminOnly, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Nama karakter wajib diisi' });
        const [result] = await db.query(
            'INSERT INTO ipc_perilaku_karakter (name, is_active) VALUES (?, TRUE)', [name.trim()]
        );
        const options = await getPerilakuCharacters();
        res.status(201).json(options.find(option => option.id === result.insertId));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Karakter sudah terdaftar' });
        console.error('Error creating perilaku character:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/perilaku-characters/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const [option] = await db.query('SELECT name FROM ipc_perilaku_karakter WHERE id = ?', [req.params.id]);
        if (!option.length) return res.status(404).json({ message: 'Karakter tidak ditemukan' });
        const [configs] = await db.query(
            `SELECT COUNT(*) count FROM ipc_config WHERE category = 'perilaku' AND field1 = ?`,
            [option[0].name]
        );
        if (configs[0].count > 0) {
            return res.status(409).json({
                message: `Karakter ${option[0].name} tidak dapat dihapus karena masih memiliki konfigurasi point IPC`
            });
        }
        await db.query('DELETE FROM ipc_perilaku_karakter WHERE id = ?', [req.params.id]);
        res.json({ message: 'Karakter berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting perilaku character:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/perilaku-ratings', auth, async (req, res) => {
    try {
        res.json(await getPerilakuRatings(true));
    } catch (error) {
        console.error('Error fetching perilaku ratings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/perilaku-ratings', auth, superAdminOnly, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Nama tingkat penilaian wajib diisi' });
        const [result] = await db.query(
            'INSERT INTO ipc_perilaku_tingkat (name, is_active) VALUES (?, TRUE)', [name.trim()]
        );
        const options = await getPerilakuRatings();
        res.status(201).json(options.find(option => option.id === result.insertId));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Tingkat penilaian sudah terdaftar' });
        console.error('Error creating perilaku rating:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/perilaku-ratings/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const [option] = await db.query('SELECT name FROM ipc_perilaku_tingkat WHERE id = ?', [req.params.id]);
        if (!option.length) return res.status(404).json({ message: 'Tingkat penilaian tidak ditemukan' });
        const [configs] = await db.query(
            `SELECT COUNT(*) count FROM ipc_config WHERE category = 'perilaku' AND field2 = ?`,
            [option[0].name]
        );
        if (configs[0].count > 0) {
            return res.status(409).json({
                message: `Tingkat penilaian ${option[0].name} tidak dapat dihapus karena masih memiliki konfigurasi point IPC`
            });
        }
        await db.query('DELETE FROM ipc_perilaku_tingkat WHERE id = ?', [req.params.id]);
        res.json({ message: 'Tingkat penilaian berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting perilaku rating:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single configuration
router.get('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const pelanggaranId = parsePelanggaranId(id);
        if (pelanggaranId) {
            const configs = await getPelanggaranConfigs();
            const config = configs.find(item => item.id === id);
            return config ? res.json(config) : res.status(404).json({ message: 'Configuration not found' });
        }
        const [configs] = await db.query(`
            SELECT 
                id,
                category,
                field1,
                field2,
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
        const { category, field1, field2, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        if (category === 'pelanggaran') {
            if (field2) {
                const [level] = await db.query('SELECT id FROM ipc_pelanggaran_level WHERE name = ?', [field2]);
                if (!level.length) return res.status(400).json({ message: 'Violation level not found' });
                const [result] = await db.query(
                    'INSERT INTO ipc_pelanggaran_detail (name, level_id, is_active) VALUES (?, ?, ?)',
                    [field1, level[0].id, is_active !== undefined ? is_active : true]
                );
                return res.status(201).json((await getPelanggaranConfigs()).find(item => item.id === `detail-${result.insertId}`));
            }
            const [result] = await db.query(
                'INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active) VALUES (?, ?, ?, ?)',
                [field1, point_value, description || null, is_active !== undefined ? is_active : true]
            );
            return res.status(201).json((await getPelanggaranConfigs()).find(item => item.id === `level-${result.insertId}`));
        }
        
        if (!category || !field1 || point_value === undefined) {
            return res.status(400).json({ message: 'Category, field1, and point_value are required' });
        }
        
        const [result] = await db.query(`
            INSERT INTO ipc_config (category, field1, field2, point_value, description, is_active, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [category, field1, field2 || null, point_value, description || null, is_active !== undefined ? is_active : true, userId]);
        
        const [newConfig] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [result.insertId]);
        res.status(201).json(newConfig[0]);
    } catch (error) {
        console.error('Error creating IPC configuration:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Configuration with this category, field1, and field2 already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update configuration
router.put('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, field1, field2, point_value, description, is_active } = req.body;
        const userId = req.user.id;
        const pelanggaranId = parsePelanggaranId(id);
        if (pelanggaranId) {
            const table = pelanggaranId.type === 'level' ? 'ipc_pelanggaran_level' : 'ipc_pelanggaran_detail';
            const fieldUpdates = pelanggaranId.type === 'level'
                ? ['point_value = ?', 'description = ?', 'is_active = ?']
                : ['is_active = ?'];
            const values = pelanggaranId.type === 'level'
                ? [point_value, description ?? null, is_active, pelanggaranId.value]
                : [is_active, pelanggaranId.value];
            await db.query(`UPDATE ${table} SET ${fieldUpdates.join(', ')} WHERE id = ?`, values);
            return res.json((await getPelanggaranConfigs()).find(item => item.id === id));
        }
        
        // Check if configuration exists
        const [existing] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        const [result] = await db.query(`
            UPDATE ipc_config
            SET category = ?, field1 = ?, field2 = ?, point_value = ?, description = ?, is_active = ?, updated_by = ?
            WHERE id = ?
        `, [
            category || existing[0].category,
            field1 || existing[0].field1,
            field2 !== undefined ? field2 : existing[0].field2,
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
            return res.status(400).json({ message: 'Configuration with this category, field1, and field2 already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete configuration
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const pelanggaranId = parsePelanggaranId(id);
        if (pelanggaranId) {
            const table = pelanggaranId.type === 'level' ? 'ipc_pelanggaran_level' : 'ipc_pelanggaran_detail';
            const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [pelanggaranId.value]);
            return result.affectedRows
                ? res.json({ message: 'Configuration deleted successfully' })
                : res.status(404).json({ message: 'Configuration not found' });
        }
        
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
        await db.query('DELETE FROM ipc_pelanggaran_detail');
        await db.query('DELETE FROM ipc_pelanggaran_level');
        await db.query(`
            INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active)
            VALUES ('ringan', -1, 'Point untuk pelanggaran ringan', TRUE),
                   ('sedang', -5, 'Point untuk pelanggaran sedang', TRUE),
                   ('berat', -25, 'Point untuk pelanggaran berat', TRUE)
        `);
        
        // Insert default configurations from schema file
        // This should match the data in ipc_config_schema.sql
        let defaults = [
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
        
        const prestasiDefaults = defaults
            .filter(config => config.category === 'prestasi')
            .reduce((grouped, config) => {
                const key = `${config.field2}:${config.field3}`;
                if (!grouped[key] || config.point_value > grouped[key].point_value) {
                    grouped[key] = {
                        ...config,
                        field1: config.field2,
                        field2: config.field3,
                        field3: null,
                        description: `${config.field3} tingkat ${config.field2}`
                    };
                }
                return grouped;
            }, {});
        defaults = [
            ...defaults.filter(config => config.category !== 'prestasi'),
            ...Object.values(prestasiDefaults)
        ];

        for (const config of defaults) {
            await db.query(`
                INSERT INTO ipc_config (category, field1, field2, point_value, description, is_active, updated_by)
                VALUES (?, ?, ?, ?, ?, TRUE, ?)
            `, [config.category, config.field1, config.field2, config.point_value, config.description, userId]);
        }
        
        res.json({ message: 'Configurations reset to defaults successfully' });
    } catch (error) {
        console.error('Error resetting IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;