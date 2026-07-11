import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanLine, LogOut, UserPlus, Shield } from 'lucide-react';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 400);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-header">
      {/* Logo */}
      <Link to={user ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99,102,241,0.5)'
          }}>
            <Shield size={18} color="white" />
          </div>
          <span className="app-logo">PassGuard</span>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {user ? (
          <>
            {/* Role chip */}
            <span className="chip" style={{ marginRight: '0.5rem' }}>
              <span className={`dot ${user.role === 'Admin' ? 'green' : user.role === 'Security' ? 'yellow' : 'green'}`} />
              {user.name} · {user.role}
            </span>

            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" active={isActive('/dashboard')} />

            {(user.role === 'Admin' || user.role === 'Security') && (
              <NavLink to="/scan" icon={<ScanLine size={15} />} label="Scanner" active={isActive('/scan')} />
            )}

            <button
              className="btn btn-ghost"
              style={{ gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem', opacity: loggingOut ? 0.5 : 1 }}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register-visitor" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', gap: '0.4rem' }}>
              <UserPlus size={15} /> Register Visit
            </Link>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}>
              Staff Login
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

const NavLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className="btn btn-ghost"
    style={{
      fontSize: '0.85rem',
      padding: '0.5rem 0.9rem',
      gap: '0.4rem',
      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      color: active ? '#a5b4fc' : 'var(--text-muted)',
      borderColor: active ? 'rgba(99,102,241,0.3)' : 'transparent',
      border: '1px solid',
    }}
  >
    {icon}{label}
  </Link>
);

export default Header;
