const db = require('../config/database');

// Cache for IPC configurations to avoid frequent database queries
let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get IPC configuration from database with caching
 * @returns {Object} Grouped configurations by category
 */
async function getIPCConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (configCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache;
  }
  
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
    
    // Update cache
    configCache = grouped;
    cacheTimestamp = now;
    
    return grouped;
  } catch (error) {
    console.error('Error fetching IPC configuration:', error);
    // Return default configuration if database query fails
    return getDefaultConfig();
  }
}

/**
 * Clear the configuration cache (call after updating config)
 */
function clearConfigCache() {
  configCache = null;
  cacheTimestamp = null;
}

/**
 * Get default configuration (fallback)
 */
function getDefaultConfig() {
  return {
    prestasi: {
      juara: {
        'juara 1': 8,
        'juara 2': 6,
        'juara 3': 5,
        'juara harapan 1': 4,
        'juara harapan 2': 3,
        'juara harapan 3': 2,
        'finalis': 2,
        'peserta': 1
      },
      kategori: {
        'kecamatan': 1,
        'kabupaten': 2,
        'provinsi': 3,
        'nasional': 4,
        'internasional': 5
      }
    },
    organisasi: {
      jabatan: {
        'ketua': 5,
        'wakil ketua': 4,
        'sekretaris': 4,
        'bendahara': 3,
        'koordinator': 2,
        'anggota': 1
      }
    },
    kepanitiaan: {
      jabatan: {
        'ketua': 5,
        'wakil ketua': 4,
        'sekretaris': 4,
        'bendahara': 3,
        'koordinator': 2,
        'anggota': 1
      }
    },
    event: {
      tingkat: {
        'sekolah': 2,
        'kecamatan': 4,
        'kabupaten': 6,
        'provinsi': 8,
        'nasional': 10,
        'internasional': 12
      }
    },
    pelanggaran: {
      jenis: {
        'ringan': -1,
        'sedang': -5,
        'berat': -25
      }
    },
    perilaku: {
      karakter: {
        'kurang baik': 1,
        'cukup baik': 2,
        'baik': 3,
        'sangat baik': 4
      },
      indikator: {
        'tanggung_jawab': 1,
        'disiplin': 1,
        'kepedulian': 1,
        'kemandirian': 1,
        'spiritual': 1,
        'kejujuran': 1,
        'kepercayaan_diri': 1
      }
    }
  };
}

/**
 * Calculate point for prestasi based on configuration
 * @param {string} juara - juara value
 * @param {string} kategori - kategori value
 * @returns {number} calculated point
 */
async function calculatePrestasiPoint(juara, kategori) {
  const config = await getIPCConfig();
  
  const juaraPoint = config.prestasi?.juara?.[juara] || 0;
  const kategoriMultiplier = config.prestasi?.kategori?.[kategori] || 1;
  
  return juaraPoint * kategoriMultiplier;
}

/**
 * Calculate point for organisasi based on configuration
 * @param {string} jabatan - jabatan value
 * @returns {number} calculated point
 */
async function calculateOrganisasiPoint(jabatan) {
  const config = await getIPCConfig();
  return config.organisasi?.jabatan?.[jabatan] || 0;
}

/**
 * Calculate point for kepanitiaan based on configuration
 * @param {string} jabatan - jabatan value
 * @returns {number} calculated point
 */
async function calculateKepanitiaanPoint(jabatan) {
  const config = await getIPCConfig();
  return config.kepanitiaan?.jabatan?.[jabatan] || 0;
}

/**
 * Calculate point for event based on configuration
 * @param {string} tingkat - tingkat value
 * @returns {number} calculated point
 */
async function calculateEventPoint(tingkat) {
  const config = await getIPCConfig();
  return config.event?.tingkat?.[tingkat] || 0;
}

/**
 * Calculate point for pelanggaran based on configuration
 * @param {string} jenis - jenis value
 * @returns {number} calculated point (negative)
 */
async function calculatePelanggaranPoint(jenis) {
  const config = await getIPCConfig();
  return config.pelanggaran?.jenis?.[jenis] || 0;
}

/**
 * Calculate point for perilaku based on configuration
 * @param {string} karakter - karakter value
 * @returns {number} calculated point
 */
async function calculatePerilakuPoint(karakter) {
  const config = await getIPCConfig();
  return config.perilaku?.karakter?.[karakter] || 0;
}

/**
 * Calculate total perilaku point based on all indicators
 * @param {Object} perilakuData - object with indicator values
 * @returns {number} calculated total point
 */
async function calculateTotalPerilakuPoint(perilakuData) {
  const config = await getIPCConfig();
  const indicators = config.perilaku?.indikator || {};
  
  let total = 0;
  const indicatorFields = ['tanggung_jawab', 'disiplin', 'kepedulian', 'kemandirian', 'spiritual', 'kejujuran', 'kepercayaan_diri'];
  
  for (const field of indicatorFields) {
    const karakterValue = perilakuData[field];
    if (karakterValue && indicators[karakterValue]) {
      total += indicators[karakterValue];
    }
  }
  
  return total;
}

module.exports = {
  getIPCConfig,
  clearConfigCache,
  calculatePrestasiPoint,
  calculateOrganisasiPoint,
  calculateKepanitiaanPoint,
  calculateEventPoint,
  calculatePelanggaranPoint,
  calculatePerilakuPoint,
  calculateTotalPerilakuPoint
};