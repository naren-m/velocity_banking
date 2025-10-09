import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
    return isActive(path)
      ? `${base} bg-primary text-white`
      : `${base} text-gray-700 hover:bg-gray-200`;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-bold text-primary">
            Velocity Banking
          </Link>

          <div className="flex gap-2 items-center">
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/calculator" className={linkClass('/calculator')}>
              Calculator
            </Link>
            <Link to="/heloc-strategy" className={linkClass('/heloc-strategy')}>
              HELOC Strategy
            </Link>
            <Link to="/target-year-strategy" className={linkClass('/target-year-strategy')}>
              Target Year
            </Link>
            <Link to="/investment-comparison" className={linkClass('/investment-comparison')}>
              Investment Comparison
            </Link>
            <Link to="/payment" className={linkClass('/payment')}>
              Payment
            </Link>
            {user && (
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout ({user.username || user.email || 'User'})
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
