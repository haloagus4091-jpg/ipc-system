// Single source of truth for IPC point calculations
// Reads from ipc_config (field1/field2) with hardcoded fallbacks

const { getIPCConfig } = require('../utils/ipcConfig');
const db = require('../config/database');

// Default values as fallback — aligned with ipc_config_schema.sql
const PRESTASI_POINTS = {
    'juara 1': { kecamatan: 50, kabupaten: 60, provinsi: 70, nasional: 80, internasional: 90 },
    'juara 2': { kecamatan: 40, kabupaten: 50, provinsi: 60, nasional: 70, internasional: 80 },
    'juara 3': { kecamatan: 30, kabupaten: 40, provinsi: 50, nasional: 60, internasional: 70 },
    'juara harapan 1': { kecamatan: 25, kabupaten: 35, provinsi: 45, nasional: 55, internasional: 65 },
    'juara harapan 2': { kecamatan: 20, kabupaten: 30, provinsi: 40, nasional: 50, internasional: 60 },
    'juara harapan 3': { kecamatan: 15, kabupaten: 25, provinsi: 35, nasional: 45, internasional: 55 },
    'finalis': { kecamatan: 10, kabupaten: 15, provinsi: 20, nasional: 25, internasional: 30 },
    'peserta': { kecamatan: 5, kabupaten: 8, provinsi: 12, nasional: 15, internasional: 20 }
};

const EVENT_POINTS = {
    'sekolah': 5,
    'kecamatan': 10,
    'kabupaten': 15,
    'provinsi': 20,
    'nasional': 25,
    'internasional': 30
};

const ORGANISASI_POINTS = {
    'ketua': 10,
    'wakil ketua': 8,
    'sekretaris': 7,
    'bendahara': 7,
    'koordinator': 5,
    'anggota': 3
};

const KEPANITIAAN_POINTS = {
    'ketua': 10,
    'wakil ketua': 8,
    'sekretaris': 7,
    'bendahara': 7,
    'koordinator': 5,
    'anggota': 3
};

const PELANGGARAN_POINTS = {
    'ringan': -1,
    'sedang': -5,
    'berat': -25
};

const PERILAKU_POINTS = {
    'kurang baik': 1,
    'cukup baik': 3,
    'baik': 4,
    'sangat baik': 5
};

const PERILAKU_CHARACTER_FIELDS = [
    'tanggung_jawab',
    'disiplin',
    'kepedulian',
    'kemandirian',
    'spiritual',
    'kejujuran',
    'kepercayaan_diri'
];

const PERILAKU_CHARACTER_LABELS = {
    tanggung_jawab: 'Tanggung Jawab',
    disiplin: 'Disiplin',
    kepedulian: 'Kepedulian',
    kemandirian: 'Kemandirian',
    spiritual: 'Spiritual',
    kejujuran: 'Kejujuran',
    kepercayaan_diri: 'Kepercayaan Diri'
};

const normalizeKey = (value) => (value || '').toString().trim().toLowerCase();

const calculatePrestasiPoints = async (juara, kategori) => {
    try {
        const [configuredPoints] = await db.query(
            `SELECT point_value
             FROM ipc_config
             WHERE category = 'prestasi'
               AND is_active = TRUE
               AND LOWER(TRIM(field1)) = LOWER(TRIM(?))
               AND LOWER(TRIM(field2)) = LOWER(TRIM(?))
             LIMIT 1`,
            [kategori, juara]
        );
        if (configuredPoints[0]) {
            return configuredPoints[0].point_value;
        }

        const config = await getIPCConfig();
        return config.prestasi?.byKey?.[`${kategori}|${juara}`]
            || config.prestasi?.juara?.[juara]
            || PRESTASI_POINTS[juara]?.[kategori]
            || 0;
    } catch (error) {
        console.error('Error calculating prestasi points:', error);
        return PRESTASI_POINTS[juara]?.[kategori] || 0;
    }
};

const calculateEventPoints = async (tingkat) => {
    try {
        const [configuredPoints] = await db.query(
            `SELECT point_value
             FROM ipc_config
             WHERE category = 'event'
               AND is_active = TRUE
               AND LOWER(TRIM(field1)) = LOWER(TRIM(?))
               AND (field2 IS NULL OR field2 = '')
             LIMIT 1`,
            [tingkat]
        );
        if (configuredPoints[0]) {
            return configuredPoints[0].point_value;
        }

        const config = await getIPCConfig();
        return config.event?.tingkat?.[tingkat]
            || config.event?.tingkat?.[normalizeKey(tingkat)]
            || EVENT_POINTS[normalizeKey(tingkat)]
            || EVENT_POINTS[tingkat]
            || 0;
    } catch (error) {
        console.error('Error calculating event points:', error);
        return EVENT_POINTS[normalizeKey(tingkat)] || EVENT_POINTS[tingkat] || 0;
    }
};

