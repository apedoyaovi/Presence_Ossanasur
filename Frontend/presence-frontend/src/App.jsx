import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Accueil from './pages/Accueil';
import Historique from './pages/Historique';
import AdminLogin from './pages/AdminLogin';
import DashboardLayout from './components/DashboardLayout';
import CreationEmploye from './pages/admin/CreationEmploye';
import ListeEmployes from './pages/admin/ListeEmployes';
import HistoriqueAdmin from './pages/admin/HistoriqueAdmin';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Composant pour les Routes Protégées (ADMIN)
const ProtectedRoute = ({ element: Element, requiredRole, ...rest }) => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || (requiredRole && role !== requiredRole)) {
        return <Navigate to="/admin" replace />;
    }

    return <Element {...rest} />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* Toast Notifications */}
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />

                {/* La Navbar n'apparaît que sur les pages publiques */}
                <Routes>
                    <Route path="/*" element={<Navbar />} />
                </Routes>

                <main>
                    <Routes>
                        {/* Pages Publiques */}
                        <Route path="/" element={<Accueil />} />
                        <Route path="/historique" element={<Historique />} />
                        <Route path="/admin" element={<AdminLogin />} />

                        {/* Dashboard Administrateur (PROTÉGÉ) */}
                        <Route
                            path="/admin/dashboard"
                            element={<ProtectedRoute element={DashboardLayout} requiredRole="ADMIN" />}
                        >
                            <Route path="creation" element={<CreationEmploye />} />
                            <Route path="liste" element={<ListeEmployes />} />
                            <Route path="historique" element={<HistoriqueAdmin />} />
                            <Route index element={<Navigate to="liste" replace />} />
                        </Route>

                        {/* Gestion des chemins non trouvés */}
                        <Route path="*" element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                                    <p className="text-gray-600">Page non trouvée</p>
                                </div>
                            </div>
                        } />
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}

export default App;