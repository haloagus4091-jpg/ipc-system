import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import '../ipcPrint.css';

// ------------------------------------------------------------------
// KONFIGURASI WARNA
// ------------------------------------------------------------------
const COLORS = {
  headerPrestasi: [255, 242, 204], // kuning muda
  headerKarakter: [198, 224, 180], // hijau muda
  headerKeaktifan: [248, 203, 173], // oranye muda
  headerPelanggaran: [244, 199, 195], // pink muda
  headerTotal: [189, 215, 238], // biru muda

  cellJumlahPrestasi: [255, 242, 0], // kuning tegas
  cellJumlahKarakter: [169, 208, 142], // hijau tegas
  cellJumlahKeaktifan: [244, 176, 132], // oranye tegas
  cellJumlahPelanggaran: [255, 199, 206], // pink tegas

  textNegative: [192, 0, 0], // merah untuk nilai negatif
  borderGray: [180, 180, 180],
};

// Warna untuk ExcelJS (format ARGB)
const EXCEL_COLORS = {
  prestasi: "FFFFF2CC",
  karakter: "FFC6E0B4",
  keaktifan: "FFF8CBAD",
  pelanggaran: "FFF4C7C3",
  total: "FFBDD7EE",
  jumlahPrestasi: "FFFFFF00",
  jumlahKarakter: "FFA9D08E",
  jumlahKeaktifan: "FFF4B084",
  jumlahPelanggaran: "FFFFC7CE",
  headerAbu: "FFE6E6E6",
};

const THIN_BORDER = {
  top: { style: "thin", color: { argb: "FFB4B4B4" } },
  left: { style: "thin", color: { argb: "FFB4B4B4" } },
  bottom: { style: "thin", color: { argb: "FFB4B4B4" } },
  right: { style: "thin", color: { argb: "FFB4B4B4" } },
};

// Helper: Calculate totals - MUST MATCH BACKEND CALCULATION
function hitungTotal(s) {
  // Point awal (default 80 if not specified)
  const ipcAwal = s.ipc_awal || 80;
  
  // Prestasi
  const prestasiAkademik = Number(s.prestasi_akademik) || 0;
  const prestasiNonakademik = Number(s.prestasi_nonakademik) || 0;
  
  // Perilaku (7 karakter)
  const tanggungJawab = Number(s.tanggung_jawab) || 0;
  const disiplin = Number(s.disiplin) || 0;
  const kepedulian = Number(s.kepedulian) || 0;
  const kemandirian = Number(s.kemandirian) || 0;
  const spiritual = Number(s.spiritual) || 0;
  const kejujuran = Number(s.kejujuran) || 0;
  const kepercayaanDiri = Number(s.kepercayaan_diri) || 0;
  
  // Keaktifan
  const organisasi = Number(s.organisasi) || 0;
  const kepanitiaan = Number(s.kepanitiaan) || 0;
  const event = Number(s.event) || 0;
  
  // Pelanggaran
  const pelanggaranRingan = Number(s.pelanggaran_ringan) || 0;
  const pelanggaranSedang = Number(s.pelanggaran_sedang) || 0;
  const pelanggaranBerat = Number(s.pelanggaran_berat) || 0;
  
  const totalPrestasi = prestasiAkademik + prestasiNonakademik;
  const totalKarakter = tanggungJawab + disiplin + kepedulian + kemandirian + spiritual + kejujuran + kepercayaanDiri;
  const totalKeaktifan = organisasi + kepanitiaan + event;
  const totalPelanggaran = pelanggaranRingan + pelanggaranSedang + pelanggaranBerat;
  
  const ipcTotal = ipcAwal + totalPrestasi + totalKarakter + totalKeaktifan + totalPelanggaran;
  
  return {
    ipcAwal,
    totalPrestasi,
    totalKarakter,
    totalKeaktifan,
    totalPelanggaran,
    ipcTotal
  };
}

// Helper: Style cell
function styleCell(cell, { fill, bold, align = "center", color } = {}) {
  cell.border = THIN_BORDER;
  cell.alignment = { vertical: "middle", horizontal: align, wrapText: true };
  if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  if (bold) cell.font = { ...(cell.font || {}), bold: true, color: color ? { argb: color } : undefined };
  else if (color) cell.font = { ...(cell.font || {}), color: { argb: color } };
}

// Column definitions
const COLUMN_DEFS = [
  { key: "no", header1: "NO", merge: "v", width: 5 },
  { key: "nama", header1: "NAMA SISWA", merge: "v", width: 24, align: "left" },
  { key: "nis", header1: "NIS", merge: "v", width: 11 },
  { key: "kelas", header1: "KELAS", merge: "v", width: 10 },
  { key: "ghra", header1: "GHRA", merge: "v", width: 7 },
  { key: "pointAwal", header1: "Point Awal", merge: "v", width: 10 }, // Added point awal column

  { key: "prestasi_akademik", header1: "Prestasi", header2: "Akademik", group: "prestasi", width: 10 },
  { key: "prestasi_nonakademik", header2: "Non-Akademik", group: "prestasi", width: 15 },
  { key: "jumlahPrestasi", header2: "Jumlah", group: "prestasi", width: 10, jumlahFill: "jumlahPrestasi" },

  { key: "tanggung_jawab", header1: "Perkembangan Karakter", header2: "Tanggung Jawab", group: "karakter", width: 13 },
  { key: "disiplin", header2: "Disiplin", group: "karakter", width: 9 },
  { key: "kepedulian", header2: "Kepedulian", group: "karakter", width: 12 },
  { key: "kemandirian", header2: "Kemandirian", group: "karakter", width: 12 }, // Added kemandirian
  { key: "spiritual", header2: "Spiritual", group: "karakter", width: 9 },
  { key: "kejujuran", header2: "Kejujuran", group: "karakter", width: 9 },
  { key: "kepercayaan_diri", header2: "Kepercayaan Diri", group: "karakter", width: 15 },
  { key: "jumlahKarakter", header2: "Jumlah", group: "karakter", width: 10, jumlahFill: "jumlahKarakter" },

  { key: "organisasi", header1: "Keaktifan", header2: "Organisasi", group: "keaktifan", width: 10 },
  { key: "kepanitiaan", header2: "Kepanitiaan", group: "keaktifan", width: 11 },
  { key: "event", header2: "Event", group: "keaktifan", width: 8 },
  { key: "jumlahKeaktifan", header2: "Jumlah", group: "keaktifan", width: 10, jumlahFill: "jumlahKeaktifan" },

  { key: "pelanggaran_ringan", header1: "Pelanggaran", header2: "Ringan", group: "pelanggaran", width: 10 },
  { key: "pelanggaran_sedang", header2: "Sedang", group: "pelanggaran", width: 10 },
  { key: "pelanggaran_berat", header2: "Berat", group: "pelanggaran", width: 9 },
  { key: "jumlahPelanggaran", header2: "Jumlah", group: "pelanggaran", width: 10, jumlahFill: "jumlahPelanggaran" },

  { key: "totalIPC", header1: "Total IPC", merge: "v", width: 10, jumlahFill: "total" },
];

