import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TeacherWaliKelas() {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);

  useEffect(() => {
    fetchMyClass();
  }, []);

  const fetchMyClass = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/wali-kelas/my-class', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError(error.response?.data?.message || 'Gagal mengambil data kelas');
      setLoading(false);
    }
  };

  const handleViewStudentDetail = (student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const getIpcColor = (ipc) => {
    if (ipc >= 90) return '#28a745';
    if (ipc >= 80) return '#17a2b8';
    if (ipc >= 70) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '50px' }}>
        <div className="spinner" style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p>Memuat data kelas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="alert alert-warning" style={{ 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px'
        }}>
          <h4>⚠️ {error}</h4>
          <p>Anda belum ditunjuk sebagai Wali Kelas untuk tahun ajaran ini.</p>
          <p>Silakan hubungi SuperAdmin untuk informasi lebih lanjut.</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Data kelas tidak tersedia.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>👨‍🏫 Dashboard Wali Kelas</h2>
        <p style={{ margin: 0, fontSize: '18px' }}>
          {classData.kelas} | Tahun Ajaran {classData.tahunAjaran}
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Total Siswa */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>
            {classData.totalSiswa}
          </div>
          <div style={{ color: '#666' }}>Total Siswa</div>
        </div>

        {/* Total Prestasi */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>
            {classData.totalPrestasi}
          </div>
          <div style={{ color: '#666' }}>Total Prestasi</div>
        </div>

        {/* Total Event */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9b59b6' }}>
            {classData.totalEvent}
          </div>
          <div style={{ color: '#666' }}>Total Event</div>
        </div>

        {/* Total Organisasi */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e67e22' }}>
            {classData.totalOrganisasi}
          </div>
          <div style={{ color: '#666' }}>Total Organisasi</div>
        </div>

        {/* Total Pelanggaran */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: classData.totalPelanggaran > 0 ? '#e74c3c' : '#27ae60'
          }}>
            {classData.totalPelanggaran}
          </div>
          <div style={{ color: '#666' }}>Total Pelanggaran</div>
        </div>

        {/* Rata-rata IPC */}
        <div style={{ 
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: getIpcColor(classData.rataRataIPC)
          }}>
            {classData.rataRataIPC}
          </div>
          <div style={{ color: '#666' }}>Rata-rata IPC Kelas</div>
        </div>
      </div>

      {/* Students Table */}
      <div style={{ 
        background: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>📋 Daftar Siswa Kelas {classData.kelas}</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>No</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Nama</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>NIS</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Prestasi</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Event</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Organisasi</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Pelanggaran</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>IPC</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classData.students.map((student, index) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{student.nama}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{student.grha}</small>
                  </td>
                  <td style={{ padding: '12px' }}>{student.nis}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: student.stats.prestasi > 0 ? '#d4edda' : '#f8f9fa',
                      color: student.stats.prestasi > 0 ? '#155724' : '#6c757d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {student.stats.prestasi}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: student.stats.event > 0 ? '#e2d4f0' : '#f8f9fa',
                      color: student.stats.event > 0 ? '#6f42c1' : '#6c757d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {student.stats.event}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: student.stats.organisasi > 0 ? '#fff3cd' : '#f8f9fa',
                      color: student.stats.organisasi > 0 ? '#856404' : '#6c757d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {student.stats.organisasi}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: student.stats.pelanggaran > 0 ? '#f8d7da' : '#d4edda',
                      color: student.stats.pelanggaran > 0 ? '#721c24' : '#155724',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {student.stats.pelanggaran}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: getIpcColor(student.ipc_total),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {student.ipc_total || 80}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleViewStudentDetail(student)}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
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

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>👤 Detail Siswa</h3>
              <button
                onClick={() => setShowStudentDetail(false)}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#3498db' }}>Informasi Pribadi</h4>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold', width: '40%' }}>Nama</td>
                    <td style={{ padding: '8px' }}>{selectedStudent.nama}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>NIS</td>
                    <td style={{ padding: '8px' }}>{selectedStudent.nis}</td>
                  </tr>
                  <tr>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Grha</td>
                    <td style={{ padding: '8px' }}>{selectedStudent.grha || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Alamat</td>
                    <td style={{ padding: '8px' }}>{selectedStudent.alamat || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>No. HP</td>
                    <td style={{ padding: '8px' }}>{selectedStudent.no_hp || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#27ae60' }}>Statistik Aktivitas</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px'
              }}>
                <div style={{ 
                  backgroundColor: '#e8f5e9', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                    {selectedStudent.stats.prestasi}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Prestasi</div>
                </div>
                <div style={{ 
                  backgroundColor: '#f3e5f5', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                    {selectedStudent.stats.event}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Event</div>
                </div>
                <div style={{ 
                  backgroundColor: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>
                    {selectedStudent.stats.organisasi}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Organisasi</div>
                </div>
                <div style={{ 
                  backgroundColor: selectedStudent.stats.pelanggaran > 0 ? '#ffebee' : '#e8f5e9', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: selectedStudent.stats.pelanggaran > 0 ? '#e74c3c' : '#27ae60' }}>
                    {selectedStudent.stats.pelanggaran}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Pelanggaran</div>
                </div>
                <div style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                    {selectedStudent.stats.perilaku}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Perilaku Positif</div>
                </div>
                <div style={{ 
                  backgroundColor: getIpcColor(selectedStudent.ipc_total || 80) + '20', 
                  padding: '15px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getIpcColor(selectedStudent.ipc_total || 80) }}>
                    {selectedStudent.ipc_total || 80}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total IPC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherWaliKelas;
