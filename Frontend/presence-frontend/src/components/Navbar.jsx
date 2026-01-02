import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo/Titre */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-2xl font-bold text-emerald-600 hover:text-emerald-800 transition duration-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <span className="text-white font-bold">P</span>
              </div>
              <span>Système Présence</span>
            </Link>
          </div>

          {/* Liens de Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" text="Scan"
              isActive={location.pathname === '/'}
            />
            <NavLink to="/historique" text="Historique"
              isActive={location.pathname === '/historique'}
            />
            <NavLink to="/admin" text="Admin"
              isActive={location.pathname.startsWith('/admin')}
            />
          </div>

          {/* Menu Burger pour Mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 focus:outline-none transition duration-300"
              aria-label="Menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="pt-2 pb-3 space-y-1">
              <MobileNavLink to="/" text="Scan" isActive={location.pathname === '/'}
                onClick={() => setIsOpen(false)}
              />
              <MobileNavLink to="/historique" text="Historique" isActive={location.pathname === '/historique'}
                onClick={() => setIsOpen(false)}
              />
              <MobileNavLink to="/admin" text="Admin" isActive={location.pathname.startsWith('/admin')}
                onClick={() => setIsOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Composant Desktop NavLink
const NavLink = ({ to, text, isActive }) => (
  <Link 
    to={to} 
    className={`
      relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300
      ${isActive ? 'text-emerald-700 bg-emerald-50' 
        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
      }
    `}
  >
    {text}
    {isActive && (
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
    )}
  </Link>
);

// Composant Mobile NavLink
const MobileNavLink = ({ to, text, isActive, onClick }) => (
  <Link to={to} onClick={onClick}
    className={`
      block px-3 py-3 rounded-md text-base font-medium transition duration-300
      ${isActive ? 'text-emerald-700 bg-emerald-50 border-r-4 border-emerald-500' 
        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
      }
    `}
  >
    {text}
  </Link>
);

export default Navbar;