import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Trophy, User, RefreshCw, GraduationCap, ListOrdered, FileText, Medal } from "lucide-react";

const PAGE_BG = "#F7F8FB";
const CARD = "#FFFFFF";
const LINE = "#E7E8EE";
const INK = "#1E2130";
const SLATE = "#6B7080";

const BLUE = { bg: "#EAF1FE", text: "#2563EB", border: "#C6DAFC", solid: "#3B7CF6" };
const GREEN = { bg: "#EAFBF3", text: "#0F7A55", border: "#B7EED7" };
const AMBER = { bg: "#FFF8EA", text: "#B4700A", border: "#F7DFAE" };

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

  function rankBadge(rank) {
    if (rank === 1) return { bg: "#FCEDBB", fg: "#8A6512", ring: "#E4B932" };
    if (rank === 2) return { bg: "#E7E9EE", fg: "#565B68", ring: "#B7BCC7" };
    if (rank === 3) return { bg: "#F4DEC4", fg: "#9A5B21", ring: "#D99A55" };
    return { bg: "#EEF0F4", fg: SLATE, ring: LINE };
  }

  function initials(name) {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  const currentData = activeTab === 'akademik' ? akademikData : nonAkademikData;
  const title = activeTab === 'akademik' ? "Peringkat akademik" : "Peringkat non-akademik";

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 32px 60px",
        color: INK,
      }}>
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 32px 60px",
        color: INK,
      }}>
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchLeaderboardData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "28px 32px 60px",
        color: INK,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: AMBER.bg, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Trophy size={17} strokeWidth={2} color={AMBER.text} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
          Peringkat Top 20
        </h1>
      </div>
      <p style={{ fontSize: 13.5, color: SLATE, margin: "0 0 22px" }}>
        Peringkat siswa berdasarkan prestasi akademik dan non-akademik
      </p>

      {/* Tabs + refresh */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 9,
            padding: 4,
            gap: 4,
          }}
        >
          {[
            { key: "akademik", label: "Akademik", count: akademikData.length },
            { key: "nonakademik", label: "Non-akademik", count: nonAkademikData.length },
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "9px 20px",
                  borderRadius: 6,
                  background: active ? BLUE.solid : "transparent",
                  color: active ? "#fff" : SLATE,
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 130,
                }}
              >
                <span>{t.label}</span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 400,
                    color: active ? "rgba(255,255,255,0.75)" : SLATE,
                    marginTop: 1,
                  }}
                >
                  {t.count} siswa
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchLeaderboardData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 16px",
            borderRadius: 7,
            border: "none",
            background: BLUE.solid,
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={15} strokeWidth={2} />
          Refresh data
        </button>
      </div>

      {/* Table card */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 22px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ListOrdered size={16} strokeWidth={2} color={BLUE.text} />
            <h2 style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>{title}</h2>
          </div>
          <p style={{ fontSize: 12.5, color: SLATE, margin: 0 }}>
            Daftar siswa dengan prestasi terbanyak yang telah disetujui
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#F4F6FA" }}>
                <th style={th}>Posisi</th>
                <th style={th}>Nama</th>
                <th style={th}>Kelas</th>
                <th style={th}>Grha</th>
                <th style={{ ...th, textAlign: "center" }}>Total</th>
                <th style={th}>Detail prestasi</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "60px 20px", color: SLATE }}>
                    Belum ada data prestasi {activeTab === 'akademik' ? 'akademik' : 'non-akademik'}.
                  </td>
                </tr>
              ) : (
                currentData.map((s) => {
                  const badge = rankBadge(s.rank);
                  return (
                    <tr key={s.id} style={{ borderTop: `1px solid ${LINE}` }}>
                      <td style={{ ...td, width: 70 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: badge.bg,
                            color: badge.fg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12.5,
                            fontWeight: 700,
                            border: `1px solid ${badge.ring}`,
                          }}
                        >
                          {s.rank}
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: '#f0f0f0',
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {s.foto ? (
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${s.foto}`} 
                                alt={s.nama} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: BLUE.text }}>{initials(s.nama)}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.nama}</div>
                            <div style={{ fontSize: 11.5, color: SLATE }}>NIS {s.nis}</div>
                          </div>
                        </div>
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: GREEN.text,
                            background: GREEN.bg,
                            border: `1px solid ${GREEN.border}`,
                            borderRadius: 999,
                            padding: "3px 11px",
                          }}
                        >
                          {s.kelas}
                        </span>
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: AMBER.text,
                            background: AMBER.bg,
                            border: `1px solid ${AMBER.border}`,
                            borderRadius: 999,
                            padding: "3px 11px",
                          }}
                        >
                          {s.grha || '-'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            minWidth: 26,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: BLUE.bg,
                            color: BLUE.text,
                            border: `1px solid ${BLUE.border}`,
                            fontSize: 12.5,
                            fontWeight: 700,
                            justifyContent: "center",
                          }}
                        >
                          {s.total_prestasi}
                        </span>
                      </td>
                      <td style={{ ...td, minWidth: 220 }}>
                        <div
                          style={{
                            maxHeight: 132,
                            overflowY: s.detail_prestasi && s.detail_prestasi.length > 2 ? "auto" : "visible",
                            paddingRight: s.detail_prestasi && s.detail_prestasi.length > 2 ? 4 : 0,
                          }}
                        >
                          {s.detail_prestasi && s.detail_prestasi.length > 0 ? (
                            s.detail_prestasi.map((d, i) => (
                              <div
                                key={i}
                                style={{
                                  background: AMBER.bg,
                                  border: `1px solid ${AMBER.border}`,
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  marginBottom: i < s.detail_prestasi.length - 1 ? 6 : 0,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: AMBER.text }}>
                                  <Medal size={13} strokeWidth={2} color={AMBER.text} />
                                  {d.nama_lomba}
                                </div>
                                <div style={{ fontSize: 11.5, color: "#A9791F", marginTop: 1 }}>{d.juara}</div>
                              </div>
                            ))
                          ) : (
                            <span style={{ opacity: 0.6, fontStyle: "italic" }}>Tidak ada detail</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ padding: "18px 22px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <FileText size={14} strokeWidth={2} color={SLATE} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: SLATE }}>Keterangan</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              { icon: User, label: "Nama", desc: "Nama siswa" },
              { icon: GraduationCap, label: "Kelas", desc: "Kelas siswa" },
              { icon: Medal, label: "Grha", desc: "Asrama siswa" },
              { icon: ListOrdered, label: "Total", desc: "Jumlah prestasi" },
              { icon: FileText, label: "Detail", desc: "Info lomba & juara" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                style={{
                  background: CARD,
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, marginBottom: 2, color: BLUE.text }}>
                  <Icon size={13} strokeWidth={2} color={BLUE.text} />
                  {label}
                </div>
                <div style={{ fontSize: 11.5, color: SLATE }}>{desc}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderLeft: `3px solid ${AMBER.text}`,
              background: AMBER.bg,
              borderRadius: 6,
              fontSize: 12.5,
              color: AMBER.text,
            }}
          >
            Lingkaran bernomor menandai peringkat 1 sampai 3. Data diperbarui otomatis.
          </div>
        </div>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 11.5,
  fontWeight: 600,
  color: SLATE,
  textTransform: "none",
};

const td = {
  padding: "14px 16px",
  verticalAlign: "middle",
};

export default Leaderboard;
