import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const PAGE_BG = "#f8fafc";
const LINE = "#e2e8f0";
const INK = "#0f172a";
const SLATE = "#64748b";

const BLUE = { bg: "#eff6ff", text: "#2563eb", border: "#c6dafc", solid: "#2563eb", dark: "#1d4ed8" };

function Leaderboard() {
  const [activeTab, setActiveTab] = useState('akademik');
  const [akademikData, setAkademikData] = useState([]);
  const [nonAkademikData, setNonAkademikData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [akademikRes, nonAkademikRes] = await Promise.all([
        axios.get('/search/leaderboard/akademik', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/search/leaderboard/nonakademik', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAkademikData(akademikRes.data);
      setNonAkademikData(nonAkademikRes.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Gagal memuat data peringkat');
    } finally {
      setLoading(false);
    }
  };

  function initials(name) {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  const currentData = activeTab === 'akademik' ? akademikData : nonAkademikData;
  const title = activeTab === 'akademik' ? "Peringkat akademik" : "Peringkat non-akademik";

  if (loading) {
    return (
      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 32px 60px",
        color: INK,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.2rem', color: SLATE }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 32px 60px",
        color: INK,
      }}>
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>{error}</div>
        <button onClick={fetchLeaderboardData} style={{ padding: '10px 16px', background: BLUE.solid, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "20px 16px 48px",
        maxWidth: '1100px',
        margin: '0 auto',
        color: INK,
      }}
    >
      <style>{`
        :root{
          --blue:#2563eb;
          --blue-dark:#1d4ed8;
          --blue-light:#eff6ff;
          --green-bg:#dcfce7;
          --green-text:#16a34a;
          --amber-bg:#fef3c7;
          --amber-text:#b45309;
          --amber-border:#fde68a;
          --gray-50:#f8fafc;
          --gray-100:#f1f5f9;
          --gray-200:#e2e8f0;
          --gray-400:#94a3b8;
          --gray-500:#64748b;
          --gray-700:#334155;
          --gray-900:#0f172a;
          --white:#fff;
          --radius:14px;
          --radius-sm:10px;
          --shadow:0 1px 2px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.04);
        }
        .header-row{
          display:flex;
          align-items:flex-start;
          gap:12px;
          margin-bottom:20px;
        }
        .header-icon{
          flex:0 0 auto;
          width:40px;height:40px;
          border-radius:10px;
          background:var(--amber-bg);
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
        }
        .header-text h1{
          margin:0 0 2px;
          font-size:clamp(18px,4vw,22px);
          font-weight:700;
        }
        .header-text p{
          margin:0;
          font-size:13.5px;
          color:var(--gray-500);
        }
        .controls{
          display:flex;
          flex-wrap:wrap;
          gap:12px;
          align-items:center;
          justify-content:space-between;
          margin-bottom:20px;
        }
        .tabs{
          display:flex;
          gap:8px;
          background:var(--white);
          padding:5px;
          border-radius:12px;
          box-shadow:var(--shadow);
          width:100%;
          max-width:340px;
        }
        .tab{
          flex:1;
          border:none;
          background:transparent;
          padding:9px 12px;
          border-radius:9px;
          cursor:pointer;
          font-family:inherit;
          text-align:center;
          transition:background .15s ease, color .15s ease;
          color:var(--gray-700);
        }
        .tab strong{display:block;font-size:13.5px;font-weight:700;}
        .tab span{display:block;font-size:11.5px;opacity:.85;margin-top:1px;}
        .tab.active{
          background:var(--blue);
          color:var(--white);
        }
        .refresh-btn{
          display:inline-flex;
          align-items:center;
          gap:8px;
          background:var(--blue);
          color:var(--white);
          border:none;
          padding:10px 16px;
          border-radius:10px;
          font-family:inherit;
          font-size:13.5px;
          font-weight:600;
          cursor:pointer;
          box-shadow:var(--shadow);
          transition:background .15s ease, transform .1s ease;
          white-space:nowrap;
        }
        .refresh-btn:hover{background:var(--blue-dark);}
        .refresh-btn:active{transform:scale(.97);}
        .refresh-btn svg{
          width:15px;height:15px;
          transition:transform .5s ease;
        }
        .refresh-btn.spinning svg{transform:rotate(360deg);}
        .card{
          background:var(--white);
          border-radius:var(--radius);
          box-shadow:var(--shadow);
          overflow:hidden;
          margin-bottom:20px;
        }
        .card-head{
          padding:18px 20px;
          border-bottom:1px solid var(--gray-100);
        }
        .card-head h2{
          margin:0 0 3px;
          font-size:16px;
          display:flex;
          align-items:center;
          gap:8px;
        }
        .card-head p{
          margin:0;
          font-size:13px;
          color:var(--gray-500);
        }
        .table-wrap{display:block;}
        table{
          width:100%;
          border-collapse:collapse;
        }
        thead th{
          text-align:left;
          font-size:12.5px;
          font-weight:600;
          color:var(--gray-500);
          background:var(--gray-50);
          padding:12px 20px;
          border-bottom:1px solid var(--gray-200);
        }
        tbody td{
          padding:16px 20px;
          border-bottom:1px solid var(--gray-100);
          vertical-align:middle;
          font-size:14px;
        }
        tbody tr:last-child td{border-bottom:none;}
        .pos-badge{
          width:30px;height:30px;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;
          font-size:13px;
          background:var(--gray-100);
          color:var(--gray-700);
        }
        .pos-badge.top{
          background:var(--amber-bg);
          color:var(--amber-text);
          border:1px solid var(--amber-border);
        }
        .student{
          display:flex;
          align-items:center;
          gap:10px;
        }
        .avatar{
          width:34px;height:34px;
          border-radius:50%;
          background:var(--blue-light);
          color:var(--blue);
          display:flex;align-items:center;justify-content:center;
          font-weight:700;
          font-size:14px;
          flex:0 0 auto;
        }
        .student-name{font-weight:600;font-size:14px;}
        .student-nis{font-size:12px;color:var(--gray-500);}
        .pill{
          display:inline-block;
          padding:3px 10px;
          border-radius:999px;
          font-size:12.5px;
          font-weight:600;
        }
        .pill.kelas{background:var(--green-bg);color:var(--green-text);}
        .pill.grha{background:var(--amber-bg);color:var(--amber-text);}
        .total-badge{
          width:26px;height:26px;
          border-radius:50%;
          background:var(--blue-light);
          color:var(--blue);
          display:flex;align-items:center;justify-content:center;
          font-weight:700;
          font-size:12.5px;
        }
        .detail-box{
          background:var(--amber-bg);
          border:1px solid var(--amber-border);
          border-left:4px solid var(--amber-text);
          border-radius:10px;
          padding:10px 14px;
        }
        .detail-title{
          display:flex;align-items:center;gap:6px;
          font-weight:700;
          font-size:13.5px;
          color:var(--amber-text);
          margin-bottom:2px;
        }
        .detail-sub{font-size:12.5px;color:var(--amber-text);opacity:.85;}
        .mobile-list{display:none;}
        .m-item{
          padding:16px 18px;
          border-bottom:1px solid var(--gray-100);
        }
        .m-item:last-child{border-bottom:none;}
        .m-top{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:10px;
        }
        .m-top .student{flex:1;min-width:0;}
        .m-top .student-name{
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .m-tags{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-bottom:10px;
        }
        .m-total{
          display:flex;
          align-items:center;
          gap:6px;
          font-size:12.5px;
          color:var(--gray-500);
          margin-bottom:10px;
        }
        .keterangan{
          background:var(--white);
          border-radius:var(--radius);
          box-shadow:var(--shadow);
          padding:18px 20px;
        }
        .keterangan h3{
          display:flex;align-items:center;gap:8px;
          margin:0 0 14px;
          font-size:15px;
        }
        .keterangan-grid{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:12px;
          margin-bottom:16px;
        }
        .k-item{
          border:1px solid var(--gray-200);
          border-radius:10px;
          padding:12px 14px;
        }
        .k-item .k-title{
          display:flex;align-items:center;gap:6px;
          font-weight:700;
          font-size:13px;
          color:var(--blue);
          margin-bottom:2px;
        }
        .k-item .k-sub{font-size:12px;color:var(--gray-500);}
        .note{
          background:var(--amber-bg);
          border:1px solid var(--amber-border);
          border-left:4px solid var(--amber-text);
          border-radius:8px;
          padding:12px 16px;
          font-size:13px;
          color:var(--amber-text);
        }
        @media (max-width: 860px){
          .keterangan-grid{grid-template-columns:repeat(3,1fr);}
        }
        @media (max-width: 640px){
          .page{padding:14px 12px 36px;}
          .header-row{margin-bottom:16px;}
          .controls{
            flex-direction:column;
            align-items:stretch;
            gap:10px;
            margin-bottom:16px;
          }
          .tabs{max-width:none;}
          .refresh-btn{justify-content:center;width:100%;}
          .card-head{padding:16px;}
          .table-wrap{display:none;}
          .mobile-list{display:block;}
          .keterangan{padding:16px;}
          .keterangan-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
        }
        @media (max-width: 380px){
          .keterangan-grid{grid-template-columns:1fr;}
        }
      `}</style>

      {/* Header */}
      <div className="header-row">
        <div className="header-icon">🏆</div>
        <div className="header-text">
          <h1>Peringkat Top 20</h1>
          <p>Peringkat siswa berdasarkan prestasi akademik dan non-akademik</p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'akademik' ? 'active' : ''}`}
            onClick={() => setActiveTab('akademik')}
          >
            <strong>Akademik</strong>
            <span>{akademikData.length} siswa</span>
          </button>
          <button 
            className={`tab ${activeTab === 'nonakademik' ? 'active' : ''}`}
            onClick={() => setActiveTab('nonakademik')}
          >
            <strong>Non-akademik</strong>
            <span>{nonAkademikData.length} siswa</span>
          </button>
        </div>

        <button 
          className="refresh-btn"
          onClick={fetchLeaderboardData}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh data
        </button>
      </div>

      {/* Ranking card */}
      <div className="card">
        <div className="card-head">
          <h2 id="cardTitle">📋 {title}</h2>
          <p id="cardSub">Daftar siswa dengan prestasi terbanyak yang telah disetujui</p>
        </div>

        {/* Desktop table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Posisi</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th>Grha</th>
                <th>Total</th>
                <th>Detail prestasi</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: SLATE, padding: '32px' }}>Belum ada data</td>
                </tr>
              ) : (
                currentData.map((s) => {
                  return (
                    <tr key={s.id}>
                      <td><span className={`pos-badge ${s.rank <= 3 ? 'top' : ''}`}>{s.rank}</span></td>
                      <td>
                        <div className="student">
                          <div className="avatar">
                            {s.foto ? (
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${s.foto}`} 
                                alt={s.nama} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span>{initials(s.nama)}</span>
                            )}
                          </div>
                          <div>
                            <div className="student-name">{s.nama}</div>
                            <div className="student-nis">NIS {s.nis}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="pill kelas">{s.kelas}</span></td>
                      <td><span className="pill grha">{s.grha || '-'}</span></td>
                      <td><span className="total-badge">{s.total_prestasi}</span></td>
                      <td>
                        {s.detail_prestasi && s.detail_prestasi.length > 0 ? (
                          s.detail_prestasi.map((d, i) => (
                            <div key={i} className="detail-box" style={{ marginBottom: i < s.detail_prestasi.length - 1 ? 6 : 0 }}>
                              <div className="detail-title">🏅 {d.nama_lomba}</div>
                              <div className="detail-sub">{d.juara}</div>
                            </div>
                          ))
                        ) : (
                          <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Tidak ada detail</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="mobile-list">
          {currentData.length === 0 ? (
            <div className="m-item" style={{ textAlign: 'center', color: SLATE }}>Belum ada data</div>
          ) : (
            currentData.map((s) => {
              return (
                <div key={s.id} className="m-item">
                  <div className="m-top">
                    <span className={`pos-badge ${s.rank <= 3 ? 'top' : ''}`}>{s.rank}</span>
                    <div className="student">
                      <div className="avatar">
                        {s.foto ? (
                          <img 
                            src={`${API_BASE_URL.replace('/api', '')}${s.foto}`} 
                            alt={s.nama} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <span>{initials(s.nama)}</span>
                        )}
                      </div>
                      <div>
                        <div className="student-name">{s.nama}</div>
                        <div className="student-nis">NIS {s.nis}</div>
                      </div>
                    </div>
                  </div>
                  <div className="m-tags">
                    <span className="pill kelas">{s.kelas}</span>
                    <span className="pill grha">{s.grha || '-'}</span>
                  </div>
                  <div className="m-total">📋 Total prestasi: <span className="total-badge">{s.total_prestasi}</span></div>
                  {s.detail_prestasi && s.detail_prestasi.length > 0 ? (
                    s.detail_prestasi.map((d, i) => (
                      <div key={i} className="detail-box" style={{ marginBottom: i < s.detail_prestasi.length - 1 ? 6 : 0 }}>
                        <div className="detail-title">🏅 {d.nama_lomba}</div>
                        <div className="detail-sub">{d.juara}</div>
                      </div>
                    ))
                  ) : (
                    <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Tidak ada detail</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Keterangan */}
      <div className="keterangan">
        <h3>📄 Keterangan</h3>
        <div className="keterangan-grid">
          <div className="k-item">
            <div className="k-title">👤 Nama</div>
            <div className="k-sub">Nama siswa</div>
          </div>
          <div className="k-item">
            <div className="k-title">🏷️ Kelas</div>
            <div className="k-sub">Kelas siswa</div>
          </div>
          <div className="k-item">
            <div className="k-title">🏅 Grha</div>
            <div className="k-sub">Asrama siswa</div>
          </div>
          <div className="k-item">
            <div className="k-title">📋 Total</div>
            <div className="k-sub">Jumlah prestasi</div>
          </div>
          <div className="k-item">
            <div className="k-title">📄 Detail</div>
            <div className="k-sub">Info lomba & juara</div>
          </div>
        </div>
        <div className="note">Lingkaran bernomor menandai peringkat 1 sampai 3. Data diperbarui otomatis.</div>
      </div>
    </div>
  );
}

export default Leaderboard;
