const db = require('../config/database');
const {
    PERILAKU_POINTS,
    lookupPerilakuPoint
} = require('../constants/points');

const TRAIT_FIELD_MAP = {
    'tanggung jawab': 'tanggung_jawab',
    disiplin: 'disiplin',
    kepedulian: 'kepedulian',
    kemandirian: 'kemandirian',
    spiritual: 'spiritual',
    kejujuran: 'kejujuran',
    'kepercayaan diri': 'kepercayaan_diri'
};

function createEmptyPoints(ipcAwal = 80) {
    return {
        point_awal: ipcAwal,
        prestasi_akademik: 0,
        prestasi_nonakademik: 0,
        tanggung_jawab: 0,
        disiplin: 0,
        kepedulian: 0,
        kemandirian: 0,
        spiritual: 0,
        kejujuran: 0,
        kepercayaan_diri: 0,
        organisasi: 0,
        kepanitiaan: 0,
        event: 0,
        pelanggaran_ringan: 0,
        pelanggaran_sedang: 0,
        pelanggaran_berat: 0,
        pelanggaran_lainnya: 0
    };
}

async function addPerilakuPoints(points, karakterSiswa) {
    if (!karakterSiswa) {
        return;
    }

    const text = String(karakterSiswa).trim();
    if (!text) {
        return;
    }

    if (text.includes(':')) {
        const parts = text.split(',');
        for (const part of parts) {
            const [label, value] = part.split(':').map((s) => s.trim());
            const field = TRAIT_FIELD_MAP[label?.toLowerCase()];
            if (!field || !value) {
                continue;
            }
            const point = await lookupPerilakuPoint(field, value);
            points[field] += point || PERILAKU_POINTS[value.toLowerCase()] || 0;
        }
        return;
    }

    // Legacy single-rating string — apply to tanggung_jawab as before
    const point = await lookupPerilakuPoint('tanggung_jawab', text);
    points.tanggung_jawab += point || PERILAKU_POINTS[text.toLowerCase()] || 0;
}

function calculateBreakdownTotal(points) {
    let total = points.point_awal || 80;
    total += points.prestasi_akademik || 0;
    total += points.prestasi_nonakademik || 0;
    total += points.tanggung_jawab || 0;
    total += points.disiplin || 0;
    total += points.kepedulian || 0;
    total += points.kemandirian || 0;
    total += points.spiritual || 0;
    total += points.kejujuran || 0;
    total += points.kepercayaan_diri || 0;
    total += points.organisasi || 0;
    total += points.kepanitiaan || 0;
    total += points.event || 0;
    total -= points.pelanggaran_ringan || 0;
    total -= points.pelanggaran_sedang || 0;
    total -= points.pelanggaran_berat || 0;
    total -= points.pelanggaran_lainnya || 0;
    return total;
}

async function buildIpcCardBreakdown(userId) {
    const [students] = await db.query(
        `SELECT id, nama, nis, kelas, grha, ipc_total, ipc_awal
         FROM users
         WHERE id = ? AND role = 'siswa'`,
        [userId]
    );

    if (students.length === 0) {
        return null;
    }

    const student = students[0];
    const points = createEmptyPoints(student.ipc_awal ?? 80);

    const [prestasi] = await db.query(
        `SELECT jenis, point FROM prestasi WHERE user_id = ? AND status = 'approved'`,
        [userId]
    );
    prestasi.forEach((row) => {
        if (row.jenis === 'akademik') {
            points.prestasi_akademik += row.point || 0;
        } else {
            points.prestasi_nonakademik += row.point || 0;
        }
    });

    const [organisasi] = await db.query(
        `SELECT point FROM organisasi WHERE user_id = ? AND status = 'approved'`,
        [userId]
    );
    points.organisasi = organisasi.reduce((sum, row) => sum + (row.point || 0), 0);

    const [kepanitiaan] = await db.query(
        `SELECT point FROM kepanitiaan WHERE user_id = ? AND status = 'approved'`,
        [userId]
    );
    points.kepanitiaan = kepanitiaan.reduce((sum, row) => sum + (row.point || 0), 0);

    const [event] = await db.query(
        `SELECT point FROM event WHERE user_id = ? AND status = 'approved'`,
        [userId]
    );
    points.event = event.reduce((sum, row) => sum + (row.point || 0), 0);

    const [pelanggaran] = await db.query(
        `SELECT jenis_pelanggaran, point_dikurangi FROM pelanggaran WHERE user_id = ? AND status = 'approved'`,
        [userId]
    );
    pelanggaran.forEach((row) => {
        const jenis = row.jenis_pelanggaran?.toLowerCase();
        if (jenis === 'ringan') {
            points.pelanggaran_ringan += row.point_dikurangi || 0;
        } else if (jenis === 'sedang') {
            points.pelanggaran_sedang += row.point_dikurangi || 0;
        } else if (jenis === 'berat') {
            points.pelanggaran_berat += row.point_dikurangi || 0;
        } else {
            points.pelanggaran_lainnya += row.point_dikurangi || 0;
        }
    });

    const [perilaku] = await db.query(
        `SELECT karakter_siswa, point FROM perilaku
         WHERE user_id = ? AND status = 'approved'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );
    if (perilaku.length > 0) {
        await addPerilakuPoints(points, perilaku[0].karakter_siswa);
    }

    const breakdownTotal = calculateBreakdownTotal(points);

    return {
        student,
        points,
        ipc_total: breakdownTotal,
        breakdown_total: breakdownTotal
    };
}

module.exports = {
    buildIpcCardBreakdown,
    calculateBreakdownTotal,
    createEmptyPoints
};