const calculateOrganisasiPoints = async (kategori, jabatan) => {
    try {
        const [configuredPoints] = await db.query(
            `SELECT point_value
             FROM ipc_config
             WHERE category = 'organisasi'
               AND is_active = TRUE
               AND LOWER(TRIM(field1)) = LOWER(TRIM(?))
               AND LOWER(TRIM(field2)) = LOWER(TRIM(?))
             LIMIT 1`,
            [kategori, jabatan]
        );
        if (configuredPoints[0]) {
            return configuredPoints[0].point_value;
        }

        const config = await getIPCConfig();
        return config.organisasi?.byKey?.[`${kategori}|${jabatan}`]
            || config.organisasi?.jabatan?.[jabatan]
            || ORGANISASI_POINTS[normalizeKey(jabatan)]
            || ORGANISASI_POINTS[jabatan]
            || 0;
    } catch (error) {
        console.error('Error calculating organisasi points:', error);
        return ORGANISASI_POINTS[normalizeKey(jabatan)] || ORGANISASI_POINTS[jabatan] || 0;
    }
};

const calculateKepanitiaanPoints = async (jabatan) => {
    try {
        const [configuredPoints] = await db.query(
            `SELECT point_value
             FROM ipc_config
             WHERE category = 'kepanitiaan'
               AND is_active = TRUE
               AND LOWER(TRIM(field1)) = LOWER(TRIM(?))
               AND (field2 IS NULL OR field2 = '')
             LIMIT 1`,
            [jabatan]
        );
        if (configuredPoints[0]) {
            return configuredPoints[0].point_value;
        }

        const config = await getIPCConfig();
        return config.kepanitiaan?.jabatan?.[jabatan]
            || config.kepanitiaan?.jabatan?.[normalizeKey(jabatan)]
            || KEPANITIAAN_POINTS[normalizeKey(jabatan)]
            || KEPANITIAAN_POINTS[jabatan]
            || 0;
    } catch (error) {
        console.error('Error calculating kepanitiaan points:', error);
        return KEPANITIAAN_POINTS[normalizeKey(jabatan)] || KEPANITIAAN_POINTS[jabatan] || 0;
    }
};

const calculatePelanggaranPoints = async (jenis) => {
    try {
        const [configs] = await db.query(
            `SELECT level.point_value AS point_value
             FROM ipc_pelanggaran_level level
             LEFT JOIN ipc_pelanggaran_detail detail
               ON detail.level_id = level.id AND detail.name = ?
             WHERE (level.name = ? OR detail.name = ?)
               AND level.is_active = TRUE
               AND (detail.id IS NULL OR detail.is_active = TRUE)
             LIMIT 1`,
            [jenis, jenis, jenis]
        );
        if (configs[0]) {
            return configs[0].point_value;
        }

        const [legacyConfigs] = await db.query(
            `SELECT COALESCE(level_config.point_value, detail_config.point_value) AS point_value
             FROM ipc_config detail_config
             LEFT JOIN ipc_config level_config
               ON level_config.category = detail_config.category
              AND level_config.field1 = detail_config.field2
              AND level_config.field2 IS NULL
              AND level_config.is_active = TRUE
             WHERE detail_config.category = ?
               AND (detail_config.field1 = ? OR detail_config.field2 = ?)
               AND detail_config.is_active = TRUE
             LIMIT 1`,
            ['pelanggaran', jenis, jenis]
        );
        return legacyConfigs[0]?.point_value ?? (PELANGGARAN_POINTS[normalizeKey(jenis)] || 0);
    } catch (error) {
        console.error('Error calculating pelanggaran points:', error);
        return PELANGGARAN_POINTS[normalizeKey(jenis)] || 0;
    }
};

const lookupPerilakuPoint = async (character, rating) => {
    if (!rating) return 0;

    const [rows] = await db.query(
        `SELECT point_value
         FROM ipc_config
         WHERE category = 'perilaku'
           AND is_active = TRUE
           AND LOWER(TRIM(field1)) = LOWER(TRIM(?))
           AND LOWER(TRIM(field2)) = LOWER(TRIM(?))
         LIMIT 1`,
        [character, rating]
    );
    if (rows[0]) {
        return rows[0].point_value;
    }

    const [ratingOnly] = await db.query(
        `SELECT point_value
         FROM ipc_config
         WHERE category = 'perilaku'
           AND is_active = TRUE
           AND LOWER(TRIM(field2)) = LOWER(TRIM(?))
         LIMIT 1`,
        [rating]
    );
    if (ratingOnly[0]) {
        return ratingOnly[0].point_value;
    }

    return PERILAKU_POINTS[normalizeKey(rating)] || 0;
};

