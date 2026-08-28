import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import StudentDetail from './StudentDetail';
import { KELAS_OPTIONS } from '../utils/kelasJurusan';
import { GRHA_OPTIONS, getRowField, normalizeGrha } from '../utils/excelImport';

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
    grha: ''
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
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ role: '', kelas: '', grha: '' });
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

    const roles = [...new Set(selectable.map((u) => u.role))];
    if (roles.length > 1) {
      setMessage('Filter menampilkan siswa dan guru. Filter per role dulu sebelum pilih semua.');
      return;
    }

    setSelectionRole(roles[0]);
    setSelectedIds(selectable.map((u) => u.id));
  };

  const isUserSelectable = (user) => user.role !== 'superadmin';
  const isUserDisabled = (user) => {
    if (!isUserSelectable(user)) return true;
    if (!selectionRole) return false;
    return user.role !== selectionRole;
  };

  const handleEditUser = (user) => {
    setEditStudent(user);
    if (user.role === 'siswa') {
      setFormData({
        nama: user.nama,
        nis: user.nis,
        nisn: user.nisn,
        jurusan: user.jurusan,
        grha: user.grha,
        tahun_pelajaran: user.tahun_pelajaran
      });
    } else if (user.role === 'guru') {
      setFormData({
        nama: user.nama,
        nip: user.nip,
        detail: user.detail,
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
            // Import student
            const jurusan = getRowField(row, 'jurusan', 'Jurusan');
            const tahunPelajaran = getRowField(row, 'tahun_pelajaran', 'Tahun Pelajaran', 'TahunPelajaran');
            
            // Validate tahun_pelajaran format
            if (!tahunPelajaran || !/^\d{4}-\d{4}$/.test(tahunPelajaran)) {
              results.push({
                status: 'error',
                name: row.nama || row.Nama || 'Unknown',
                error: 'Tahun pelajaran tidak valid. Format harus YYYY-YYYY (contoh: 2024-2025)'
              });
              continue;
            }
            
            const studentData = {
              nama: getRowField(row, 'nama', 'Nama'),
              nis: getRowField(row, 'nis', 'NIS'),
              nisn: getRowField(row, 'nisn', 'NISN'),
              jurusan,
              grha: normalizeGrha(getRowField(row, 'grha', 'Grha', 'Gra', 'GRHA')),
              tahun_pelajaran: tahunPelajaran,
              password: getRowField(row, 'password', 'Password') || '123456'
            };

            await axios.post('/users/create-student', studentData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            results.push({ status: 'success', name: studentData.nama, type: 'siswa' });
          } else {
            // Import teacher
            const teacherData = {
              nama: getRowField(row, 'nama', 'Nama'),
              nip: getRowField(row, 'nip', 'NIP'),
              detail: getRowField(row, 'detail', 'Detail'),
              no_hp: getRowField(row, 'no_hp', 'NoHP', 'No HP', 'no hp'),
              password: getRowField(row, 'password', 'Password') || '123456'
            };

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

  const downloadTemplate = (type) => {
    const currentYear = new Date().getFullYear();
    const templateData = type === 'siswa'
      ? [
          { Nama: '', NIS: '', NISN: '', Jurusan: 'TKJ 1', Grha: '', TahunPelajaran: `${currentYear}-${currentYear + 1}`, Password: '123456' }
        ]
      : [
          { Nama: '', NIP: '', Detail: '', NoHP: '', Password: '123456' }
        ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${type}.xlsx`);
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
    <div>
      <h2>Kelola Akun</h2>
      {message && <div className="alert alert-success">{message}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        {/* Debug: show current role */}
        <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
          Role: {userRole || 'loading...'}
        </small>
        
        {/* Buat Akun Siswa - available for superadmin and guru */}
        {(userRole === 'superadmin' || userRole === 'guru') && (
          <button className="btn btn-primary" onClick={() => { setShowCreateModal(true); setCreateModalType('student'); setFormData({}); }} style={{ marginRight: '10px' }}>
            + Buat Akun Siswa
          </button>
        )}
        
        {/* Buat Akun Guru - only for superadmin */}
        {userRole === 'superadmin' && (
          <button className="btn btn-success" onClick={() => { setShowCreateModal(true); setCreateModalType('teacher'); setFormData({}); }} style={{ marginRight: '10px' }}>
            + Buat Akun Guru
          </button>
        )}

        {/* Import from Excel - only for superadmin */}
        {userRole === 'superadmin' && (
          <>
            <button className="btn btn-warning" onClick={handleValidateClasses} disabled={validatingClasses} style={{ marginRight: '10px' }}>
              {validatingClasses ? 'Memvalidasi...' : 'Validasi Kelas'}
            </button>
            <button className="btn btn-info" onClick={() => { setShowImportModal(true); setImportModalType('siswa'); setExcelFile(null); setImportResults([]); }} style={{ marginRight: '10px' }}>
              📥 Import Siswa
            </button>
            <button className="btn btn-info" onClick={() => { setShowImportModal(true); setImportModalType('guru'); setExcelFile(null); setImportResults([]); }} style={{ marginRight: '10px' }}>
              📥 Import Guru
            </button>
          </>
        )}
      </div>


      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <h4>Filter</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {userRole === 'superadmin' && (
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label>Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="form-control"
              >
                <option value="">Semua Role</option>
                <option value="superadmin">Superadmin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
              </select>
            </div>
          )}
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label>Kelas</label>
            <select
              value={filters.kelas}
              onChange={(e) => handleFilterChange('kelas', e.target.value)}
              className="form-control"
            >
              <option value="">Semua Kelas</option>
              {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label>Grha</label>
            <select
              value={filters.grha}
              onChange={(e) => handleFilterChange('grha', e.target.value)}
              className="form-control"
            >
              <option value="">Semua Grha</option>
              {grhaOptions.map(grha => <option key={grha} value={grha}>{grha}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
        </div>
      </div>



      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0 }}>{userRole === 'guru' ? 'Daftar Siswa' : 'Daftar Pengguna'}</h3>
          {userRole === 'superadmin' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={selectAllFiltered} style={{ fontSize: 13 }}>
                Pilih Semua (filter)
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button type="button" className="btn btn-danger" onClick={handleBulkDelete} style={{ fontSize: 13 }}>
                    Hapus ({selectedIds.length})
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={clearSelection} style={{ fontSize: 13 }}>
                    Batal Pilih
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {userRole === 'superadmin' && selectionRole && (
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Mode pilihan: <strong>{selectionRole === 'siswa' ? 'Siswa' : 'Guru'}</strong> — hanya role yang sama yang bisa dipilih.
          </p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {userRole === 'superadmin' && <th style={{ width: 40 }}></th>}
                <th>Nama</th>
                <th>{userRole === 'guru' ? 'NIS' : 'NIS/NIP'}</th>
                {userRole !== 'guru' && <th>NISN</th>}
                <th>Role</th>
                <th>Kelas</th>
                <th>IPC Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={isUserDisabled(user) && selectionRole ? { opacity: 0.45 } : undefined}>
                  {userRole === 'superadmin' && (
                    <td>
                      {isUserSelectable(user) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          disabled={isUserDisabled(user)}
                          onChange={() => toggleUserSelection(user)}
                        />
                      )}
                    </td>
                  )}
                  <td>{user.nama}</td>
                  <td>{user.nis || user.nip || '-'}</td>
                  {userRole !== 'guru' && <td>{user.nisn || '-'}</td>}
                  <td><span className={`badge badge-${user.role === 'superadmin' ? 'danger' : user.role === 'guru' ? 'warning' : 'info'}`}>{user.role}</span></td>
                  <td>
                    <>
                      {user.is_graduated ? (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>{user.kelas || '-'}</span>
                      ) : (
                        user.kelas || '-'
                      )}
                      { /* user.is_graduated && <span className="badge badge-secondary" style={{ marginLeft: '5px' }}>Lulus</span> */}
                    </>
                  </td>
                  <td>{user.ipc_total ?? 0}</td>
                  <td>
                    {userRole === 'superadmin' && user.role !== 'superadmin' && (
                      <>
                        {user.role === 'siswa' && (
                          <button className="btn btn-primary" onClick={() => setDetailStudent(user)} style={{ padding: '5px 10px', marginRight: '5px' }}>Detail</button>
                        )}
                        <button className="btn btn-info" onClick={() => { handleEditUser(user); setShowEditBiodataModal(true); }} style={{ padding: '5px 10px', marginRight: '5px' }}>Edit Biodata</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)} style={{ padding: '5px 10px' }}>Hapus</button>
                      </>
                    )}
                    {userRole === 'guru' && user.role === 'siswa' && (
                      <>
                        <button className="btn btn-primary" onClick={() => setDetailStudent(user)} style={{ padding: '5px 10px', marginRight: '5px' }}>Detail</button>
                        <button className="btn btn-info" onClick={() => { handleEditUser(user); setShowEditBiodataModal(true); }} style={{ padding: '5px 10px' }}>Edit Biodata</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  <label>NISN</label>
                  <input type="text" value={formData.nisn || ''} onChange={(e) => setFormData({...formData, nisn: e.target.value})} required />
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
                  <label>Detail</label>
                  <input type="text" value={formData.detail || ''} onChange={(e) => setFormData({...formData, detail: e.target.value})} />
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
                  <strong>Format Siswa:</strong>
                ) : (
                  <strong>Format Guru:</strong>
                )} {importModalType === 'siswa' ? 'nama, nis, nisn, kelas, grha, password' : 'nama, nip, jabatan, no_hp, password'}
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
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                <h5>Import Results:</h5>
                {importResults.map((result, index) => (
                  <div key={index} style={{ 
                    padding: '5px', 
                    marginBottom: '5px', 
                    backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {result.status === 'success' ? '✅' : '❌'} {result.name} ({result.type}) - {result.status === 'error' ? result.error : 'Success'}
                  </div>
                ))}
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
                    <label>NISN</label>
                    <input type="text" value={formData.nisn || ''} onChange={(e) => setFormData({...formData, nisn: e.target.value})} required />
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
                    <label>Detail</label>
                    <input type="text" value={formData.detail || ''} onChange={(e) => setFormData({...formData, detail: e.target.value})} />
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
