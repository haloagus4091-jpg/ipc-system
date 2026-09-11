import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/approvals/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovals(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch(item.type) {
        case 'prestasi':
          endpoint = `/prestasi/${item.id}/approve`;
          break;
        case 'organisasi':
          endpoint = `/organisasi/${item.id}/approve`;
          break;
        case 'event':
          endpoint = `/event/${item.id}/approve`;
          break;
        case 'pelanggaran':
          endpoint = `/pelanggaran/${item.id}/approve`;
          break;
        case 'perilaku':
          endpoint = `/perilaku/${item.id}/approve`;
          break;
        default:
          return;
      }
      
      await axios.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Berhasil diapprove!');
      fetchApprovals();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal approve');
    }
  };

  const handleReject = async (item) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch(item.type) {
        case 'prestasi':
          endpoint = `/prestasi/${item.id}/reject`;
          break;
        case 'organisasi':
          endpoint = `/organisasi/${item.id}/reject`;
          break;
        case 'event':
          endpoint = `/event/${item.id}/reject`;
          break;
        case 'pelanggaran':
          endpoint = `/pelanggaran/${item.id}/reject`;
          break;
        case 'perilaku':
          endpoint = `/perilaku/${item.id}/reject`;
          break;
        default:
          return;
      }
      
      await axios.put(endpoint, { rejection_reason: reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Berhasil direject!');
      fetchApprovals();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal reject');
    }
  };

  const renderItemDetails = (item) => {
    switch(item.type) {
      case 'prestasi':
        return (
          <>
            <p><strong>Nama Lomba:</strong> {item.nama_lomba}</p>
            <p><strong>Jenis:</strong> {item.jenis}</p>
            <p><strong>Juara:</strong> {item.juara}</p>
            <p><strong>Kategori:</strong> {item.kategori}</p>
            <p><strong>Point:</strong> {item.point}</p>
          </>
        );
      case 'organisasi':
        return (
          <>
            <p><strong>Jabatan:</strong> {item.jabatan_organisasi}</p>
            <p><strong>Kategori:</strong> {item.kategori_organisasi}</p>
            <p><strong>Point:</strong> {item.point}</p>
          </>
        );
      case 'event':
        return (
          <>
            <p><strong>Nama Event:</strong> {item.nama_event}</p>
            <p><strong>Tingkat:</strong> {item.tingkat}</p>
            <p><strong>Point:</strong> {item.point}</p>
          </>
        );
      case 'pelanggaran':
        return (
          <>
            <p><strong>Keterangan:</strong> {item.keterangan}</p>
            <p><strong>Jenis:</strong> {item.jenis_pelanggaran}</p>
            <p><strong>Point Dikurangi:</strong> -{item.point_dikurangi}</p>
          </>
        );
      case 'perilaku':
        return (
          <>
            <p><strong>Karakter:</strong> {item.karakter_siswa}</p>
            <p><strong>Point:</strong> {item.point}</p>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2>Approvals</h2>
      <p>Pending submissions yang menunggu approval</p>
      
      {approvals.length === 0 ? (
        <div className="card">
          <p>Tidak ada pending submissions</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Tipe</th>
                <th>Diajukan Oleh</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>Detail</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map(item => (
                <tr key={`${item.type}-${item.id}`}>
                  <td>
                    <span className={`badge badge-${item.type === 'pelanggaran' ? 'danger' : 'info'}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{item.user_name || item.submitted_by || 'Unknown'}</td>
                  <td>{item.nama}</td>
                  <td>{item.nis}</td>
                  <td>
                    {renderItemDetails(item)}
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(item)}
                      style={{ padding: '5px 10px', marginRight: '5px' }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(item)}
                      style={{ padding: '5px 10px' }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Approvals;
