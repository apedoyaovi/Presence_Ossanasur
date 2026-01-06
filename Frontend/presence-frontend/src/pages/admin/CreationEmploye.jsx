import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Plus, XCircle, Info, Edit, Check } from 'lucide-react';
import { employeeService } from '../../services/api'; 

const CreationEmploye = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const employeeId = searchParams.get('id');

    const initialFormData = {
        lastName: '',
        firstName: '',
        registrationNumber: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: new Date().toISOString().split('T')[0],
        address: '',
        city: '',
        postalCode: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [pageError, setPageError] = useState(null);

    const isEditMode = !!employeeId;

    // Définir les postes par département
    const positionsByDepartment = {
        'Développement': ['Développeur Frontend', 'Développeur Backend', 'Développeur Full Stack', 'DevOps Engineer', 'Architecte Logiciel'],
        'Marketing': ['Responsable Marketing', 'Spécialiste SEO/SEM', 'Community Manager', 'Content Manager', 'Analyste Marketing'],
        'Ressources Humaines': ['Responsable RH', 'Recruteur', 'Gestionnaire de Paie', 'Chargé de Formation', 'Responsable Compensation'],
        'Finance': ['Directeur Financier', 'Comptable', 'Contrôleur de Gestion', 'Trésorier', 'Analyste Financier'],
        'Commercial': ['Directeur Commercial', 'Chef de Ventes', 'Commercial Terrain', 'Account Manager', 'Business Développeur'],
        'Support': ['Responsable Support', 'Technicien Support', 'Helpdesk', 'Support Client', 'Technical Support Engineer'],
        'Direction': ['PDG', 'Directeur Général', 'Directeur Exécutif', 'Président']
    };

    // Obtenir les postes suggérés basés sur le département sélectionné
    const suggestedPositions = formData.department ? positionsByDepartment[formData.department] || [] : [];

    const title = isEditMode ? "Modifier l'employé" : "Ajouter un employé";

    // Charger l'employé en mode édition
    useEffect(() => {
        if (isEditMode) {
            const fetchEmployee = async () => {
                setLoading(true);
                try {
                    const employee = await employeeService.getById(employeeId);
                    
                    setFormData({
                        lastName: employee.lastName || '',
                        firstName: employee.firstName || '',
                        registrationNumber: employee.registrationNumber || '',
                        email: employee.email || '',
                        phone: employee.phone || '',
                        department: employee.department || '',
                        position: employee.position || '',
                        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
                        address: employee.address || '',
                        city: employee.city || '',
                        postalCode: employee.postalCode || '',
                    });
                } catch (error) {
                    console.error("Erreur de chargement de l'employé:", error);
                    setPageError("Erreur lors du chargement des données de l'employé.");
                    toast.error("Impossible de charger l'employé", { position: "top-right" });
                } finally {
                    setLoading(false);
                }
            };
            fetchEmployee();
        }
    }, [isEditMode, employeeId]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
        if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
        if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Le matricule est requis';

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerateMatricule = () => {
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const year = new Date().getFullYear();
        const newMatricule = `EMP${year}${randomNum}`;
        setFormData(prev => ({ ...prev, registrationNumber: newMatricule }));
        if (errors.registrationNumber) {
            setErrors(prev => ({ ...prev, registrationNumber: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Veuillez corriger les erreurs dans le formulaire.', { position: "top-right" });
            return;
        }

        setLoading(true);

        try {
            if (isEditMode) {
                await employeeService.update(employeeId, formData);
                toast.success(`Employé ${formData.firstName} mis à jour avec succès !`, { position: "top-right" });
            } else {
                await employeeService.create(formData);
                toast.success(`Employé ${formData.firstName} ${formData.lastName} créé avec succès !`, { position: "top-right" });
            }

            setTimeout(() => {
                navigate('/admin/dashboard/liste');
            }, 1500);

        } catch (error) {
            console.error('Erreur API:', error);
            const errorMessage = `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de l'employé: ${error.message}`;
            toast.error(errorMessage, { position: "top-right" });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/dashboard/liste');
    };

    if (pageError) {
        return (
            <div className="min-h-screen pt-24 p-8 flex justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-xl" role="alert">
                    <strong className="font-bold">Erreur de chargement!</strong>
                    <span className="block sm:inline ml-2">{pageError}</span>
                </div>
            </div>
        );
    }

    if (isEditMode && loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center text-xl text-emerald-600">
                <Loader2 className="animate-spin w-6 h-6 mr-3" /> Chargement des données...
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // 4. RENDU (avec les noms de champs mis à jour)
    // ----------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8 pt-24">
            <ToastContainer />
            <div className="max-w-4xl mx-auto">

                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                                {title}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Remplissez les informations pour {isEditMode ? 'modifier' : 'ajouter'} l'employé.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Section Informations de base */}
                            <div>
                                <h2 className="text-xl font-bold text-emerald-700 mb-4 pb-2 border-b border-gray-200">
                                    <div className='flex items-center'>
                                        <Info className="w-5 h-5 mr-2" /> Informations de base
                                    </div>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nom (lastName) */}
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                                                errors.lastName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Entrez le nom de famille"
                                        />
                                        {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                                    </div>

                                    {/* Prénom (firstName) */}
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Prénom <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                                                errors.firstName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Entrez le prénom"
                                        />
                                        {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                                    </div>

                                    {/* Matricule (registrationNumber) */}
                                    <div>
                                        <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                            Matricule <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="registrationNumber"
                                                value={formData.registrationNumber}
                                                onChange={handleChange}
                                                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                                                    errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Ex: EMP2024001"
                                                disabled={isEditMode} // Le matricule est souvent non modifiable
                                            />
                                            {!isEditMode && (
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateMatricule}
                                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                                >
                                                    Générer
                                                </button>
                                            )}
                                        </div>
                                        {errors.registrationNumber && <p className="mt-1 text-sm text-red-600">{errors.registrationNumber}</p>}
                                        <p className="mt-1 text-sm text-gray-500">Identifiant unique de l'employé</p>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Adresse email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="exemple@entreprise.com"
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section Informations professionnelles */}
                            <div>
                                <h2 className="text-xl font-bold text-emerald-700 mb-4 pb-2 border-b border-gray-200">
                                    <div className='flex items-center'>
                                        <Edit className="w-5 h-5 mr-2" /> Informations professionnelles
                                    </div>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Département (department) */}
                                    <div>
                                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                                            Département
                                        </label>
                                        <select
                                            id="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                        >
                                            <option value="">Sélectionnez un département</option>
                                            <option value="Développement">Développement</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Ressources Humaines">Ressources Humaines</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Support">Support</option>
                                            <option value="Direction">Direction</option>
                                        </select>
                                    </div>

                                    {/* Poste (position) */}
                                    <div>
                                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                                            Poste
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="position"
                                                value={formData.position}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                                placeholder={formData.department ? "Sélectionnez ou tapez un poste" : "Veuillez d'abord sélectionner un département"}
                                                disabled={!formData.department}
                                            />
                                            
                                            {/* Liste des suggestions de postes */}
                                            {formData.department && suggestedPositions.length > 0 && !formData.position && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                    {suggestedPositions.map((pos) => (
                                                        <button
                                                            key={pos}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    position: pos
                                                                }));
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                                                        >
                                                            <span>{pos}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {formData.department && suggestedPositions.length > 0 && !formData.position && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Cliquez sur un poste pour le sélectionner ou continuez à taper pour un poste personnalisé
                                            </p>
                                        )}
                                    </div>

                                    {/* Date d'embauche (hireDate) */}
                                    <div>
                                        <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-2">
                                            Date d'embauche
                                        </label>
                                        <input
                                            type="date"
                                            id="hireDate"
                                            value={formData.hireDate}
                                            onChange={handleChange}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        />
                                    </div>

                                    {/* Téléphone (phone) */}
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                            Téléphone
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                            placeholder="+228 90 12 34 56"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section Adresse */}
                            <div>
                                <h2 className="text-xl font-bold text-emerald-700 mb-4 pb-2 border-b border-gray-200">
                                    Adresse
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Adresse */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                            Adresse
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                            placeholder="Agoè plateau, Rue 123"
                                        />
                                    </div>

                                    {/* Ville (city) */}
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                            Ville
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                            placeholder="Lomé"
                                        />
                                    </div>

                                    {/* Code postal (postalCode) */}
                                    <div>
                                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                                            Code postal
                                        </label>
                                        <input
                                            type="text"
                                            id="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                            placeholder="0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
                                            {isEditMode ? 'Modification en cours...' : 'Création en cours...'}
                                        </span>
                                    ) : (
                                        isEditMode ? 'Modifier l\'employé' : 'Créer l\'employé'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Note informative */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0 text-blue-600">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Information</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>• Les champs marqués d'un astérisque (*) sont obligatoires</p>
                                <p>• Un QR code sera automatiquement généré après la création de l'employé.</p>
                                <p>• Le matricule est l'identifiant unique de l'employé et ne peut pas être modifié.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreationEmploye;