import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditModal from './EditModal';
import useEditModal from '../hooks/useEditModal';
import API_BASE_URL from '../config';

function InputPelanggaran() {
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    kelas: '',
    grha: '',
    keterangan: '',
    jenis_pelanggaran: 'ringan'
  });
  const [foto, setFoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [nisLoading, setNisLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [allPelanggaran, setAllPelanggaran] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [userRole, setUserRole] = useState('');
  const editModal = useEditModal();

  const grhaOptions = [
    'Airsanya', 'Daksina', 'Genya', 'Madhya', 'Nairiti', 'Pascima', 'Purwa', 'Uttara', 'Wayabhya'
  ];

  const jenisOptions = [
    { value: 'ringan', label: 'Ringan (-1 point)' },
    { value: 'sedang', label: 'Sedang (-5 point)' },
    { value: 'berat', label: 'Berat (-25 point)' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    if (user.role === 'superadmin') {
      fetchAllPelanggaran();
    }
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

  // useEffect(() => {
  //   checkPermission();
  // }, []);

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
  //     setHasPermission(response.data.can_input_pelanggaran === true);
  //   } catch (error) {
  //     console.error('Error checking permission:', error);
  //     setHasPermission(false);
  //   } finally {
  //     setCheckingPermission(false);
  //   }
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill student data when NIS is entered
    if (name === 'nis' && value.length >= 1) {
      fetchStudentData(value);
    }
  };

  const fetchStudentData = async (nis) => {
    try {
      setNisLoading(true);
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
    } finally {
      setNisLoading(false);
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
        jenis_pelanggaran: 'ringan'
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

  // Permission checking disabled for now
  // if (checkingPermission) {
  //   return <div className="loading"><div className="spinner"></div></div>;
  // }

  // if (!hasPermission) {
  //   return (
  //     <div className="card">
  //       <h2>Akses Ditolak</h2>
  //       <p>Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi SuperAdmin.</p>
  //     </div>
  //   );
  // }

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
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Nama siswa"
              required
              disabled={isAutoFilled}
              style={{ backgroundColor: isAutoFilled ? '#f0f0f0' : '' }}
            />
            {isAutoFilled && <p className="form-helper-text">Data diisi otomatis dari NIS</p>}
          </div>
          <div className="form-group">
            <label>NIS <span className="required">*</span></label>
            <input
              type="text"
              name="nis"
              value={formData.nis}
              onChange={handleChange}
              placeholder="Masukkan NIS siswa"
              required
              className={nisLoading ? 'auto-fill-loading' : (isAutoFilled ? 'auto-fill-success' : 'nis-input-highlight')}
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
              placeholder="Auto-filled from student data"
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Auto-filled from student data</small>
          </div>
          <div className="form-group">
            <label>Grha</label>
            <select name="grha" value={formData.grha} onChange={handleChange} disabled={isAutoFilled} style={{ backgroundColor: isAutoFilled ? '#f0f0f0' : '' }}>
              <option value="">Pilih Grha</option>
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
          <label>Jenis Pelanggaran</label>
          <select name="jenis_pelanggaran" value={formData.jenis_pelanggaran} onChange={handleChange}>
            {jenisOptions.map(jenis => (
              <option key={jenis.value} value={jenis.value}>{jenis.label}</option>
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
            <label>Jenis Pelanggaran</label>
            <select 
              value={editModal.editFormData.jenis_pelanggaran || ''} 
              onChange={(e) => editModal.setEditFormData({ ...editModal.editFormData, jenis_pelanggaran: e.target.value })}
            >
              {jenisOptions.map(jenis => (
                <option key={jenis.value} value={jenis.value}>{jenis.label}</option>
              ))}
            </select>
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
