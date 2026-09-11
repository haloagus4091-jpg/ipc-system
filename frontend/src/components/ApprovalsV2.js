import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function ApprovalsV2() {
  const PAGE_BG = '#f3f5f9';
  const CARD = '#ffffff';
  const BORDER = '#e7eaf0';
  const TEXT = '#1f2430';
  const MUTED = '#6b7280';
  const BLUE = '#2f5fe8';
  const BLUE_DARK = '#234bc4';
  const AMBER = '#f5a524';
  const AMBER_BG = '#fdf1de';
  const GREEN = '#16a875';
  const GREEN_DARK = '#0f8a61';
  const RED = '#e34848';
  const RED_DARK = '#cc3b3b';
  const RADIUS = '12px';
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
      return (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          color: MUTED
        }}>
          <span style={{ fontSize: "34px", display: "block", marginBottom: "10px" }}>🗂️</span>
          <strong style={{ color: TEXT, display: "block", marginBottom: "4px", fontSize: "15px" }}>Belum ada pengajuan {type}</strong>
          Pengajuan baru akan muncul di sini untuk ditinjau.
        </div>
      );
    }

    const columns = {
      prestasi: ['Diajukan Oleh', 'Nama', 'NIS', 'Lomba', 'Juara', 'Kategori', 'Foto', 'Status', 'Aksi'],
      event: ['Diajukan Oleh', 'Nama', 'NIS', 'Event', 'Tingkat', 'Foto', 'Status', 'Aksi'],
      organisasi: ['Diajukan Oleh', 'Nama', 'NIS', 'Organisasi', 'Jabatan', 'Foto', 'Status', 'Aksi'],
      kepanitiaan: ['Diajukan Oleh', 'Nama', 'NIS', 'Kepanitiaan', 'Jabatan', 'Foto', 'Status', 'Aksi'],
      pelanggaran: ['Diajukan Oleh', 'Nama', 'NIS', 'Keterangan', 'Jenis', 'Foto', 'Status', 'Aksi'],
      perilaku: ['Diajukan Oleh', 'Nama', 'NIS', 'Karakter', 'Status', 'Aksi'],
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
      } else if (!cleanPath.startsWith('/')) {
        cleanPath = `/uploads/${uploadFolder}/${cleanPath}`;
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

    // Get data columns for mobile cards (exclude diajukan, nama, nis, foto, status, aksi)
    const dataCols = columns[type].filter(c => 
      c !== 'Diajukan Oleh' && c !== 'Nama' && c !== 'NIS' && c !== 'Foto' && c !== 'Status' && c !== 'Aksi'
    );

    const getFieldLabel = (col) => {
      const labelMap = {
        'Lomba': 'Lomba',
        'Juara': 'Juara',
        'Kategori': 'Kategori',
        'Event': 'Event',
        'Tingkat': 'Tingkat',
        'Organisasi': 'Organisasi',
        'Jabatan': 'Jabatan',
        'Kepanitiaan': 'Kepanitiaan',
        'Keterangan': 'Keterangan',
        'Jenis': 'Jenis',
        'Karakter': 'Karakter'
      };
      return labelMap[col] || col;
    };

    const getFieldValue = (item, col, type) => {
      if (type === 'prestasi') {
        if (col === 'Lomba') return item.nama_lomba;
        if (col === 'Juara') return item.juara;
        if (col === 'Kategori') return item.kategori;
      }
      if (type === 'event') {
        if (col === 'Event') return item.nama_event;
        if (col === 'Tingkat') return item.tingkat;
      }
      if (type === 'organisasi') {
        if (col === 'Organisasi') return item.kategori_organisasi;
        if (col === 'Jabatan') return item.jabatan_organisasi;
      }
      if (type === 'kepanitiaan') {
        if (col === 'Kepanitiaan') return item.kategori_kepanitiaan;
        if (col === 'Jabatan') return item.jabatan_kepanitiaan;
      }
      if (type === 'pelanggaran') {
        if (col === 'Keterangan') return item.keterangan;
        if (col === 'Jenis') return item.jenis_pelanggaran;
      }
      if (type === 'perilaku') {
        if (col === 'Karakter') return item.karakter_siswa;
      }
      return '';
    };

    const renderMobileCard = (item) => {
      const status = getApprovalStatus(item);
      const isPending = status === 'pending';

      return (
        <div style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: '16px',
          animation: 'fadeSlide 0.28s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: TEXT }}>{item.nama}</div>
              <div style={{ fontWeight: '500', fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>
                NIS {item.nis} · diajukan oleh {item.user_name || 'Unknown'}
              </div>
            </div>
            {isPending ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                background: AMBER_BG,
                color: '#a86a05'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: AMBER,
                  animation: 'blink 1.4s ease-in-out infinite'
                }}></span>
                MENUNGGU
              </span>
            ) : status === 'approved' ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                background: '#e5f7ee',
                color: GREEN_DARK
              }}>✅ DISETUJUI</span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                background: '#fdeaea',
                color: RED_DARK
              }}>❌ DITOLAK</span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 14px',
            marginBottom: '12px'
          }}>
            {dataCols.map(col => (
              <div key={col}>
                <div style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.03em',
                  color: MUTED,
                  fontWeight: '700',
                  marginBottom: '2px'
                }}>{getFieldLabel(col)}</div>
                <div style={{ fontSize: '13.5px', color: TEXT }}>{getFieldValue(item, col, type)}</div>
              </div>
            ))}
            {usesApprovalStatus && type !== 'perilaku' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.03em',
                  color: MUTED,
                  fontWeight: '700',
                  marginBottom: '2px'
                }}>Foto</div>
                <div style={{ fontSize: '13.5px' }}>
                  {getItemPhoto(item, type) ? (
                    <a
                      href={getItemPhoto(item, type)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: BLUE,
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📷 Foto Bukti
                    </a>
                  ) : (
                    <span style={{ color: MUTED }}>-</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {isPending ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#fff',
                    background: GREEN,
                    boxShadow: '0 4px 10px -4px rgba(22,168,117,.5)',
                    transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                  }}
                  onClick={() => setSelectedItem({ ...item, type })}
                >
                  ✅ Setuju
                </button>
                <button 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#fff',
                    background: RED,
                    boxShadow: '0 4px 10px -4px rgba(227,72,72,.5)',
                    transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                  }}
                  onClick={() => setSelectedItem({ ...item, type, action: 'reject' })}
                >
                  ❌ Tolak
                </button>
              </div>
            ) : (
              <span style={{ color: MUTED, fontSize: "12.5px" }}>Selesai diproses</span>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
        <style>{`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.25; }
          }
          @media (max-width: 880px) {
            .desktop-table { display: none !important; }
            .mobile-cards { display: block !important; }
          }
          @media (min-width: 881px) {
            .mobile-cards { display: none !important; }
            .desktop-table { display: table !important; }
          }
          @media (max-width: 480px) {
            .mobile-cards .req-fields {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        <table className="desktop-table" style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px"
        }}>
          <thead>
            <tr>
              {columns[type].map(col => (
                <th key={col} style={{
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: ".03em",
                  fontSize: "11.5px",
                  color: MUTED,
                  fontWeight: "700",
                  background: "#f8f9fc",
                  padding: "14px 18px",
                  borderBottom: `1px solid ${BORDER}`,
                  whiteSpace: "nowrap"
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{
                transition: "background 0.15s ease"
              }}>
                <td style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${BORDER}`,
                  verticalAlign: "middle",
                  color: MUTED
                }}>{item.user_name || 'Unknown'}</td>
                <td style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${BORDER}`,
                  verticalAlign: "middle",
                  fontWeight: "600",
                  color: TEXT
                }}>{item.nama}</td>
                <td style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${BORDER}`,
                  verticalAlign: "middle",
                  color: TEXT
                }}>{item.nis}</td>
                {type === 'prestasi' && (
                  <>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.nama_lomba}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.juara}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.kategori}</td>
                  </>
                )}
                {type === 'event' && (
                  <>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.nama_event}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.tingkat}</td>
                  </>
                )}
                {type === 'organisasi' && (
                  <>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.kategori_organisasi}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.jabatan_organisasi}</td>
                  </>
                )}
                {type === 'kepanitiaan' && (
                  <>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.kategori_kepanitiaan}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.jabatan_kepanitiaan}</td>
                  </>
                )}
                {type === 'pelanggaran' && (
                  <>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.keterangan}</td>
                    <td style={{
                      padding: "16px 18px",
                      borderBottom: `1px solid ${BORDER}`,
                      verticalAlign: "middle",
                      color: TEXT
                    }}>{item.jenis_pelanggaran}</td>
                  </>
                )}
                {type === 'perilaku' && (
                  <td style={{
                    padding: "16px 18px",
                    borderBottom: `1px solid ${BORDER}`,
                    verticalAlign: "middle",
                    color: TEXT
                  }}>{item.karakter_siswa}</td>
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
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: AMBER_BG,
                          color: '#a86a05'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: AMBER,
                            animation: 'blink 1.4s ease-in-out infinite'
                          }}></span>
                          MENUNGGU
                        </span>
                      ) : item.superadmin_status === 'approved' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: '#e5f7ee',
                          color: GREEN_DARK
                        }}>✅ DISETUJUI</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: '#fdeaea',
                          color: RED_DARK
                        }}>❌ DITOLAK</span>
                      )}
                    </td>
                  </>
                )}
                {type === 'student_creation' && (
                  <>
                    <td>{item.nama}</td>
                    <td>{item.nis}</td>
                    <td>{item.kelas}</td>
                    <td>{item.requested_by_name}</td>
                    <td>
                      {item.superadmin_status === 'pending' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: AMBER_BG,
                          color: '#a86a05'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: AMBER,
                            animation: 'blink 1.4s ease-in-out infinite'
                          }}></span>
                          MENUNGGU
                        </span>
                      ) : item.superadmin_status === 'approved' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: '#e5f7ee',
                          color: GREEN_DARK
                        }}>✅ DISETUJUI</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: '#fdeaea',
                          color: RED_DARK
                        }}>❌ DITOLAK</span>
                      )}
                    </td>
                  </>
                )}
                {usesApprovalStatus && (
                  <td style={{
                    padding: "16px 18px",
                    borderBottom: `1px solid ${BORDER}`,
                    verticalAlign: "middle"
                  }}>
                    {getApprovalStatus(item) === 'pending' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        background: AMBER_BG,
                        color: '#a86a05'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: AMBER,
                          animation: 'blink 1.4s ease-in-out infinite'
                        }}></span>
                        MENUNGGU
                      </span>
                    ) : getApprovalStatus(item) === 'approved' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        background: '#e5f7ee',
                        color: GREEN_DARK
                      }}>✅ DISETUJUI</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        background: '#fdeaea',
                        color: RED_DARK
                      }}>❌ DITOLAK</span>
                    )}
                  </td>
                )}
                {usesApprovalStatus && type !== 'perilaku' && (
                  <td style={{
                    padding: "16px 18px",
                    borderBottom: `1px solid ${BORDER}`,
                    verticalAlign: "middle"
                  }}>
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
                      <span style={{ color: MUTED }}>-</span>
                    )}
                  </td>
                )}
                <td style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${BORDER}`,
                  verticalAlign: "middle"
                }}>
                  {type === 'biodata' || type === 'student_creation' ? (
                    item.superadmin_status === 'approved' ? (
                      <span style={{ color: MUTED, fontSize: "12.5px" }}>Selesai diproses</span>
                    ) : item.superadmin_status === 'rejected' ? (
                      <span style={{ color: MUTED, fontSize: "12.5px" }}>Selesai diproses</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            color: '#fff',
                            background: GREEN,
                            boxShadow: '0 4px 10px -4px rgba(22,168,117,.5)',
                            transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                          onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onClick={() => setSelectedItem({ ...item, type, id: item.id })} 
                        >
                          ✅ Setuju
                        </button>
                        <button 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            color: '#fff',
                            background: RED,
                            boxShadow: '0 4px 10px -4px rgba(227,72,72,.5)',
                            transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                          onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onClick={() => setSelectedItem({ ...item, type, id: item.id, action: 'reject' })} 
                        >
                          ❌ Tolak
                        </button>
                      </div>
                    )
                  ) : getApprovalStatus(item) === 'approved' ? (
                    <span style={{ color: MUTED, fontSize: "12.5px" }}>Selesai diproses</span>
                  ) : getApprovalStatus(item) === 'rejected' ? (
                    <span style={{ color: MUTED, fontSize: "12.5px" }}>Selesai diproses</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          color: '#fff',
                          background: GREEN,
                          boxShadow: '0 4px 10px -4px rgba(22,168,117,.5)',
                          transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => setSelectedItem({ ...item, type })} 
                      >
                        ✅ Setuju
                      </button>
                      <button 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          color: '#fff',
                          background: RED,
                          boxShadow: '0 4px 10px -4px rgba(227,72,72,.5)',
                          transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => setSelectedItem({ ...item, type, action: 'reject' })} 
                      >
                        ❌ Tolak
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mobile-cards">
          {data.map(item => renderMobileCard(item))}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 20px 60px"
      }}>
        <div style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: RADIUS,
          padding: "60px 20px",
          textAlign: "center",
          color: MUTED
        }}>
          <div style={{ fontSize: "34px", marginBottom: "10px" }}>⏳</div>
          <strong style={{ color: TEXT, fontSize: "15px" }}>Memuat data...</strong>
        </div>
      </div>
    );
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
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      background: PAGE_BG,
      minHeight: "100vh",
      padding: "28px 20px 60px"
    }}>
      <h1 style={{
        fontSize: "26px",
        fontWeight: "700",
        margin: "4px 0 20px",
        letterSpacing: "-0.01em",
        color: TEXT
      }}>Approvals</h1>

      {message && (
        <div style={{
          background: message.includes('disetujui') ? '#e5f7ee' : message.includes('ditolak') ? '#fdeaea' : '#e8f0fe',
          color: message.includes('disetujui') ? GREEN_DARK : message.includes('ditolak') ? RED_DARK : BLUE_DARK,
          padding: "12px 18px",
          borderRadius: "10px",
          marginBottom: "18px",
          fontSize: "13.5px",
          fontWeight: "600"
        }}>{message}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 18px',
              borderRadius: '10px',
              border: `1px solid ${activeTab === tab.key ? BLUE : BORDER}`,
              background: activeTab === tab.key ? BLUE : '#eceff3',
              color: activeTab === tab.key ? '#fff' : TEXT,
              fontSize: '14.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease',
              userSelect: 'none',
              boxShadow: activeTab === tab.key ? '0 6px 16px -6px rgba(47,95,232,.55)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 10px -4px rgba(20,25,40,.18)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '999px',
                background: RED,
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700'
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: RADIUS,
        boxShadow: '0 1px 2px rgba(20,25,40,.04), 0 8px 24px -12px rgba(20,25,40,.10)',
        overflow: 'hidden'
      }}>
        {renderTable(approvals[activeTab], activeTab)}
      </div>

      {selectedItem && (
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
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: RADIUS,
            boxShadow: '0 12px 30px -10px rgba(0,0,0,.4)',
            width: '500px',
            maxWidth: '90%',
            padding: '24px',
            animation: 'fadeSlide 0.28s ease'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 16px',
              color: TEXT
            }}>
              {selectedItem.action === 'reject' ? 'Tolak Pengajuan' : 'Setujui Pengajuan'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: TEXT,
                marginBottom: '8px'
              }}>Catatan:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan (opsional)"
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = BLUE}
                onBlur={(e) => e.currentTarget.style.borderColor = BORDER}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {selectedItem.action === 'reject' ? (
                <button 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#fff',
                    background: RED,
                    boxShadow: '0 4px 10px -4px rgba(227,72,72,.5)',
                    transition: 'filter 0.15s ease, transform 0.1s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onClick={() => handleReject(selectedItem.type, selectedItem.id)}
                >
                  ❌ Tolak
                </button>
              ) : (
                <button 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#fff',
                    background: GREEN,
                    boxShadow: '0 4px 10px -4px rgba(22,168,117,.5)',
                    transition: 'filter 0.15s ease, transform 0.1s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onClick={() => handleApprove(selectedItem.type, selectedItem.id)}
                >
                  ✅ Setuju
                </button>
              )}
              <button 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: TEXT,
                  background: '#eceff3',
                  transition: 'filter 0.15s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.06)'}
                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => { setSelectedItem(null); setNotes(''); }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalsV2;
