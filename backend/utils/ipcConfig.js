const db = require('../config/database');

// Cache for IPC configurations to avoid frequent database queries
let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get IPC configuration from database with caching.
 * Shape matches what calculators expect:
 * - prestasi.byKey['tingkat|juara'] / prestasi.juara[juara] (legacy)
 * - organisasi.byKey['org|jabatan'] / organisasi.jabatan[jabatan] (legacy)
 * - kepanitiaan.jabatan[jabatan]
 * - event.tingkat[tingkat]
 * - pelanggaran.jenis[level]
 * - perilaku.byKey['character|rating'] / perilaku.karakter[rating] (legacy)
 */
async function getIPCConfig() {
  const now = Date.now();

  if (configCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache;
  }

  try {
    const [configs] = await db.query(`
      SELECT category, field1, field2, point_value
      FROM ipc_config
      WHERE is_active = TRUE
      ORDER BY category, field1, field2
    `);

    const grouped = {
      prestasi: { juara: {}, byKey: {} },
      organisasi: { jabatan: {}, byKey: {} },
      kepanitiaan: { jabatan: {} },
      event: { tingkat: {} },
      pelanggaran: { jenis: {} },
      perilaku: { karakter: {}, byKey: {} }
    };

    configs.forEach((config) => {
      const { category, field1, field2, point_value } = config;
      if (!field1) return;

      if (category === 'prestasi') {
        const juara = field2 || field1;
        grouped.prestasi.juara[juara] = point_value;
        if (field2) {
          grouped.prestasi.byKey[`${field1}|${field2}`] = point_value;
        }
      } else if (category === 'organisasi') {
        if (field2) {
          grouped.organisasi.jabatan[field2] = point_value;
          grouped.organisasi.byKey[`${field1}|${field2}`] = point_value;
        } else {
          grouped.organisasi.jabatan[field1] = point_value;
        }
      } else if (category === 'kepanitiaan') {
        grouped.kepanitiaan.jabatan[field1] = point_value;
      } else if (category === 'event') {
        grouped.event.tingkat[field1] = point_value;
      } else if (category === 'pelanggaran') {
        grouped.pelanggaran.jenis[field1] = point_value;
      } else if (category === 'perilaku') {
        if (field2) {
          grouped.perilaku.karakter[field2] = point_value;
          grouped.perilaku.byKey[`${field1}|${field2}`] = point_value;
        } else {
          grouped.perilaku.karakter[field1] = point_value;
        }
      }
    });

    // Merge pelanggaran levels from dedicated table
    try {
      const [levels] = await db.query(
        `SELECT name, point_value FROM ipc_pelanggaran_level WHERE is_active = TRUE`
      );
      levels.forEach((level) => {
        grouped.pelanggaran.jenis[level.name] = level.point_value;
      });
    } catch (_) {
      // Table may not exist on older DBs
    }

    configCache = grouped;
    cacheTimestamp = now;
    return grouped;
  } catch (error) {
    console.error('Error fetching IPC configuration:', error);
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
 * Get default configuration (fallback) — aligned with ipc_config_schema.sql
 */
function getDefaultConfig() {
  return {
    prestasi: {
      juara: {
        'juara 1': 50,
        'juara 2': 40,
        'juara 3': 30,
        'juara harapan 1': 25,
        'juara harapan 2': 20,
        'juara harapan 3': 15,
        finalis: 10,
        peserta: 5
      },
      byKey: {}
    },
    organisasi: {
      jabatan: {
        ketua: 10,
        'wakil ketua': 8,
        sekretaris: 7,
        bendahara: 7,
        koordinator: 5,
        anggota: 3
      },
      byKey: {}
    },
    kepanitiaan: {
      jabatan: {
        ketua: 10,
        'wakil ketua': 8,
        sekretaris: 7,
        bendahara: 7,
        koordinator: 5,
        anggota: 3
      }
    },
    event: {
      tingkat: {
        sekolah: 5,
        kecamatan: 10,
        kabupaten: 15,
        provinsi: 20,
        nasional: 25,
        internasional: 30
      }
    },
    pelanggaran: {
      jenis: {
        ringan: -1,
        sedang: -5,
        berat: -25
      }
    },
    perilaku: {
      karakter: {
        'kurang baik': 1,
        'cukup baik': 3,
        baik: 4,
        'sangat baik': 5
      },
      byKey: {}
    }
  };
}

module.exports = {
  getIPCConfig,
  clearConfigCache,
  getDefaultConfig
};
