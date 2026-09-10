import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import StudentDetail from './StudentDetail';
import { GRHA_OPTIONS, getRowField, normalizeGrha } from '../utils/excelImport';

const JABATAN_OPTIONS = ['Guru', 'Pegawai', 'Staff'];

const KELAS_OPTIONS = [
  'X TKJ 1', 'X TKJ 2', 'X TKR 1', 'X TKR 2',
  'X DPIB 1', 'X DPIB 2',
  'XI TKJ 1', 'XI TKJ 2', 'XI TKR 1', 'XI TKR 2',
  'XI DPIB 1', 'XI DPIB 2',
  'XII TKJ 1', 'XII TKJ 2', 'XII TKR 1', 'XII TKR 2',
  'XII DPIB 1', 'XII DPIB 2'
];

function KelolaAkun() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [editStudent, setEditStudent] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    kelas: '',
    grha: '',
    jurusan: '',
    tahun_pelajaran: ''
  });
  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState([]);
  const [importType, setImportType] = useState('siswa');
  const [detailStudent, setDetailStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionRole, setSelectionRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalType, setImportModalType] = useState('');
  const [showEditBiodataModal, setShowEditBiodataModal] = useState(false);
  const [showClassValidationModal, setShowClassValidationModal] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validatingClasses, setValidatingClasses] = useState(false);

  const grhaOptions = GRHA_OPTIONS;

  const filteredUsers = users.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.kelas && user.kelas !== filters.kelas) return false;
    if (filters.grha && user.grha !== filters.grha) return false;
    if (filters.jurusan && user.jurusan !== filters.jurusan) return false;
    if (filters.tahun_pelajaran && user.tahun_pelajaran !== filters.tahun_pelajaran) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ role: '', kelas: '', grha: '', jurusan: '', tahun_pelajaran: '' });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // If guru, only show students. If superadmin, show all users
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.role === 'guru') {
        const students = response.data.filter(user => user.role === 'siswa');
        setUsers(students);
      } else {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/users/create-student', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Akun siswa berhasil dibuat!');
      setShowCreateModal(false);
      setFormData({});
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal membuat akun');
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/users/create-teacher', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Akun guru berhasil dibuat!');
      setShowCreateModal(false);
      setFormData({});
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal membuat akun');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Akun berhasil dihapus!');
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus akun');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setMessage('Pilih minimal satu pengguna');
      return;
    }

    const label = selectionRole === 'guru' ? 'guru' : 'siswa';
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} akun ${label}?\n\nData terkait (pengajuan/notifications) juga akan ikut terhapus.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/users/bulk-delete', { user_ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Berhasil menghapus ${selectedIds.length} akun`);
      setSelectedIds([]);
      setSelectionRole(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus akun (bulk)');
    }
  };

  const toggleUserSelection = (user) => {
    if (user.role === 'superadmin') {
      return;
    }

    if (selectedIds.includes(user.id)) {
      const next = selectedIds.filter((id) => id !== user.id);
      setSelectedIds(next);
      if (next.length === 0) {
        setSelectionRole(null);
      }
      return;
    }

    if (selectionRole && user.role !== selectionRole) {
      setMessage('Tidak bisa memilih siswa dan guru sekaligus. Kosongkan pilihan terlebih dahulu.');
      return;
    }

    setSelectionRole(user.role);
    setSelectedIds([...selectedIds, user.id]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionRole(null);
  };

  const selectAllFiltered = () => {
    const selectable = filteredUsers.filter((u) => u.role !== 'superadmin');
    if (selectable.length === 0) {
      return;
    }

    // Allow selecting all regardless of role mixing
    setSelectedIds(selectable.map((u) => u.id));
    setSelectionRole(null); // Reset selection role to allow mixed selection
  };

  const isUserSelectable = (user) => user.role !== 'superadmin';
  const isUserDisabled = (user) => {
    if (!isUserSelectable(user)) return true;
    // Only disable if selectionRole is set and user role doesn't match
    // If selectionRole is null, allow mixed selection
    if (!selectionRole) return false;
    return user.role !== selectionRole;
  };

  const handleEditUser = (user) => {
    setEditStudent(user);
    if (user.role === 'siswa') {
      setFormData({
        nama: user.nama,
        nis: user.nis,
        jurusan: user.jurusan,
        grha: user.grha,
        tahun_pelajaran: user.tahun_pelajaran
      });
    } else if (user.role === 'guru') {
      setFormData({
        nama: user.nama,
        nip: user.nip,
        jabatan: user.jabatan || user.detail || '',
        no_hp: user.no_hp
      });
    }
    setShowEditBiodataModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (userRole === 'guru' && editStudent.role === 'siswa') {
        // Guru needs approval to update student biodata
        await axios.post(`/users/${editStudent.id}/biodata-request`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Permintaan update biodata berhasil diajukan, menunggu persetujuan SuperAdmin!');
      } else {
        // SuperAdmin updates directly
        await axios.put(`/users/${editStudent.id}/biodata`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`Data ${editStudent.role === 'siswa' ? 'siswa' : 'guru'} berhasil diupdate!`);
      }
      
      setShowEditBiodataModal(false);
      setEditStudent(null);
      setFormData({});
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal update data');
    }
  };

  const handleExcelFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      setMessage('Please select an Excel file');
      return;
    }

    setImporting(true);
    setImportResults([]);
    const results = [];

    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const token = localStorage.getItem('token');

      for (const row of jsonData) {
        try {
          if (importType === 'siswa') {
            // Skip rows without nama (might be header or empty)
            const nama = getRowField(row, 'nama', 'Nama');
            if (!nama) {
              continue;
            }

            // Import student
            const jurusan = getRowField(row, 'jurusan', 'Jurusan');
            const tahunPelajaran = getRowField(row, 'tahun_pelajaran', 'Tahun Pelajaran', 'TahunPelajaran');
            
            // Validate jurusan
            const validJurusanOptions = ['TKJ 1', 'TKJ 2', 'DPIB 1', 'DPIB 2', 'TKR 1', 'TKR 2'];
            if (!jurusan || !validJurusanOptions.includes(jurusan)) {
              results.push({
                status: 'error',
                name: nama,
                error: `Jurusan tidak valid. Gunakan: ${validJurusanOptions.join(', ')}`
              });
              continue;
            }
            
            // Validate tahun_pelajaran format
            if (!tahunPelajaran || !/^\d{4}-\d{4}$/.test(tahunPelajaran)) {
              results.push({
                status: 'error',
                name: nama,
                error: 'Tahun pelajaran tidak valid. Format harus YYYY-YYYY (contoh: 2024-2025)'
              });
              continue;
            }

            // Calculate expected class for better feedback
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const currentAcademicYear = currentMonth >= 6 
              ? `${currentYear}-${currentYear + 1}` 
              : `${currentYear - 1}-${currentYear}`;
            
            const [enrollStart] = tahunPelajaran.split('-').map(Number);
            const [currentStart] = currentAcademicYear.split('-').map(Number);
            const yearsSinceEnrollment = currentStart - enrollStart;
            
            let classLevel = '';
            let statusText = '';
            
            switch (yearsSinceEnrollment) {
              case 0: 
                classLevel = 'X'; 
                statusText = 'Kelas X';
                break;
              case 1: 
                classLevel = 'XI'; 
                statusText = 'Kelas XI';
                break;
              case 2: 
                classLevel = 'XII'; 
                statusText = 'Kelas XII';
                break;
              default: 
                classLevel = 'Lulus';
                statusText = 'Sudah Lulus';
            }
            
            const expectedClass = classLevel === 'Lulus' ? 'Lulus' : `${classLevel} ${jurusan}`;
            
            const studentData = {
              nama: nama,
              nis: getRowField(row, 'nis', 'NIS'),
              jurusan,
              grha: normalizeGrha(getRowField(row, 'grha', 'Grha', 'Gra', 'GRHA')) || 'Airsanya',
              tahun_pelajaran: tahunPelajaran,
              password: getRowField(row, 'password', 'Password') || '123456'
            };

            await axios.post('/users/create-student', studentData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            results.push({ 
              status: 'success', 
              name: studentData.nama, 
              type: 'siswa',
              expectedClass: expectedClass,
              statusText: statusText,
              tahunPelajaran: tahunPelajaran
            });
          } else {
            // Import teacher
            const teacherData = {
              nama: getRowField(row, 'nama', 'Nama'),
              nip: getRowField(row, 'nip', 'NIP'),
              jabatan: getRowField(row, 'jabatan', 'Jabatan', 'detail', 'Detail'),
              no_hp: getRowField(row, 'no_hp', 'NoHP', 'No HP', 'no hp'),
              password: getRowField(row, 'password', 'Password') || '123456'
            };

            if (!JABATAN_OPTIONS.includes(teacherData.jabatan)) {
              results.push({
                status: 'error',
                name: teacherData.nama,
                error: `Jabatan tidak valid. Gunakan: ${JABATAN_OPTIONS.join(', ')}`
              });
              continue;
            }

            await axios.post('/users/create-teacher', teacherData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            results.push({ status: 'success', name: teacherData.nama, type: 'guru' });
          }
        } catch (error) {
          results.push({
            status: 'error',
            name: row.nama || row.Nama || 'Unknown',
            error: error.response?.data?.message || error.message
          });
        }
      }

      setImportResults(results);
      setMessage(`Import completed: ${results.filter(r => r.status === 'success').length} successful, ${results.filter(r => r.status === 'error').length} failed`);
      fetchUsers();
    } catch (error) {
      setMessage('Error reading Excel file: ' + error.message);
    } finally {
      setImporting(false);
      setExcelFile(null);
    }
  };

  const downloadTemplate = async (type) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentAcademicYear = currentMonth >= 6 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`;
    
    if (type === 'siswa') {
      // Create 30 sample students with TKJ 1 and the current academic year
      const templateData = [];
      const grhaOptions = ['Airsanya', 'Daksina', 'Genya', 'Madhya', 'Pascima', 'Uttara'];
      
      for (let i = 1; i <= 30; i++) {
        templateData.push({
          Nama: `Siswa TKJ 1 ${i}`,
          NIS: `2024${String(i).padStart(3, '0')}`,
          Jurusan: 'TKJ 1',
          Grha: grhaOptions[i % grhaOptions.length],
          TahunPelajaran: currentAcademicYear,
          Password: '123456'
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');

      worksheet.columns = [
        { header: 'Nama', key: 'Nama', width: 25 },
        { header: 'NIS', key: 'NIS', width: 10 },
        { header: 'Jurusan', key: 'Jurusan', width: 10 },
        { header: 'Grha', key: 'Grha', width: 12 },
        { header: 'TahunPelajaran', key: 'TahunPelajaran', width: 15 },
        { header: 'Password', key: 'Password', width: 12 }
      ];
      templateData.forEach(row => worksheet.addRow(row));

      const validJurusanOptions = ['TKJ 1', 'TKJ 2', 'DPIB 1', 'DPIB 2', 'TKR 1', 'TKR 2'];
      const academicYearOptions = [];
      for (let year = currentYear - 3; year <= currentYear + 3; year += 1) {
        academicYearOptions.push(`${year}-${year + 1}`);
      }

      const validationFor = (formulae, errorTitle, error) => ({
        type: 'list',
        allowBlank: false,
        formulae: [`"${formulae.join(',')}"`],
        showErrorMessage: true,
        errorTitle,
        error
      });

      for (let rowNumber = 2; rowNumber <= 1000; rowNumber += 1) {
        worksheet.getCell(`C${rowNumber}`).dataValidation = validationFor(
          validJurusanOptions,
          'Jurusan tidak valid',
          `Pilih salah satu: ${validJurusanOptions.join(', ')}`
        );
        worksheet.getCell(`D${rowNumber}`).dataValidation = validationFor(
          GRHA_OPTIONS,
          'Grha tidak valid',
          `Pilih salah satu: ${GRHA_OPTIONS.join(', ')}`
        );
        worksheet.getCell(`E${rowNumber}`).dataValidation = validationFor(
          academicYearOptions,
          'Tahun Pelajaran tidak valid',
          'Pilih TahunPelajaran dari daftar yang tersedia'
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blobUrl = URL.createObjectURL(new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'template_siswa.xlsx';
      link.click();
      URL.revokeObjectURL(blobUrl);
    } else {
      const templateData = [
        { Nama: '', NIP: '', Jabatan: 'Guru', NoHP: '', Password: '123456' }
      ];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');
      worksheet.columns = [
        { header: 'Nama', key: 'Nama', width: 25 },
        { header: 'NIP', key: 'NIP', width: 18 },
        { header: 'Jabatan', key: 'Jabatan', width: 14 },
        { header: 'NoHP', key: 'NoHP', width: 15 },
        { header: 'Password', key: 'Password', width: 12 }
      ];
      templateData.forEach(row => worksheet.addRow(row));

      worksheet.dataValidations.add('C2:C1000', {
        type: 'list',
        allowBlank: false,
        formulae: [`"${JABATAN_OPTIONS.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Jabatan tidak valid',
        error: `Pilih salah satu: ${JABATAN_OPTIONS.join(', ')}`
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blobUrl = URL.createObjectURL(new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'template_guru.xlsx';
      link.click();
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleValidateClasses = async () => {
    setValidatingClasses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/academic-year/validate-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setValidationResults(response.data);
      setShowClassValidationModal(true);
    } catch (error) {
      console.error('Error validating classes:', error);
      alert('Gagal memvalidasi kelas');
    } finally {
      setValidatingClasses(false);
    }
  };

  const handleFixDiscrepancies = async (dryRun = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/academic-year/fix-discrepancies', 
        { dryRun },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (dryRun) {
        alert(`Preview: ${response.data.discrepanciesFound} discrepancies found. Run again without dryRun to fix.`);
      } else {
        alert(`Berhasil memperbaiki ${response.data.fixedCount} siswa`);
        // Re-validate to show updated results
        await handleValidateClasses();
      }
    } catch (error) {
      console.error('Error fixing discrepancies:', error);
      alert('Gagal memperbaiki discrepancies');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Siswa cannot access Kelola Akun
  if (userRole === 'siswa') {
    return (
      <div className="card">
        <h2>Akses Ditolak</h2>
        <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f5f5f5', padding: '20px', color: '#333', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px', margin: 0 }}>Kelola Akun</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Role: {userRole || 'loading...'}</p>
        </div>

        {message && <div style={{ padding: '12px 16px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724', marginBottom: '20px' }}>{message}</div>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(userRole === 'superadmin' || userRole === 'guru') && (
            <button 
              onClick={() => { setShowCreateModal(true); setCreateModalType('student'); setFormData({}); }}
              style={{ 
                padding: '10px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                background: '#1e88e5', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => { e.target.style.background = '#1565c0'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 8px rgba(30, 136, 229, 0.3)'; }}
              onMouseOut={(e) => { e.target.style.background = '#1e88e5'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
            >
              <i className="fas fa-plus"></i> Buat Akun Siswa
            </button>
          )}
          
          {userRole === 'superadmin' && (
            <button 
              onClick={() => { setShowCreateModal(true); setCreateModalType('teacher'); setFormData({}); }}
              style={{ 
                padding: '10px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                background: '#43a047', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => { e.target.style.background = '#388e3c'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 8px rgba(67, 160, 71, 0.3)'; }}
              onMouseOut={(e) => { e.target.style.background = '#43a047'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
            >
              <i className="fas fa-plus"></i> Buat Akun Guru
            </button>
          )}

          {userRole === 'superadmin' && (
            <>
              <button 
                onClick={handleValidateClasses} 
                disabled={validatingClasses}
                style={{ 
                  padding: '10px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: validatingClasses ? 'not-allowed' : 'pointer',
                  background: '#ffa726', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.3s ease', opacity: validatingClasses ? 0.6 : 1
                }}
                onMouseOver={(e) => { if (!validatingClasses) { e.target.style.background = '#fb8c00'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 8px rgba(255, 167, 38, 0.3)'; } }}
                onMouseOut={(e) => { e.target.style.background = '#ffa726'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >
                {validatingClasses ? 'Memvalidasi...' : 'Validasi Kelas'}
              </button>
              <button 
                onClick={() => { setShowImportModal(true); setImportModalType('siswa'); setExcelFile(null); setImportResults([]); }}
                style={{ 
                  padding: '10px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  background: '#1e88e5', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => { e.target.style.background = '#1565c0'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 8px rgba(30, 136, 229, 0.3)'; }}
                onMouseOut={(e) => { e.target.style.background = '#1e88e5'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >
                <i className="fas fa-download"></i> Import Siswa
              </button>
              <button 
                onClick={() => { setShowImportModal(true); setImportModalType('guru'); setExcelFile(null); setImportResults([]); }}
                style={{ 
                  padding: '10px 16px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  background: '#1e88e5', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => { e.target.style.background = '#1565c0'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 8px rgba(30, 136, 229, 0.3)'; }}
                onMouseOut={(e) => { e.target.style.background = '#1e88e5'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >
                <i className="fas fa-download"></i> Import Guru
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {userRole === 'superadmin' && (
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  style={{ 
                    width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: '4px', 
                    fontSize: '13px', background: 'white', color: '#333', transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1e88e5'; e.target.style.boxShadow = '0 0 0 2px rgba(30, 136, 229, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d0d0d0'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">Semua Role</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>
            )}
            <div style={{ flex: '1', minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Kelas</label>
              <select
                value={filters.kelas}
                onChange={(e) => handleFilterChange('kelas', e.target.value)}
                style={{ 
                  width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: '4px', 
                  fontSize: '13px', background: 'white', color: '#333', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#1e88e5'; e.target.style.boxShadow = '0 0 0 2px rgba(30, 136, 229, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d0d0d0'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Semua Kelas</option>
                {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Grha</label>
              <select
                value={filters.grha}
                onChange={(e) => handleFilterChange('grha', e.target.value)}
                style={{ 
                  width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: '4px', 
                  fontSize: '13px', background: 'white', color: '#333', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#1e88e5'; e.target.style.boxShadow = '0 0 0 2px rgba(30, 136, 229, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d0d0d0'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Semua Grha</option>
                {grhaOptions.map(grha => <option key={grha} value={grha}>{grha}</option>)}
              </select>
            </div>
            {userRole === 'superadmin' && (
              <>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Jurusan</label>
                  <select
                    value={filters.jurusan}
                    onChange={(e) => handleFilterChange('jurusan', e.target.value)}
                    style={{ 
                      width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: '4px', 
                      fontSize: '13px', background: 'white', color: '#333', transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#1e88e5'; e.target.style.boxShadow = '0 0 0 2px rgba(30, 136, 229, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d0d0d0'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="">Semua Jurusan</option>
                    <option value="TKJ 1">TKJ 1</option>
                    <option value="TKJ 2">TKJ 2</option>
                    <option value="DPIB 1">DPIB 1</option>
                    <option value="DPIB 2">DPIB 2</option>
                    <option value="TKR 1">TKR 1</option>
                    <option value="TKR 2">TKR 2</option>
                  </select>
                </div>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>Tahun Pelajaran</label>
                  <select
                    value={filters.tahun_pelajaran}
                    onChange={(e) => handleFilterChange('tahun_pelajaran', e.target.value)}
                    style={{ 
                      width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: '4px', 
                      fontSize: '13px', background: 'white', color: '#333', transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#1e88e5'; e.target.style.boxShadow = '0 0 0 2px rgba(30, 136, 229, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d0d0d0'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="">Semua Tahun</option>
                    {(() => {
                      const options = [];
                      for (let year = 2024; year <= 2030; year++) {
                        options.push(`${year}-${year + 1}`);
                      }
                      return options.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ));
                    })()}
                  </select>
                </div>
              </>
            )}
            <button 
              onClick={resetFilters}
              style={{ 
                padding: '8px 14px', background: '#f5f5f5', border: '1px solid #d0d0d0', borderRadius: '4px', 
                fontSize: '13px', cursor: 'pointer', color: '#666', transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => { e.target.style.background = '#efefef'; e.target.style.borderColor = '#bbb'; }}
              onMouseOut={(e) => { e.target.style.background = '#f5f5f5'; e.target.style.borderColor = '#d0d0d0'; }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', marginBottom: '24px', border: '1px solid #d0d0d0', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#f9f9f9', borderBottom: '1px solid #d0d0d0' }}>
              <tr>
                {userRole === 'superadmin' && <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '30px' }}></th>}
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0' }}>Nama</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '90px' }}>{userRole === 'guru' ? 'NIS' : 'NIS/NIP'}</th>
                {userRole !== 'guru' && <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '80px' }}>NISN</th>}
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '80px' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '100px' }}>Kelas</th>
                {userRole === 'superadmin' && (
                  <>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '100px' }}>Jurusan</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '100px' }}>Tahun Pelajaran</th>
                  </>
                )}
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', borderRight: '1px solid #e0e0e0', width: '90px' }}>IPC Total</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '80px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  style={{ 
                    transition: 'all 0.2s ease',
                    ...(isUserDisabled(user) && selectionRole ? { opacity: 0.45 } : {})
                  }}
                  onMouseOver={(e) => { if (!isUserDisabled(user) || !selectionRole) e.currentTarget.style.background = '#f0f7ff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = ''; }}
                >
                  {userRole === 'superadmin' && (
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                      {isUserSelectable(user) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          disabled={isUserDisabled(user)}
                          onChange={() => toggleUserSelection(user)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                  )}
                  <td style={{ padding: '10px 12px', color: '#333', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>{user.nama}</td>
                  <td style={{ padding: '10px 12px', color: '#333', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>{user.nis || user.nip || '-'}</td>
                  {userRole !== 'guru' && <td style={{ padding: '10px 12px', color: '#333', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>{user.nisn || '-'}</td>}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ 
                      display: 'inline-block', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '500', textAlign: 'center', minWidth: '50px',
                      background: user.role === 'superadmin' ? '#ef5350' : user.role === 'guru' ? '#ffc107' : '#b3e5fc',
                      color: user.role === 'superadmin' ? 'white' : user.role === 'guru' ? 'white' : '#01579b'
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                    {user.is_graduated ? (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>{user.kelas || '-'}</span>
                    ) : (
                      user.kelas || '-'
                    )}
                  </td>
                  {userRole === 'superadmin' && (
                    <>
                      <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                        {user.jurusan ? (
                          <span style={{ 
                            fontSize: '11px', backgroundColor: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: '4px'
                          }}>
                            {user.jurusan}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                        {user.tahun_pelajaran ? (
                          <span style={{ 
                            fontSize: '11px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {user.tahun_pelajaran}
                          </span>
                        ) : '-'}
                      </td>
                    </>
                  )}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ 
                      color: (user.ipc_total ?? 0) < 0 ? '#dc2626' : 'inherit',
                      fontWeight: (user.ipc_total ?? 0) < 0 ? 'bold' : 'normal'
                    }}>
                      {(user.ipc_total ?? 0) < 0 ? `${user.ipc_total ?? 0} (MINUS)` : (user.ipc_total ?? 0)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                    {userRole === 'superadmin' && user.role !== 'superadmin' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {user.role === 'siswa' && (
                          <button 
                            onClick={() => setDetailStudent(user)}
                            style={{ 
                              padding: '6px 10px', border: 'none', borderRadius: '3px', 
                              fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: 'white',
                              background: '#1e88e5', transition: 'all 0.2s ease', width: '100%', textAlign: 'center'
                            }}
                            onMouseOver={(e) => { e.target.style.background = '#1565c0'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 2px 4px rgba(30, 136, 229, 0.3)'; }}
                            onMouseOut={(e) => { e.target.style.background = '#1e88e5'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                          >
                            Detail
                          </button>
                        )}
                        <button 
                          onClick={() => { handleEditUser(user); setShowEditBiodataModal(true); }}
                          style={{ 
                            padding: '6px 10px', border: 'none', borderRadius: '3px', 
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: 'white',
                            background: '#00bcd4', transition: 'all 0.2s ease', width: '100%', textAlign: 'center'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#00acc1'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 2px 4px rgba(0, 188, 212, 0.3)'; }}
                          onMouseOut={(e) => { e.target.style.background = '#00bcd4'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ 
                            padding: '6px 10px', border: 'none', borderRadius: '3px', 
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: 'white',
                            background: '#ef5350', transition: 'all 0.2s ease', width: '100%', textAlign: 'center'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#e53935'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 2px 4px rgba(239, 83, 80, 0.3)'; }}
                          onMouseOut={(e) => { e.target.style.background = '#ef5350'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                    {userRole === 'guru' && user.role === 'siswa' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button 
                          onClick={() => setDetailStudent(user)}
                          style={{ 
                            padding: '6px 10px', border: 'none', borderRadius: '3px', 
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: 'white',
                            background: '#1e88e5', transition: 'all 0.2s ease', width: '100%', textAlign: 'center'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#1565c0'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 2px 4px rgba(30, 136, 229, 0.3)'; }}
                          onMouseOut={(e) => { e.target.style.background = '#1e88e5'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => { handleEditUser(user); setShowEditBiodataModal(true); }}
                          style={{ 
                            padding: '6px 10px', border: 'none', borderRadius: '3px', 
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: 'white',
                            background: '#00bcd4', transition: 'all 0.2s ease', width: '100%', textAlign: 'center'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#00acc1'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 2px 4px rgba(0, 188, 212, 0.3)'; }}
                          onMouseOut={(e) => { e.target.style.background = '#00bcd4'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk Actions */}
        {userRole === 'superadmin' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Menampilkan {filteredUsers.length} pengguna
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={selectAllFiltered}
                style={{ 
                  padding: '6px 12px', border: '1px solid #d0d0d0', background: 'white', borderRadius: '3px', 
                  fontSize: '12px', cursor: 'pointer', color: '#333'
                }}
                onMouseOver={(e) => { e.target.style.background = '#f5f5f5'; e.target.style.borderColor = '#bbb'; }}
                onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#d0d0d0'; }}
              >
                Pilih Semua
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button 
                    onClick={handleBulkDelete}
                    style={{ 
                      padding: '6px 12px', border: '1px solid #d0d0d0', background: '#dc3545', borderRadius: '3px', 
                      fontSize: '12px', cursor: 'pointer', color: 'white'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#c82333'; }}
                    onMouseOut={(e) => { e.target.style.background = '#dc3545'; }}
                  >
                    Hapus ({selectedIds.length})
                  </button>
                  <button 
                    onClick={clearSelection}
                    style={{ 
                      padding: '6px 12px', border: '1px solid #d0d0d0', background: 'white', borderRadius: '3px', 
                      fontSize: '12px', cursor: 'pointer', color: '#333'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#f5f5f5'; e.target.style.borderColor = '#bbb'; }}
                    onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#d0d0d0'; }}
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {userRole === 'superadmin' && selectionRole && (
          <p style={{ fontSize: '13px', color: '#666', marginTop: '12px' }}>
            Mode pilihan: <strong>{selectionRole === 'siswa' ? 'Siswa' : 'Guru'}</strong> — hanya role yang sama yang bisa dipilih.
          </p>
        )}
      </div>

      {detailStudent && (
        <StudentDetail student={detailStudent} onClose={() => setDetailStudent(null)} />
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{createModalType === 'student' ? 'Buat Akun Siswa' : 'Buat Akun Guru'}</h3>
            <button className="btn btn-danger" onClick={() => { setShowCreateModal(false); setFormData({}); }} style={{ marginBottom: '10px' }}>Tutup</button>

            {createModalType === 'student' ? (
              <form onSubmit={handleCreateStudent}>
                <div className="form-group">
                  <label>Nama</label>
                  <input type="text" value={formData.nama || ''} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>NIS</label>
                  <input type="text" value={formData.nis || ''} onChange={(e) => setFormData({...formData, nis: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Kelas</label>
                  <select value={formData.jurusan || ''} onChange={(e) => setFormData({...formData, jurusan: e.target.value})} required>
                    <option value="">Pilih Kelas</option>
                    <option value="TKJ 1">TKJ 1</option>
                    <option value="TKJ 2">TKJ 2</option>
                    <option value="DPIB 1">DPIB 1</option>
                    <option value="DPIB 2">DPIB 2</option>
                    <option value="TKR 1">TKR 1</option>
                    <option value="TKR 2">TKR 2</option>
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>Kelas akan dihitung otomatis berdasarkan tahun pelajaran</small>
                </div>
                <div className="form-group">
                  <label>Grha</label>
                  <select value={formData.grha || ''} onChange={(e) => setFormData({...formData, grha: e.target.value})}>
                    <option value="">Pilih Grha</option>
                    {grhaOptions.map(grha => (
                      <option key={grha} value={grha}>{grha}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tahun Pelajaran (Masuk)</label>
                  <select value={formData.tahun_pelajaran || ''} onChange={(e) => setFormData({...formData, tahun_pelajaran: e.target.value})} required>
                    <option value="">Pilih Tahun Pelajaran</option>
                    {(() => {
                      // Opsi tahun pelajaran dari 2024-2025 sampai 2030-2031
                      const options = [];
                      for (let year = 2024; year <= 2030; year++) {
                        options.push(`${year}-${year + 1}`);
                      }
                      return options.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ));
                    })()}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>Tahun pelajaran saat siswa pertama kali masuk sekolah</small>
                </div>

                {/* Preview Kelas */}
                {formData.tahun_pelajaran && formData.jurusan && (
                  <div className="form-group" style={{
                    background: '#e3f2fd',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #2196f3'
                  }}>
                    <strong style={{ color: '#1976d2', display: 'block', marginBottom: '5px' }}>
                      📚 Preview Kelas yang Akan Dibuat:
                    </strong>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d47a1' }}>
                      {(() => {
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth();
                        const currentAcademicYear = currentMonth >= 6 
                          ? `${currentYear}-${currentYear + 1}` 
                          : `${currentYear - 1}-${currentYear}`;
                        
                        const [enrollStart] = formData.tahun_pelajaran.split('-').map(Number);
                        const [currentStart] = currentAcademicYear.split('-').map(Number);
                        const yearsSinceEnrollment = currentStart - enrollStart;
                        
                        let classLevel = '';
                        let statusColor = '#0d47a1';
                        let statusText = '';
                        
                        switch (yearsSinceEnrollment) {
                          case 0: 
                            classLevel = 'X'; 
                            statusText = 'Kelas X (Tahun Pertama)';
                            break;
                          case 1: 
                            classLevel = 'XI'; 
                            statusText = 'Kelas XI (Tahun Kedua)';
                            break;
                          case 2: 
                            classLevel = 'XII'; 
                            statusText = 'Kelas XII (Tahun Ketiga)';
                            break;
                          default: 
                            classLevel = 'Lulus';
                            statusColor = '#c62828';
                            statusText = 'SUDAH LULUS';
                        }
                        
                        if (classLevel === 'Lulus') {
                          return (
                            <div>
                              <span style={{ color: statusColor, fontSize: '18px' }}>
                                {classLevel}
                              </span>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                {statusText} - Siswa tidak akan muncul di kelas aktif
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div>
                            <span style={{ color: statusColor, fontSize: '18px' }}>
                              {classLevel} {formData.jurusan}
                            </span>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                              {statusText}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <small style={{ color: '#666', fontSize: '11px' }}>
                      Kelas dihitung otomatis berdasarkan tahun pelajaran masuk dan tahun ajaran saat ini ({(() => {
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth();
                        return currentMonth >= 6 
                          ? `${currentYear}-${currentYear + 1}` 
                          : `${currentYear - 1}-${currentYear}`;
                      })()})
                    </small>
                  </div>
                )}
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <button type="submit" className="btn btn-primary">Buat Akun Siswa</button>
              </form>
            ) : (
              <form onSubmit={handleCreateTeacher}>
                <div className="form-group">
                  <label>Nama</label>
                  <input type="text" value={formData.nama || ''} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>NIP</label>
                  <input type="text" value={formData.nip || ''} onChange={(e) => setFormData({...formData, nip: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Jabatan</label>
                  <select value={formData.jabatan || ''} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} required>
                    <option value="">Pilih Jabatan</option>
                    {JABATAN_OPTIONS.map((jabatan) => (
                      <option key={jabatan} value={jabatan}>{jabatan}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>No HP</label>
                  <input type="text" value={formData.no_hp || ''} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <button type="submit" className="btn btn-success">Buat Akun Guru</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4>Import {importModalType === 'siswa' ? 'Siswa' : 'Guru'} dari Excel</h4>
            <button className="btn btn-danger" onClick={() => { setShowImportModal(false); setExcelFile(null); setImportResults([]); }} style={{ marginBottom: '10px' }}>Tutup</button>
            <div style={{ marginBottom: '15px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => downloadTemplate(importModalType)}
                style={{ marginBottom: '10px' }}
              >
                📥 Download Template {importModalType === 'siswa' ? 'Siswa' : 'Guru'}
              </button>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileChange}
                style={{ marginBottom: '10px' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                {importModalType === 'siswa' ? (
                  <div>
                    <strong>Format Siswa:</strong> nama, nis, jurusan, grha, tahun_pelajaran, password
                    <br />
                    <small style={{ color: '#1976d2' }}>
                      💡 Kelas akan dihitung otomatis berdasarkan tahun_pelajaran dan jurusan. 
                      Download template untuk melihat contoh.
                    </small>
                  </div>
                ) : (
                  <div>
                    <strong>Format Guru:</strong> nama, nip, jabatan (Guru/Pegawai/Staff), no_hp, password
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { setImportType(importModalType); handleExcelImport(); }}
                disabled={importing || !excelFile}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>

            {importResults.length > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                <h5>Import Results:</h5>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '5px' }}>Nama</th>
                      <th style={{ padding: '5px' }}>Kelas</th>
                      <th style={{ padding: '5px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.map((result, index) => (
                      <tr key={index}>
                        <td style={{ padding: '5px' }}>
                          {result.status === 'success' ? '✅' : '❌'} {result.name}
                        </td>
                        <td style={{ padding: '5px' }}>
                          {result.status === 'success' && result.expectedClass ? (
                            <div>
                              <span style={{ 
                                backgroundColor: result.expectedClass === 'Lulus' ? '#ffebee' : '#e3f2fd',
                                color: result.expectedClass === 'Lulus' ? '#c62828' : '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                display: 'block'
                              }}>
                                {result.expectedClass}
                              </span>
                              <small style={{ fontSize: '10px', color: '#666' }}>
                                {result.statusText}
                              </small>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '5px' }}>
                          {result.status === 'error' ? result.error : 'Berhasil'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class Validation Modal */}
      {showClassValidationModal && validationResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 800, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Validasi Kelas</h3>
            <button className="btn btn-danger" onClick={() => { setShowClassValidationModal(false); setValidationResults(null); }} style={{ marginBottom: '10px' }}>Tutup</button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1, padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                  <strong>Total Siswa:</strong> {validationResults.totalStudents}
                </div>
                <div style={{ flex: 1, padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                  <strong>Valid:</strong> {validationResults.validCount}
                </div>
                <div style={{ flex: 1, padding: '10px', backgroundColor: validationResults.discrepancyCount > 0 ? '#f8d7da' : '#d4edda', borderRadius: '4px' }}>
                  <strong>Discrepancies:</strong> {validationResults.discrepancyCount}
                </div>
              </div>

              {validationResults.discrepancyCount > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <button 
                    className="btn btn-info" 
                    onClick={() => handleFixDiscrepancies(true)}
                    style={{ marginRight: '10px' }}
                  >
                    Preview Perbaikan
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleFixDiscrepancies(false)}
                  >
                    Perbaiki Sekarang
                  </button>
                </div>
              )}
            </div>

            {validationResults.discrepancies.length > 0 ? (
              <div>
                <h4>Discrepancies ({validationResults.discrepancies.length})</h4>
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <table className="table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>NIS</th>
                        <th>Tipe</th>
                        <th>Expected</th>
                        <th>Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.discrepancies.map((discrepancy, index) => (
                        <tr key={index}>
                          <td>{discrepancy.nama}</td>
                          <td>{discrepancy.nis}</td>
                          <td>
                            <span className={`badge badge-${discrepancy.discrepancyType === 'graduation_status' ? 'danger' : 'warning'}`}>
                              {discrepancy.discrepancyType === 'graduation_status' ? 'Graduation' : 'Class'}
                            </span>
                          </td>
                          <td>{discrepancy.expectedValue}</td>
                          <td>{discrepancy.actualValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
                <strong>✅ Semua kelas valid!</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Biodata Modal */}
      {showEditBiodataModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Edit Data {editStudent?.role === 'siswa' ? 'Siswa' : 'Guru'}</h3>
            <button className="btn btn-danger" onClick={() => { setShowEditBiodataModal(false); setEditStudent(null); setFormData({}); }} style={{ marginBottom: '10px' }}>Tutup</button>

            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Nama</label>
                <input type="text" value={formData.nama || ''} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
              </div>
              
              {editStudent?.role === 'siswa' ? (
                <>
                  <div className="form-group">
                    <label>NIS</label>
                    <input type="text" value={formData.nis || ''} onChange={(e) => setFormData({...formData, nis: e.target.value})} required />
                  </div>
                  <div className="form-group">
                  </div>
                  <div className="form-group">
                    <label>Kelas</label>
                    <select value={formData.jurusan || ''} onChange={(e) => setFormData({...formData, jurusan: e.target.value})} required>
                      <option value="">Pilih Kelas</option>
                      <option value="TKJ 1">TKJ 1</option>
                      <option value="TKJ 2">TKJ 2</option>
                      <option value="DPIB 1">DPIB 1</option>
                      <option value="DPIB 2">DPIB 2</option>
                      <option value="TKR 1">TKR 1</option>
                      <option value="TKR 2">TKR 2</option>
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>Kelas akan dihitung otomatis berdasarkan tahun pelajaran</small>
                  </div>
                  <div className="form-group">
                    <label>Grha</label>
                    <select value={formData.grha || ''} onChange={(e) => setFormData({...formData, grha: e.target.value})}>
                      <option value="">Pilih Grha</option>
                      {grhaOptions.map(grha => (
                        <option key={grha} value={grha}>{grha}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tahun Pelajaran (Masuk)</label>
                    <select value={formData.tahun_pelajaran || ''} onChange={(e) => setFormData({...formData, tahun_pelajaran: e.target.value})} required>
                      <option value="">Pilih Tahun Pelajaran</option>
                      {(() => {
                        const currentYear = new Date().getFullYear();
                        const options = [];
                        for (let i = -5; i <= 5; i++) {
                          const startYear = currentYear + i;
                          const endYear = startYear + 1;
                          options.push(`${startYear}-${endYear}`);
                        }
                        return options.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ));
                      })()}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>Tahun pelajaran saat siswa pertama kali masuk sekolah</small>
                  </div>
                </>
              ) : (
                <> 
                  <div className="form-group">
                    <label>NIP</label>
                    <input type="text" value={formData.nip || ''} onChange={(e) => setFormData({...formData, nip: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Jabatan</label>
                    <select value={formData.jabatan || ''} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} required>
                      <option value="">Pilih Jabatan</option>
                      {JABATAN_OPTIONS.map((jabatan) => (
                        <option key={jabatan} value={jabatan}>{jabatan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>No HP</label>
                    <input type="text" value={formData.no_hp || ''} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} />
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary">Update Data</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelolaAkun;
