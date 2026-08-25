import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function ApprovalsV2() {
  const [activeTab, setActiveTab] = useState('prestasi');
  const [approvals, setApprovals] = useState({
    prestasi: [],
    event: [],
    organisasi: [],
    kepanitiaan: [],
    pelanggaran: [],
    perilaku: [],
    biodata: [],
    student_creation: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const [approvalsRes, biodataRes, studentCreationRes] = await Promise.all([
        axios.get('/approvals-v2/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/users/biodata-approvals', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/users/student-creation-approvals', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setApprovals({
        ...approvalsRes.data,
        biodata: biodataRes.data || [],
        student_creation: studentCreationRes.data || []
      });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setMessage('Gagal memuat data approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type, id) => {
    try {
      const token = localStorage.getItem('token');
      
      if (type === 'biodata') {
        await axios.put(`/users/biodata-approvals/${id}`, {
          status: 'approved',
          notes: notes || 'Disetujui'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (type === 'student_creation') {
        await axios.put(`/users/student-creation-approvals/${id}`, {
          status: 'approved',
          notes: notes || 'Disetujui'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`/approvals-v2/superadmin/${type}/${id}`, {
          status: 'approved',
          notes: notes || 'Disetujui'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const typeLabels = {
        biodata: 'Update biodata',
        student_creation: 'Pembuatan akun siswa',
        prestasi: 'Prestasi',
        event: 'Event',
        organisasi: 'Organisasi',
        kepanitiaan: 'Kepanitiaan',
        pelanggaran: 'Pelanggaran',
        perilaku: 'Perilaku'
      };
      setMessage(`${typeLabels[type] || type} berhasil disetujui!`);
      setSelectedItem(null);
      setNotes('');
      fetchApprovals();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menyetujui');
    }
  };

  const handleReject = async (type, id) => {
    try {
      const token = localStorage.getItem('token');
      
      if (type === 'biodata') {
        await axios.put(`/users/biodata-approvals/${id}`, {
          status: 'rejected',
          notes: notes || 'Ditolak'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (type === 'student_creation') {
        await axios.put(`/users/student-creation-approvals/${id}`, {
          status: 'rejected',
          notes: notes || 'Ditolak'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`/approvals-v2/superadmin/${type}/${id}`, {
          status: 'rejected',
          notes: notes || 'Ditolak'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const typeLabels = {
        biodata: 'Update biodata',
        student_creation: 'Pembuatan akun siswa',
        prestasi: 'Prestasi',
        event: 'Event',
        organisasi: 'Organisasi',
        kepanitiaan: 'Kepanitiaan',
        pelanggaran: 'Pelanggaran',
        perilaku: 'Perilaku'
      };
      setMessage(`${typeLabels[type] || type} ditolak`);
      setSelectedItem(null);
      setNotes('');
      fetchApprovals();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menolak');
    }
  };


  const getApprovalStatus = (item) => item.superadmin_status || item.status || 'pending';

  const renderTable = (data, type) => {
    if (data.length === 0) {
      return <p className="text-muted">Tidak ada pengajuan {type}</p>;
    }

    const columns = {
      prestasi: ['Nama', 'NIS', 'Lomba', 'Juara', 'Kategori', 'Foto', 'Status', 'Aksi'],
      event: ['Nama', 'NIS', 'Event', 'Tingkat', 'Foto', 'Status', 'Aksi'],
      organisasi: ['Nama', 'NIS', 'Organisasi', 'Jabatan', 'Foto', 'Status', 'Aksi'],
      kepanitiaan: ['Nama', 'NIS', 'Kepanitiaan', 'Jabatan', 'Foto', 'Status', 'Aksi'],
      pelanggaran: ['Nama', 'NIS', 'Keterangan', 'Jenis', 'Foto', 'Status', 'Aksi'],
      perilaku: ['Nama', 'NIS', 'Karakter', 'Status', 'Aksi'],
    };

    const getPhotoUrl = (path, uploadFolder = 'approvals') => {
      if (!path) return null;
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      let cleanPath = path;
      // Handle organized paths (uploads/approved/type/filename)
      if (path.includes('approved')) {
        cleanPath = path.replace(/\\/g, '/');
        if (!cleanPath.startsWith('/')) {
          cleanPath = `/${cleanPath}`;
        }
      } else if (path.includes('\\') || path.includes(':')) {
        cleanPath = path.split('\\').pop();
        cleanPath = `/uploads/${uploadFolder}/${cleanPath}`;
      } else if (!path.startsWith('/')) {
        cleanPath = `/uploads/${uploadFolder}/${path}`;
      }
      return `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
    };

    const getItemPhoto = (item, itemType) => {
      if (itemType === 'pelanggaran') {
        return item.foto ? getPhotoUrl(item.foto, 'pelanggaran') : null;
      }
      return item.foto_path ? getPhotoUrl(item.foto_path) : null;
    };

    const usesApprovalStatus = !['biodata', 'student_creation'].includes(type);

    return (
      <table className="table">
        <thead>
          <tr>
            {columns[type].map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.nama}</td>
              <td>{item.nis}</td>
              {type === 'prestasi' && (
                <>
                  <td>{item.nama_lomba}</td>
                  <td>{item.juara}</td>
                  <td>{item.kategori}</td>
                </>
              )}
              {type === 'event' && (
                <>
                  <td>{item.nama_event}</td>
                  <td>{item.tingkat}</td>
                </>
              )}
              {type === 'organisasi' && (
                <>
                  <td>{item.kategori_organisasi}</td>
                  <td>{item.jabatan_organisasi}</td>
                </>
              )}
              {type === 'kepanitiaan' && (
                <>
                  <td>{item.kategori_kepanitiaan}</td>
                  <td>{item.jabatan_kepanitiaan}</td>
                </>
              )}
              {type === 'pelanggaran' && (
                <>
                  <td>{item.keterangan}</td>
                  <td>{item.jenis_pelanggaran}</td>
                </>
              )}
              {type === 'perilaku' && (
                <td>{item.karakter_siswa}</td>
              )}
              {type === 'biodata' && (
                <>
                  <td>{item.student_name}</td>
                  <td>{item.nis_lama}</td>
                  <td>{item.nis_baru}</td>
                  <td>
                    <small>
                      {item.nama_baru !== item.nama_lama && <div>Nama: {item.nama_lama} → {item.nama_baru}</div>}
                      {item.kelas_baru !== item.kelas_lama && <div>Kelas: {item.kelas_lama} → {item.kelas_baru}</div>}
                      {item.jurusan_baru !== item.jurusan_lama && <div>Jurusan: {item.jurusan_lama} → {item.jurusan_baru}</div>}
                      {item.tahun_pelajaran_baru !== item.tahun_pelajaran_lama && <div>Tahun Pelajaran: {item.tahun_pelajaran_lama} → {item.tahun_pelajaran_baru}</div>}
                      {item.grha_baru !== item.grha_lama && <div>Grha: {item.grha_lama} → {item.grha_baru}</div>}
                    </small>
                  </td>
                  <td>{item.requested_by_name}</td>
                  <td>
                    {item.superadmin_status === 'pending' ? (
                      <span className="badge badge-warning">⏳ Menunggu</span>
                    ) : item.superadmin_status === 'approved' ? (
                      <span className="badge badge-success">✅ Disetujui</span>
                    ) : (
                      <span className="badge badge-danger">❌ Ditolak</span>
                    )}
                  </td>
                </>
              )}
              {type === 'student_creation' && (
                <>
                  <td>{item.nama}</td>
                  <td>{item.nis}</td>
                  <td>{item.nisn}</td>
                  <td>{item.kelas}</td>
                  <td>{item.requested_by_name}</td>
                  <td>
                    {item.superadmin_status === 'pending' ? (
                      <span className="badge badge-warning">⏳ Menunggu</span>
                    ) : item.superadmin_status === 'approved' ? (
                      <span className="badge badge-success">✅ Disetujui</span>
                    ) : (
                      <span className="badge badge-danger">❌ Ditolak</span>
                    )}
                  </td>
                </>
              )}
              {usesApprovalStatus && (
                <td>
                  {getApprovalStatus(item) === 'pending' ? (
                    <span className="badge badge-warning">⏳ Menunggu</span>
                  ) : getApprovalStatus(item) === 'approved' ? (
                    <span className="badge badge-success">✅ Disetujui</span>
                  ) : (
                    <span className="badge badge-danger">❌ Ditolak</span>
                  )}
                </td>
              )}
              {usesApprovalStatus && type !== 'perilaku' && (
                <td>
                  {getItemPhoto(item, type) ? (
                    <div>
                      <img
                        src={getItemPhoto(item, type)}
                        alt="Foto Bukti"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px', cursor: 'pointer' }}
                        onClick={() => window.open(getItemPhoto(item, type), '_blank')}
                        title="Klik untuk memperbesar"
                      />
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
              )}
              <td>
                {type === 'biodata' || type === 'student_creation' ? (
                  item.superadmin_status === 'approved' ? (
                    <span className="badge badge-success">✅ Disetujui</span>
                  ) : item.superadmin_status === 'rejected' ? (
                    <span className="badge badge-danger">❌ Ditolak</span>
                  ) : (
                    <>
                      <button 
                        className="btn btn-success" 
                        onClick={() => setSelectedItem({ ...item, type, id: item.id })} 
                        style={{ marginRight: '5px', padding: '6px 12px', fontSize: '13px' }}
                      >
                        ✅ Setuju
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => setSelectedItem({ ...item, type, id: item.id, action: 'reject' })} 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        ❌ Tolak
                      </button>
                    </>
                  )
                ) : getApprovalStatus(item) === 'approved' ? (
                  <span className="badge badge-success">✅ Disetujui</span>
                ) : getApprovalStatus(item) === 'rejected' ? (
                  <span className="badge badge-danger">❌ Ditolak</span>
                ) : (
                  <>
                    <button 
                      className="btn btn-success" 
                      onClick={() => setSelectedItem({ ...item, type })} 
                      style={{ marginRight: '5px', padding: '6px 12px', fontSize: '13px' }}
                    >
                      ✅ Setuju
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => setSelectedItem({ ...item, type, action: 'reject' })} 
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      ❌ Tolak
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const tabs = [
    { key: 'prestasi', label: 'Prestasi', count: approvals.prestasi.length },
    { key: 'event', label: 'Event', count: approvals.event.length },
    { key: 'organisasi', label: 'Organisasi', count: approvals.organisasi.length },
    { key: 'kepanitiaan', label: 'Kepanitiaan', count: approvals.kepanitiaan.length },
    { key: 'pelanggaran', label: 'Pelanggaran', count: approvals.pelanggaran?.length || 0 },
    { key: 'perilaku', label: 'Perilaku', count: approvals.perilaku?.length || 0 },
  ];

  return (
    <div>
      <h2>Approvals</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: '5px' }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {renderTable(approvals[activeTab], activeTab)}
      </div>

      {selectedItem && (
        <div className="modal" style={{
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
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3>
              {selectedItem.action === 'reject' ? 'Tolak Pengajuan' : 'Setujui Pengajuan'}
            </h3>
            <div className="form-group">
              <label>Catatan:</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan (opsional)"
                rows="3"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedItem.action === 'reject' ? (
                <button className="btn btn-danger" onClick={() => handleReject(selectedItem.type, selectedItem.id)}>Tolak</button>
              ) : (
                <button className="btn btn-success" onClick={() => handleApprove(selectedItem.type, selectedItem.id)}>Setujui</button>
              )}
              <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setNotes(''); }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalsV2;
