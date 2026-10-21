import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const dashboardPath = { customer: '/account', vendor: '/vendor', admin: '/admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-indigo-600">Marketplace</Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link to={dashboardPath[user.role]} className="hover:text-indigo-600">
                {user.name} <span className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{user.role}</span>
              </Link>
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                className="text-slate-500 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-600">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white rounded px-3 py-1.5 hover:bg-indigo-700">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
