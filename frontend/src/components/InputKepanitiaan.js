import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import EditModal from './EditModal';
import useEditModal from '../hooks/useEditModal';
import API_BASE_URL from '../config';

function InputKepanitiaan() {
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    kelas: '',
    grha: '',
    jabatan_kepanitiaan: '',
    kategori_kepanitiaan: ''
  });
  const [foto, setFoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [allKepanitiaan, setAllKepanitiaan] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const editModal = useEditModal();
  const [ipcConfig, setIpcConfig] = useState([]);
  const [calculatedPoint, setCalculatedPoint] = useState(0);
  const [students, setStudents] = useState([]);

  const grhaOptions = [
    'Airsanya', 'Daksina', 'Genya', 'Madhya', 'Nairiti', 'Pascima', 'Purwa', 'Uttara', 'Wayabhya'
  ];

  const jabatanOptions = [
    { value: 'ketua', label: 'Ketua' },
    { value: 'wakil ketua', label: 'Wakil Ketua' },
    { value: 'sekretaris', label: 'Sekretaris' },
    { value: 'bendahara', label: 'Bendahara' },
    { value: 'koordinator', label: 'Koordinator' },
    { value: 'anggota', label: 'Anggota' }
  ];

  useEffect(() => {
    fetchUserSubmissions();
    checkAccess();
    fetchIpcConfig();
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchUserSubmissions();
    fetchIpcConfig();
    fetchStudents();
    checkAccess();
    if (user.role === 'superadmin') {
      fetchAllKepanitiaan();
    }
  }, []);

  const fetchAllKepanitiaan = async () => {
    try {
      setLoadingIndex(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/kepanitiaan/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllKepanitiaan(response.data);
    } catch (error) {
      console.error('Error fetching all kepanitiaan:', error);
    } finally {
      setLoadingIndex(false);
    }
  };

  const checkAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Superadmin always has access
      if (user.role === 'superadmin') {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }
      
      const response = await axios.get('/input-access/status/my-access', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const canInputKepanitiaan = response.data.kepanitiaan;
      setHasAccess(canInputKepanitiaan);
      
      if (!canInputKepanitiaan) {
        setAccessMessage('Anda tidak memiliki izin untuk input data kepanitiaan. Silakan hubungi SuperAdmin.');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(true);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/approvals-v2/user-submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data.kepanitiaan || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchIpcConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIpcConfig(response.data);
    } catch (error) {
      console.error('Error fetching IPC config:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentList = response.data.filter(user => user.role === 'siswa');
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const calculatePoint = (jabatan) => {
    const kepanitiaanConfigs = ipcConfig['kepanitiaan'] || [];
    const config = kepanitiaanConfigs.find(
      c => c.field1 === jabatan
    );
    return config ? config.point_value : 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset auto-fill flag if user clears the field
    if ((name === 'nis' || name === 'nama') && value === '') {
      setIsAutoFilled(false);
    }

    // Auto-fill student data when NIS is entered
    if (name === 'nis' && value.length >= 1) {
      fetchStudentData(value);
    }

    // Auto-fill student data when nama is entered
    if (name === 'nama' && value.length >= 1) {
      fetchStudentDataByName(value);
    }

    // Calculate point when jabatan_kepanitiaan changes
    if (name === 'jabatan_kepanitiaan') {
      const point = calculatePoint(value);
      setCalculatedPoint(point);
    }
  };

  const handleStudentSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        nama: selectedOption.nama,
        nis: selectedOption.nis,
        kelas: selectedOption.kelas || '',
        grha: selectedOption.grha || ''
      }));
      setIsAutoFilled(true);
    } else {
      setFormData(prev => ({
        ...prev,
        nama: '',
        nis: '',
        kelas: '',
        grha: ''
      }));
      setIsAutoFilled(false);
    }
  };

  const fetchStudentData = async (nis) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/users/nis/${nis}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          nama: response.data.nama || '',
          kelas: response.data.kelas || '',
          grha: response.data.grha || ''
        }));
        setIsAutoFilled(true);
      }
    } catch (error) {
      // Student not found or error, don't auto-fill
      console.log('Student not found or error fetching data');
    }
  };

  const fetchStudentDataByName = async (nama) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/users/nama/${nama}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          nis: response.data.nis || '',
          kelas: response.data.kelas || '',
          grha: response.data.grha || ''
        }));
        setIsAutoFilled(true);
      }
    } catch (error) {
      // Student not found or error, don't auto-fill
      console.log('Student not found or error fetching data');
    }
  };

  const handleFileChange = (e) => {
    setFoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (foto) {
        // Prepend NIS to filename if NIS exists
        const fileToUpload = formData.nis
          ? new File([foto], `${formData.nis}_${foto.name}`, { type: foto.type })
          : foto;
        data.append('foto', fileToUpload);
      }

      await axios.post('/approvals-v2/kepanitiaan/submit', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(userRole === 'superadmin' ? 'Kepanitiaan berhasil ditambahkan!' : 'Kepanitiaan berhasil diajukan untuk persetujuan!');
      if (userRole === 'superadmin') {
        fetchAllKepanitiaan();
      }
      setFormData({
        nama: '',
        nis: '',
        kelas: '',
        grha: '',
        jabatan_kepanitiaan: '',
        kategori_kepanitiaan: ''
      });
      setFoto(null);
      setIsAutoFilled(false);
      setShowForm(false);
      fetchUserSubmissions(); // Refresh submissions list
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengirim kepanitiaan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    editModal.openEditModal(item);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini? IPC akan dikembalikan jika sudah disetujui.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/kepanitiaan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Kepanitiaan berhasil dihapus!');
      fetchAllKepanitiaan();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus kepanitiaan');
    }
  };

  const handleEditFileChange = (e) => {
    editModal.setEditFoto(e.target.files[0]);
  };

  const handleUpdate = async () => {
    editModal.setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.keys(editModal.editFormData).forEach(key => {
        if (key !== 'id' && key !== 'created_at' && key !== 'status' && key !== 'user_id') {
          data.append(key, editModal.editFormData[key]);
        }
      });
      if (editModal.editFoto) {
        const fileToUpload = editModal.editFormData.nis
          ? new File([editModal.editFoto], `${editModal.editFormData.nis}_${editModal.editFoto.name}`, { type: editModal.editFoto.type })
          : editModal.editFoto;
        data.append('foto', fileToUpload);
      }

      await axios.put(`/kepanitiaan/${editModal.editingItem.id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Kepanitiaan berhasil diperbarui!');
      fetchAllKepanitiaan();
      editModal.closeEditModal();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui kepanitiaan');
    } finally {
      editModal.setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#ffc107', color: '#333' },
      approved: { background: '#28a745', color: 'white' },
      rejected: { background: '#dc3545', color: 'white' }
    };
    const labels = {
      pending: '⏳ Menunggu',
      approved: '✅ Disetujui',
      rejected: '❌ Ditolak'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        ...styles[status]
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (checkingAccess) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!hasAccess) {
    return (
      <div className="card">
        <h2>🚫 Akses Ditolak</h2>
        <div className="alert alert-danger" style={{ marginTop: '15px' }}>
          {accessMessage || 'Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi SuperAdmin.'}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Input Kepanitiaan</h2>
        {userRole === 'superadmin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Tutup Form' : '+ Input Kepanitiaan'}
          </button>
        )}
      </div>
      
      {message && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {message}
        </div>
      )}
      
      {/* Index Display for Superadmin */}
      {(userRole === 'superadmin' && !showForm) && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>📋 Index Kepanitiaan</h3>
          {loadingIndex ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th>Kategori</th>
                    <th>Jabatan</th>
                    <th>Point</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allKepanitiaan.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.nama}</td>
                      <td>{item.nis}</td>
                      <td>{item.kategori_kepanitiaan}</td>
                      <td>{item.jabatan_kepanitiaan}</td>
                      <td>{item.point}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <button 
                          className="btn btn-info" 
                          onClick={() => handleEdit(item)} 
                          style={{ padding: '3px 8px', fontSize: '12px', marginRight: '5px' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(item.id)} 
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allKepanitiaan.length === 0 && (
                <p className="text-muted">Belum ada data kepanitiaan</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Input Form - Show for non-superadmin or when showForm is true */}
      {(userRole !== 'superadmin' || showForm) && (
        <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Nama <span className="required">*</span></label>
            <Select
              value={students.find(s => s.nama === formData.nama && s.nis === formData.nis) ? { value: formData.nama, label: formData.nama, nama: formData.nama, nis: formData.nis, kelas: formData.kelas, grha: formData.grha } : null}
              onChange={(selected) => handleStudentSelect(selected)}
              options={students.map(student => ({ value: student.nama, label: `${student.nama} (${student.nis})`, nama: student.nama, nis: student.nis, kelas: student.kelas, grha: student.grha }))}
              placeholder="Cari nama siswa..."
              isSearchable
              isClearable
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px'
                })
              }}
            />
            {isAutoFilled && <p className="form-helper-text">Data diisi otomatis dari NIS</p>}
          </div>
          <div className="form-group">
            <label>NIS <span className="required">*</span></label>
            <Select
              value={students.find(s => s.nis === formData.nis) ? { value: formData.nis, label: formData.nis, nama: formData.nama, nis: formData.nis, kelas: formData.kelas, grha: formData.grha } : null}
              onChange={(selected) => handleStudentSelect(selected)}
              options={students.map(student => ({ value: student.nis, label: `${student.nis} - ${student.nama}`, nama: student.nama, nis: student.nis, kelas: student.kelas, grha: student.grha }))}
              placeholder="Cari NIS siswa..."
              isSearchable
              isClearable
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px'
                })
              }}
            />
            <p className="form-helper-text">Masukkan NIS untuk mengisi data siswa secara otomatis</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Kelas</label>
            <input 
              type="text" 
              name="kelas" 
              value={formData.kelas} 
              onChange={handleChange} 
              placeholder="Auto-filled from student data"
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Auto-filled from student data</small>
          </div>
          <div className="form-group">
            <label>Grha</label>
            <select name="grha" value={formData.grha} onChange={handleChange}>
              <option value="">Pilih Grha</option>
              {grhaOptions.map(grha => (
                <option key={grha} value={grha}>{grha}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Jabatan Kepanitiaan</label>
          <select name="jabatan_kepanitiaan" value={formData.jabatan_kepanitiaan} onChange={handleChange} required>
            <option value="">Pilih Jabatan</option>
            {jabatanOptions.map(jabatan => (
              <option key={jabatan.value} value={jabatan.value}>{jabatan.label} {formData.jabatan_kepanitiaan === jabatan.value && calculatedPoint ? `(${calculatedPoint} point)` : ''}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Kategori Kepanitiaan</label>
          <input
            type="text"
            name="kategori_kepanitiaan"
            value={formData.kategori_kepanitiaan}
            onChange={handleChange}
            placeholder="Nama kepanitiaan"
          />
        </div>

        <div className="form-group" style={{ 
          padding: '12px', 
          background: '#EAFBF3',
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <label style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>
            Point IPC yang akan didapatkan:
          </label>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '700',
            color: '#0F7A55'
          }}>
            +{calculatedPoint}
          </span>
        </div>

        <div className="form-group">
          <label>Foto Bukti</label>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Mengirim...' : (userRole === 'superadmin' ? 'Kirim' : 'Ajukan untuk Persetujuan')}
        </button>
      </form>
      )}

      <EditModal
        isOpen={editModal.showEditModal}
        title="Edit Kepanitiaan"
        onClose={editModal.closeEditModal}
        onSave={handleUpdate}
        isLoading={editModal.isLoading}
        photoPreview={editModal.editingItem?.foto ? `${API_BASE_URL.replace('/api', '')}/${editModal.editingItem.foto}` : null}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Nama</label>
            <input
              type="text"
              value={editModal.editFormData.nama || ''}
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, nama: e.target.value })}
              placeholder="Nama siswa"
            />
          </div>
          <div className="form-group">
            <label>NIS</label>
            <input
              type="text"
              value={editModal.editFormData.nis || ''}
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, nis: e.target.value })}
              placeholder="NIS"
              disabled
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Kelas</label>
            <input 
              type="text" 
              value={editModal.editFormData.kelas || ''} 
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, kelas: e.target.value })}
              disabled
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Auto-filled from student data</small>
          </div>
        </div>

        <div className="form-group">
          <label>Grha</label>
          <select 
            value={editModal.editFormData.grha || ''} 
            onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, grha: e.target.value })}
          >
            <option value="">Pilih Grha</option>
            {grhaOptions.map(grha => (
              <option key={grha} value={grha}>{grha}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Jabatan Kepanitiaan</label>
            <select 
              value={editModal.editFormData.jabatan_kepanitiaan || ''} 
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, jabatan_kepanitiaan: e.target.value })}
            >
              <option value="">Pilih Jabatan</option>
              {jabatanOptions.map(jabatan => (
                <option key={jabatan.value} value={jabatan.value}>{jabatan.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Kategori Kepanitiaan</label>
            <input
              type="text"
              value={editModal.editFormData.kategori_kepanitiaan || ''}
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, kategori_kepanitiaan: e.target.value })}
              placeholder="Nama kepanitiaan"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Foto Bukti {editModal.editingItem?.foto && '(Pilih untuk ganti)'}</label>
          <input
            type="file"
            onChange={handleEditFileChange}
            accept="image/*"
          />
        </div>
      </EditModal>

      {/* Submission History */}
      {submissions.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>📋 Riwayat Pengajuan Kepanitiaan</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {submissions.map((sub, index) => (
              <div key={sub.id || index} style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '10px',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{sub.kategori_kepanitiaan}</strong>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                    {sub.nama} ({sub.nis}) - {sub.jabatan_kepanitiaan}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    Diajukan: {new Date(sub.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  {getStatusBadge(sub.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InputKepanitiaan;
