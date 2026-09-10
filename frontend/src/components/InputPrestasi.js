import { useState, useEffect } from 'react';
import axios from 'axios';
import EditModal from './EditModal';
import useEditModal from '../hooks/useEditModal';
import API_BASE_URL from '../config';
import Select from 'react-select';

function InputPrestasi() {
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    jenis: 'akademik',
    nama_lomba: '',
    kelas: '',
    pembina: '',
    grha: '',
    juara: 'juara 1',
    kategori: 'kecamatan'
  });
  const [foto, setFoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [hasAccess, setHasAccess] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [allPrestasi, setAllPrestasi] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [userRole, setUserRole] = useState('');
  const editModal = useEditModal();
  const [ipcConfig, setIpcConfig] = useState([]);
  const [calculatedPoint, setCalculatedPoint] = useState(0);
  const prestasiConfigs = ipcConfig.prestasi || [];
  const tingkatLombaOptions = [...new Set(prestasiConfigs.map(config => config.field1))];
  const juaraLombaOptions = [...new Set(prestasiConfigs.map(config => config.field2))];
  const [students, setStudents] = useState([]);

  const grhaOptions = [
    'Airsanya', 'Daksina', 'Genya', 'Madhya', 'Nairiti', 'Pascima', 'Purwa', 'Uttara', 'Wayabhya'
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchTeachers();
    fetchUserSubmissions();
    fetchIpcConfig();
    fetchStudents();
    checkAccess();
    if (user.role === 'superadmin') {
      fetchAllPrestasi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllPrestasi = async () => {
    try {
      setLoadingIndex(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/prestasi/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllPrestasi(response.data);
    } catch (error) {
      console.error('Error fetching all prestasi:', error);
    } finally {
      setLoadingIndex(false);
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
      await axios.delete(`/prestasi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Prestasi berhasil dihapus!');
      fetchAllPrestasi();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus prestasi');
    }
  };

  const handleUpdate = async () => {
    editModal.setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      Object.keys(editModal.editFormData).forEach(key => {
        if (key !== 'id' && key !== 'created_at' && key !== 'status' && key !== 'user_id') {
          updateData[key] = editModal.editFormData[key];
        }
      });
      
      await axios.put(`/prestasi/${editModal.editingItem.id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      setMessage('Prestasi berhasil diperbarui!');
      fetchAllPrestasi();
      editModal.closeEditModal();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui prestasi');
    } finally {
      editModal.setIsLoading(false);
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
      
      console.log('[Access Check] Response:', response.data);
      
      const canInputPrestasi = response.data.prestasi;
      setHasAccess(canInputPrestasi);
      
      if (!canInputPrestasi) {
        setAccessMessage('Anda tidak memiliki izin untuk input data prestasi. Silakan hubungi SuperAdmin.');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      // Fail open - allow access if error
      setHasAccess(true);
    } finally {
      setCheckingAccess(false);
    }
  };

  // const checkPermission = async () => {
  //   const user = JSON.parse(localStorage.getItem('user'));
  //   if (user?.role === 'superadmin') {
  //     setHasPermission(true);
  //     setCheckingPermission(false);
  //     return;
  //   }

  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await axios.get('/permissions/' + user.id, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setHasPermission(response.data.can_input_prestasi === true);
  //   } catch (error) {
  //     console.error('Error checking permission:', error);
  //     setHasPermission(false);
  //   } finally {
  //     setCheckingPermission(false);
  //   }
  // };

  const fetchUserSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/approvals-v2/user-submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data.prestasi || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/prestasi/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchIpcConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIpcConfig(response.data);
      const firstTingkat = response.data.prestasi?.[0]?.field1 || 'kecamatan';
      const firstJuara = response.data.prestasi?.[0]?.field2 || 'juara 1';
      setFormData(prev => ({ ...prev, kategori: firstTingkat, juara: firstJuara }));
      setCalculatedPoint(calculatePoint(firstTingkat, firstJuara, response.data));
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
      // Filter only students
      const studentList = response.data.filter(user => user.role === 'siswa');
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const calculatePoint = (tingkat, juara, configData = ipcConfig) => {
    const config = (configData.prestasi || []).find(
      c => c.field1 === tingkat && c.field2 === juara
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

    // Calculate point when tingkat lomba or juara changes
    if (name === 'kategori' || name === 'juara') {
      const newFormData = { ...formData, [name]: value };
      const point = calculatePoint(newFormData.kategori, newFormData.juara);
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
      console.log('Fetching student data for NIS:', nis);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/users/nis/${nis}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Student data response:', response.data);
      
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          nama: response.data.nama || '',
          kelas: response.data.kelas || '',
          grha: response.data.grha || ''
        }));
        setIsAutoFilled(true);
        console.log('Form data updated:', { nama: response.data.nama, kelas: response.data.kelas, grha: response.data.grha });
      }
    } catch (error) {
      // Student not found or error, don't show error to user and don't auto-fill
      console.log('Student not found or error fetching data:', error.message);
      // Don't update form data if student not found
    }
  };

  const fetchStudentDataByName = async (nama) => {
    try {
      console.log('Fetching student data for name:', nama);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/users/nama/${nama}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Student data response:', response.data);
      
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          nis: response.data.nis || '',
          kelas: response.data.kelas || '',
          grha: response.data.grha || ''
        }));
        setIsAutoFilled(true);
        console.log('Form data updated:', { nis: response.data.nis, kelas: response.data.kelas, grha: response.data.grha });
      }
    } catch (error) {
      // Student not found or error, don't show error to user and don't auto-fill
      console.log('Student not found or error fetching data:', error.message);
      // Don't update form data if student not found
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

      const response = await axios.post('/approvals-v2/prestasi/submit', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Use message from backend response (different for superadmin vs regular user)
      setMessage(response.data?.message || 'Data prestasi berhasil dikirim!');
      fetchUserSubmissions();
      if (userRole === 'superadmin') {
        fetchAllPrestasi();
      }
      setFormData({
        nama: '',
        nis: '',
        jenis: 'akademik',
        nama_lomba: '',
        kelas: '',
        pembina: '',
        grha: '',
        juara: 'juara 1',
        kategori: 'kecamatan'
      });
      setFoto(null);
      setIsAutoFilled(false);
      setShowForm(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengirim prestasi');
    } finally {
      setLoading(false);
    }
  };

  // Permission checking disabled for now
  // if (checkingPermission) {
  //   return <div className="loading"><div className="spinner"></div></div>;
  // }

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
        <h2>Input Prestasi</h2>
        {userRole === 'superadmin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Input Prestasi
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
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>📋 Index Prestasi</h3>
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
                    <th>Lomba</th>
                    <th>Juara</th>
                    <th>Tingkat Lomba</th>
                    <th>Pembina</th>
                    <th>Point</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allPrestasi.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.nama}</td>
                      <td>{item.nis}</td>
                      <td>{item.nama_lomba}</td>
                      <td>{item.juara}</td>
                      <td>{item.kategori}</td>
                      <td>{item.pembina || '-'}</td>
                      <td>{item.point}</td>
                      <td>{getStatusBadge(item)}</td>
                      <td>
                        <button className="btn btn-info" onClick={() => handleEdit(item)} style={{ padding: '3px 8px', fontSize: '12px', marginRight: '5px' }}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(item.id)} style={{ padding: '3px 8px', fontSize: '12px' }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPrestasi.length === 0 && (
                <p className="text-muted">Belum ada data prestasi</p>
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
              disabled
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
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
            <p className="form-helper-text">Data diisi otomatis dari NIS</p>
          </div>
        </div>

        <div className="form-group">
          <label>Nama Lomba</label>
          <input
            type="text"
            name="nama_lomba"
            value={formData.nama_lomba}
            onChange={handleChange}
            placeholder="Nama lomba"
            required
          />
        </div>

        <div className="form-group">
          <label>Pembina</label>
          <select name="pembina" value={formData.pembina} onChange={handleChange}>
            <option value="">Pilih Pembina</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.nama}>{teacher.nama} ({teacher.nip})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Foto Bukti</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Juara</label>
            <select name="juara" value={formData.juara} onChange={handleChange}>
              {juaraLombaOptions.map(juara => (
                <option key={juara} value={juara}>{juara}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tingkat Lomba</label>
            <select name="kategori" value={formData.kategori} onChange={handleChange}>
              {tingkatLombaOptions.map(tingkat => (
                <option key={tingkat} value={tingkat}>{tingkat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ 
          padding: '12px', 
          background: calculatedPoint > 0 ? '#EAFBF3' : '#FEE2E2',
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <label style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>
            Point IPC yang akan didapatkan:
          </label>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '700',
            color: calculatedPoint > 0 ? '#0F7A55' : '#DC2626'
          }}>
            {calculatedPoint > 0 ? '+' : ''}{calculatedPoint}
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Mengirim...' : (JSON.parse(localStorage.getItem('user') || '{}').role === 'superadmin' ? 'Kirim' : 'Ajukan untuk Persetujuan')}
        </button>
      </form>
      )}

      <EditModal
        isOpen={editModal.showEditModal}
        title="Edit Prestasi"
        onClose={editModal.closeEditModal}
        onSave={handleUpdate}
        isLoading={editModal.isLoading}
        photoPreview={editModal.editingItem?.foto ? `${API_BASE_URL.replace('/api', '')}/${editModal.editingItem.foto}` : null}
      >
        <div className="form-group">
          <label>Nama</label>
          <input
            type="text"
            value={editModal.editFormData.nama || ''}
            required
            disabled={true}
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
          />
        </div>

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

        <div className="form-group">
          <label>Grha</label>
          <select 
            value={editModal.editFormData.grha || ''} 
            disabled={true}
            onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, grha: e.target.value })}
          >
            <option value="">Pilih Grha</option>
            {grhaOptions.map(grha => (
              <option key={grha} value={grha}>{grha}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Nama Lomba</label>
          <input
            type="text"
            name="nama_lomba"
            value={editModal.editFormData.nama_lomba || ''} 
            onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, nama_lomba: e.target.value })}
            placeholder="Nama lomba"
            required
          />
        </div>

        <div className="form-group">
          <label>Pembina</label>
          <select name="pembina" value={editModal.editFormData.pembina} onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, pembina: e.target.value })}>
            <option value="">Pilih Pembina</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.nama}>{teacher.nama} ({teacher.nip})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Juara</label>
          <select name="juara" value={editModal.editFormData.juara} onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, juara: e.target.value })}>
            {juaraLombaOptions.map(juara => (
              <option key={juara} value={juara}>{juara}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tingkat Lomba</label>
          <select name="kategori" value={editModal.editFormData.kategori} onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, kategori: e.target.value })}>
            {tingkatLombaOptions.map(tingkat => (
              <option key={tingkat} value={tingkat}>{tingkat}</option>
            ))}
          </select>
        </div>
      </EditModal>

      {/* Submission History - Hidden for Superadmin */}
      {JSON.parse(localStorage.getItem('user') || '{}').role !== 'superadmin' && (
        <div style={{ marginTop: '30px' }}>
          <h3>Riwayat Pengajuan</h3>
          {submissions.length === 0 ? (
            <p className="text-muted">Belum ada pengajuan</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Lomba</th>
                  <th>Juara</th>
                  <th>Pembina</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td>{item.nama_lomba}</td>
                    <td>{item.juara}</td>
                    <td>{item.pembina || '-'}</td>
                    <td>{getStatusBadge(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusBadge(item) {
  if (item.status === 'rejected') {
    return <span className="badge badge-danger">Ditolak</span>;
  }
  if (item.status === 'approved') {
    return <span className="badge badge-success">Disetujui</span>;
  }
  return <span className="badge badge-warning">Menunggu</span>;
}

export default InputPrestasi;
