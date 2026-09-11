const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');
const { clearConfigCache } = require('../utils/ipcConfig');

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
                clearConfigCache();
                return res.status(201).json((await getPelanggaranConfigs()).find(item => item.id === `detail-${result.insertId}`));
            }
            const [result] = await db.query(
                'INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active) VALUES (?, ?, ?, ?)',
                [field1, point_value, description || null, is_active !== undefined ? is_active : true]
            );
            clearConfigCache();
            return res.status(201).json((await getPelanggaranConfigs()).find(item => item.id === `level-${result.insertId}`));
        }
        
        if (!category || !field1 || point_value === undefined) {
            return res.status(400).json({ message: 'Category, field1, and point_value are required' });
        }
        
        const [result] = await db.query(`
            INSERT INTO ipc_config (category, field1, field2, point_value, description, is_active, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [category, field1, field2 || null, point_value, description || null, is_active !== undefined ? is_active : true, userId]);
        
        clearConfigCache();
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
            clearConfigCache();
            return res.json((await getPelanggaranConfigs()).find(item => item.id === id));
        }
        
        // Check if configuration exists
        const [existing] = await db.query('SELECT * FROM ipc_config WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        await db.query(`
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
        
        clearConfigCache();
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
            if (result.affectedRows) {
                clearConfigCache();
                return res.json({ message: 'Configuration deleted successfully' });
            }
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        const [result] = await db.query('DELETE FROM ipc_config WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        clearConfigCache();
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

        await db.query('DELETE FROM ipc_config');
        await db.query('DELETE FROM ipc_pelanggaran_detail');
        await db.query('DELETE FROM ipc_pelanggaran_level');
        await db.query(`
            INSERT INTO ipc_pelanggaran_level (name, point_value, description, is_active)
            VALUES ('ringan', -1, 'Point untuk pelanggaran ringan', TRUE),
                   ('sedang', -5, 'Point untuk pelanggaran sedang', TRUE),
                   ('berat', -25, 'Point untuk pelanggaran berat', TRUE)
        `);

        const juaraList = [
            ['juara_i', 50, 60],
            ['juara_ii', 40, 50],
            ['juara_iii', 30, 40],
            ['harapan_i', 25, 35],
            ['harapan_ii', 20, 30],
            ['harapan_iii', 15, 25],
            ['finalis', 10, 15],
            ['peserta', 5, 8]
        ];
        const { FIXED_TINGKAT_OPTIONS, FIXED_JUARA_LOMBA_OPTIONS, PRESTASI_POINTS, EVENT_POINTS, ORGANISASI_POINTS, KEPANITIAAN_POINTS, PERILAKU_POINTS } = require('../constants/points');
        const perilakuChars = [
            'tanggung_jawab', 'disiplin', 'kepedulian', 'kemandirian',
            'spiritual', 'kejujuran', 'kepercayaan_diri'
        ];
        const perilakuRatings = [
            ['sangat baik', 4], ['baik', 3], ['cukup baik', 2], ['kurang baik', 1]
        ];
        const jabatanList = [
            ['ketua', 5], ['wakil ketua', 4], ['sekretaris', 4],
            ['bendahara', 3], ['koordinator', 2], ['anggota', 1]
        ];
        const orgs = ['OSIS', 'KY', 'MPK', 'PRAMUKA', 'PKS', 'PMR', 'PASKIBRAKA'];

        const defaults = [];
        for (const juara of FIXED_JUARA_LOMBA_OPTIONS) {
            for (const tingkat of FIXED_TINGKAT_OPTIONS) {
                const juaraKey = juara.toLowerCase();
                const tingkatKey = tingkat;
                const pointValue = PRESTASI_POINTS[juaraKey]?.[tingkatKey] || 0;
                defaults.push({
                    category: 'prestasi', field1: tingkat, field2: juara,
                    point_value: pointValue,
                    description: `${juara.replace(/_/g, ' ')} tingkat ${tingkat}`
                });
            }
        }
        for (const ch of perilakuChars) {
            for (const [rating, pts] of perilakuRatings) {
                const ratingKey = rating.toLowerCase();
                const pointValue = PERILAKU_POINTS[ratingKey] || pts;
                defaults.push({
                    category: 'perilaku', field1: ch, field2: rating,
                    point_value: pointValue,
                    description: `Karakter ${ch.replace(/_/g, ' ')} ${rating}`
                });
            }
        }
        for (const [jab, pts] of jabatanList) {
            const jabatanKey = jab.toLowerCase();
            const pointValue = KEPANITIAAN_POINTS[jabatanKey] || pts;
            defaults.push({
                category: 'kepanitiaan', field1: jab, field2: null,
                point_value: pointValue, description: `${jab} kepanitiaan`
            });
        }
        for (const org of orgs) {
            for (const [jab, pts] of jabatanList) {
                const jabatanKey = jab.toLowerCase();
                const pointValue = ORGANISASI_POINTS[jabatanKey] || pts;
                defaults.push({
                    category: 'organisasi', field1: org, field2: jab,
                    point_value: pointValue, description: `${jab} ${org}`
                });
            }
        }
        for (const tingkat of FIXED_TINGKAT_OPTIONS) {
            const tingkatKey = tingkat;
            const pointValue = EVENT_POINTS[tingkatKey] || 0;
            defaults.push({
                category: 'event', field1: tingkat, field2: null,
                point_value: pointValue, description: `Event tingkat ${tingkat}`
            });
        }

        for (const config of defaults) {
            await db.query(`
                INSERT INTO ipc_config (category, field1, field2, point_value, description, is_active, updated_by)
                VALUES (?, ?, ?, ?, ?, TRUE, ?)
            `, [config.category, config.field1, config.field2, config.point_value, config.description, userId]);
        }

        await db.query(`
            INSERT IGNORE INTO ipc_organisasi (name)
            SELECT DISTINCT field1 FROM ipc_config
            WHERE category = 'organisasi' AND field1 IS NOT NULL
        `);
        await db.query(`
            INSERT IGNORE INTO ipc_perilaku_karakter (name)
            SELECT DISTINCT field1 FROM ipc_config
            WHERE category = 'perilaku' AND field1 IS NOT NULL
        `);
        await db.query(`
            INSERT IGNORE INTO ipc_perilaku_tingkat (name) VALUES
            ('sangat baik'), ('baik'), ('cukup baik'), ('kurang baik')
        `);

        clearConfigCache();
        res.json({ message: 'Configurations reset to defaults successfully' });
    } catch (error) {
        console.error('Error resetting IPC configurations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
