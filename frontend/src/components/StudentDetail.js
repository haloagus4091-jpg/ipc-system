import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import StudentRecordsHistory from './StudentRecordsHistory';

function StudentDetail({ student, onClose }) {
    const [records, setRecords] = useState(null);
    const [ipcHistory, setIpcHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!student?.id) return;

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [recordsRes, historyRes] = await Promise.all([
                    axios.get(`/users/${student.id}/records`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`/users/${student.id}/ipc-history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setRecords(recordsRes.data);
                setIpcHistory(historyRes.data || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat detail siswa');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [student?.id]);

    const avatarUrl = student?.foto
        ? `${API_BASE_URL.replace('/api', '')}${student.foto}`
        : null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            overflow: 'auto',
            padding: 20
        }}>
            <div style={{
                maxWidth: 900,
                margin: isMobile ? '20px auto' : '80px auto 0 auto',
                marginLeft: isMobile ? 'auto' : 'calc(50% + 140px)',
                transform: isMobile ? 'none' : 'translateX(-50%)',
                background: 'var(--bg-primary, #fff)',
                borderRadius: 12,
                padding: 24,
                minHeight: 200
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>Detail Siswa</h2>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={student.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: 32 }}>👤</span>
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0' }}>{student.nama}</h3>
                                    <p style={{ margin: '4px 0', color: '#666' }}>NIS: {student.nis || '-'}</p>
                                    <p style={{ margin: '4px 0', color: '#666' }}>
                                        {student.kelas || '-'} · {student.grha || '-'}
                                    </p>
                                    <p style={{ margin: '8px 0 0 0' }}>
                                        <strong>IPC:</strong>{' '}
                                        <span style={{ 
                                            fontSize: 20, 
                                            color: (student.ipc_total ?? 0) < 0 ? '#dc2626' : '#3498db', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {(student.ipc_total ?? 0) < 0 ? `${student.ipc_total ?? 0} (MINUS)` : (student.ipc_total ?? 0)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {records && (
                            <StudentRecordsHistory
                                records={records}
                                title="Riwayat Prestasi & Kegiatan"
                                showAllTabs
                            />
                        )}

                        <div className="card">
                            <h3>Riwayat IPC</h3>
                            {ipcHistory.length > 0 ? (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Jenis</th>
                                            <th>Perubahan</th>
                                            <th>IPC</th>
                                            {!isMobile && <th>Keterangan</th>}
                                            {!isMobile && <th>Tanggal</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ipcHistory.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.jenis_perubahan}</td>
                                                <td style={{ color: row.point_change >= 0 ? 'green' : 'red' }}>
                                                    {row.point_change >= 0 ? '+' : ''}{row.point_change}
                                                </td>
                                                <td>{row.ipc_sebelum} → {row.ipc_sesudah}</td>
                                                {!isMobile && <td>{row.keterangan}</td>}
                                                {!isMobile && <td>{new Date(row.created_at).toLocaleDateString('id-ID')}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-muted">Belum ada riwayat IPC</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentDetail;
