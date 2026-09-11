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
  const [pelanggaranSection, setPelanggaranSection] = useState('severity');
  const [pelanggaranAddType, setPelanggaranAddType] = useState('severity');
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [organisasiOptions, setOrganisasiOptions] = useState([]);
  const [organisasiName, setOrganisasiName] = useState('');
  const [perilakuRatings, setPerilakuRatings] = useState([]);
  const [perilakuRatingName, setPerilakuRatingName] = useState('');

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
    fetchOrganisasiOptions();
    fetchPerilakuRatings();
  }, []);

  const fetchOrganisasiOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/organisasi-options', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganisasiOptions(response.data);
    } catch (error) {
      console.error('Error fetching organisasi options:', error);
      setMessage('Gagal memuat daftar organisasi');
    }
  };

  const fetchPerilakuRatings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/ipc-config/perilaku-ratings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid perilaku rating response');
      }
      setPerilakuRatings(response.data);
    } catch (error) {
      console.error('Error fetching perilaku ratings:', error);
      setMessage('Gagal memuat daftar tingkat penilaian');
    }
  };

  const addPerilakuRating = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post('/ipc-config/perilaku-ratings', { name: perilakuRatingName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerilakuRatingName('');
      setMessage('Tingkat penilaian berhasil ditambahkan!');
      await fetchPerilakuRatings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menambahkan tingkat penilaian');
    } finally {
      setSaving(false);
    }
  };

  const deletePerilakuRating = async (rating) => {
    if (!window.confirm(`Hapus tingkat penilaian ${rating.name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/ipc-config/perilaku-ratings/${rating.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Tingkat penilaian berhasil dihapus!');
      fetchPerilakuRatings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus tingkat penilaian');
    }
  };

  const addOrganisasiOption = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post('/ipc-config/organisasi-options', { name: organisasiName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganisasiName('');
      setMessage('Organisasi berhasil ditambahkan!');
      fetchOrganisasiOptions();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menambahkan organisasi');
    } finally {
      setSaving(false);
    }
  };

  const deleteOrganisasiOption = async (option) => {
    if (!window.confirm(`Hapus organisasi ${option.name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/ipc-config/organisasi-options/${option.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Organisasi berhasil dihapus!');
      fetchOrganisasiOptions();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal menghapus organisasi');
    }
  };

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

  const handleToggleActive = async (configId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/ipc-config/${configId}`, { is_active: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Konfigurasi berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
      fetchConfigs();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengubah status konfigurasi');
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
  const configuredPelanggaranLevels = configs.filter(c => c.category === 'pelanggaran' && !c.field2 && c.is_active);
  const pelanggaranSeverityConfigs = categoryConfigs.filter(c => !c.field2);
  const pelanggaranDetailConfigs = categoryConfigs.filter(c => Boolean(c.field2));
  const displayedConfigs = activeCategory === 'pelanggaran'
    ? (pelanggaranSection === 'severity' ? pelanggaranSeverityConfigs : pelanggaranDetailConfigs)
    : categoryConfigs;
  const getDisplayPoint = (config) => {
    if (activeCategory === 'pelanggaran' && config.field2) {
      return categoryConfigs.find(level => !level.field2 && level.field1 === config.field2)?.point_value ?? 0;
    }
    return config.point_value ?? 0;
  };

  const getHeaderLabel1 = (category) => {
    const labels = {
      prestasi: 'Tingkat Lomba',
      organisasi: 'Nama Organisasi',
      kepanitiaan: 'Jabatan',
      event: 'Tingkat Event',
      pelanggaran: 'Tingkat Pelanggaran',
      perilaku: 'Nama Karakter'
    };
    return labels[category] || 'Field 1';
  };

  const getHeaderLabel2 = (category) => {
    const labels = {
      prestasi: 'Juara Lomba',
      organisasi: 'Jabatan',
      kepanitiaan: '',
      event: '',
      pelanggaran: '',
      perilaku: 'Tingkat Penilaian'
    };
    return labels[category] || 'Field 2';
  };

  const FIXED_KARAKTER_OPTIONS = [
    'tanggung_jawab',
    'disiplin',
    'kepedulian',
    'kemandirian',
    'spiritual',
    'kejujuran',
    'kepercayaan_diri'
  ];

  const FIXED_TINGKAT_OPTIONS = [
    'sekolah',
    'kecamatan',
    'kabupaten',
    'provinsi',
    'nasional',
    'internasional'
  ];

  const FIXED_JUARA_LOMBA_OPTIONS = [
    'peserta',
    'finalis',
    'harapan_iii',
    'harapan_ii',
    'harapan_i',
    'juara_iii',
    'juara_ii',
    'juara_i'
  ];

  const formatDisplayText = (text) => {
    return text
      .replace(/_/g, ' ')
      .replace(/\b\w+\b/g, word => {
        // Check if word is Roman numeral (I, II, III, etc.)
        if (/^[ivx]+$/.test(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
  };

  const showAddField2 = ['prestasi', 'organisasi', 'perilaku'].includes(activeCategory) ||
    (activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail');
  const showTableField2 = !['kepanitiaan', 'event'].includes(activeCategory) &&
    !(activeCategory === 'pelanggaran' && pelanggaranSection === 'severity');
  const showEditField2 = ['prestasi', 'organisasi', 'perilaku'].includes(activeCategory) ||
    (activeCategory === 'pelanggaran' && Boolean(editingConfig?.field2));

  const tableFields = [
    { key: 'field1', label: activeCategory === 'pelanggaran' ? (pelanggaranSection === 'severity' ? 'Tingkat Pelanggaran' : 'Detail Pelanggaran') : getHeaderLabel1(activeCategory) },
    { key: 'field2', label: showTableField2 ? (activeCategory === 'pelanggaran' && pelanggaranSection === 'detail' ? 'Tingkat Pelanggaran' : getHeaderLabel2(activeCategory)) : '' }
  ].filter(field => field.label);
  const showDescription = !(activeCategory === 'pelanggaran' && pelanggaranSection === 'detail');

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
            onClick={() => {
              setPelanggaranAddType(activeCategory === 'pelanggaran' ? pelanggaranSection : 'severity');
              setShowAddModal(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Tambah Konfigurasi
          </button>
        </div>

        {activeCategory === 'pelanggaran' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              ['severity', 'Tingkat Pelanggaran & Point'],
              ['detail', 'Detail Pelanggaran']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPelanggaranSection(key)}
                className={`btn ${pelanggaranSection === key ? 'btn-primary' : 'btn-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {activeCategory === 'perilaku' && (
          <div className="card" style={{ marginBottom: 20, background: '#F8FAFF' }}>
            <h4>Daftar Tingkat Penilaian</h4>
            <form onSubmit={addPerilakuRating} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={perilakuRatingName}
                onChange={event => setPerilakuRatingName(event.target.value)}
                placeholder="Contoh: Kurang Baik, Cukup Baik, Baik, Sangat Baik"
                required
                className="form-control"
              />
              <button className="btn btn-primary" disabled={saving}>Tambah</button>
            </form>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {perilakuRatings.length === 0 ? (
                <p style={{ color: '#6B7080' }}>Belum ada tingkat penilaian yang tersedia.</p>
              ) : perilakuRatings.map(rating => (
                <span
                  key={rating.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: '#F8FAFF',
                    border: '1px solid #E7E8EE',
                    borderRadius: 6,
                    fontWeight: 600
                  }}
                >
                  {formatDisplayText(rating.name)}
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deletePerilakuRating(rating)}
                    style={{ padding: '2px 6px', fontSize: 11 }}
                  >
                    Hapus
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'organisasi' && (
          <div className="card" style={{ marginBottom: 20, background: '#F8FAFF' }}>
            <h4>Daftar Organisasi</h4>
            <form onSubmit={addOrganisasiOption} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={organisasiName}
                onChange={event => setOrganisasiName(event.target.value)}
                placeholder="Contoh: OSIS, KY, MPK"
                required
                className="form-control"
              />
              <button className="btn btn-primary" disabled={saving}>Tambah</button>
            </form>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {organisasiOptions.map(option => (
                <span key={option.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: 6 }}>
                  {option.name}
                  <button type="button" className="btn btn-danger" onClick={() => deleteOrganisasiOption(option)} style={{ padding: '2px 6px', fontSize: 11 }}>Hapus</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : displayedConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7080' }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#94A3B8' }}>⚠️</div>
            <p>Belum ada konfigurasi untuk kategori ini</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                {tableFields.map(field => <th key={field.key}>{field.label}</th>)}
                <th>Point</th>
                {showDescription && <th>Deskripsi</th>}
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedConfigs.map(config => (
                <tr key={config.id}>
                  {tableFields.map((field, index) => (
                    <td key={field.key} style={index === 0 ? { fontWeight: 600 } : undefined}>
                      {config[field.key] || 'Tidak ada'}
                    </td>
                  ))}
                  <td>
                    {(() => {
                      const pointValue = getDisplayPoint(config);
                      return (
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: pointValue >= 0 ? '#EAFBF3' : '#FEE2E2',
                        color: pointValue >= 0 ? '#0F7A55' : '#DC2626',
                        fontWeight: 700,
                        fontSize: 14
                      }}
                    >
                      {pointValue >= 0 ? '+' : ''}{pointValue}
                    </span>
                      );
                    })()}
                  </td>
                  {showDescription && <td style={{ fontSize: 13, color: '#6B7080' }}>{config.description || 'Tidak ada deskripsi'}</td>}
                  <td>
                    <button
                      onClick={() => handleToggleActive(config.id, config.is_active)}
                      className={`btn ${config.is_active ? 'btn-success' : 'btn-secondary'}`}
                      style={{ 
                        padding: '4px 12px', 
                        fontSize: 12, 
                        minWidth: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {config.is_active ? '✓ Aktif' : '✗ Non-Aktif'}
                    </button>
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
          </div>
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
                field2: e.target.field2?.value || editingConfig.field2,
                point_value: activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail'
                  ? 0
                  : parseInt(e.target.point_value.value),
                description: activeCategory === 'pelanggaran' && editingConfig.field2
                  ? null
                  : e.target.description.value,
                is_active: e.target.is_active.checked
              });
            }}>
              <div className="form-group">
                <label>{activeCategory === 'pelanggaran' && editingConfig.field2 ? 'Detail Pelanggaran' : getHeaderLabel1(activeCategory)}</label>
                <input
                  type="text"
                  name="field1"
                  defaultValue={editingConfig.field1 || '-'}
                  disabled
                  className="form-control"
                  style={{ background: '#F7F8FB', color: '#6B7080' }}
                />
              </div>
              {showEditField2 && (
                <div className="form-group">
                  <label>{activeCategory === 'pelanggaran' ? 'Tingkat Pelanggaran' : getHeaderLabel2(activeCategory)}</label>
                  <input
                    type="text"
                    name="field2"
                    defaultValue={editingConfig.field2 || '-'}
                    disabled={activeCategory !== 'pelanggaran'}
                    className="form-control"
                    style={{ background: '#F7F8FB', color: '#6B7080' }}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Point Value</label>
                <input
                  type="number"
                  name="point_value"
                  defaultValue={editingConfig.point_value}
                  required
                  className="form-control"
                  placeholder="Masukkan nilai point"
                />
              </div>
              {!(activeCategory === 'pelanggaran' && editingConfig.field2) && <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="description"
                  defaultValue={editingConfig.description || ''}
                  className="form-control"
                  rows={3}
                  placeholder="Masukkan deskripsi konfigurasi"
                />
              </div>}
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
            maxWidth: 450,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Tambah Konfigurasi</h3>
            <p style={{ marginBottom: 20, fontSize: 13, color: '#6B7080' }}>
              Kategori: <strong>{categories.find(c => c.key === activeCategory)?.label}</strong>
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddConfig({
                category: activeCategory,
                field1: e.target.field1.value,
                field2: e.target.field2?.value || null,
                point_value: activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail'
                  ? 0
                  : parseInt(e.target.point_value.value),
                description: activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail'
                  ? null
                  : e.target.description.value,
                is_active: true
              });
            }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  {activeCategory === 'pelanggaran'
                    ? (pelanggaranAddType === 'detail' ? 'Detail Pelanggaran' : 'Tingkat Pelanggaran')
                    : getHeaderLabel1(activeCategory)} *
                </label>
                {activeCategory === 'prestasi' && (
                  <select name="field1" required className="form-control" style={{ fontSize: 14 }}>
                    <option value="">Pilih Tingkat Lomba</option>
                    {FIXED_TINGKAT_OPTIONS.map(tingkat => (
                      <option key={tingkat} value={tingkat}>
                        {formatDisplayText(tingkat)}
                      </option>
                    ))}
                  </select>
                )}
                {activeCategory === 'perilaku' && (
                  <select name="field1" required className="form-control" style={{ fontSize: 14 }}>
                    <option value="">Pilih Karakter</option>
                    {FIXED_KARAKTER_OPTIONS.map(karakter => (
                      <option key={karakter} value={karakter}>
                        {formatDisplayText(karakter)}
                      </option>
                    ))}
                  </select>
                )}
                {activeCategory === 'pelanggaran' && pelanggaranAddType === 'severity' && (
                <input
                  type="text"
                  name="field1"
                  required
                  className="form-control"
                  placeholder="Contoh: Ringan, Sedang, Berat, Sangat Berat"
                  style={{ fontSize: 14 }}
                />
                )}
                {activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail' && (
                  <input
                    type="text"
                    name="field1"
                    required
                    className="form-control"
                    placeholder="Contoh: Mencuri, Mencontek, Bolos"
                    style={{ fontSize: 14 }}
                  />
                )}
                {activeCategory === 'kepanitiaan' && (
                  <select name="field1" required className="form-control" style={{ fontSize: 14 }}>
                    <option value="">Pilih Jabatan</option>
                    <option value="ketua">Ketua</option>
                    <option value="wakil ketua">Wakil Ketua</option>
                    <option value="sekretaris">Sekretaris</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="koordinator">Koordinator</option>
                    <option value="anggota">Anggota</option>
                  </select>
                )}
                {activeCategory === 'organisasi' && (
                  <select name="field1" required className="form-control" style={{ fontSize: 14 }}>
                    <option value="">Pilih Organisasi</option>
                    {organisasiOptions.filter(option => option.is_active).map(option => (
                      <option key={option.id} value={option.name}>{option.name}</option>
                    ))}
                  </select>
                )}
                {activeCategory === 'event' && (
                  <select name="field1" required className="form-control" style={{ fontSize: 14 }}>
                    <option value="">Pilih Tingkat Event</option>
                    {FIXED_TINGKAT_OPTIONS.map(tingkat => (
                      <option key={tingkat} value={tingkat}>
                        {formatDisplayText(tingkat)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {showAddField2 && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    {activeCategory === 'pelanggaran' ? 'Tingkat Pelanggaran' : getHeaderLabel2(activeCategory)} *
                  </label>
                  {activeCategory === 'prestasi' && (
                    <select name="field2" required className="form-control" style={{ fontSize: 14 }}>
                      <option value="">Pilih Juara Lomba</option>
                      {FIXED_JUARA_LOMBA_OPTIONS.map(juara => (
                        <option key={juara} value={juara}>
                          {formatDisplayText(juara)}
                        </option>
                      ))}
                    </select>
                  )}
                  {activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail' && (
                    <select name="field2" required className="form-control" style={{ fontSize: 14 }}>
                      <option value="">Pilih Tingkat Pelanggaran</option>
                    {configuredPelanggaranLevels.map(level => (
                      <option key={level.id} value={level.field1}>{level.field1}</option>
                    ))}
                    </select>
                  )}
                  {activeCategory === 'perilaku' && (
                    <select name="field2" required className="form-control" style={{ fontSize: 14 }}>
                      <option value="">Pilih Tingkat Penilaian</option>
                      {perilakuRatings.filter(rating => rating.is_active).map(rating => (
                        <option key={rating.id} value={rating.name}>
                          {formatDisplayText(rating.name)}
                        </option>
                      ))}
                    </select>
                  )}
                  {activeCategory === 'organisasi' && (
                    <select name="field2" required className="form-control" style={{ fontSize: 14 }}>
                      <option value="">Pilih Jabatan</option>
                      <option value="ketua">Ketua</option>
                      <option value="wakil ketua">Wakil Ketua</option>
                      <option value="sekretaris">Sekretaris</option>
                      <option value="bendahara">Bendahara</option>
                      <option value="koordinator">Koordinator</option>
                      <option value="anggota">Anggota</option>
                    </select>
                  )}
                </div>
              )}
              {!(activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail') && <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Nilai Point *</label>
                <input
                  type="number"
                  name="point_value"
                  required
                  className="form-control"
                  placeholder="Masukkan nilai point"
                  style={{ fontSize: 14 }}
                />
              </div>}
              {!(activeCategory === 'pelanggaran' && pelanggaranAddType === 'detail') && <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Deskripsi</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={2}
                  placeholder="Deskripsi singkat..."
                  style={{ fontSize: 14 }}
                />
              </div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 14 }}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '8px 16px', fontSize: 14 }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
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