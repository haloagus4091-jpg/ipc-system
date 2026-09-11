import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditModal from './EditModal';
import useEditModal from '../hooks/useEditModal';
import API_BASE_URL from '../config';
import Select from 'react-select';

function InputPelanggaran() {
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    kelas: '',
    grha: '',
    keterangan: '',
    jenis_pelanggaran: ''
  });
  const [foto, setFoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [allPelanggaran, setAllPelanggaran] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [userRole, setUserRole] = useState('');
  const editModal = useEditModal();
  const [ipcConfig, setIpcConfig] = useState([]);
  const [calculatedPoint, setCalculatedPoint] = useState(0);
  const [students, setStudents] = useState([]);
  const jenisOptions = (ipcConfig['pelanggaran'] || [])
    .filter(config => config.field2)
    .map(config => {
      const level = (ipcConfig['pelanggaran'] || []).find(
        candidate => !candidate.field2 && candidate.field1 === config.field2
      );
      return { value: config.field1, label: config.field1, point: level?.point_value || 0 };
    });

  const grhaOptions = [
    'Airsanya', 'Daksina', 'Genya', 'Madhya', 'Nairiti', 'Pascima', 'Purwa', 'Uttara', 'Wayabhya'
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchIpcConfig();
    if (user.role === 'superadmin') {
      fetchAllPelanggaran();
    }
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllPelanggaran = async () => {
    try {
      setLoadingIndex(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/pelanggaran/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllPelanggaran(response.data);
    } catch (error) {
      console.error('Error fetching all pelanggaran:', error);
    } finally {
      setLoadingIndex(false);
    }
  };

  const fetchIpcConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIpcConfig(response.data);
      const firstDetail = (response.data.pelanggaran || []).find(config => config.field2);
      if (firstDetail) {
        setFormData(prev => ({ ...prev, jenis_pelanggaran: firstDetail.field1 }));
        setCalculatedPoint(calculatePoint(firstDetail.field1, response.data));
      }
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

  const calculatePoint = (jenis, configData = ipcConfig) => {
    const pelanggaranConfigs = configData.pelanggaran || [];
    const config = pelanggaranConfigs.find(
      c => c.field1 === jenis
    );
    if (!config) return 0;
    if (config.field2) {
      const level = pelanggaranConfigs.find(
        candidate => !candidate.field2 && candidate.field1 === config.field2
      );
      return level?.point_value || 0;
    }
    return config.point_value;
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

  const handleJenisSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({ ...prev, jenis_pelanggaran: selectedOption.value }));
      setCalculatedPoint(calculatePoint(selectedOption.value));
    } else {
      setFormData(prev => ({ ...prev, jenis_pelanggaran: '' }));
      setCalculatedPoint(0);
    }
  };

  const handleEditJenisSelect = (selectedOption) => {
    if (selectedOption) {
      editModal.setEditFormData({ ...editModal.editFormData, jenis_pelanggaran: selectedOption.value });
    } else {
      editModal.setEditFormData({ ...editModal.editFormData, jenis_pelanggaran: '' });
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

      await axios.post('/approvals-v2/pelanggaran/submit', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(userRole === 'superadmin' ? 'Pelanggaran berhasil ditambahkan!' : 'Pelanggaran berhasil diajukan untuk persetujuan!');
      if (userRole === 'superadmin') {
        fetchAllPelanggaran();
      }
      setFormData({
        nama: '',
        nis: '',
        kelas: '',
        grha: '',
        keterangan: '',
        jenis_pelanggaran: ''
      });
      setFoto(null);
      setIsAutoFilled(false);
      setShowForm(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengirim pelanggaran');
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
      await axios.delete(`/pelanggaran/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Pelanggaran berhasil dihapus!');
      fetchAllPelanggaran();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus pelanggaran');
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

      await axios.put(`/pelanggaran/${editModal.editingItem.id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Pelanggaran berhasil diperbarui!');
      fetchAllPelanggaran();
      editModal.closeEditModal();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui pelanggaran');
    } finally {
      editModal.setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Input Pelanggaran</h2>
        {userRole === 'superadmin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Tutup Form' : '+ Input Pelanggaran'}
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
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>📋 Index Pelanggaran</h3>
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
                    <th>Keterangan</th>
                    <th>Jenis</th>
                    <th>Point</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allPelanggaran.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.nama}</td>
                      <td>{item.nis}</td>
                      <td>{item.keterangan}</td>
                      <td>{item.jenis_pelanggaran}</td>
                      <td style={{ color: 'red' }}>{item.point_dikurangi}</td>
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
              {allPelanggaran.length === 0 && (
                <p className="text-muted">Belum ada data pelanggaran</p>
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
              placeholder="Data diisi otomatis"
              disabled
              required
            />
          </div>
          <div className="form-group">
            <label>Grha</label>
            <select name="grha" value={formData.grha} disabled required onChange={handleChange}>
              <option value="">Data diisi otomatis</option>
              {grhaOptions.map(grha => (
                <option key={grha} value={grha}>{grha}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Keterangan Pelanggaran</label>
          <textarea
            name="keterangan"
            value={formData.keterangan}
            onChange={handleChange}
            placeholder="Jelaskan pelanggaran yang dilakukan"
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>Detail Pelanggaran</label>
          <Select
            value={jenisOptions.find(jenis => jenis.value === formData.jenis_pelanggaran) || null}
            onChange={handleJenisSelect}
            options={jenisOptions.map(jenis => ({
              value: jenis.value,
              label: jenis.point > 0 ? `${jenis.label} (${jenis.point} point)` : jenis.label
            }))}
            placeholder="Pilih Detail Pelanggaran"
            isSearchable
            isClearable
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '40px'
              })
            }}
          />
        </div>

        <div className="form-group" style={{ 
          padding: '12px', 
          background: '#FEE2E2',
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <label style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>
            Point IPC yang akan dikurangi:
          </label>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '700',
            color: '#DC2626'
          }}>
            {calculatedPoint}
          </span>
        </div>

        <div className="form-group">
          <label>Foto Bukti</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Mengirim...' : 'Kirim'}
        </button>
      </form>
      )}

      <EditModal
        isOpen={editModal.showEditModal}
        title="Edit Pelanggaran"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
          <div className="form-group">
            <label>Detail Pelanggaran</label>
            <Select
              value={jenisOptions.find(jenis => jenis.value === editModal.editFormData.jenis_pelanggaran) || null}
              onChange={handleEditJenisSelect}
              options={jenisOptions.map(jenis => ({
                value: jenis.value,
                label: jenis.point > 0 ? `${jenis.label} (${jenis.point} point)` : jenis.label
              }))}
              placeholder="Pilih Detail Pelanggaran"
              isSearchable
              isClearable
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px'
                })
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Keterangan Pelanggaran</label>
          <textarea
            value={editModal.editFormData.keterangan || ''}
            onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, keterangan: e.target.value })}
            placeholder="Jelaskan pelanggaran yang dilakukan"
            rows="3"
          />
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
    </div>
  );
}

export default InputPelanggaran;
