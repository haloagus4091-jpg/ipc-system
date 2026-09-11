import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
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
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  // CSS Variables
  const BG = '#eef1f7';
  const CARD = '#ffffff';
  const BORDER = '#e6e9f1';
  const TEXT = '#1b2033';
  const MUTED = '#727a8c';
  const BLUE = '#2f5fe8';
  const PURPLE = '#7c6fd6';
  const GREEN = '#16a875';
  const AMBER = '#f5a524';
  const RED = '#e34848';
  const TEAL = '#23b5b5';
  const RADIUS = '16px';
  const SHADOW = '0 1px 2px rgba(20,25,45,.04), 0 10px 26px -14px rgba(20,25,45,.14)';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);
  
  // Chart colors
  const COLORS = ['#2f5fe8', '#23b5b5', '#16a875', '#f5a524', '#7c6fd6', '#e34848'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
    fetchSchoolConfig();
    
    // Refresh data setiap 30 detik untuk memastikan data terbaru
    const interval = setInterval(fetchStats, 30000);
    
    // Refresh school config setiap 30 detik untuk sinkron dengan perubahan logo
    const schoolConfigInterval = setInterval(fetchSchoolConfig, 30000);
    
    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(schoolConfigInterval);
      clearInterval(clockInterval);
    };
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

  const fetchSchoolConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/school-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('School config response:', response.data);
      setSchoolConfig(response.data);
    } catch (error) {
      console.error('Error fetching school config:', error);
      // Use default values if fetch fails
      setSchoolConfig({
        school_name: 'SMK Negeri Bali Mandara',
        school_description: 'Sistem Index Prestasi Citra (IPC) • Panel Admin',
        principal_name: 'Nama Kepala Sekolah',
        principal_nip: '',
        logo_url: null
      });
    }
  };

  // Refresh data manual
  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: BG,
        minHeight: "100vh",
        padding: "26px 24px 60px"
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

  // Clock formatting
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const clockDate = `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  const clockTime = currentTime.toLocaleTimeString('id-ID');

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: BG,
      minHeight: "100vh",
      padding: "26px 24px 60px"
    }}>
      {/* HEADER */}
      <div style={{
        position: 'relative',
        background: RED,
        color: '#fff',
        overflow: 'hidden',
        borderRadius: RADIUS,
        marginBottom: '20px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: '.35',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'relative',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(145deg, #fff, #dbe4ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 18px -6px rgba(0,0,0,.45)',
              overflow: 'hidden'
            }}>
              {schoolConfig?.logo_url ? (
                <img
                  src={`${API_BASE_URL.replace('/api', '')}${schoolConfig.logo_url}`}
                  alt="Logo Sekolah"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '4px'
                  }}
                  onError={(e) => {
                    console.error('Logo image failed to load:', e);
                    console.error('Image URL:', `${API_BASE_URL.replace('/api', '')}${schoolConfig.logo_url}`);
                  }}
                />
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4z" fill={BLUE}/>
                  <path d="M9 12.5l2 2 4-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '-0.01em',
                lineHeight: '1.2'
              }}>{schoolConfig?.school_name || 'SMK Negeri Bali Mandara'}</div>
              <div style={{
                fontSize: '12.5px',
                color: 'rgba(255,255,255,.68)',
                marginTop: '2px'
              }}>{schoolConfig?.school_description || 'Sistem Index Prestasi Citra (IPC) · Panel Admin'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.14)',
              padding: '8px 16px 8px 8px',
              borderRadius: '999px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg,#8fa8ff,#4f6fe0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                flexShrink: 0,
                color: '#fff'
              }}>{user?.role === 'superadmin' ? 'SA' : user?.role === 'guru' ? 'G' : user?.role === 'siswa' ? 'S' : 'U'}</div>
              <div>
                <div style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  color: 'rgba(255,255,255,.6)',
                  fontWeight: '700'
                }}>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'guru' ? 'Guru' : user?.role === 'siswa' ? 'Siswa' : 'User'}</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700' }}>{user?.nama || 'User'}</div>
              </div>
            </div>
            <div style={{
              fontSize: '12.5px',
              color: 'rgba(255,255,255,.65)',
              textAlign: 'right',
              lineHeight: '1.4',
              minWidth: '110px'
            }}>
              <div>{clockDate}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{clockTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div style={{
        position: 'relative',
        height: '38px',
        background: '#fff4e2',
        borderBottom: `1px solid ${BORDER}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          width: 'max-content',
          animation: 'marqueeLTR 16s linear infinite',
          willChange: 'transform'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            fontWeight: '700',
            color: '#a86a05',
            letterSpacing: '.01em',
            paddingRight: '56px'
          }}>
            <span>Selamat datang di Website IPC — Sistem Index Prestasi Citra SMK Negeri Bali Mandara</span>
            <span style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: AMBER,
              margin: '0 12px',
              flexShrink: 0
            }}></span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            fontWeight: '700',
            color: '#a86a05',
            letterSpacing: '.01em',
            paddingRight: '56px'
          }}>
            <span>Selamat datang di Website IPC — Sistem Index Prestasi Citra SMK Negeri Bali Mandara</span>
            <span style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: AMBER,
              margin: '0 12px',
              flexShrink: 0
            }}></span>
          </div>
        </div>
      </div>

      {/* WELCOME ROW */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 4px',
            letterSpacing: '-0.01em',
            color: TEXT
          }}>Dashboard</h1>
          <p style={{ color: MUTED, fontSize: '14px', margin: '0' }}>Selamat datang, {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'guru' ? 'Guru' : user?.role === 'siswa' ? 'Siswa' : 'User'}!</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowLabels(!showLabels)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: '#fff',
              color: TEXT,
              border: `1px solid ${BORDER}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f7f9fc'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            {showLabels ? 'Sembunyikan Angka' : 'Tampilkan Angka'}
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              background: BLUE,
              color: '#fff',
              boxShadow: '0 6px 16px -8px rgba(47,95,232,.6)',
              transition: 'filter 0.15s ease, transform 0.1s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.filter = 'brightness(1.07)')}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* STATS CHIPS */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '6px',
        marginBottom: '22px',
        scrollbarWidth: 'thin'
      }}>
        <style>{`
          .stats-scroll::-webkit-scrollbar { height: 6px; }
          .stats-scroll::-webkit-scrollbar-thumb { background: #d7dced; border-radius: 99px; }
          @keyframes marqueeLTR {
            from { transform: translateX(-50%); }
            to { transform: translateX(0%); }
          }
        `}</style>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid BLUE',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Total Siswa</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_students || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid TEAL',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Total Guru</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_teachers || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid GREEN',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Prestasi Akademik</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.prestasi_akademik || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid PURPLE',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Prestasi Non-Akademik</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.prestasi_nonakademik || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid RED',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Total Pelanggaran</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_pelanggaran || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid AMBER',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Organisasi</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_organisasi || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid BLUE',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Kepanitiaan</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_kepanitiaan || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid TEAL',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Event</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_event || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid PURPLE',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Perilaku</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.total_perilaku || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid GREEN',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>Rata-rata IPC</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.ipc_stats?.rata_rata || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid BLUE',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>IPC Tertinggi</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.ipc_stats?.tertinggi || 0}</div>
        </div>
        <div style={{
          flex: '0 0 auto',
          minWidth: '148px',
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderLeft: '3px solid AMBER',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: SHADOW,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            fontSize: '11.5px',
            color: MUTED,
            fontWeight: '600',
            marginBottom: '4px',
            whiteSpace: 'nowrap'
          }}>IPC Terendah</div>
          <div style={{
            fontSize: '21px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            filter: showLabels ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s ease'
          }}>{stats?.ipc_stats?.terendah || 0}</div>
        </div>
      </div>

      {/* PRINCIPAL NOTE */}
      <div style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: RADIUS,
        boxShadow: SHADOW,
        padding: '20px 22px',
        marginBottom: '22px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        <div style={{
          fontSize: '34px',
          lineHeight: '1',
          color: BLUE,
          fontWeight: '800',
          flexShrink: 0,
          marginTop: '-4px'
        }}>&ldquo;</div>
        <div>
          <h2 style={{
            fontSize: '15px',
            margin: '0 0 6px',
            fontWeight: '700',
            color: TEXT
          }}>Sambutan Kepala Sekolah</h2>
          <p style={{
            margin: '0',
            fontSize: '13.5px',
            lineHeight: '1.6',
            color: MUTED,
            maxHeight: noteExpanded ? '220px' : '44px',
            overflow: 'hidden',
            transition: 'max-height 0.35s ease'
          }}>
            Selamat datang di sistem Index Prestasi Citra SMK Negeri Bali Mandara. IPC hadir untuk mencatat dan
            mengapresiasi setiap pencapaian siswa secara transparan — dari prestasi akademik dan non-akademik,
            keterlibatan organisasi, hingga kepanitiaan. Semoga sistem ini mendorong seluruh siswa untuk terus
            berprestasi dan berkontribusi bagi sekolah.
          </p>
          <button 
            onClick={() => setNoteExpanded(!noteExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: BLUE,
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '8px 0 0',
              fontFamily: 'inherit'
            }}
          >
            {noteExpanded ? 'Tutup' : 'Baca selengkapnya'}
          </button>
          <div style={{
            marginTop: '10px',
            fontSize: '12.5px',
            color: TEXT,
            fontWeight: '700'
          }}>
            {schoolConfig?.principal_name || 'Nama Kepala Sekolah'}
            <span style={{
              display: 'block',
              fontWeight: '500',
              color: MUTED,
              fontSize: '11.5px'
            }}>{schoolConfig?.principal_nip ? `NIP: ${schoolConfig.principal_nip}` : 'Kepala SMK Negeri Bali Mandara'}</span>
          </div>
        </div>
      </div>

      {!user && (
        <div style={{
          background: '#fff4e2',
          border: `1px solid ${BORDER}`,
          borderRadius: RADIUS,
          padding: '16px 20px',
          marginBottom: '20px',
          color: '#a86a05',
          fontSize: '14px',
          fontWeight: '600'
        }}>
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
          {/* TOP 5 PANEL */}
          <div style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: RADIUS,
            boxShadow: SHADOW,
            marginBottom: '20px',
            opacity: 0,
            transform: 'translateY(10px)',
            animation: 'riseIn 0.5s ease forwards'
          }}>
            <style>{`
              @keyframes riseIn {
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes rowIn {
                from { opacity: 0; transform: translateX(-8px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '18px 20px 4px'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '9px',
                background: '#fff4e2',
                color: AMBER,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 8.5 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 8.5 12 2"></polygon></svg>
              </div>
              <h3 style={{
                fontSize: '15px',
                margin: '0',
                fontWeight: '700',
                color: TEXT
              }}>Top 5 Siswa dengan IPC Tertinggi</h3>
            </div>
            <div style={{ padding: '14px 8px 18px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13.5px',
                minWidth: '520px'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>Peringkat</th>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>Nama</th>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>NIS</th>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>Kelas</th>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>Grha</th>
                    <th style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: MUTED,
                      fontWeight: '700',
                      padding: '10px 14px'
                    }}>IPC</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_ipc_students && stats.top_ipc_students.map((student, index) => (
                    <tr key={student.id || index} style={{
                      opacity: 0,
                      animation: 'rowIn 0.4s ease forwards',
                      animationDelay: `${index * 0.06}s`
                    }}>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          background: index === 0 ? BLUE : index === 1 ? TEAL : index === 2 ? AMBER : '#8b93a8'
                        }}>{index + 1}</div>
                      </td>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle', fontWeight: '500' }}>{student.nama}</td>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle' }}>{student.nis || '-'}</td>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle' }}>{student.kelas || '-'}</td>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle' }}>{student.grha || '-'}</td>
                      <td style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, verticalAlign: 'middle', fontWeight: '800', color: BLUE, fontSize: '14.5px' }}>{student.ipc_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '18px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '18px 18px 10px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.10s'
            }}>
              <h4 style={{
                fontSize: '14px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Siswa per Kelas</h4>
              <div style={{ position: 'relative', height: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.by_kelas || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
                    <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: MUTED }} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} tick={{ fontSize: 11, fill: MUTED }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Jumlah Siswa']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8b7fd1" 
                      name="Jumlah Siswa"
                      radius={[6, 6, 0, 0]}
                      maxBarThickness={42}
                      label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '18px 18px 10px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.15s'
            }}>
              <h4 style={{
                fontSize: '14px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Distribusi Siswa per Grha</h4>
              <div style={{ position: 'relative', height: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
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
                      labelStyle={{ fontSize: 12, fontWeight: '500', fill: MUTED }}
                      cutout="60%"
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
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '18px 18px 10px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.20s'
            }}>
              <h4 style={{
                fontSize: '14px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Pelanggaran per Grha</h4>
              <div style={{ position: 'relative', height: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.pelanggaran_by_grha || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
                    <XAxis dataKey="grha" tick={{ fontSize: 11, fill: MUTED }} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} tick={{ fontSize: 11, fill: MUTED }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Jumlah Pelanggaran']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#e34848" 
                      name="Jumlah Pelanggaran"
                      radius={[6, 6, 0, 0]}
                      maxBarThickness={30}
                      label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {(!stats.pelanggaran_by_grha || stats.pelanggaran_by_grha.every(x => x.count === 0)) && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12.5px',
                    color: MUTED,
                    textAlign: 'center',
                    padding: '0 20px'
                  }}>Belum ada pelanggaran tercatat — kabar baik!</div>
                )}
              </div>
            </div>

            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '18px 18px 10px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.25s'
            }}>
              <h4 style={{
                fontSize: '14px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Perbandingan Prestasi</h4>
              <div style={{ position: 'relative', height: '200px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Prestasi', akademik: stats.prestasi_akademik || 0, nonakademik: stats.prestasi_nonakademik || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} />
                    <YAxis allowDecimals={false} tickFormatter={(value) => Math.round(value)} tick={{ fontSize: 11, fill: MUTED }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Jumlah']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="akademik" 
                      fill="#8b7fd1" 
                      name="Akademik"
                      radius={[6, 6, 0, 0]}
                      maxBarThickness={60}
                      label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                    />
                    <Bar 
                      dataKey="nonakademik" 
                      fill="#16a875" 
                      name="Non-Akademik"
                      radius={[6, 6, 0, 0]}
                      maxBarThickness={60}
                      label={showLabels ? { position: 'top', fill: '#2d3748', fontSize: 12, fontWeight: 'bold' } : false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* DETAIL TABLES GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '18px'
          }}>
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '16px 18px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.30s'
            }}>
              <h4 style={{
                fontSize: '13.5px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Detail Siswa per Kelas</h4>
              <div>
                {stats.by_kelas && stats.by_kelas.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: index === 0 ? 'none' : `1px solid ${BORDER}`,
                    fontSize: '13px'
                  }}>
                    <span>{item.kelas}</span>
                    <span style={{ fontWeight: '700' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '16px 18px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.34s'
            }}>
              <h4 style={{
                fontSize: '13.5px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Detail Siswa per Grha</h4>
              <div>
                {stats.by_grha && stats.by_grha.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: index === 0 ? 'none' : `1px solid ${BORDER}`,
                    fontSize: '13px'
                  }}>
                    <span>{item.grha}</span>
                    <span style={{ fontWeight: '700' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: RADIUS,
              boxShadow: SHADOW,
              padding: '16px 18px',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'riseIn 0.5s ease forwards',
              animationDelay: '0.38s'
            }}>
              <h4 style={{
                fontSize: '13.5px',
                margin: '0 0 10px',
                fontWeight: '700',
                color: TEXT
              }}>Detail Pelanggaran per Grha</h4>
              <div>
                {stats.pelanggaran_by_grha && stats.pelanggaran_by_grha.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: index === 0 ? 'none' : `1px solid ${BORDER}`,
                    fontSize: '13px'
                  }}>
                    <span>{item.grha}</span>
                    <span style={{ fontWeight: '700' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RESPONSIVE MEDIA QUERIES */}
          <style>{`
            @media (max-width: 980px) {
              .charts-grid { grid-template-columns: repeat(2, 1fr) !important; }
              .detail-grid { grid-template-columns: 1fr 1fr !important; }
            }
            @media (max-width: 680px) {
              .charts-grid { grid-template-columns: 1fr !important; }
              .detail-grid { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 760px) {
              .header-clock { display: none !important; }
            }
            @media (max-width: 600px) {
              .marquee-bar { height: 34px !important; }
              .marquee-group { font-size: 12px !important; padding-right: 36px !important; }
            }
            @media (prefers-reduced-motion: reduce) {
              * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
            }
          `}</style>
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
