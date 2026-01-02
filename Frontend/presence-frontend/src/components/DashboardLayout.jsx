import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { employeeService, presenceService } from '../services/api';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [scansCount, setScansCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch real stats for sidebar
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const employees = await employeeService.getAll();
        const presences = await presenceService.getAll();

        if (!mounted) return;

        setEmployeesCount(Array.isArray(employees) ? employees.filter(e => e.isActive).length : 0);
        setScansCount(Array.isArray(presences) ? presences.length : 0);
      } catch (err) {
        console.error('Erreur récupération stats sidebar:', err);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };

    fetchStats();

    // Option: refresh stats when coming back to dashboard
    const onFocus = () => fetchStats();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const SidebarLink = ({ to, icon, text, desc }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-start p-4 rounded-xl transition-all duration-300 mb-3 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
            : 'text-gray-300 hover:bg-emerald-800 hover:text-white hover:shadow-md'
        }`}
      >
        <span className="text-2xl mr-4 flex-shrink-0 mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-base block mb-1 whitespace-nowrap">{text}</span>
          <span className="text-xs text-emerald-200/80 block opacity-90">{desc}</span>
        </div>
        {isActive && (
          <span className="ml-2 w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0"></span>
        )}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const menuItems = [
    {
      to: "/admin/dashboard/liste",
      icon: "",
      text: "Liste Employés",
      desc: "Gérer tous les employés"
    },
    { 
      to: "/admin/dashboard/creation", 
      icon: "",
      text: "Créer Employé",
      desc: "Ajouter un nouvel employé"
    },
    { 
      to: "/admin/dashboard/historique", 
      icon: "",
      text: "Historique Scans", 
      desc: "Voir tous les scans"
    }
  ];

  // Trouver le titre de la page active
  const currentPage = menuItems.find(item => 
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-16">
      {/* Overlay pour mobile */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-16 lg:top-0 left-0 z-40
        flex flex-col w-64 h-[calc(100vh-4rem)] lg:h-screen
        bg-gradient-to-b from-emerald-900 to-emerald-800 text-white
        shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* En-tête Sidebar (version mobile seulement) */}
        <div className="p-5 border-b border-emerald-700/50 flex-shrink-0 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                <span className="text-xl font-bold">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
                <p className="text-xs text-emerald-300 mt-1">Dashboard</p>
              </div>
            </div>
            {/* Bouton fermer mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-emerald-300 hover:text-white p-2"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>
        
        {/* Menu de navigation avec scroll */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-4 px-2">
              Navigation Admin
            </h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <SidebarLink 
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  text={item.text}
                  desc={item.desc}
                />
              ))}
            </div>
          </div>

          {/* Section d'aide */}
          <div className="mt-8 p-4 bg-emerald-800/30 rounded-xl">
            <h4 className="text-sm font-medium text-emerald-300 mb-2 flex items-center">
              <span className="mr-2">💡</span> Aide rapide
            </h4>
            <ul className="text-xs text-emerald-200/80 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Créez les employés d'abord</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Générez leurs QR codes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Suivez les scans en temps réel</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Stats et Déconnexion */}
        <div className="p-5 border-t border-emerald-700/50 flex-shrink-0 space-y-4">
          {/* Stats */}
          <div className="bg-emerald-800/40 backdrop-blur-sm rounded-lg p-4">
            <h4 className="text-sm font-medium text-emerald-300 mb-3">Statistiques</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-emerald-900/30 rounded">
                <div className="text-lg font-bold">{statsLoading ? '…' : employeesCount}</div>
                <div className="text-xs text-emerald-300">Employés</div>
              </div>
              <div className="text-center p-2 bg-emerald-900/30 rounded">
                <div className="text-lg font-bold">{statsLoading ? '…' : scansCount}</div>
                <div className="text-xs text-emerald-300">Scans</div>
              </div>
            </div>
          </div>
          
          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg bg-emerald-800/40 hover:bg-emerald-800 text-red-300 hover:text-red-100 transition-all duration-300 group"
          >
            <span className="text-xl mr-3 group-hover:scale-110 transition-transform cursor-pointer"></span>
            <div className="flex-1 text-left cursor-pointer">
              <span className="font-medium block">Déconnexion</span>
              <span className="text-xs text-red-300/70">Quitter le dashboard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen w-full lg:w-[calc(100%-16rem)] lg:ml-64">
        {/* En-tête de contenu (petite barre sous la navbar) */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-16 z-30">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Bouton menu mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden mr-3 p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">☰</span>
                </button>
                
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {currentPage?.text || 'Administration'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {currentPage?.desc || 'Tableau de bord administrateur'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Indicateur d'état */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-700">Dashboard actif</span>
                </div>
                
                {/* Badge Admin */}
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Admin</span>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-4 sm:p-6">
          <div className="max-w-full">
            <Outlet />
          </div>
        </div>

        {/* Footer léger */}
        <footer className="mt-8 px-4 sm:px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              Dashboard Admin • Système de Présence • 
              <span className="text-emerald-600 font-medium ml-2">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;