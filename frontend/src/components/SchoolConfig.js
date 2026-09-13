import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const buildAssetUrl = (path) => {
  if (!path) return null;
  const base = API_BASE_URL.replace('/api', '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);
  const mountedRef = useRef(true);

  // CSS Variables
  const BG = '#eef1f7';
  const CARD = '#ffffff';
  const BORDER = '#e6e9f1';
  const TEXT = '#1b2033';
  const MUTED = '#727a8c';
  const BLUE = '#2f5fe8';
  const RADIUS = '16px';
  const SHADOW = '0 1px 2px rgba(20,25,45,.04), 0 10px 26px -14px rgba(20,25,45,.14)';

  useEffect(() => {
    mountedRef.current = true;
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchConfig();
    return () => { mountedRef.current = false; };
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/school-config');
      if (mountedRef.current) {
        setConfig(response.data);
      }
    } catch (error) {
      if (mountedRef.current) {
        setMessage({ type: 'error', text: 'Gagal memuat konfigurasi sekolah' });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const validateConfig = () => {
    if (!config.school_name.trim()) {
      setMessage({ type: 'error', text: 'Nama sekolah wajib diisi' });
      return false;
    }
    if (!config.principal_name.trim()) {
      setMessage({ type: 'error', text: 'Nama kepala sekolah wajib diisi' });
      return false;
    }
    if (!config.principal_nip.trim()) {
      setMessage({ type: 'error', text: 'NIP kepala sekolah wajib diisi' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;
    setSaving(true);
    setMessage(null);
    try {
      await axios.put('/school-config', config);
      if (mountedRef.current) {
        await fetchConfig();
        setMessage({ type: 'success', text: 'Konfigurasi sekolah berhasil disimpan!' });
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorText = error.response?.data?.error || 'Gagal menyimpan konfigurasi sekolah';
        setMessage({ type: 'error', text: errorText });
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const validateLogoFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Hanya file JPEG dan PNG yang diizinkan';
    }
    if (file.size > maxSize) {
      return 'Ukuran file maksimal 2MB';
    }
    return null;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateLogoFile(file);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    setUploading(true);
    setMessage(null);
    try {
      await axios.post('/school-config/upload-logo', formData);
      if (mountedRef.current) {
        await fetchConfig();
        setMessage({ type: 'success', text: 'Logo berhasil diupload!' });
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorText = error.response?.data?.error || 'Gagal mengupload logo';
        setMessage({ type: 'error', text: errorText });
      }
    } finally {
      if (mountedRef.current) {
        setUploading(false);
        e.target.value = '';
      }
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
            <label htmlFor="school-name" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Nama Sekolah</label>
            <input
              id="school-name"
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
            <label htmlFor="school-description" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Deskripsi Sekolah</label>
            <textarea
              id="school-description"
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
            <label htmlFor="principal-name" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>Nama Kepala Sekolah</label>
            <input
              id="principal-name"
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
            <label htmlFor="principal-nip" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: TEXT,
              marginBottom: '6px'
            }}>NIP Kepala Sekolah</label>
            <input
              id="principal-nip"
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
                 src={buildAssetUrl(config.logo_url)}
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
                 background: uploading ? MUTED : BLUE,
                 color: '#fff',
                 borderRadius: '8px',
                 fontSize: '13px',
                 fontWeight: '600',
                 cursor: uploading ? 'not-allowed' : 'pointer',
                 transition: 'filter 0.15s ease',
                 opacity: uploading ? 0.7 : 1
               }}
               onMouseEnter={(e) => !uploading && (e.currentTarget.style.filter = 'brightness(1.07)')}
               onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
               >
                 {uploading ? 'Mengupload...' : 'Upload Logo Baru'}
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleLogoUpload}
                   disabled={uploading}
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