function buildRowValues(s) {
  const t = hitungTotal(s);
  return {
    no: s.no,
    nama: s.nama,
    nis: s.nis,
    kelas: s.kelas,
    ghra: s.ghra || "-",
    pointAwal: t.pointAwal, // Added point awal
    prestasi_akademik: Number(s.prestasi_akademik) ?? 0,
    prestasi_nonakademik: Number(s.prestasi_nonakademik) ?? 0,
    jumlahPrestasi: t.jumlahPrestasi,
    tanggung_jawab: Number(s.tanggung_jawab) ?? 0,
    disiplin: Number(s.disiplin) ?? 0,
    kepedulian: Number(s.kepedulian) ?? 0,
    kemandirian: Number(s.kemandirian) ?? 0, // Added kemandirian
    spiritual: Number(s.spiritual) ?? 0,
    kejujuran: Number(s.kejujuran) ?? 0,
    kepercayaan_diri: Number(s.kepercayaan_diri) ?? 0,
    jumlahKarakter: t.jumlahKarakter,
    organisasi: Number(s.organisasi) ?? 0,
    kepanitiaan: Number(s.kepanitiaan) ?? 0,
    event: Number(s.event) ?? 0,
    jumlahKeaktifan: t.jumlahKeaktifan,
    pelanggaran_ringan: Number(s.pelanggaran_ringan) ?? 0,
    pelanggaran_sedang: Number(s.pelanggaran_sedang) ?? 0,
    pelanggaran_berat: Number(s.pelanggaran_berat) ?? 0,
    jumlahPelanggaran: t.jumlahPelanggaran,
    totalIPC: t.totalIPC,
  };
}

// Index kolom body (0-based)
const COL = {
  NO: 0,
  NAMA: 1,
  NIS: 2,
  KELAS: 3,
  GHRA: 4,
  POINT_AWAL: 5, // Added point awal
  PRESTASI_AKADEMIK: 6,
  PRESTASI_NONAKADEMIK: 7,
  PRESTASI_JUMLAH: 8,
  KARAKTER_TJ: 9,
  KARAKTER_DISIPLIN: 10,
  KARAKTER_PEDULI: 11,
  KARAKTER_KEMANDIRIAN: 12, // Added kemandirian
  KARAKTER_SPIRITUAL: 13,
  KARAKTER_JUJUR: 14,
  KARAKTER_PD: 15,
  KARAKTER_JUMLAH: 16,
  KEAKTIFAN_ORGANISASI: 17,
  KEAKTIFAN_KEPANITIAAN: 18,
  KEAKTIFAN_EVENT: 19,
  KEAKTIFAN_JUMLAH: 20,
  PELANGGARAN_RINGAN: 21,
  PELANGGARAN_SEDANG: 22,
  PELANGGARAN_BERAT: 23,
  PELANGGARAN_JUMLAH: 24,
  TOTAL_IPC: 25,
};

