// Base URL de votre backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';

// Gestion du token et de l'authentification
export const authService = {
    async login(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, rememberMe }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Échec de la connexion',
                };
            }

            // Stocker le token JWT et les informations utilisateur
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    email: data.email,
                    fullName: data.fullName,
                }));

                // Stocker pour "Se souvenir de moi"
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                }
            }

            return {
                success: true,
                message: data.message,
                token: data.token,
                user: {
                    email: data.email,
                    fullName: data.fullName,
                },
            };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return {
                success: false,
                message: 'Erreur réseau. Vérifiez votre connexion.',
            };
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },
    
    async validateToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json().catch(() => ({}));
            // Retourne true si le backend indique que le token est valide
            return data.success !== false;
        } catch (error) {
            console.error('Erreur lors de la validation du token:', error);
            return false;
        }
    },
};

// Service des employés
export const employeeService = {
    async getAll() {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    authService.logout();
                    window.location.href = '/admin';
                }
                throw new Error('Erreur lors de la récupération des employés');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Employé non trouvé');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async create(employeeData) {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la création');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async update(id, employeeData) {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la modification');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            return true;
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async generateQRData(id) {
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_BASE_URL}/employes/${id}/qr`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la génération du QR code');
            }

            const data = await response.text();
            return data;
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },
};

// Interceptor pour les requêtes fetch
export const fetchWithAuth = async (url, options = {}) => {
    const token = authService.getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Bearer ${token}`}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        authService.logout();
        window.location.href = '/admin';
        throw new Error('Session expirée');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur serveur');
    }

    return response;
};
   // Service des présences
    export const presenceService = {
        async getAll() {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        authService.logout();
                        window.location.href = '/admin';
                    }
                    throw new Error('Erreur lors de la récupération des présences');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async getStats() {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/stats`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des statistiques');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async search(query) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/search?query=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la recherche');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async getByDate(date) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/date/${date}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération par date');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async create(presenceData) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(presenceData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la création');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async update(id, presenceData) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(presenceData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la modification');
                }

                return await response.json();
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async delete(id) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression');
                }

                return true;
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },

        async deleteMultiple(ids) {
            try {
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/presences/batch-delete`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ids),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression multiple');
                }

                return true;
            } catch (error) {
                console.error('Erreur:', error);
                throw error;
            }
        },
    };   // ... après presenceService ...

// Service pour le scan de QR Code
        export const scanService = {
            async scanQRCode(qrData, action, reason = '') {
                try {
                    const response = await fetch(`${API_BASE_URL}/presences/scan`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ qrData, action, reason }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        return {
                            success: false,
                            message: errorData.message || 'Erreur lors du scan'
                        };
                    }

                    const data = await response.json();
                    return {
                        success: true,
                        message: 'Présence enregistrée avec succès',
                        presence: data
                    };
                } catch (error) {
                    console.error('Erreur Scan:', error);
                    return {
                        success: false,
                        message: 'Erreur réseau: ' + error.message
                    };
                }
            }
};
