import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLabels, setShowLabels] = useState(true); // Opsi untuk menampilkan/menyembunyikan label
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
    
    // Refresh data setiap 30 detik untuk memastikan data terbaru
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
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

  // Refresh data manual
  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Selamat datang, {user?.nama}!</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {showLabels ? '🔢 Sembunyikan Angka' : '🔢 Tampilkan Angka'}
          </button>
          <button 
            onClick={handleRefresh}
            className="btn btn-info"
            disabled={loading}
            style={{ minWidth: '120px' }}
          >
            {loading ? 'Memuat...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      
      {!user && (
        <div className="alert alert-warning">
          User data tidak ditemukan. Silakan login ulang.
        </div>
      )}
      
      {user?.role === 'siswa' && (
        <div className="student-dashboard">
          <div className="student-info">
            <h3>🎯 IPC Anda: {user?.ipc_total || 0}</h3>
            <p>Point Indeks Prestasi dan Karakter</p>
          </div>
          
          <div className="student-details">
            <div className="detail-item">
              <span className="detail-label">Nama:</span>
              <span className="detail-value">{user?.nama || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">NIS:</span>
              <span className="detail-value">{user?.nis || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Kelas:</span>
              <span className="detail-value">{user?.kelas || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Grha:</span>
              <span className="detail-value">{user?.grha || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Jurusan:</span>
              <span className="detail-value">{user?.jurusan || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {stats ? (
        <>
          {/* Simple Statistics Header */}
          <div className="dashboard-header">
            <div className="stat-simple">
              <span className="stat-label">Total Siswa:</span>
              <span className="stat-number">{stats.total_students}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Total Guru:</span>
              <span className="stat-number">{stats.total_teachers}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Prestasi Akademik:</span>
              <span className="stat-number">{stats.prestasi_akademik}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Prestasi Non-Akademik:</span>
              <span className="stat-number">{stats.prestasi_nonakademik}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Total Pelanggaran:</span>
              <span className="stat-number">{stats.total_pelanggaran}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Organisasi:</span>
              <span className="stat-number">{stats.total_organisasi}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Kepanitiaan:</span>
              <span className="stat-number">{stats.total_kepanitiaan}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Event:</span>
              <span className="stat-number">{stats.total_event}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Perilaku:</span>
              <span className="stat-number">{stats.total_perilaku}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">Rata-rata IPC:</span>
              <span className="stat-number">{stats.ipc_stats?.rata_rata || 0}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">IPC Tertinggi:</span>
              <span className="stat-number">{stats.ipc_stats?.tertinggi || 0}</span>
            </div>
            <div className="stat-simple">
              <span className="stat-label">IPC Terendah:</span>
              <span className="stat-number">{stats.ipc_stats?.terendah || 0}</span>
            </div>
          </div>

          {/* Top IPC Students */}
          <div className="card">
            <h3>🏆 Top 5 Siswa dengan IPC Tertinggi</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Peringkat</th>
                  <th>Nama</th>
                  <th>NIS</th>
                  <th>Kelas</th>
                  <th>Grha</th>
                  <th>IPC</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_ipc_students && stats.top_ipc_students.map((student, index) => (
                  <tr key={student.id || index}>
                    <td>
                      <span className={`badge badge-${index === 0 ? 'success' : index === 1 ? 'info' : index === 2 ? 'warning' : 'secondary'}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{student.nama}</td>
                    <td>{student.nis || '-'}</td>
                    <td>{student.kelas || '-'}</td>
                    <td>{student.grha || '-'}</td>
                    <td style={{ fontWeight: 'bold', color: '#3B82F6', fontSize: '1.1rem' }}>{student.ipc_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts">
            <div className="chart-item">
              <h3>Siswa per Kelas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.by_kelas || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kelas" />
                  <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                  <Tooltip 
                    formatter={(value) => [value, 'Jumlah Siswa']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#8884d8" 
                    name="Jumlah Siswa"
                    label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-item">
              <h3>Distribusi Siswa per Grha</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.by_grha || []}
                    cx="50%"
                    cy="50%"
                    labelLine={showLabels}
                    label={showLabels ? ({ name, percent, count }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)` : false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    labelStyle={{ fontSize: 12, fontWeight: '500' }}
                  >
                    {(stats.by_grha || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Jumlah Siswa']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-item">
              <h3>Pelanggaran per Grha</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.pelanggaran_by_grha || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grha" />
                  <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                  <Tooltip 
                    formatter={(value) => [value, 'Jumlah Pelanggaran']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#ff6b6b" 
                    name="Jumlah Pelanggaran"
                    label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-item">
              <h3>Perbandingan Prestasi</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Prestasi', akademik: stats.prestasi_akademik || 0, nonakademik: stats.prestasi_nonakademik || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                  <Tooltip 
                    formatter={(value) => [value, 'Jumlah']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="akademik" 
                    fill="#8884d8" 
                    name="Akademik"
                    label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                  />
                  <Bar 
                    dataKey="nonakademik" 
                    fill="#82ca9d" 
                    name="Non-Akademik"
                    label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Tables Section */}
          <div className="dashboard-tables">
            <div className="table-card">
              <h3>📚 Detail Siswa per Kelas</h3>
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

            <div className="table-card">
              <h3>🏠 Detail Siswa per Grha</h3>
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

            <div className="table-card">
              <h3>⚠️ Detail Pelanggaran per Grha</h3>
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
          </div>
        </>
      ) : (
        <div className="alert alert-warning">
          Backend belum terhubung atau database belum siap. Pastikan backend berjalan di port 5000.
        </div>
      )}
    </div>
  );
}

export default Dashboard;
