import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, XCircle, Shield, Loader2, CheckCircle } from 'lucide-react';

const AdminLogin = () => {
    const { login, isAuthenticated, role, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const navigate = useNavigate();

    // Redirection si déjà authentifié
    useEffect(() => {
        if (isAuthenticated && role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    // Charger l'email sauvegardé
    useEffect(() => {
        const savedEmail = localStorage.getItem('adminEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // Valider le mot de passe
    useEffect(() => {
        setIsPasswordValid(password.length > 0);
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isAuthenticated) return;

        setLoading(true);

        const result = await login(email, password, rememberMe);

        if (result.success) {
            console.log("Connexion réussie !");

            if (rememberMe) {
                localStorage.setItem('adminEmail', email);
            } else {
                localStorage.removeItem('adminEmail');
            }

            navigate('/admin/dashboard', { replace: true });
        } else {
            setError(result.message || 'Échec de connexion. Vérifiez les identifiants.');
            console.error("Échec de connexion:", result.message);
        }

        setLoading(false);
    };

    // Afficher un loader pendant la vérification de l'authentification
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Si déjà authentifié, rediriger
    if (isAuthenticated && role === 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirection vers le tableau de bord...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center pt-20 pb-10 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            <div className="max-w-md w-full mx-4">
                {/* En-tête */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-3">
                        Portail Administrateur
                    </h1>
                    <p className="text-gray-600 max-w-sm mx-auto">
                        Accédez au tableau de bord de gestion de présence
                    </p>
                </div>

                {/* Carte de connexion */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>

                    <div className="p-8">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Champ Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="pl-10 appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                        placeholder="admin@system.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Champ Mot de passe */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 ${
                                        isPasswordFocused ? 'text-emerald-500' :
                                            isPasswordValid ? 'text-emerald-600' : 'text-gray-400'
                                    }`}>
                                        {isPasswordValid ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <Lock className="h-5 w-5" />
                                        )}
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className={`pl-10 pr-12 appearance-none rounded-lg relative block w-full px-4 py-3 border ${
                                            isPasswordFocused ? 'border-emerald-500 ring-2 ring-emerald-500' :
                                                isPasswordValid ? 'border-emerald-500' : 'border-gray-300'
                                        } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-200`}
                                        placeholder="Votre mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                    <span className={`transition-colors duration-200 ${
                        isPasswordFocused ? 'text-emerald-500 hover:text-emerald-600' :
                            'text-gray-400 hover:text-emerald-600'
                    }`}>
                      {showPassword ? <EyeOff className="h-5 h-5" /> : <Eye className="h-5 h-5" />}
                    </span>
                                    </button>
                                </div>

                                {password.length > 0 && (
                                    <div className="mt-2 flex items-center">
                                        <div className={`h-1 flex-1 rounded-full mr-2 transition-all duration-300 ${
                                            password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-200'
                                        }`}></div>
                                        <span className={`text-xs font-medium ${
                                            password.length >= 8 ? 'text-emerald-600' : 'text-gray-500'
                                        }`}>
                      {password.length >= 8 ? 'Sécurisé' : `${password.length}/8 caractères`}
                    </span>
                                    </div>
                                )}
                            </div>

                            {/* Option Se souvenir de moi */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                        Se souvenir de moi
                                    </label>
                                </div>
                            </div>

                            {/* Message d'Erreur */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start">
                                        <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">{error}</p>
                                            <p className="text-xs text-red-600 mt-1">
                                                Identifiants de test: admin@system.com / admin123
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bouton de Connexion */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || isAuthenticated}
                                    className="group relative w-full flex justify-center py-3 px-4 mt-10 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Connexion en cours...
                    </span>
                                    ) : (
                                        'Se Connecter'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer de la carte */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-center text-sm text-gray-600">
                            <p>© 2025 Système de Présence</p>
                            <p className="text-xs mt-1">Sécurisé avec authentification avancée</p>
                        </div>
                    </div>
                </div>

                {/* Informations de sécurité */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                        <Shield className="h-4 w-4 text-emerald-600 mr-2" />
                        <span>Session sécurisée • Connexion chiffrée</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;