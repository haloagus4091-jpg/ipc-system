import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

function Login() {
  const [activeTab, setActiveTab] = useState('siswa');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchoolConfig = async () => {
      try {
        const response = await axios.get('/school-config/public');
        setSchoolConfig(response.data);
      } catch (error) {
        console.error('Error fetching school config:', error);
      }
    };

    fetchSchoolConfig();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', formData);
      console.log('Login response:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('User data stored:', localStorage.getItem('user'));
      console.log('Token stored:', localStorage.getItem('token'));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="login-content">
        <div className="login-card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div className="login-logo" style={{ textAlign: 'center', marginBottom: '10px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {schoolConfig?.logo_url ? (
              <img
                src={`${API_BASE_URL.replace('/api', '')}${schoolConfig.logo_url}`}
                alt="Logo Sekolah"
                style={{
                  maxWidth: '150px',
                  maxHeight: '72px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <span style={{ color: '#667eea', fontSize: '48px', fontWeight: 'bold' }}>IPC</span>
            )}
          </div>
          <h2 style={{ color: '#333', textAlign: 'center', marginBottom: '5px' }}>School System</h2>
          <p className="login-subtitle" style={{ color: '#666', textAlign: 'center', marginBottom: '25px' }}>Individual Point Card</p>
          <div className="login-divider" style={{ color: '#ccc', textAlign: 'center', marginBottom: '25px' }}><span style={{ background: 'white', color: '#666', padding: '0 10px' }}>Pilih Tipe Akun</span></div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <button
            onClick={() => { setActiveTab('siswa'); setFormData({ username: '', password: '' }); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'siswa' ? '#667eea' : '#999',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'siswa' ? '2px solid #667eea' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Siswa
          </button>
          <button
            onClick={() => { setActiveTab('guru'); setFormData({ username: '', password: '' }); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'guru' ? '#667eea' : '#999',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'guru' ? '2px solid #667eea' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Guru
          </button>
          <button
            onClick={() => { setActiveTab('superadmin'); setFormData({ username: '', password: '' }); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'superadmin' ? '#667eea' : '#999',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'superadmin' ? '2px solid #667eea' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            SuperAdmin
          </button>
        </div>
        
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {activeTab === 'siswa' && (
            <>
              <div className="form-group">
                <label>NIS</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan User"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          {activeTab === 'guru' && (
            <>
              <div className="form-group">
                <label>NIP</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan User"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          {activeTab === 'superadmin' && (
            <>
              <div className="form-group">
                <label>NIS (ADMIN001)</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan User"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
