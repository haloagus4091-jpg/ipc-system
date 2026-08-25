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
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const grade10Students = getStudentsByGrade('X');
  const grade11Students = getStudentsByGrade('XI');
  const grade12Students = getStudentsByGrade('XII');

  return (
    <div>
      <h2>Edit IPC Awal</h2>
      {message && <div className="alert alert-success">{message}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === '10' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('10')}
          style={{ marginRight: '10px' }}
        >
          Kelas 10 ({grade10Students.length} siswa)
        </button>
        <button 
          className={`btn ${activeTab === '11' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('11')}
          style={{ marginRight: '10px' }}
        >
          Kelas 11 ({grade11Students.length} siswa)
        </button>
        <button 
          className={`btn ${activeTab === '12' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('12')}
        >
          Kelas 12 ({grade12Students.length} siswa)
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
        <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
          <h3>Bulk Update IPC Awal</h3>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            {selectedStudents.length} siswa dipilih. Mengubah IPC awal juga menyesuaikan IPC total dengan selisih yang sama.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>IPC Awal Baru:</label>
              <input
                type="number"
                min="0"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleBulkUpdate}
              disabled={saving}
              style={{ marginTop: '18px' }}
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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>Kelas {grade}</h3>
        <button 
          className="btn btn-secondary" 
          onClick={onSelectAll}
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          {isAllSelected ? 'Batal' : 'Pilih Semua'}
        </button>
      </div>
      
      {students.length === 0 ? (
        <p>Tidak ada siswa di kelas {grade}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
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
              <th>IPC Awal</th>
              <th>IPC Total</th>
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
                <td>{student.ipc_awal ?? '-'}</td>
                <td>{student.ipc_total ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EditIPCAwal;