const calculatePerilakuPoints = async (karakter) => {
    try {
        // Formatted multi-trait string: "Tanggung Jawab: baik, Disiplin: sangat baik"
        if (karakter && String(karakter).includes(':')) {
            const fields = {};
            String(karakter).split(',').forEach((part) => {
                const [label, value] = part.split(':').map((s) => s.trim());
                const field = Object.entries(PERILAKU_CHARACTER_LABELS)
                    .find(([, lbl]) => lbl.toLowerCase() === label?.toLowerCase())?.[0];
                if (field && value) {
                    fields[field] = value;
                }
            });
            return calculatePerilakuPointsFromFields(fields);
        }

        const config = await getIPCConfig();
        return config.perilaku?.karakter?.[karakter]
            || config.perilaku?.karakter?.[normalizeKey(karakter)]
            || PERILAKU_POINTS[normalizeKey(karakter)]
            || 0;
    } catch (error) {
        console.error('Error calculating perilaku points:', error);
        return PERILAKU_POINTS[normalizeKey(karakter)] || 0;
    }
};

// Sum of all trait points (matches frontend preview + IPC card breakdown)
const calculatePerilakuPointsFromFields = async (fields) => {
    try {
        let total = 0;
        for (const field of PERILAKU_CHARACTER_FIELDS) {
            const rating = fields[field];
            if (!rating) continue;
            total += await lookupPerilakuPoint(field, rating);
        }
        return total;
    } catch (error) {
        console.error('Error calculating perilaku points from fields:', error);
        return PERILAKU_CHARACTER_FIELDS
            .map((field) => fields[field])
            .filter(Boolean)
            .reduce((sum, value) => sum + (PERILAKU_POINTS[normalizeKey(value)] || 0), 0);
    }
};

const formatPerilakuKarakter = (fields) => {
    return PERILAKU_CHARACTER_FIELDS
        .filter((field) => fields[field])
        .map((field) => `${PERILAKU_CHARACTER_LABELS[field]}: ${fields[field]}`)
        .join(', ');
};

// Normalize prestasi jenis across tables (legacy non_akademik → nonakademik)
const normalizePrestasiJenis = (jenis) => {
    if (jenis === 'non_akademik') return 'nonakademik';
    return jenis;
};

// Synchronous versions for backward compatibility (using default values)
const calculatePrestasiPointsSync = (juara, kategori) => {
    return PRESTASI_POINTS[juara]?.[kategori] || 0;
};

const calculateEventPointsSync = (tingkat) => {
    return EVENT_POINTS[normalizeKey(tingkat)] || EVENT_POINTS[tingkat] || 0;
};

const calculateOrganisasiPointsSync = (jabatan) => {
    return ORGANISASI_POINTS[normalizeKey(jabatan)] || ORGANISASI_POINTS[jabatan] || 0;
};

const calculateKepanitiaanPointsSync = (jabatan) => {
    return KEPANITIAAN_POINTS[normalizeKey(jabatan)] || KEPANITIAAN_POINTS[jabatan] || 0;
};

const calculatePelanggaranPointsSync = (jenis) => {
    return PELANGGARAN_POINTS[normalizeKey(jenis)] || 0;
};

const calculatePerilakuPointsSync = (karakter) => {
    return PERILAKU_POINTS[normalizeKey(karakter)] || 0;
};

const calculatePerilakuPointsFromFieldsSync = (fields) => {
    return PERILAKU_CHARACTER_FIELDS
        .map((field) => fields[field])
        .filter(Boolean)
        .reduce((sum, value) => sum + (PERILAKU_POINTS[normalizeKey(value)] || 0), 0);
};

module.exports = {
    PRESTASI_POINTS,
    EVENT_POINTS,
    ORGANISASI_POINTS,
    KEPANITIAAN_POINTS,
    PELANGGARAN_POINTS,
    PERILAKU_POINTS,
    calculatePrestasiPoints,
    calculateEventPoints,
    calculateOrganisasiPoints,
    calculateKepanitiaanPoints,
    calculatePelanggaranPoints,
    calculatePerilakuPoints,
    calculatePerilakuPointsFromFields,
    calculatePrestasiPointsSync,
    calculateEventPointsSync,
    calculateOrganisasiPointsSync,
    calculateKepanitiaanPointsSync,
    calculatePelanggaranPointsSync,
    calculatePerilakuPointsSync,
    calculatePerilakuPointsFromFieldsSync,
    formatPerilakuKarakter,
    PERILAKU_CHARACTER_FIELDS,
    PERILAKU_CHARACTER_LABELS,
    normalizePrestasiJenis,
    lookupPerilakuPoint
};
