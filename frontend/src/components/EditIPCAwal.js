import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EditIPCAwal() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('10'); // '10', '11', '12'
  const [bulkValue, setBulkValue] = useState('80');
  const [saving, setSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.filter(user => user.role === 'siswa'));
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const getStudentsByGrade = (grade) => {
    // Handle both Roman numerals (X, XI, XII) and Arabic numerals (10, 11, 12)
    return students.filter(student => {
      if (!student.kelas) return false;
      const classPrefix = student.kelas.split(' ')[0]; // Get the class level (X, XI, XII)
      return classPrefix === grade || 
             (grade === '10' && classPrefix === 'X') ||
             (grade === '11' && classPrefix === 'XI') ||
             (grade === '12' && classPrefix === 'XII');
    });
  };

  const handleSelectAll = (grade) => {
    const gradeStudents = getStudentsByGrade(grade);
    const allSelected = gradeStudents.every(s => selectedStudents.includes(s.id));
    
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !gradeStudents.find(s => s.id === id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...gradeStudents.map(s => s.id)])]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedStudents.length === 0) {
      setMessage('Pilih minimal satu siswa untuk diupdate');
      return;
    }

    const parsed = parseInt(bulkValue, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setMessage('IPC awal harus angka valid (min 0)');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.post('/users/bulk-update-ipc-awal', {
        userIds: selectedStudents,
        ipcAwal: parsed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`IPC awal berhasil diupdate untuk ${selectedStudents.length} siswa`);
      setSelectedStudents([]);
      fetchStudents();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal update IPC awal');
    } finally {
      setSaving(false);
    }
  };

  const isAllSelected = (grade) => {
    const gradeStudents = getStudentsByGrade(grade);
    return gradeStudents.length > 0 && gradeStudents.every(s => selectedStudents.includes(s.id));
  };

  const isSomeSelected = (grade) => {
    const gradeStudents = getStudentsByGrade(grade);
    return gradeStudents.some(s => selectedStudents.includes(s.id)) && !isAllSelected(grade);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f6f9' }}>
        <div style={{ fontSize: '1.2rem', color: '#5b6472' }}>Loading...</div>
      </div>
    );
  }

  const grade10Students = getStudentsByGrade('X');
  const grade11Students = getStudentsByGrade('XI');
  const grade12Students = getStudentsByGrade('XII');

  return (
    <div style={{ padding: '32px 20px 60px', maxWidth: '1080px', margin: '0 auto', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', background: '#f4f6f9', color: '#1c2430', minHeight: '100vh' }}>
      <style>{`
        :root{
          --ink: #1c2430;
          --ink-soft: #5b6472;
          --line: #e4e7ec;
          --surface: #ffffff;
          --page: #f4f6f9;
          --accent: #2a5cdb;
          --accent-soft: #eaf0ff;
          --radius: 14px;
          --shadow: 0 1px 2px rgba(20,30,50,.04), 0 8px 24px rgba(20,30,50,.06);
        }
        .tabs{
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .tabs::-webkit-scrollbar{ display:none; }
        .tab{
          flex: 0 0 auto;
          appearance: none;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--ink-soft);
          font-size: 14px;
          font-weight: 600;
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease;
          white-space: nowrap;
        }
        .tab:hover{ border-color: #c9d2e0; }
        .tab:active{ transform: translateY(1px); }
        .tab.active{
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .tab .count{
          opacity: .8;
          font-weight: 500;
        }
        .panel{
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .panel-head{
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px 16px;
        }
        .panel-head h2{
          font-size: 17px;
          font-weight: 700;
          margin: 0;
        }
        .btn-select-all{
          appearance: none;
          border: 1px solid var(--line);
          background: var(--page);
          color: var(--ink);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background .15s ease;
        }
        .btn-select-all:hover{ background: #eceef2; }
        .table-scroll{
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        .table-scroll::after{
          content: "";
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 24px;
          pointer-events: none;
          background: linear-gradient(to right, transparent, rgba(20,30,50,.06));
          opacity: 0;
          transition: opacity .2s ease;
        }
        .table-scroll.has-overflow::after{ opacity: 1; }
        table{
          width: 100%;
          border-collapse: collapse;
          min-width: 640px;
        }
        thead th{
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-soft);
          letter-spacing: .02em;
          padding: 10px 22px;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          background: #fafbfc;
        }
        thead th.checkbox-col{ width: 40px; }
        thead th.num{ text-align: right; }
        tbody td{
          padding: 14px 22px;
          font-size: 14px;
          border-bottom: 1px solid var(--line);
          color: var(--ink);
        }
        tbody tr:last-child td{ border-bottom: none; }
        tbody tr:hover{ background: #fafbfd; }
        td.num{ text-align: right; font-variant-numeric: tabular-nums; }
        input[type="checkbox"]{
          width: 17px;
          height: 17px;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .editable{
          display: inline-block;
          min-width: 34px;
          padding: 4px 8px;
          border-radius: 6px;
          font-variant-numeric: tabular-nums;
          text-align: right;
          border: 1px solid transparent;
          background: transparent;
        }
        .editable:hover{ border-color: var(--line); background: var(--page); }
        .editable:focus{
          outline: none;
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .empty{
          padding: 48px 22px;
          text-align: center;
          color: var(--ink-soft);
          font-size: 14px;
        }
        @media (max-width: 780px){
          thead th:nth-child(2),
          tbody td:nth-child(2){
            position: sticky;
            left: 0;
            background: #fff;
            box-shadow: 1px 0 0 var(--line);
          }
          thead th:nth-child(2){ background: #fafbfc; }
          tbody tr:hover td:nth-child(2){ background: #fafbfd; }
        }
        @media (max-width: 780px){
          .wrap{ padding: 20px 14px 48px; }
          h1{ font-size: 22px; margin-bottom: 16px; }
          .panel-head{ padding: 14px 16px 12px; }
          .panel-head h2{ font-size: 16px; }
          .btn-select-all{ padding: 7px 12px; font-size: 12.5px; }
          thead th, tbody td{ padding: 12px 14px; font-size: 13.5px; }
        }
        @media (max-width: 420px){
          .tab{ padding: 10px 14px; font-size: 13px; }
          table{ min-width: 580px; }
        }
      `}</style>

      <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 20px' }}>Edit IPC Awal</h1>
      {message && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: '10px', marginBottom: '18px', fontSize: '14px', fontWeight: 600 }}>{message}</div>}
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === '10' ? 'active' : ''}`}
          onClick={() => setActiveTab('10')}
        >
          Kelas 10 <span className="count">({grade10Students.length} siswa)</span>
        </button>
        <button 
          className={`tab ${activeTab === '11' ? 'active' : ''}`}
          onClick={() => setActiveTab('11')}
        >
          Kelas 11 <span className="count">({grade11Students.length} siswa)</span>
        </button>
        <button 
          className={`tab ${activeTab === '12' ? 'active' : ''}`}
          onClick={() => setActiveTab('12')}
        >
          Kelas 12 <span className="count">({grade12Students.length} siswa)</span>
        </button>
      </div>

      {activeTab === '10' && (
        <GradeSection 
          grade="10"
          students={grade10Students}
          selectedStudents={selectedStudents}
          onSelectAll={() => handleSelectAll('X')}
          onSelectStudent={handleSelectStudent}
          isAllSelected={isAllSelected('X')}
          isSomeSelected={isSomeSelected('X')}
        />
      )}

      {activeTab === '11' && (
        <GradeSection 
          grade="11"
          students={grade11Students}
          selectedStudents={selectedStudents}
          onSelectAll={() => handleSelectAll('XI')}
          onSelectStudent={handleSelectStudent}
          isAllSelected={isAllSelected('XI')}
          isSomeSelected={isSomeSelected('XI')}
        />
      )}

      {activeTab === '12' && (
        <GradeSection 
          grade="12"
          students={grade12Students}
          selectedStudents={selectedStudents}
          onSelectAll={() => handleSelectAll('XII')}
          onSelectStudent={handleSelectStudent}
          isAllSelected={isAllSelected('XII')}
          isSomeSelected={isSomeSelected('XII')}
        />
      )}

      {selectedStudents.length > 0 && (
        <div className="panel" style={{ marginTop: '18px', padding: '20px 22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px' }}>Bulk Update IPC Awal</h3>
          <p style={{ marginBottom: '16px', color: '#5b6472', fontSize: '14px' }}>
            {selectedStudents.length} siswa dipilih. Mengubah IPC awal juga menyesuaikan IPC total dengan selisih yang sama.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#1c2430' }}>IPC Awal Baru:</label>
              <input
                type="number"
                min="0"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e4e7ec', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color .15s ease' }}
                onFocus={(e) => e.target.style.borderColor = '#2a5cdb'}
                onBlur={(e) => e.target.style.borderColor = '#e4e7ec'}
              />
            </div>
            <button 
              onClick={handleBulkUpdate}
              disabled={saving}
              style={{ marginTop: '24px', padding: '10px 18px', background: '#2a5cdb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'background .15s ease' }}
              onMouseEnter={(e) => !saving && (e.target.style.background = '#1e4bb8')}
              onMouseLeave={(e) => !saving && (e.target.style.background = '#2a5cdb')}
            >
              {saving ? 'Menyimpan...' : 'Update IPC Awal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeSection({ grade, students, selectedStudents, onSelectAll, onSelectStudent, isAllSelected, isSomeSelected }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Kelas {grade}</h2>
        <button 
          className="btn-select-all"
          onClick={onSelectAll}
        >
          {isAllSelected ? 'Batal' : 'Pilih Semua'}
        </button>
      </div>
      
      {students.length === 0 ? (
        <div className="empty">Belum ada siswa di kelas ini.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={onSelectAll}
                  />
                </th>
                <th>Nama</th>
                <th>NIS</th>
                <th>Kelas</th>
                <th>Grha</th>
                <th className="num">IPC Awal</th>
                <th className="num">IPC Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => onSelectStudent(student.id)}
                    />
                  </td>
                  <td>{student.nama}</td>
                  <td>{student.nis || '-'}</td>
                  <td>{student.kelas || '-'}</td>
                  <td>{student.grha || '-'}</td>
                  <td className="num">{student.ipc_awal ?? '-'}</td>
                  <td className="num">{student.ipc_total ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EditIPCAwal;
