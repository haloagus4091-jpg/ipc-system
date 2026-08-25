import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Selamat datang, {user?.nama}!</p>
      
      {!user && (
        <div className="alert alert-warning">
          User data tidak ditemukan. Silakan login ulang.
        </div>
      )}
      
      {user?.role === 'siswa' && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>IPC Anda</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#3498db' }}>{user?.ipc_total || 0}</p>
          <p>Point Indeks Prestasi dan Karakter</p>
        </div>
      )}

      {user?.role !== 'siswa' && (
        <>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{stats.total_students}</h3>
                <p>Total Siswa</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_teachers}</h3>
                <p>Total Guru</p>
              </div>
              <div className="stat-card">
                <h3>{stats.prestasi_akademik}</h3>
                <p>Prestasi Akademik</p>
              </div>
              <div className="stat-card">
                <h3>{stats.prestasi_nonakademik}</h3>
                <p>Prestasi Non-Akademik</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_pelanggaran}</h3>
                <p>Total Pelanggaran</p>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              Backend belum terhubung atau database belum siap. Pastikan backend berjalan di port 5000.
            </div>
          )}

          {stats && (
            <>
              <div className="card">
                <h3>Siswa per Kelas</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.by_kelas && stats.by_kelas.map((item, index) => (
                      <tr key={index}>
                        <td>{item.kelas}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3>Siswa per Grha</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Grha</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.by_grha && stats.by_grha.map((item, index) => (
                      <tr key={index}>
                        <td>{item.grha}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3>Pelanggaran per Grha</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Grha</th>
                      <th>Jumlah Pelanggaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pelanggaran_by_grha && stats.pelanggaran_by_grha.map((item, index) => (
                      <tr key={index}>
                        <td>{item.grha}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