function LaporanCetak({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [ipcLoading, setIpcLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [reportType, setReportType] = useState('individual'); // 'individual' or 'class'
  const [classStudents, setClassStudents] = useState([]);
  const [isWaliKelas, setIsWaliKelas] = useState(false);
  const [waliKelasInfo, setWaliKelasInfo] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);
  
  useEffect(() => {
    checkWaliKelasStatus();
    fetchStudents();
    fetchSchoolConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWaliKelasStatus = async () => {
    console.log('LaporanCetak - Checking wali kelas status, user:', user);
    if (user?.role === 'guru') {
      try {
        const token = localStorage.getItem('token');
        console.log('LaporanCetak - Calling /wali-kelas/my-class');
        const response = await axios.get('/wali-kelas/my-class', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('LaporanCetak - Wali kelas response:', response.data);
        setIsWaliKelas(true);
        setWaliKelasInfo(response.data);
        setSelectedClass(response.data.kelas); // Auto-select their class
        console.log('LaporanCetak - Set selectedClass to:', response.data.kelas);
      } catch (error) {
        console.log('LaporanCetak - Teacher is not a wali kelas:', error);
        setIsWaliKelas(false);
      }
    }
  };

  useEffect(() => {
    setSelectedStudentId('');
    setPdfPreviewUrl(null);
    setClassStudents([]);
  }, [selectedClass]);

  useEffect(() => {
    setPdfPreviewUrl(null);
    if (selectedClass && reportType === 'class') {
      fetchClassStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedClass]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (isWaliKelas && waliKelasInfo) {
        // For wali kelas, fetch only their class students
        response = await axios.get(`/reports/class-ipc/${waliKelasInfo.kelas}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(response.data);
        setClasses([waliKelasInfo.kelas]); // Only show their class
      } else {
        // For superadmin, fetch all students
        response = await axios.get('/reports/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(response.data);

        // Get unique classes from calculated classes
        const uniqueClasses = [...new Set(response.data.map(s => s.kelas).filter(Boolean))];
        setClasses(uniqueClasses.sort());
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    if (!selectedClass) return students;
    return students.filter(s => s.kelas === selectedClass);
  };

  const fetchIpcCard = async (userId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/reports/ipc-card/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  };

  const fetchClassStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/reports/class-ipc/${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassStudents(response.data);
    } catch (error) {
      console.error('Error fetching class students:', error);
    }
  };

  const fetchSchoolConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/school-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchoolConfig(response.data);
    } catch (error) {
      console.error('Error fetching school config:', error);
      // Use default values if fetch fails
      setSchoolConfig({
        school_name: 'SMK Negeri Bali Mandara',
        school_description: 'Sistem Index Prestasi Citra (IPC) • Panel Admin',
        principal_name: 'Nama Kepala Sekolah',
        principal_nip: '',
        logo_url: null
      });
    }
  };

  const generateClassReportPdf = async (students) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Fetch wali kelas data for this class
      let waliKelasData = { nama: 'Wali Kelas Belum Ditentukan', nip: '' };
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/wali-kelas/class/${selectedClass}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.nama) {
          waliKelasData = response.data;
          console.log('Wali kelas data fetched:', waliKelasData);
        } else {
          console.log('Wali kelas data response invalid:', response.data);
        }
      } catch (error) {
        console.error('Could not fetch wali kelas data:', error);
      }

      // Header Image
      try {
        const headerImg = '/header.png';
        doc.addImage(headerImg, 'PNG', 20, 10, doc.internal.pageSize.getWidth() - 40, 40);
      } catch (e) {
        console.log('Header image not found, using text fallback');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SMK NEGERI BALI MANDARA', doc.internal.pageSize.getWidth() / 2, 16, { align: 'center' });
      }

      // Title
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.text('LAPORAN IPC PER KELAS', doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
      doc.text('SMK NEGERI BALI MANDARA', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
      doc.text(`TAHUN PELAJARAN ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, doc.internal.pageSize.getWidth() / 2, 65, { align: 'center' });

      // Class info
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.text(`Kelas: ${selectedClass}`, 20, 75);

      let y = 78;

      // Prepare table data with full breakdown and subtotals
      const tableData = students.map((student, index) => {
        const points = student.points || {};
        const pointAwalNum = Number(points.point_awal || student.ipc_awal) || 80;

        // Calculate subtotals - MUST MATCH BACKEND CALCULATION
        // Use Number() to ensure type consistency (handle string/null from API)
        const prestasiTotal = (Number(points.prestasi_akademik) || 0) + (Number(points.prestasi_nonakademik) || 0);
        const karakterTotal = (Number(points.tanggung_jawab) || 0) + (Number(points.disiplin) || 0) + (Number(points.kepedulian) || 0) +
                             (Number(points.kemandirian) || 0) + // Added kemandirian
                             (Number(points.spiritual) || 0) + (Number(points.kejujuran) || 0) + (Number(points.kepercayaan_diri) || 0);
        const keaktifanTotal = (Number(points.organisasi) || 0) + (Number(points.kepanitiaan) || 0) + (Number(points.event) || 0);
        const pelanggaranTotal = (Number(points.pelanggaran_ringan) || 0) + (Number(points.pelanggaran_sedang) || 0) + (Number(points.pelanggaran_berat) || 0);

        // Calculate total to ensure consistency
        const calculatedTotal = pointAwalNum + prestasiTotal + karakterTotal + keaktifanTotal - pelanggaranTotal;

        // Debug log for troubleshooting
        console.log('DEBUG PDF points untuk', student.nama, ':', points, 'total:', calculatedTotal);

        // Use object first to ensure correct order, then convert to array
        // Order MUST match COLUMN_DEFS exactly for proper column mapping
        const row = {
          no: index + 1,
          nama: student.nama || '-',
          nis: student.nis || '-',
          kelas: student.kelas || '-',
          ghra: student.grha || '-',
          pointAwal: pointAwalNum,
          prestasi_akademik: Number(points.prestasi_akademik) || 0,
          prestasi_nonakademik: Number(points.prestasi_nonakademik) || 0,
          jumlahPrestasi: prestasiTotal,
          tanggung_jawab: Number(points.tanggung_jawab) || 0,
          disiplin: Number(points.disiplin) || 0,
          kepedulian: Number(points.kepedulian) || 0,
          kemandirian: Number(points.kemandirian) || 0,
          spiritual: Number(points.spiritual) || 0,
          kejujuran: Number(points.kejujuran) || 0,
          kepercayaan_diri: Number(points.kepercayaan_diri) || 0,
          jumlahKarakter: karakterTotal,
          organisasi: Number(points.organisasi) || 0,
          kepanitiaan: Number(points.kepanitiaan) || 0,
          event: Number(points.event) || 0,
          jumlahKeaktifan: keaktifanTotal,
          pelanggaran_ringan: Number(points.pelanggaran_ringan) || 0,
          pelanggaran_sedang: Number(points.pelanggaran_sedang) || 0,
          pelanggaran_berat: Number(points.pelanggaran_berat) || 0,
          jumlahPelanggaran: pelanggaranTotal,
          totalIPC: calculatedTotal < 0 ? `${calculatedTotal} (MINUS)` : calculatedTotal,
        };

        // Debug: verify object has exactly 26 properties
        if (Object.keys(row).length !== 26) {
          console.error('ERROR: Row object has wrong number of properties:', Object.keys(row).length, 'expected 26');
          console.error('Row keys:', Object.keys(row));
        }

        // Convert to array using explicit key order to match COLUMN_DEFS
        const columnOrder = [
          'no', 'nama', 'nis', 'kelas', 'ghra', 'pointAwal',
          'prestasi_akademik', 'prestasi_nonakademik', 'jumlahPrestasi',
          'tanggung_jawab', 'disiplin', 'kepedulian', 'kemandirian', 'spiritual', 'kejujuran', 'kepercayaan_diri', 'jumlahKarakter',
          'organisasi', 'kepanitiaan', 'event', 'jumlahKeaktifan',
          'pelanggaran_ringan', 'pelanggaran_sedang', 'pelanggaran_berat', 'jumlahPelanggaran',
          'totalIPC'
        ];

        return columnOrder.map(key => row[key]);
      });

      // Create merged header structure
      const headerRow1 = [
        { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'NAMA SISWA', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
        { content: 'NIS', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'KELAS', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'GHRA', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Point\nAwal', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fillColor: COLORS.headerTotal } }, // Added point awal with line break
        { content: 'Prestasi', colSpan: 3, styles: { halign: 'center', fillColor: COLORS.headerPrestasi } },
        { content: 'Perkembangan\nKarakter', colSpan: 8, styles: { halign: 'center', fillColor: COLORS.headerKarakter } },
        { content: 'Keaktifan', colSpan: 4, styles: { halign: 'center', fillColor: COLORS.headerKeaktifan } },
        { content: 'Pelanggaran', colSpan: 4, styles: { halign: 'center', fillColor: COLORS.headerPelanggaran } },
        { content: 'Total\nIPC', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fillColor: COLORS.headerTotal } },
      ];

      const headerRow2 = [
        { content: 'Akademik', styles: { fillColor: COLORS.headerPrestasi, halign: 'center', valign: 'middle' } },
        { content: 'Non-Akademik', styles: { fillColor: COLORS.headerPrestasi, halign: 'center', valign: 'middle' } },
        { content: 'Jumlah', styles: { fillColor: COLORS.headerPrestasi, halign: 'center', valign: 'middle' } },

        { content: 'Tg. Jawab', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Disiplin', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Peduli', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Mandiri', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Spiritual', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Jujur', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'P. Diri', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },
        { content: 'Jumlah', styles: { fillColor: COLORS.headerKarakter, halign: 'center', valign: 'middle' } },

        { content: 'Org.', styles: { fillColor: COLORS.headerKeaktifan, halign: 'center', valign: 'middle' } },
        { content: 'Panitia', styles: { fillColor: COLORS.headerKeaktifan, halign: 'center', valign: 'middle' } },
        { content: 'Event', styles: { fillColor: COLORS.headerKeaktifan, halign: 'center', valign: 'middle' } },
        { content: 'Jumlah', styles: { fillColor: COLORS.headerKeaktifan, halign: 'center', valign: 'middle' } },

        { content: 'Ringan', styles: { fillColor: COLORS.headerPelanggaran, halign: 'center', valign: 'middle' } },
        { content: 'Sedang', styles: { fillColor: COLORS.headerPelanggaran, halign: 'center', valign: 'middle' } },
        { content: 'Berat', styles: { fillColor: COLORS.headerPelanggaran, halign: 'center', valign: 'middle' } },
        { content: 'Jumlah', styles: { fillColor: COLORS.headerPelanggaran, halign: 'center', valign: 'middle' } },
      ];

      // Calculate dynamic margin to center table horizontally
      const columnStyles = {
        [COL.NO]: { cellWidth: 6 },
        [COL.NAMA]: { cellWidth: 22, halign: 'left', fontSize: 6 },
        [COL.NIS]: { cellWidth: 10 },
        [COL.KELAS]: { cellWidth: 9 },
        [COL.GHRA]: { cellWidth: 6 },
        [COL.POINT_AWAL]: { cellWidth: 9 },
        [COL.PRESTASI_AKADEMIK]: { cellWidth: 9 },
        [COL.PRESTASI_NONAKADEMIK]: { cellWidth: 13 },
        [COL.PRESTASI_JUMLAH]: { cellWidth: 8 },
        [COL.KARAKTER_TJ]: { cellWidth: 9 },
        [COL.KARAKTER_DISIPLIN]: { cellWidth: 9 },
        [COL.KARAKTER_PEDULI]: { cellWidth: 9 },
        [COL.KARAKTER_KEMANDIRIAN]: { cellWidth: 9 },
        [COL.KARAKTER_SPIRITUAL]: { cellWidth: 9 },
        [COL.KARAKTER_JUJUR]: { cellWidth: 7 },
        [COL.KARAKTER_PD]: { cellWidth: 8 },
        [COL.KARAKTER_JUMLAH]: { cellWidth: 8 },
        [COL.KEAKTIFAN_ORGANISASI]: { cellWidth: 8 },
        [COL.KEAKTIFAN_KEPANITIAAN]: { cellWidth: 9 },
        [COL.KEAKTIFAN_EVENT]: { cellWidth: 7 },
        [COL.KEAKTIFAN_JUMLAH]: { cellWidth: 8 },
        [COL.PELANGGARAN_RINGAN]: { cellWidth: 9 },
        [COL.PELANGGARAN_SEDANG]: { cellWidth: 9 },
        [COL.PELANGGARAN_BERAT]: { cellWidth: 7 },
        [COL.PELANGGARAN_JUMLAH]: { cellWidth: 8 },
        [COL.TOTAL_IPC]: { cellWidth: 10 },
      };

      const totalTableWidth = Object.values(columnStyles).reduce((sum, c) => sum + c.cellWidth, 0);
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = Math.max(10, (pageWidth - totalTableWidth) / 2);

      // Add table with merged headers
      autoTable(doc, {
        startY: y,
        head: [headerRow1, headerRow2],
        body: tableData,
        theme: 'grid',
        tableWidth: 'auto',
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        styles: {
          font: 'helvetica',
          fontSize: 6,
          cellPadding: 0.8,
          halign: 'center',
          valign: 'middle',
          lineColor: COLORS.borderGray,
          lineWidth: 0.1,
          overflow: 'linebreak',
          minCellHeight: 6.5,
        },
        headStyles: {
          fontStyle: 'bold',
          fontSize: 6.5,
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          minCellHeight: 18,
          valign: 'middle',
          cellPadding: 0.6,
          overflow: 'linebreak',
        },
        columnStyles,
        margin: { left: marginX, right: marginX, top: 10, bottom: 20 },
        didParseCell: (data) => {
          if (data.section !== 'body') return;
          const col = data.column.index;
          const raw = data.cell.raw;

          if (col === COL.PRESTASI_JUMLAH) {
            data.cell.styles.fillColor = COLORS.cellJumlahPrestasi;
            data.cell.styles.fontStyle = 'bold';
          }
          if (col === COL.KARAKTER_JUMLAH) {
            data.cell.styles.fillColor = COLORS.cellJumlahKarakter;
            data.cell.styles.fontStyle = 'bold';
          }
          if (col === COL.KEAKTIFAN_JUMLAH) {
            data.cell.styles.fillColor = COLORS.cellJumlahKeaktifan;
            data.cell.styles.fontStyle = 'bold';
          }
          if (col === COL.PELANGGARAN_JUMLAH) {
            data.cell.styles.fillColor = COLORS.cellJumlahPelanggaran;
            data.cell.styles.fontStyle = 'bold';
          }
          if (col === COL.TOTAL_IPC) {
            data.cell.styles.fillColor = COLORS.headerTotal;
            data.cell.styles.fontStyle = 'bold';
          }

          // Nilai negatif ditampilkan merah
          if (typeof raw === 'number' && raw < 0) {
            data.cell.styles.textColor = COLORS.textNegative;
          }
          // Handle string negative values
          if (typeof raw === 'string' && raw.includes('MINUS')) {
            data.cell.styles.textColor = COLORS.textNegative;
          }
        },
      });

      // Add footnote for abbreviations
      const noteY = doc.lastAutoTable.finalY + 4;
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.text(
        'Ket: T. Jawab = Tanggung Jawab, Peduli = Kepedulian, P. Diri = Kepercayaan Diri, Panitia = Kepanitiaan',
        marginX,
        noteY
      );

      // Signatures
      const finalY = doc.lastAutoTable.finalY + 20;
      const leftX = 20;
      const rightX = doc.internal.pageSize.getWidth() - 90;

      const formatDate = () => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date().toLocaleDateString('id-ID', options);
      };

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text('Mengetahui,', leftX, finalY);
      doc.text(`Kubutambahan, ${formatDate()}`, rightX, finalY);

      doc.setFont('times', 'bold');
      doc.text('Kepala Sekolah', leftX, finalY + 5);
      doc.text('Wali Kelas', rightX, finalY + 5);

      // Ruang tanda tangan
      const ttdY = finalY + 22;
      doc.setFont('times', 'bold');
      doc.text(schoolConfig?.principal_name || 'Ketut Susila Widiarsana, S.Pd., M.Pd.', leftX, ttdY);
      doc.text(waliKelasData.nama || 'Wali Kelas Belum Ditentukan', rightX, ttdY);

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(schoolConfig?.principal_nip || 'NIP. 19831101 200803 1 001', leftX, ttdY + 5);
      if (waliKelasData.nip) {
        doc.text(`NIP. ${waliKelasData.nip}`, rightX, ttdY + 5);
      }

      return doc.output('blob');
    } catch (e) {
      console.error('Error generating class report PDF:', e);
      return null;
    }
  };

  const generateExcelBlob = async () => {
    if (reportType === 'individual') {
      // For individual report, we'll handle separately if needed
      return null;
    } else if (reportType === 'class') {
      // For class report, generate Excel with leger format using ExcelJS
      try {
        // Prepare student data in the format expected by the Excel generator
        const formattedStudents = classStudents.map((student, index) => {
          const points = student.points || {};
          console.log('DEBUG Excel generation untuk', student.nama, ':', points);
          return {
            no: index + 1,
            nama: student.nama || '-',
            nis: student.nis || '-',
            kelas: student.kelas || '-',
            ghra: student.grha || '-',
            // Use snake_case to match backend API directly
            prestasi_akademik: Number(points.prestasi_akademik) || 0,
            prestasi_nonakademik: Number(points.prestasi_nonakademik) || 0,
            tanggung_jawab: Number(points.tanggung_jawab) || 0,
            disiplin: Number(points.disiplin) || 0,
            kepedulian: Number(points.kepedulian) || 0,
            kemandirian: Number(points.kemandirian) || 0,
            spiritual: Number(points.spiritual) || 0,
            kejujuran: Number(points.kejujuran) || 0,
            kepercayaan_diri: Number(points.kepercayaan_diri) || 0,
            organisasi: Number(points.organisasi) || 0,
            kepanitiaan: Number(points.kepanitiaan) || 0,
            event: Number(points.event) || 0,
            pelanggaran_ringan: Number(points.pelanggaran_ringan) || 0,
            pelanggaran_sedang: Number(points.pelanggaran_sedang) || 0,
            pelanggaran_berat: Number(points.pelanggaran_berat) || 0,
          };
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Laporan IPC", {
          pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
        });
        sheet.properties.defaultRowHeight = 20;

        const totalCols = COLUMN_DEFS.length;
        const tahunPelajaran = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

        // ---- Judul di atas tabel ----
        sheet.mergeCells(1, 1, 1, totalCols);
        sheet.getCell(1, 1).value = "LAPORAN IPC PER KELAS";
        sheet.getCell(1, 1).font = { bold: true, size: 13 };
        sheet.getCell(1, 1).alignment = { horizontal: "center" };

        sheet.mergeCells(2, 1, 2, totalCols);
        sheet.getCell(2, 1).value = schoolConfig?.school_name || "SMK NEGERI BALI MANDARA";
        sheet.getCell(2, 1).font = { bold: true };
        sheet.getCell(2, 1).alignment = { horizontal: "center" };

        sheet.mergeCells(3, 1, 3, totalCols);
        sheet.getCell(3, 1).value = `TAHUN PELAJARAN ${tahunPelajaran}`;
        sheet.getCell(3, 1).font = { bold: true };
        sheet.getCell(3, 1).alignment = { horizontal: "center" };

        sheet.mergeCells(5, 1, 5, totalCols);
        sheet.getCell(5, 1).value = `Kelas: ${selectedClass}`;
        sheet.getCell(5, 1).font = { bold: true };

        // Baris 6 dikosongkan sebagai jarak
        const HEAD_ROW_1 = 7; // baris grup
        const HEAD_ROW_2 = 8; // baris sub-header
        const DATA_START_ROW = 9;

        // ---- Set lebar kolom ----
        COLUMN_DEFS.forEach((def, i) => {
          sheet.getColumn(i + 1).width = def.width;
        });

        // ---- Set tinggi baris header supaya teks tidak kepotong ----
        sheet.getRow(HEAD_ROW_1).height = 22;
        sheet.getRow(HEAD_ROW_2).height = 38;

        // ---- Tulis header baris 1 & 2, sekaligus merge sesuai grup/rowspan ----
        let colCursor = 1;
        while (colCursor <= totalCols) {
          const def = COLUMN_DEFS[colCursor - 1];

          if (def.merge === "v") {
            // Kolom rowspan 2
            sheet.mergeCells(HEAD_ROW_1, colCursor, HEAD_ROW_2, colCursor);
            const cell = sheet.getCell(HEAD_ROW_1, colCursor);
            cell.value = def.header1;
            styleCell(cell, { fill: def.jumlahFill ? EXCEL_COLORS[def.jumlahFill] : EXCEL_COLORS.headerAbu, bold: true });

            // style cell kedua juga (walau sudah merge) supaya border-nya konsisten
            styleCell(sheet.getCell(HEAD_ROW_2, colCursor), { fill: def.jumlahFill ? EXCEL_COLORS[def.jumlahFill] : EXCEL_COLORS.headerAbu, bold: true });

            colCursor += 1;
            continue;
          }

          if (def.group) {
            // Hitung berapa banyak kolom berturutan dengan group yang sama
            let span = 1;
            while (
              colCursor + span <= totalCols &&
              COLUMN_DEFS[colCursor + span - 1] &&
              COLUMN_DEFS[colCursor + span - 1].group === def.group
            ) {
              span += 1;
            }

            if (span > 1) {
              sheet.mergeCells(HEAD_ROW_1, colCursor, HEAD_ROW_1, colCursor + span - 1);
            }

            // PENTING: style SEMUA cell dalam rentang merge, bukan cuma cell pertama,
            // supaya border tidak bolong di tengah setelah merge
            for (let k = 0; k < span; k++) {
              const groupCell = sheet.getCell(HEAD_ROW_1, colCursor + k);
              if (k === 0) groupCell.value = def.header1;
              styleCell(groupCell, { fill: EXCEL_COLORS[def.group], bold: true });
            }

            for (let k = 0; k < span; k++) {
              const subDef = COLUMN_DEFS[colCursor - 1 + k];
              const subCell = sheet.getCell(HEAD_ROW_2, colCursor + k);
              subCell.value = subDef.header2;
              styleCell(subCell, { fill: EXCEL_COLORS[subDef.group], bold: true });
            }

            colCursor += span;
            continue;
          }

          colCursor += 1;
        }

        // ---- Tulis baris data siswa ----
        formattedStudents.forEach((s, idx) => {
          const rowNum = DATA_START_ROW + idx;
          const values = buildRowValues(s);

          COLUMN_DEFS.forEach((def, colIdx) => {
            const cell = sheet.getCell(rowNum, colIdx + 1);
            cell.value = values[def.key];

            const isNegative = typeof values[def.key] === "number" && values[def.key] < 0;

            styleCell(cell, {
              fill: def.jumlahFill ? EXCEL_COLORS[def.jumlahFill] : undefined,
              bold: !!def.jumlahFill,
              align: def.align || "center",
              color: isNegative ? "FFC00000" : undefined,
            });
          });
        });

        // ---- Freeze panes supaya header tetap kelihatan saat scroll ----
        sheet.views = [{ state: "frozen", ySplit: HEAD_ROW_2 }];

        // ---- Trigger download ----
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
      } catch (error) {
        console.error('Error generating Excel:', error);
        return null;
      }
    }
    return null;
  };

  // eslint-disable-next-line no-unused-vars
  const generatePdfBlob = async () => {
    let data = [];

    if (reportType === 'individual') {
      // If no data yet but a student is selected, fetch it
      if (data.length === 0 && selectedStudentId) {
        try {
          const studentData = await fetchIpcCard(selectedStudentId);
          data = [studentData];
        } catch (error) {
          console.error('Error fetching IPC card:', error);
          return null;
        }
      }
    } else if (reportType === 'class') {
      // For class report, use the class students data
      data = classStudents;
    }

    if (data.length === 0) {
      return null;
    }

    // For class report, generate different PDF format
    if (reportType === 'class') {
      return generateClassReportPdf(data);
    }

    try {
      // Create jsPDF instance with selected options
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add content for each student
      
      data.forEach((cardData, index) => {
        if (index > 0) {
          doc.addPage();
        }

        const { student, wali, points, ipc_total } = cardData;
        const breakdown = points || {
          point_awal: student?.ipc_awal ?? 80,
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
          pelanggaran_berat: 0
        };

        // Calculate total from breakdown to ensure synchronization
        const calculateTotalFromBreakdown = (breakdown) => {
          let total = Number(breakdown.point_awal) || 80;
          total += Number(breakdown.prestasi_akademik) || 0;
          total += Number(breakdown.prestasi_nonakademik) || 0;
          total += Number(breakdown.tanggung_jawab) || 0;
          total += Number(breakdown.disiplin) || 0;
          total += Number(breakdown.kepedulian) || 0;
          total += Number(breakdown.kemandirian) || 0;
          total += Number(breakdown.spiritual) || 0;
          total += Number(breakdown.kejujuran) || 0;
          total += Number(breakdown.kepercayaan_diri) || 0;
          total += Number(breakdown.organisasi) || 0;
          total += Number(breakdown.kepanitiaan) || 0;
          total += Number(breakdown.event) || 0;
          total -= Number(breakdown.pelanggaran_ringan) || 0;
          total -= Number(breakdown.pelanggaran_sedang) || 0;
          total -= Number(breakdown.pelanggaran_berat) || 0;
          return total;
        };

        const total = ipc_total ?? student?.ipc_total ?? calculateTotalFromBreakdown(breakdown);

        // Format total with negative indicator
        const formatTotal = (value) => {
          if (value < 0) {
            return `${value} (MINUS)`;
          }
          return value;
        };

        // Header Image
        try {
          const headerImg = '/header.png';
          doc.addImage(headerImg, 'PNG', 20, 10, doc.internal.pageSize.getWidth() - 40, 40);
        } catch (e) {
          console.log('Header image not found, using text fallback');
          // Fallback to text if image fails
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('SMK NEGERI BALI MANDARA', doc.internal.pageSize.getWidth() / 2, 16, { align: 'center' });
        }
        
        // Title
        doc.setFontSize(10);
        doc.setFont('times', 'bold');
        doc.text('INDIVIDUAL POINT CARD', doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
        doc.text('SMK NEGERI BALI MANDARA', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' }); 
        doc.text(`TAHUN PELAJARAN ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, doc.internal.pageSize.getWidth() / 2, 65, { align: 'center' });

        // Student Info
        let yPos = 70;
        doc.setFontSize(8);
        doc.setFont('times', 'bold');
        
        // Left column
        doc.text('Nama:', 20, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.nama || '-', 20 + 20, yPos);
        
        yPos += 5;
        doc.setFont('times', 'bold');
        doc.text('NIS:', 20, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.nis || '-', 20 + 20, yPos);
        
        yPos += 5;
        doc.setFont('times', 'bold');
        doc.text('Wali Kelas:', 20, yPos);
        doc.setFont('times', 'normal');
        doc.text(wali?.nama || 'Wali Kelas Belum Ditentukan', 20 + 20, yPos);

        // Right column
        yPos = 70;
        const rightX = doc.internal.pageSize.getWidth() - 65;
        doc.setFont('times', 'bold');
        doc.text('Kelas:', rightX, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.kelas || '-', rightX + 15, yPos);
        
        yPos += 5;
        doc.setFont('times', 'bold');
        doc.text('Jurusan:', rightX, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.jurusan || '-', rightX + 15, yPos);
        
        yPos += 5;
        doc.setFont('times', 'bold');
        doc.text('Grha:', rightX, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.grha || '-', rightX + 15, yPos);
        
        yPos += 5;
        doc.setFont('times', 'bold');
        doc.text('Tahun Pelajaran:', rightX, yPos);
        doc.setFont('times', 'normal');
        doc.text(student?.tahun_pelajaran || '-', rightX + 25, yPos);
        
        // Add more spacing before table to prevent overlap
        yPos += 10;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos);

        // Table using jspdf-autotable
        const tableData = [
          ['I Point Awal', ''],
          ['', breakdown.point_awal],
          ['II Prestasi', ''],
          ['1. Akademik', breakdown.prestasi_akademik],
          ['2. Non-Akademik', breakdown.prestasi_nonakademik],
          ['Jumlah Prestasi', (Number(breakdown.prestasi_akademik) || 0) + (Number(breakdown.prestasi_nonakademik) || 0)],
          ['III Perkembangan Karakter', ''],
          ['1. Tanggung Jawab', breakdown.tanggung_jawab],
          ['2. Disiplin', breakdown.disiplin],
          ['3. Kepedulian', breakdown.kepedulian],
          ['4. Kemandirian', breakdown.kemandirian],
          ['5. Spiritual', breakdown.spiritual],
          ['6. Kejujuran', breakdown.kejujuran],
          ['7. Kepercayaan Diri', breakdown.kepercayaan_diri],
          ['Jumlah Perkembangan Karakter', (Number(breakdown.tanggung_jawab) || 0) + (Number(breakdown.disiplin) || 0) + (Number(breakdown.kepedulian) || 0) + (Number(breakdown.kemandirian) || 0) + (Number(breakdown.spiritual) || 0) + (Number(breakdown.kejujuran) || 0) + (Number(breakdown.kepercayaan_diri) || 0)],
          ['IV Organisasi', ''],
          ['', breakdown.organisasi],
          ['V Kepanitiaan', ''],
          ['', breakdown.kepanitiaan],
          ['VI Event', ''],
          ['', breakdown.event],
          ['Jumlah Keaktifan', (Number(breakdown.organisasi) || 0) + (Number(breakdown.kepanitiaan) || 0) + (Number(breakdown.event) || 0)],
          ['VII Pelanggaran', ''],
          ['1. Ringan', breakdown.pelanggaran_ringan],
          ['2. Sedang', breakdown.pelanggaran_sedang],
          ['3. Berat', breakdown.pelanggaran_berat],
          ['Jumlah Pelanggaran', (Number(breakdown.pelanggaran_ringan) || 0) + (Number(breakdown.pelanggaran_sedang) || 0) + (Number(breakdown.pelanggaran_berat) || 0)],
          ['TOTAL POINT IPC', formatTotal(total)]
        ];

        autoTable(doc, {
          startY: 95,
          head: [['Point IPC', 'Point']],
          body: tableData,
          theme: 'grid',
          styles: {
            font: 'times',
            fontSize: 8,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0]
          },
          headStyles: {
            fillColor: [240, 240, 240],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 8,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto', halign: 'right' }
          },
          margin: { left: 20, right: 20, top: 10, bottom: 20 },
          didParseCell: function(data) {
            // Style section headers (rows where first cell contains Roman numerals or section names)
            const sectionHeaders = ['I Point Awal', 'II Prestasi', 'III Perkembangan Karakter', 'IV Organisasi', 'V Kepanitiaan', 'VI Event', 'VII Pelanggaran', 'TOTAL POINT IPC'];
            if (sectionHeaders.includes(data.row.raw[0])) {
              data.cell.styles.fillColor = [224, 224, 224];
              data.cell.styles.fontStyle = 'bold';
            }
            // Style subtotal rows
            const subtotalRows = ['Jumlah Prestasi', 'Jumlah Perkembangan Karakter', 'Jumlah Keaktifan', 'Jumlah Pelanggaran'];
            if (subtotalRows.includes(data.row.raw[0])) {
              data.cell.styles.fillColor = [230, 240, 255];
              data.cell.styles.fontStyle = 'bold';
            }
            // Style total row specifically
            if (data.row.raw[0] === 'TOTAL POINT IPC') {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
            }
            // Style negative values in red
            if (data.section === 'body' && data.column.index === 1 && typeof data.cell.raw === 'number' && data.cell.raw < 0) {
              data.cell.styles.textColor = [255, 0, 0];
            }
          }
        });

        // Signatures - get the final Y position from the table
        const finalY = doc.lastAutoTable.finalY || 78;
        const sigY = finalY + 8;
        const leftSigX = 20;
        const rightSigX = doc.internal.pageSize.getWidth() - 75;
        
        const formatDate = () => {
          const options = { day: 'numeric', month: 'long', year: 'numeric' };
          return new Date().toLocaleDateString('id-ID', options);
        };

        doc.setFontSize(8);
        doc.setFont('times', 'normal');
        doc.text('Mengetahui,', leftSigX, sigY);
        doc.text(`Kubutambahan, ${formatDate()}`, rightSigX, sigY);
        
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.text('Kepala Sekolah', leftSigX, sigY + 5);
        doc.text('Wali Kelas', rightSigX, sigY + 5);
        
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.text(schoolConfig?.principal_name || 'Ketut Susila Widiarsana, S.Pd., M.Pd.', leftSigX, sigY + 20);
        doc.text(wali?.nama || 'Wali Kelas Belum Ditentukan', rightSigX, sigY + 20);
        
        doc.setFont('times', 'normal');
        doc.setFontSize(7);
        doc.text(schoolConfig?.principal_nip || 'NIP. 19831101 200803 1 001', leftSigX, sigY + 25);
        if (wali?.nip) {
          doc.text(`NIP. ${wali.nip}`, rightSigX, sigY + 25);
        }
      });

      return doc.output('blob');
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleDownloadExcel = async () => {
    const filename = `Laporan_IPC_Kelas_${selectedClass || 'SEMUA'}.xlsx`;

    try {
      setExcelLoading(true);
      const blob = await generateExcelBlob();
      if (blob) {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Gagal membuat Excel');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal membuat Excel');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    let filename;

    if (reportType === 'individual') {
      if (!selectedStudentId) {
        alert('Pilih siswa terlebih dahulu');
        return;
      }

      try {
        setIpcLoading(true);
        const token = localStorage.getItem('token');
        
        // Call backend endpoint for PDF generation
        const response = await axios.get(`/reports/ipc-card-pdf/${selectedStudentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        if (!filename) {
          filename = `IPC_SISWA.pdf`;
        }
        
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error(e);
        alert('Gagal membuat PDF');
      } finally {
        setIpcLoading(false);
      }
    } else {
      // Class report - use backend endpoint for PDF generation
      if (!selectedClass) {
        alert('Pilih kelas terlebih dahulu');
        return;
      }

      try {
        setIpcLoading(true);
        const token = localStorage.getItem('token');
        
        // Call backend endpoint for class report PDF generation
        const response = await axios.get(`/reports/leger-pdf/${encodeURIComponent(selectedClass)}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        if (!filename) {
          filename = `Leger_IPC_Kelas_${selectedClass}.pdf`;
        }
        
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error(e);
        alert('Gagal membuat PDF');
      } finally {
        setIpcLoading(false);
      }
    }
  };

  const handleGeneratePreview = async () => {
    if (reportType === 'individual') {
      if (!selectedStudentId) {
        alert('Pilih siswa terlebih dahulu');
        return;
      }

      try {
        setIpcLoading(true);
        const token = localStorage.getItem('token');
        
        // Call backend endpoint for PDF preview (inline)
        const response = await axios.get(`/reports/ipc-card-preview/${selectedStudentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        // Create preview URL from blob
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfPreviewUrl(url);
      } catch (e) {
        console.error(e);
        alert('Gagal membuat preview PDF');
      } finally {
        setIpcLoading(false);
      }
    } else {
      // Class report - use backend endpoint for PDF preview
      if (!selectedClass) {
        alert('Pilih kelas terlebih dahulu');
        return;
      }

      try {
        setIpcLoading(true);
        const token = localStorage.getItem('token');
        
        // Call backend endpoint for class report PDF preview (inline)
        const response = await axios.get(`/reports/leger-preview/${encodeURIComponent(selectedClass)}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        // Create preview URL from blob
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfPreviewUrl(url);
      } catch (e) {
        console.error(e);
        alert('Gagal membuat preview PDF');
      } finally {
        setIpcLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredStudents = getFilteredStudents();

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h2 className="ipc-print-no-print laporan-cetak-title" style={{ marginBottom: '20px' }}>
        {isWaliKelas ? `Laporan & Cetak - Wali Kelas ${waliKelasInfo?.kelas}` : 'Laporan & Cetak'}
      </h2>

      {isWaliKelas && (
        <div className="alert alert-info ipc-print-no-print" style={{ marginBottom: '20px' }}>
          <strong>Mode Wali Kelas:</strong> Anda hanya dapat melihat dan mencetak laporan untuk kelas {waliKelasInfo?.kelas} dengan {waliKelasInfo?.totalSiswa} siswa.
        </div>
      )}

      <div className="ipc-print-no-print" style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Filter Kelas:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={isWaliKelas} // Disable for wali kelas
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '200px', backgroundColor: isWaliKelas ? '#f0f0f0' : 'white' }}
        >
          {isWaliKelas ? (
            <option value={waliKelasInfo?.kelas}>{waliKelasInfo?.kelas}</option>
          ) : (
            <>
              <option value="">Semua Kelas</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="ipc-print-no-print" style={{ marginBottom: '24px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '12px' }}>Cetak Laporan IPC</h3>
        <p style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Pilih jenis laporan yang ingin dicetak.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Jenis Laporan:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '200px' }}
          >
            <option value="individual">Individual Point Card (IPC)</option>
            <option value="class">Laporan IPC Per Kelas</option>
          </select>
        </div>

        {reportType === 'individual' ? (
          <>
            <p style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Format cetak mengikuti lembar IPC resmi sekolah (satu siswa per halaman A4).
            </p>

            <div className="ipc-print-toolbar">
              <div>
                <label htmlFor="ipc-student-select">Siswa:</label>
                <select
                  id="ipc-student-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">{selectedClass ? '— Pilih siswa —' : '— Pilih kelas dulu —'}</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleGeneratePreview} disabled={(!selectedStudentId) || ipcLoading}>
                {ipcLoading ? 'Membuat Preview PDF...' : 'Preview PDF'}
              </button>
              <button type="button" onClick={handleDownloadPdf} disabled={(!selectedStudentId) || ipcLoading}>
                {ipcLoading ? 'Membuat PDF...' : 'Download PDF'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Format cetak menampilkan Leger IPC Individual Point Card dengan format tabel lengkap termasuk NIS, Nama, Kelas, GHRA, breakdown IPC (Prestasi, Perkembangan Karakter, Keaktifan, Pelanggaran), dan Total IPC dalam format landscape yang rapi dan profesional.
            </p>

            <div className="ipc-print-toolbar">
              <div>
                <span style={{ marginRight: '10px' }}>
                  {selectedClass ? `${classStudents.length} siswa di kelas ${selectedClass}` : 'Pilih kelas terlebih dahulu'}
                </span>
              </div>
              <button type="button" onClick={handleGeneratePreview} disabled={(!selectedClass) || ipcLoading}>
                {ipcLoading ? 'Membuat Preview PDF...' : 'Preview PDF'}
              </button>
              <button type="button" onClick={handleDownloadPdf} disabled={(!selectedClass) || ipcLoading}>
                {ipcLoading ? 'Membuat PDF...' : 'Download PDF'}
              </button>
              <button type="button" onClick={handleDownloadExcel} disabled={(!selectedClass) || excelLoading} className="btn btn-success">
                {excelLoading ? 'Membuat Excel...' : 'Download Excel'}
              </button>
            </div>
          </>
        )}
      </div>

      {pdfPreviewUrl && (
        <div className="ipc-print-preview-wrap">
          <h3 className="ipc-print-no-print" style={{ marginBottom: '16px' }}>
            Preview PDF
            {reportType === 'individual' && selectedStudentId
              ? ` — Siswa Terpilih`
              : reportType === 'class' && selectedClass
              ? ` — Kelas ${selectedClass}`
              : ''}
          </h3>

          <div style={{ width: '100%', height: '800px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe
              src={pdfPreviewUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LaporanCetak;
