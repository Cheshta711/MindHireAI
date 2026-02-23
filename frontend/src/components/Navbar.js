import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, LayoutDashboard, LogOut, FileText } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-lilac-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-lilac-400 to-lilac-600 p-2 rounded-2xl group-hover:shadow-glow transition-all">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold text-lilac-900">MindHire AI</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-lilac-100 text-lilac-900'
                  : 'text-lilac-700 hover:bg-lilac-50'
              }`}
              data-testid="nav-dashboard-link"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              to="/interviews"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isActive('/interviews') || location.pathname.startsWith('/interview/')
                  ? 'bg-lilac-100 text-lilac-900'
                  : 'text-lilac-700 hover:bg-lilac-50'
              }`}
              data-testid="nav-interviews-link"
            >
              <FileText className="h-4 w-4" />
              My Interviews
            </Link>

            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-lilac-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-lilac-900" data-testid="nav-user-name">{user.name}</p>
                <p className="text-xs text-lilac-600">{user.role}</p>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-lilac-700 hover:text-lilac-900 hover:bg-lilac-100"
                data-testid="nav-logout-button"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;