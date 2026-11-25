import { useNavigate } from 'react-router-dom';

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const Navbar = ({ notificationCount = 0, onClearNotifications }) => {
  const navigate = useNavigate();
  const user = parseStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
          ComplaintDesk
        </span>
        {user?.role && (
          <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            {user.role}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {notificationCount > 0 && (
          <button
            onClick={onClearNotifications}
            className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full hover:shadow-xs transition cursor-pointer"
          >
            Updates ({notificationCount})
          </button>
        )}

        <span className="text-sm text-slate-600 hidden sm:inline">
          Hi, <strong className="text-slate-800">{user?.name}</strong>
        </span>

        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;