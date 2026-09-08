// Single source of truth for IPC point calculations
// Now integrated with database configuration system

const { getIPCConfig } = require('../utils/ipcConfig');

// Default values as fallback
const PRESTASI_POINTS = {
    'juara 1': { kecamatan: 8, kabupaten: 12, provinsi: 30, nasional: 40, internasional: 50 },
    'juara 2': { kecamatan: 7, kabupaten: 10, provinsi: 25, nasional: 35, internasional: 45 },
    'juara 3': { kecamatan: 6, kabupaten: 8, provinsi: 20, nasional: 30, internasional: 40 },
    'juara harapan 1': { kecamatan: 5, kabupaten: 7, provinsi: 15, nasional: 25, internasional: 35 },
    'juara harapan 2': { kecamatan: 4, kabupaten: 5, provinsi: 12, nasional: 20, internasional: 30 },
    'juara harapan 3': { kecamatan: 3, kabupaten: 5, provinsi: 10, nasional: 15, internasional: 25 },
    'finalis': { kecamatan: 2, kabupaten: 4, provinsi: 8, nasional: 15, internasional: 20 },
    'peserta': { kecamatan: 1, kabupaten: 3, provinsi: 5, nasional: 10, internasional: 15 }
};

const EVENT_POINTS = {
    'sekolah': 2,
    'kecamatan': 4,
    'kabupaten': 6,
    'provinsi': 8,
    'nasional': 10,
    'internasional': 12
};

const ORGANISASI_POINTS = {
    'ketua': 5,
    'wakil ketua': 4,
    'sekretaris': 4,
    'bendahara': 3,
    'koordinator': 2,
    'anggota': 1
};

const KEPANITIAAN_POINTS = {
    'ketua': 5,
    'wakil ketua': 4,
    'sekretaris': 4,
    'bendahara': 3,
    'koordinator': 2,
    'anggota': 1
};

const PELANGGARAN_POINTS = {
    'ringan': -1,
    'sedang': -5,
    'berat': -25
};

const PERILAKU_POINTS = {
    'kurang baik': 1,
    'cukup baik': 2,
    'baik': 3,
    'sangat baik': 4
};

// Enhanced calculate functions that use database configuration
const calculatePrestasiPoints = async (juara, kategori) => {
    try {
        const config = await getIPCConfig();
        const juaraPoint = config.prestasi?.juara?.[juara] || PRESTASI_POINTS[juara]?.[kategori] || 0;
        const kategoriMultiplier = config.prestasi?.kategori?.[kategori] || 1;
        return juaraPoint * kategoriMultiplier;
    } catch (error) {
        console.error('Error calculating prestasi points:', error);
        return PRESTASI_POINTS[juara]?.[kategori] || 0;
    }
};

const calculateEventPoints = async (tingkat) => {
    try {
        const config = await getIPCConfig();
        return config.event?.tingkat?.[tingkat] || EVENT_POINTS[tingkat?.toLowerCase()] || EVENT_POINTS[tingkat] || 0;
    } catch (error) {
        console.error('Error calculating event points:', error);
        return EVENT_POINTS[tingkat?.toLowerCase()] || EVENT_POINTS[tingkat] || 0;
    }
};

const calculateOrganisasiPoints = async (jabatan) => {
    try {
        const config = await getIPCConfig();
        return config.organisasi?.jabatan?.[jabatan] || ORGANISASI_POINTS[jabatan?.toLowerCase()] || ORGANISASI_POINTS[jabatan] || 0;
    } catch (error) {
        console.error('Error calculating organisasi points:', error);
        return ORGANISASI_POINTS[jabatan?.toLowerCase()] || ORGANISASI_POINTS[jabatan] || 0;
    }
};

