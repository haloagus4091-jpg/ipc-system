import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, isMobileMenuOpen, toggleMobileMenu }) {
  // const [permissions, setPermissions] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Navbar - User:', user);
  console.log('Navbar - User Role:', user?.role);

  // Permission fetching disabled for now
  // const fetchPermissions = useCallback(async () => {
  //   if (!user) return;
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch('/permissions/' + user.id, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     const data = await response.json();
  //     console.log('Navbar - Permissions data:', data);
  //     setPermissions(data);
  //   } catch (error) {
  //     console.error('Error fetching permissions:', error);
  //   }
  // }, [user]);

  // useEffect(() => {
  //   fetchPermissions();
  // }, [fetchPermissions]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', show: true },
    { path: '/input-prestasi', label: 'Prestasi', show: true },
    { path: '/input-organisasi', label: 'Organisasi', show: true },
    { path: '/input-kepanitiaan', label: 'Kepanitiaan', show: true },
    { path: '/input-event', label: 'Event', show: true },
    // Pelanggaran and Perilaku only for superadmin
    { path: '/input-pelanggaran', label: 'Pelanggaran', show: user?.role === 'superadmin' },
    { path: '/input-perilaku', label: 'Perilaku', show: user?.role === 'superadmin' },
    // Kelola Akun for superadmin
    { path: '/kelola-akun', label: 'Kelola Akun', show: user?.role === 'superadmin' },
    { path: '/edit-ipc-awal', label: 'Edit IPC Awal', show: user?.role === 'superadmin' },
    { path: '/konfigurasi-ipc', label: 'Konfigurasi IPC', show: user?.role === 'superadmin' },
    { path: '/izin-akun', label: 'Izin Akun', show: user?.role === 'superadmin' },
    // Approvals for superadmin only
    { path: '/approvals', label: 'Approvals', show: user?.role === 'superadmin' },
    { path: '/drive-viewer', label: 'File Manager', show: user?.role === 'superadmin' },
    { path: '/notifications', label: 'Notifikasi', show: user?.role === 'siswa' || user?.role === 'guru' },
    { path: '/logs', label: 'Logs', show: user?.role === 'superadmin' },
    { path: '/wali-kelas', label: 'Manajemen Wali Kelas', show: user?.role === 'superadmin' },
    { path: '/wali-kelas-guru', label: 'Wali Kelas', show: user?.role === 'guru' && user?.wali_kelas },
    { path: '/leaderboard', label: 'Peringkat', show: true },
    { path: '/laporan-cetak', label: 'Laporan & Cetak', show: user?.role === 'superadmin' || (user?.role === 'guru' && user?.wali_kelas) },
    { path: '/profile', label: 'Profile', show: true }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.show) return false;
    // SuperAdmin, Siswa, dan Guru bisa akses semua input forms tanpa permission check
    return true;
  });

  return (
    <>
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2>IPC School</h2>
            <p>Sistem Informasi Sekolah IPC</p>
          </div>
        </div>
        <ul className="sidebar-nav">
          {filteredNavItems.map(item => (
            <li key={item.path}>
              <a 
                href={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigating to:', item.path, 'Mobile menu open:', isMobileMenuOpen);
                  navigate(item.path);
                  if (isMobileMenuOpen && toggleMobileMenu) {
                    console.log('Closing mobile menu');
                    toggleMobileMenu();
                  }
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <button
              onClick={() => {
                onLogout();
                if (toggleMobileMenu) toggleMobileMenu();
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateX(4px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              🚪 Logout
            </button>
          </li>
        </ul>
      </div>
      <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>
    </>
  );
}

export default Navbar;
