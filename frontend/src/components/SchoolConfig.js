import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function SchoolConfig() {
  const [config, setConfig] = useState({
    school_name: '',
    school_description: '',
    principal_name: '',
    principal_nip: '',
    logo_url: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  // CSS Variables
  const BG = '#eef1f7';
  const CARD = '#ffffff';
  const BORDER = '#e6e9f1';
  const TEXT = '#1b2033';
  const MUTED = '#727a8c';
  const BLUE = '#2f5fe8';
  const GREEN = '#16a875';
  const RED = '#e34848';
  const RADIUS = '16px';
  const SHADOW = '0 1px 2px rgba(20,25,45,.04), 0 10px 26px -14px rgba(20,25,45,.14)';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/school-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching school config:', error);
      setMessage({ type: 'error', text: 'Gagal memuat konfigurasi sekolah' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Saving config:', config);
      const response = await axios.put('/school-config', config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Save response:', response.data);
      await fetchConfig(); // Refresh config after save
      setMessage({ type: 'success', text: 'Konfigurasi sekolah berhasil disimpan!' });
    } catch (error) {
      console.error('Error saving school config:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan konfigurasi sekolah' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/school-config/upload-logo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Logo upload response:', response.data);
      await fetchConfig(); // Refresh config from database after upload
      setMessage({ type: 'success', text: 'Logo berhasil diupload!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Gagal mengupload logo' });
    }
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
          <strong style={{ color: TEXT, fontSize: "15px" }}>Memuat konfigurasi...</strong>
        </div>
      </div>
    );
  }

  if (user?.role !== 'superadmin') {
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
          <div style={{ fontSize: "34px", marginBottom: "10px" }}>🔒</div>
          <strong style={{ color: TEXT, fontSize: "15px" }}>Akses Ditolak</strong>
          <p style={{ marginTop: "10px" }}>Hanya Super Admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: BG,
      minHeight: "100vh",
      padding: "26px 24px 60px"
    }}>
      <div style={{
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          margin: '0 0 4px',
          letterSpacing: '-0.01em',
          color: TEXT
        }}>Konfigurasi Sekolah</h1>
        <p style={{ color: MUTED, fontSize: '14px', margin: '0' }}>Kelola informasi sekolah dan kepala sekolah</p>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          color: message.type === 'success' ? '#155724' : '#721c24',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        maxWidth: '900px'
      }}>
        {/* School Info Card */}
        <div style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: RADIUS,
          boxShadow: SHADOW,
          padding: '24px',
          gridColumn: 'span 2'
        }}>
          <h3 style={{
            fontSize: '16px',
            margin: '0 0 20px',
            fontWeight: '700',
            color: TEXT
          }}>Informasi Sekolah</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Nama Sekolah</label>
            <input
              type="text"
              value={config.school_name}
              onChange={(e) => setConfig({ ...config, school_name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = BLUE}
              onBlur={(e) => e.currentTarget.style.borderColor = BORDER}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Deskripsi Sekolah</label>
            <textarea
              value={config.school_description}
              onChange={(e) => setConfig({ ...config, school_description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                resize: 'vertical'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = BLUE}
              onBlur={(e) => e.currentTarget.style.borderColor = BORDER}
            />
          </div>
        </div>

        {/* Principal Info Card */}
        <div style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: RADIUS,
          boxShadow: SHADOW,
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            margin: '0 0 20px',
            fontWeight: '700',
            color: TEXT
          }}>Informasi Kepala Sekolah</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Nama Kepala Sekolah</label>
            <input
              type="text"
              value={config.principal_name}
              onChange={(e) => setConfig({ ...config, principal_name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = BLUE}
              onBlur={(e) => e.currentTarget.style.borderColor = BORDER}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>NIP Kepala Sekolah</label>
            <input
              type="text"
              value={config.principal_nip}
              onChange={(e) => setConfig({ ...config, principal_nip: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = BLUE}
              onBlur={(e) => e.currentTarget.style.borderColor = BORDER}
            />
          </div>
        </div>

        {/* Logo Card */}
        <div style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: RADIUS,
          boxShadow: SHADOW,
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            margin: '0 0 20px',
            fontWeight: '700',
            color: TEXT
          }}>Logo Sekolah</h3>
          
          <div style={{
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {config.logo_url ? (
              <img
                src={`${API_BASE_URL.replace('/api', '')}${config.logo_url}`}
                alt="Logo Sekolah"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: `1px solid ${BORDER}`,
                  padding: '8px',
                  background: '#fff'
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                color: MUTED,
                fontSize: '12px'
              }}>
                No Logo
              </div>
            )}
            <div>
              <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>
                {config.logo_url ? 'Logo saat ini' : 'Belum ada logo'}
              </div>
              <label style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: BLUE,
                color: '#fff',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'filter 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.07)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
              >
                Upload Logo Baru
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            background: BLUE,
            color: '#fff',
            boxShadow: '0 6px 16px -8px rgba(47,95,232,.6)',
            transition: 'filter 0.15s ease, transform 0.1s ease',
            opacity: saving ? 0.7 : 1
          }}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.filter = 'brightness(1.07)')}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
          onMouseDown={(e) => !saving && (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}

export default SchoolConfig;