const calculateKepanitiaanPoints = async (jabatan) => {
    try {
        const config = await getIPCConfig();
        return config.kepanitiaan?.jabatan?.[jabatan] || KEPANITIAAN_POINTS[jabatan?.toLowerCase()] || KEPANITIAAN_POINTS[jabatan] || 0;
    } catch (error) {
        console.error('Error calculating kepanitiaan points:', error);
        return KEPANITIAAN_POINTS[jabatan?.toLowerCase()] || KEPANITIAAN_POINTS[jabatan] || 0;
    }
};

const calculatePelanggaranPoints = async (jenis) => {
    try {
        const config = await getIPCConfig();
        return config.pelanggaran?.jenis?.[jenis] || PELANGGARAN_POINTS[jenis?.toLowerCase()] || 0;
    } catch (error) {
        console.error('Error calculating pelanggaran points:', error);
        return PELANGGARAN_POINTS[jenis?.toLowerCase()] || 0;
    }
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

const calculatePerilakuPoints = async (karakter) => {
    try {
        const config = await getIPCConfig();
        return config.perilaku?.karakter?.[karakter] || PERILAKU_POINTS[karakter?.toLowerCase()] || 0;
    } catch (error) {
        console.error('Error calculating perilaku points:', error);
        return PERILAKU_POINTS[karakter?.toLowerCase()] || 0;
    }
};

const calculatePerilakuPointsFromFields = async (fields) => {
    try {
        const config = await getIPCConfig();
        const indicators = config.perilaku?.indikator || {};
        
        const values = PERILAKU_CHARACTER_FIELDS
            .map((field) => fields[field])
            .filter(Boolean);

        if (values.length === 0) {
            return 0;
        }

        const total = values.reduce(
            (sum, value) => sum + (indicators[value] || PERILAKU_POINTS[value?.toLowerCase()] || 0),
            0
        );

        return Math.round(total / values.length);
    } catch (error) {
        console.error('Error calculating perilaku points from fields:', error);
        // Fallback to original calculation
        const values = PERILAKU_CHARACTER_FIELDS
            .map((field) => fields[field])
            .filter(Boolean);

        if (values.length === 0) {
            return 0;
        }

        const total = values.reduce(
            (sum, value) => sum + (PERILAKU_POINTS[value?.toLowerCase()] || 0),
            0
        );

        return Math.round(total / values.length);
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
    return EVENT_POINTS[tingkat?.toLowerCase()] || EVENT_POINTS[tingkat] || 0;
};

const calculateOrganisasiPointsSync = (jabatan) => {
    return ORGANISASI_POINTS[jabatan?.toLowerCase()] || ORGANISASI_POINTS[jabatan] || 0;
};

const calculateKepanitiaanPointsSync = (jabatan) => {
    return KEPANITIAAN_POINTS[jabatan?.toLowerCase()] || KEPANITIAAN_POINTS[jabatan] || 0;
};

const calculatePelanggaranPointsSync = (jenis) => {
    return PELANGGARAN_POINTS[jenis?.toLowerCase()] || 0;
};

const calculatePerilakuPointsSync = (karakter) => {
    return PERILAKU_POINTS[karakter?.toLowerCase()] || 0;
};

const calculatePerilakuPointsFromFieldsSync = (fields) => {
    const values = PERILAKU_CHARACTER_FIELDS
        .map((field) => fields[field])
        .filter(Boolean);

    if (values.length === 0) {
        return 0;
    }

    const total = values.reduce(
        (sum, value) => sum + (PERILAKU_POINTS[value?.toLowerCase()] || 0),
        0
    );

    return Math.round(total / values.length);
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
    // Synchronous versions for backward compatibility
    calculatePrestasiPointsSync,
    calculateEventPointsSync,
    calculateOrganisasiPointsSync,
    calculateKepanitiaanPointsSync,
    calculatePelanggaranPointsSync,
    calculatePerilakuPointsSync,
    calculatePerilakuPointsFromFieldsSync,
    formatPerilakuKarakter,
    PERILAKU_CHARACTER_FIELDS,
    normalizePrestasiJenis
};
