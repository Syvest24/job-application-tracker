import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Job Tracker</span>
            </Link>
            
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Job Applications
              </Link>
              <Link
                to="/portfolio"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/portfolio')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="inline h-4 w-4 mr-1" />
                Portfolio
              </Link>
            </div>
          </div>
          
          <Link
            to="/admin"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;