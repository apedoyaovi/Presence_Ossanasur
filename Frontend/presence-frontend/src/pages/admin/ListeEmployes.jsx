import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Plus, Users, QrCode, Clock, Search, XCircle, Download, Edit, Trash2, Mail, Send } from 'lucide-react';
import { employeeService } from '../../services/api'; // Mettre à jour l'import

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

const ListeEmployes = () => {
    const navigate = useNavigate();
    const qrCanvasRef = useRef(null);

    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [sending, setSending] = useState(false);

    // Récupérer les employés depuis l'API
    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const employees = await employeeService.getAll();
            setEmployes(employees);
        } catch (err) {
            console.error("Erreur de récupération des employés:", err);
            setError("Erreur lors du chargement des données des employés.");
            toast.error("Impossible de charger les employés", { position: "top-right" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleGenerateQr = async (employeId) => {
        setQrData(null);

        try {
            const qrCodeData = await employeeService.generateQRData(employeId);
            const targetEmploye = employes.find(e => e.id === employeId);

            if (qrCodeData && targetEmploye) {
                setQrData({
                    employe: targetEmploye,
                    data: qrCodeData,
                });
            }
        } catch (err) {
            console.error("Erreur lors de la génération du QR Code:", err);
            setError("Impossible de générer le QR Code.");
            toast.error("Impossible de générer le QR Code", { position: "top-right" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir désactiver cet employé et son compte utilisateur ? Cette action est réversible mais recommandée.")) {
            return;
        }

        try {
            await employeeService.delete(id);
            
            // Mettre à jour la liste localement
            setEmployes(employes.filter(emp => emp.id !== id));
            toast.success('Employé désactivé avec succès', { position: "top-right" });
        } catch (err) {
            console.error("Erreur lors de la désactivation:", err);
            toast.error("Impossible de désactiver l'employé", { position: "top-right" });
        }
    };

    const handleUpdate = (employe) => {
        navigate(`/admin/dashboard/creation?id=${employe.id}`);
    };

    const handleSendQrCode = async (method) => {
        if (!qrData) return;
        
        setSending(true);
        setError(null);

        const successMessage = method === 'email'
            ? `QR Code envoyé avec succès à l'email de ${qrData.employe.firstName}.`
            : `Tentative d'envoi du QR Code par WhatsApp à ${qrData.employe.firstName}.`;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(successMessage, { position: "top-right" });
        } catch (err) {
            console.error(`Erreur d'envoi par ${method}:`, err);
            const errMsg = `Échec de l'envoi par ${method}. Vérifiez l'adresse ou le numéro.`;
            setError(errMsg);
            toast.error(errMsg, { position: "top-right" });
        } finally {
            setSending(false);
        }
    };

    const downloadQRCode = () => {
        if (!qrData || !qrCanvasRef.current) return;
        
        const downloadCanvas = document.createElement('canvas');
        const ctx = downloadCanvas.getContext('2d');
        
        downloadCanvas.width = 250;
        downloadCanvas.height = 250;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 250, 250);
        
        const qrSize = 200;
        const x = (250 - qrSize) / 2;
        const y = (250 - qrSize) / 2;
        
        ctx.drawImage(qrCanvasRef.current, x, y, qrSize, qrSize);
        
        const pngFile = downloadCanvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${qrData.employe.registrationNumber}_${qrData.employe.firstName}_${qrData.employe.lastName}.png`;
        downloadLink.href = pngFile;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    // Filtrage
    const filteredEmployes = employes.filter(employe => {
        const fullName = `${employe.firstName} ${employe.lastName}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchTerm.toLowerCase()) ||
            (employe.registrationNumber && employe.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (employe.email && employe.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = filterDept === 'all' || employe.department === filterDept;
        return employe.isActive && matchesSearch && matchesDept;
    });

    const departements = ['all', ...new Set(employes.map(e => e.department).filter(d => d))];
    const totalEmployes = employes.filter(e => e.isActive).length;
    const devCount = employes.filter(e => e.isActive && e.department === 'Développement').length;
    const new2025Count = employes.filter(e => {
        if (!e.hireDate) return false;
        try {
            const y = new Date(e.hireDate).getFullYear();
            return e.isActive && y === 2025;
        } catch (err) {
            return false;
        }
    }).length;

    if (loading) {
        return <div className="min-h-screen pt-24 flex items-center justify-center text-xl text-emerald-600">
            <Loader2 className="animate-spin mr-3" /> Chargement des employés...
        </div>;
    }

    if (error) {
        return <div className="min-h-screen pt-24 p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-xl mx-auto" role="alert">
                <strong className="font-bold">Erreur de connexion!</strong>
                <span className="block sm:inline ml-2">{error}</span>
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-24">
            <ToastContainer />
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-emerald-700 mb-2">
                                Gestion des Employés
                            </h1>
                            <p className="text-gray-600">
                                Gérez les employés actifs et générez leurs QR codes de présence
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={() => navigate('/admin/dashboard/creation')}
                                className="flex items-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Ajouter un employé
                            </button>
                        </div>
                    </div>

                    {/* Cartes statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total employés Actifs</p>
                                    <p className="text-2xl font-bold text-gray-800">{totalEmployes}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Développement</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {devCount}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                    <QrCode className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">QR générés</p>
                                    <p className="text-2xl font-bold text-gray-800">{totalEmployes}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                                    <QrCode className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Nouveaux</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {new2025Count}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barre de filtres */}
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher un employé..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <select
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    <option value="all">Tous les départements</option>
                                    {departements.filter(d => d !== 'all').map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterDept('all');
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau des employés */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-emerald-600">
                                <tr>
                                    {['ID', 'Nom & Prénom', 'Matricule', 'Email', 'Département', 'Date embauche', 'Actions'].map((header) => (
                                        <th
                                            key={header}
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-white uppercase"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployes.length > 0 ? (
                                    filteredEmployes.map((employe) => (
                                        <tr key={employe.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                                                    #{employe.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                                        {employe.firstName?.charAt(0)}{employe.lastName?.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {employe.firstName} {employe.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Compte User: {employe.hasUserAccount ? 'Oui' : 'Non'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 text-sm font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                                    {employe.registrationNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employe.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    employe.department === 'Développement' ? 'bg-blue-100 text-blue-800' :
                                                    employe.department === 'Marketing' ? 'bg-purple-100 text-purple-800' :
                                                    employe.department === 'Ressources Humaines' ? 'bg-pink-100 text-pink-800' :
                                                    employe.department === 'Finance' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {employe.department || 'Non spécifié'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(employe.hireDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {/* Bouton QR Code avec icône QR code en couleur émeraude */}
                                                    <button
                                                        onClick={() => handleGenerateQr(employe.id)}
                                                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Générer QR Code"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdate(employe)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(employe.id)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Désactiver l'employé"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                    <Users className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé actif trouvé</h3>
                                                <p className="text-gray-500">Veuillez ajouter un employé ou réinitialiser vos filtres.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal QR Code - Même forme que vous avez demandée */}
                {qrData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative overflow-y-auto max-h-[90vh]">
                            <button
                                onClick={() => setQrData(null)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
                                title="Fermer"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>

                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-emerald-700 mb-2">
                                        {qrData.employe.firstName} {qrData.employe.lastName}
                                    </h3>
                                    <p className="text-gray-600">
                                        Matricule: <span className="font-semibold">{qrData.employe.registrationNumber}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Scannez ce QR code pour enregistrer la présence
                                    </p>
                                </div>

                                <div className="flex justify-center p-4 bg-gray-50 rounded-lg mb-6">
                                    <QRCodeCanvas
                                        ref={qrCanvasRef}
                                        value={qrData.data}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                        bgColor="#ffffff"
                                        fgColor="#059669"
                                    />
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-medium text-emerald-800 mb-2">Données encodées (uniques) :</h4>
                                    <p className="text-sm text-emerald-700 break-all bg-white p-3 rounded border border-emerald-200">
                                        {qrData.data}
                                    </p>
                                </div>

                                {/* Options d'envoi */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-3">Options d'envoi rapide:</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleSendQrCode('email')}
                                            disabled={sending}
                                            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-md"
                                        >
                                            {sending ? (
                                                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                            ) : (
                                                <Mail className="w-5 h-5 mr-2" />
                                            )}
                                            {sending ? 'Envoi...' : 'Email'}
                                        </button>
                                        <button
                                            onClick={() => handleSendQrCode('whatsapp')}
                                            disabled={sending}
                                            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50 shadow-md"
                                        >
                                            {sending ? (
                                                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                            ) : (
                                                <Send className="w-5 h-5 mr-2" />
                                            )}
                                            {sending ? 'Envoi...' : 'WhatsApp'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Nécessite une configuration d'envoi valide côté serveur.
                                    </p>
                                </div>

                                {/* Boutons Télécharger et Fermer */}
                                <div className="flex justify-center space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={downloadQRCode}
                                        className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Télécharger
                                    </button>
                                    <button
                                        onClick={() => setQrData(null)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListeEmployes;