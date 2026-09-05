import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function WaliKelas() {
  const [assignments, setAssignments] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassDetail, setShowClassDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showMismatches, setShowMismatches] = useState(false);
  const [mismatches, setMismatches] = useState(null);
  const [loadingMismatches, setLoadingMismatches] = useState(false);
  const [formData, setFormData] = useState({
    guru_id: '',
    kelas: '',
    tahun_ajaran: new Date().getFullYear().toString()
  });

  const kelasOptions = [
    'X TKJ 1', 'X TKJ 2', 'X TO 1', 'X TO 2',
    'X DPIB 1', 'X DPIB 2',
    'XI TKJ 1', 'XI TKJ 2', 'XI TO 1', 'XI TO 2',
    'XI DPIB 1', 'XI DPIB 2',
    'XII TKJ 1', 'XII TKJ 2', 'XII TO 1', 'XII TO 2',
    'XII DPIB 1', 'XII DPIB 2'
  ];

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClassStatistics();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/wali-kelas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchClassStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/wali-kelas/class-statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassStats(response.data);
    } catch (error) {
      console.error('Error fetching class statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/wali-kelas/available-teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/wali-kelas', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      setShowForm(false);
      setFormData({ guru_id: '', kelas: '', tahun_ajaran: new Date().getFullYear().toString() });
      fetchAssignments();
      fetchClassStatistics();
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal membuat assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus assignment ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/wali-kelas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchAssignments();
      fetchClassStatistics();
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus assignment');
    }
  };

  const handleViewClassDetail = (cls) => {
    setSelectedClass(cls);
    setShowClassDetail(true);
  };

  const handleViewStudentDetail = (student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleCheckMismatches = async () => {
    setLoadingMismatches(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/wali-kelas/class-mismatches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMismatches(response.data);
      setShowMismatches(true);
    } catch (error) {
      console.error('Error checking mismatches:', error);
      alert('Gagal mengecek ketidaksesuaian kelas');
    } finally {
      setLoadingMismatches(false);
    }
  };

  const getIpcColor = (ipc) => {
    if (ipc < 0) return '#dc2626'; // Red for negative values
    if (ipc >= 90) return 'var(--success-color)';
    if (ipc >= 80) return '#17a2b8';
    if (ipc >= 70) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  if (loading) {
    return (
      <div data-aos="fade-up">
        <h2>👨‍🏫 Manajemen Wali Kelas</h2>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '20px' }}></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSiswa = classStats.reduce((sum, cls) => sum + cls.totalSiswa, 0);
  const totalPrestasi = classStats.reduce((sum, cls) => sum + cls.totalPrestasi, 0);
  const totalEvent = classStats.reduce((sum, cls) => sum + cls.totalEvent, 0);
  const totalOrganisasi = classStats.reduce((sum, cls) => sum + cls.totalOrganisasi, 0);
  const totalKepanitiaan = classStats.reduce((sum, cls) => sum + cls.totalKepanitiaan, 0);
  const totalPelanggaran = classStats.reduce((sum, cls) => sum + cls.totalPelanggaran, 0);

  return (
    <div data-aos="fade-up">
      {/* Header */}
      <div style={{ 
        background: 'var(--primary-color)',
        color: 'white',
        padding: '32px',
        borderRadius: 'var(--border-radius-lg)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '3rem' }}>
            👨‍🏫
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
              Manajemen Wali Kelas
            </h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
              Kelola wali kelas dan lihat statistik seluruh kelas
            </h3>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" data-aos="fade-up" data-aos-delay="100" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <h3 style={{ color: 'var(--primary-color)', fontSize: '2rem', margin: '0 0 8px 0' }}>{classStats.length}</h3>
          <p>Total Kelas</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: 'var(--primary-color)', fontSize: '2rem', margin: '0 0 8px 0' }}>{totalSiswa}</h3>
          <p>Total Siswa</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: 'var(--success-color)', fontSize: '2rem', margin: '0 0 8px 0' }}>{totalPrestasi}</h3>
          <p>Total Prestasi</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: '#9b59b6', fontSize: '2rem', margin: '0 0 8px 0' }}>{totalEvent}</h3>
          <p>Total Event</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: 'var(--warning-color)', fontSize: '2rem', margin: '0 0 8px 0' }}>{totalOrganisasi}</h3>
          <p>Total Organisasi</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: '#e67e22', fontSize: '2rem', margin: '0 0 8px 0' }}>{totalKepanitiaan}</h3>
          <p>Total Kepanitiaan</p>
        </div>
        <div className="stat-card">
          <h3 style={{ 
            color: totalPelanggaran > 0 ? 'var(--danger-color)' : 'var(--success-color)', 
            fontSize: '2rem', 
            margin: '0 0 8px 0' 
          }}>
            {totalPelanggaran}
          </h3>
          <p>Total Pelanggaran</p>
        </div>
      </div>

      {/* Class Overview Cards */}
      <div style={{ marginBottom: '24px' }} data-aos="fade-up" data-aos-delay="200">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Overview per Kelas
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {classStats.map((cls) => (
            <div key={cls.kelas} className="card" style={{
              borderLeft: '4px solid var(--primary-color)',
              transition: 'all var(--transition-medium)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
                  {cls.kelas}
                </h4>
                <span style={{ 
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {cls.totalSiswa} Siswa
                </span>
              </div>

              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Wali Kelas:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {cls.wali.foto ? (
                    <img 
                      src={`${API_BASE_URL.replace('/api', '')}${cls.wali.foto}`} 
                      alt={cls.wali.nama} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '2px solid var(--primary-color)'
                    }}>
                      👤
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--primary-color)', fontWeight: '600' }}>{cls.wali.nama}</div>
                    <small style={{ color: 'var(--text-secondary)' }}>NIP: {cls.wali.nip}</small>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  background: '#e8f5e9', 
                  borderRadius: 'var(--border-radius-sm)'
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--success-color)' }}>
                    {cls.totalPrestasi}
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Prestasi</small>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  background: '#f3e5f5', 
                  borderRadius: 'var(--border-radius-sm)'
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#9b59b6' }}>
                    {cls.totalEvent}
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Event</small>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  background: '#fff3e0', 
                  borderRadius: 'var(--border-radius-sm)'
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--warning-color)' }}>
                    {cls.totalOrganisasi}
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Organisasi</small>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  background: '#ffe0b2', 
                  borderRadius: 'var(--border-radius-sm)'
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#e67e22' }}>
                    {cls.totalKepanitiaan}
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Kepanitiaan</small>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    background: cls.totalPelanggaran > 0 ? '#ffebee' : '#e8f5e9',
                    color: cls.totalPelanggaran > 0 ? '#c62828' : '#2e7d32',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {cls.totalPelanggaran} Pelanggaran
                  </span>
                  <span style={{ 
                    background: getIpcColor(cls.rataRataIPC) + '20',
                    color: getIpcColor(cls.rataRataIPC),
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    Rata-rata IPC: {cls.rataRataIPC}
                  </span>
                </div>
                <button
                  onClick={() => handleViewClassDetail(cls)}
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wali Kelas Management */}
      <div className="card" data-aos="fade-up" data-aos-delay="300">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Manajemen Wali Kelas
          </h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Assign Wali Kelas Baru
          </button>
          <button 
            className="btn btn-warning" 
            onClick={handleCheckMismatches}
            disabled={loadingMismatches}
            style={{ marginLeft: '10px' }}
          >
            {loadingMismatches ? 'Mengecek...' : '🔍 Cek Ketidaksesuaian Kelas'}
          </button>
        </div>

        {showForm && (
          <div style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '20px', 
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '20px',
            border: '2px solid var(--primary-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Assign Wali Kelas Baru
              </h4>
              <button 
                onClick={() => setShowForm(false)}
                className="btn btn-danger"
                style={{ padding: '6px 16px' }}
              >
                Tutup
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Guru</label>
                <select
                  value={formData.guru_id}
                  onChange={(e) => setFormData({...formData, guru_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nama} ({teacher.nip}) - {teacher.detail}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kelas</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tahun Ajaran</label>
                <input
                  type="text"
                  value={formData.tahun_ajaran}
                  onChange={(e) => setFormData({...formData, tahun_ajaran: e.target.value})}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-success"
                style={{ width: '100%' }}
              >
                Simpan Assignment
              </button>
            </form>
          </div>
        )}

        {/* Class Mismatches Modal */}
        {showMismatches && mismatches && (
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>🔍 Ketidaksesuaian Kelas</h3>
                <button
                  onClick={() => setShowMismatches(false)}
                  className="btn btn-danger"
                  style={{ padding: '8px 16px' }}
                >
                  Tutup
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                      {mismatches.totalStudents}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total Siswa Aktif</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: mismatches.mismatchCount > 0 ? '#ffebee' : '#e8f5e9', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: mismatches.mismatchCount > 0 ? '#c62828' : '#2e7d32' }}>
                      {mismatches.mismatchCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Siswa Kelas Tidak Sesuai</div>
                  </div>
                </div>

                {mismatches.mismatchCount > 0 ? (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      Siswa-siswa berikut memiliki kelas yang tidak sesuai dengan perhitungan otomatis berdasarkan tahun pelajaran:
                    </p>
                    <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Nama</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>NIS</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Kelas Saat Ini</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Kelas Sesuai Tahun</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Tahun Pelajaran</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Jurusan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mismatches.mismatches.map((mismatch, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ padding: '8px' }}>{mismatch.nama}</td>
                              <td style={{ padding: '8px' }}>{mismatch.nis}</td>
                              <td style={{ padding: '8px', color: '#c62828', fontWeight: 'bold' }}>{mismatch.current_kelas}</td>
                              <td style={{ padding: '8px', color: '#2e7d32', fontWeight: 'bold' }}>{mismatch.expected_kelas}</td>
                              <td style={{ padding: '8px' }}>{mismatch.tahun_pelajaran}</td>
                              <td style={{ padding: '8px' }}>{mismatch.jurusan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '12px' }}>
                      <strong>💡 Solusi:</strong> Gunakan fitur "Validasi Kelas" di halaman Kelola Akun untuk memperbaiki ketidaksesuaian ini secara otomatis.
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#e8f5e9', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#2e7d32'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                    <strong>Semua siswa memiliki kelas yang sesuai dengan perhitungan tahun pelajaran!</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Guru</th>
                <th>NIP</th>
                <th>Kelas</th>
                <th>Tahun Ajaran</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id}>
                  <td style={{ fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {assignment.guru_foto ? (
                        <img 
                          src={`http://localhost:5000${assignment.guru_foto}`} 
                          alt={assignment.guru_nama} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
                        />
                      ) : (
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: 'var(--bg-secondary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '2px solid var(--primary-color)',
                          fontSize: '0.9rem'
                        }}>
                          👤
                        </div>
                      )}
                      {assignment.guru_nama}
                    </div>
                  </td>
                  <td>{assignment.nip}</td>
                  <td>
                    <span style={{ 
                      background: 'var(--primary-color)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {assignment.kelas}
                    </span>
                  </td>
                  <td>{assignment.tahun_ajaran}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      Copot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Detail Modal */}
      {showClassDetail && selectedClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📚 Detail Kelas {selectedClass.kelas}
                </h3>
                <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Wali Kelas: <strong style={{ color: 'var(--primary-color)' }}>{selectedClass.wali.nama}</strong> (NIP: {selectedClass.wali.nip})
                </p>
              </div>
              <button
                onClick={() => setShowClassDetail(false)}
                className="btn btn-danger"
              >
                Tutup
              </button>
            </div>

            {/* Class Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#e3f2fd', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                  {selectedClass.totalSiswa}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Siswa</small>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#e8f5e9', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-color)' }}>
                  {selectedClass.totalPrestasi}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Prestasi</small>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#f3e5f5', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9b59b6' }}>
                  {selectedClass.totalEvent}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Event</small>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#fff3e0', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning-color)' }}>
                  {selectedClass.totalOrganisasi}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Organisasi</small>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#ffe0b2', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e67e22' }}>
                  {selectedClass.totalKepanitiaan}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Kepanitiaan</small>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: selectedClass.totalPelanggaran > 0 ? '#ffebee' : '#e8f5e9', 
                borderRadius: 'var(--border-radius-md)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: selectedClass.totalPelanggaran > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                  {selectedClass.totalPelanggaran}
                </div>
                <small style={{ color: selectedClass.totalPelanggaran > 0 ? '#c62828' : '#2e7d32', fontWeight: '600' }}>Pelanggaran</small>
              </div>
            </div>

            {/* Students List */}
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Daftar Siswa
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th style={{ textAlign: 'center' }}>IPC</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClass.students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '2px solid var(--primary-color)',
                            flexShrink: 0
                          }}>
                            {student.foto ? (
                              <img 
                                src={`http://localhost:5000${student.foto}`} 
                                alt={student.nama} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span style={{ fontSize: '1rem' }}>👤</span>
                            )}
                          </div>
                          {student.nama}
                        </div>
                      </td>
                      <td>{student.nis}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: getIpcColor(student.ipc_total || 80),
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontWeight: '600'
                        }}>
                          {(student.ipc_total || 80) < 0 ? `${student.ipc_total || 80} (MINUS)` : (student.ipc_total || 80)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewStudentDetail(student)}
                          className="btn btn-info"
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '3px solid var(--primary-color)',
                  flexShrink: 0
                }}>
                  {selectedStudent.foto ? (
                    <img 
                      src={`http://localhost:5000${selectedStudent.foto}`} 
                      alt={selectedStudent.nama} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>👤</span>
                  )}
                </div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👤 Detail Siswa
                </h3>
              </div>
              <button
                onClick={() => setShowStudentDetail(false)}
                className="btn btn-danger"
              >
                Tutup
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Nama</strong>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedStudent.nama}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>NIS</strong>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedStudent.nis}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>NISN</strong>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedStudent.nisn || '-'}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Grha</strong>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedStudent.grha || '-'}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Total IPC</strong>
                <span style={{ 
                  background: getIpcColor(selectedStudent.ipc_total || 80),
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}>
                  {selectedStudent.ipc_total || 80}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaliKelas;
