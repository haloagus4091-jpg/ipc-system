import React, { useState, useEffect } from 'react';
import axios from 'axios';

function KonfigurasiIPC() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('prestasi');
  const [editingConfig, setEditingConfig] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');

  const categories = [
    { key: 'prestasi', label: 'Prestasi', icon: '🏆' },
    { key: 'organisasi', label: 'Organisasi', icon: '👥' },
    { key: 'kepanitiaan', label: 'Kepanitiaan', icon: '📋' },
    { key: 'event', label: 'Event', icon: '🎪' },
    { key: 'pelanggaran', label: 'Pelanggaran', icon: '⚠️' },
    { key: 'perilaku', label: 'Perilaku', icon: '⭐' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching IPC configurations:', error);
      setMessage('Gagal memuat konfigurasi IPC');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (configId, updatedData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`/ipc-config/${configId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Konfigurasi berhasil diperbarui!');
      setShowEditModal(false);
      setEditingConfig(null);
      fetchConfigs();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const handleAddConfig = async (newData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post('/ipc-config', newData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Konfigurasi berhasil ditambahkan!');
      setShowAddModal(false);
      fetchConfigs();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menambahkan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus konfigurasi ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/ipc-config/${configId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Konfigurasi berhasil dihapus!');
      fetchConfigs();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus konfigurasi');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset semua konfigurasi ke nilai default? Semua perubahan yang Anda buat akan hilang.')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post('/ipc-config/reset-defaults', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Konfigurasi berhasil direset ke nilai default!');
      fetchConfigs();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mereset konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setShowEditModal(true);
  };

  const categoryConfigs = configs.filter(c => c.category === activeCategory);

  if (userRole !== 'superadmin') {
    return (
      <div className="card">
        <h2>Akses Ditolak</h2>
        <p>Halaman ini hanya dapat diakses oleh SuperAdmin.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#EAF1FE', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}
        >
          ⚙️
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Konfigurasi IPC</h2>
          <p style={{ margin: 0, color: '#6B7080', fontSize: 14 }}>Atur nilai point untuk semua indikator IPC</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Gagal') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: 20 }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Kategori Konfigurasi</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleResetDefaults}
              disabled={saving}
              className="btn btn-warning"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🔄 Reset ke Default
            </button>
            <button
              onClick={fetchConfigs}
              disabled={loading}
              className="btn btn-info"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #E7E8EE',
                background: activeCategory === cat.key ? '#3B7CF6' : '#FFFFFF',
                color: activeCategory === cat.key ? '#FFFFFF' : '#1E2130',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {categories.find(c => c.key === activeCategory)?.label} Configuration
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Tambah Konfigurasi
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : categoryConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7080' }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#94A3B8' }}>⚠️</div>
            <p>Belum ada konfigurasi untuk kategori ini</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Indikator</th>
                <th>Sub-Indikator</th>
                <th>Point</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categoryConfigs.map(config => (
                <tr key={config.id}>
                  <td style={{ fontWeight: 600 }}>{config.indicator}</td>
                  <td>{config.sub_indicator || '-'}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: config.point_value >= 0 ? '#EAFBF3' : '#FEE2E2',
                        color: config.point_value >= 0 ? '#0F7A55' : '#DC2626',
                        fontWeight: 700,
                        fontSize: 14
                      }}
                    >
                      {config.point_value >= 0 ? '+' : ''}{config.point_value}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#6B7080' }}>{config.description || '-'}</td>
                  <td>
                    <span className={`badge badge-${config.is_active ? 'success' : 'secondary'}`}>
                      {config.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => openEditModal(config)}
                      className="btn btn-info"
                      style={{ padding: '4px 8px', fontSize: 12, marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingConfig && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 20 }}>Edit Konfigurasi</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateConfig(editingConfig.id, {
                point_value: parseInt(e.target.point_value.value),
                description: e.target.description.value,
                is_active: e.target.is_active.checked
              });
            }}>
              <div className="form-group">
                <label>Indikator</label>
                <input
                  type="text"
                  name="indicator"
                  defaultValue={editingConfig.indicator}
                  disabled
                  className="form-control"
                  style={{ background: '#F7F8FB' }}
                />
              </div>
              <div className="form-group">
                <label>Sub-Indikator</label>
                <input
                  type="text"
                  name="sub_indicator"
                  defaultValue={editingConfig.sub_indicator || ''}
                  disabled
                  className="form-control"
                  style={{ background: '#F7F8FB' }}
                />
              </div>
              <div className="form-group">
                <label>Point Value</label>
                <input
                  type="number"
                  name="point_value"
                  defaultValue={editingConfig.point_value}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="description"
                  defaultValue={editingConfig.description || ''}
                  className="form-control"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingConfig.is_active}
                    style={{ marginRight: 8 }}
                  />
                  Aktif
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConfig(null);
                  }}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 20 }}>Tambah Konfigurasi Baru</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddConfig({
                category: activeCategory,
                indicator: e.target.indicator.value,
                sub_indicator: e.target.sub_indicator.value || null,
                point_value: parseInt(e.target.point_value.value),
                description: e.target.description.value,
                is_active: true
              });
            }}>
              <div className="form-group">
                <label>Indikator</label>
                <input
                  type="text"
                  name="indicator"
                  required
                  className="form-control"
                  placeholder="Contoh: juara, jabatan, tingkat"
                />
              </div>
              <div className="form-group">
                <label>Sub-Indikator (Opsional)</label>
                <input
                  type="text"
                  name="sub_indicator"
                  className="form-control"
                  placeholder="Contoh: juara 1, ketua, sekolah"
                />
              </div>
              <div className="form-group">
                <label>Point Value</label>
                <input
                  type="number"
                  name="point_value"
                  required
                  className="form-control"
                  placeholder="Contoh: 8, -5, 3"
                />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={3}
                  placeholder="Deskripsi indikator..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KonfigurasiIPC;