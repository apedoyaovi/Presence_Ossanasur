import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, Clock, CheckCircle, XCircle, Shield, User, FileText, ChevronDown } from 'lucide-react';
import { presenceService } from '../services/api';

const Historique = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [allHistory, setAllHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Récupérer les données d'historique
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const historyData = await presenceService.getAll();
                setAllHistory(historyData);
            } catch (error) {
                console.error('Erreur de chargement de l\'historique:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Fonction pour filtrer et trier les données
    const filteredHistory = allHistory
        .filter(record => {
            const matchesSearch = searchTerm === '' ||
                record.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = !filterDate || record.date === filterDate;

            let matchesAction = true;
            if (filterAction === 'Arrivée') {
                matchesAction = record.action === 'Arrivée';
            } else if (filterAction === 'pause') {
                matchesAction = record.action === 'Pause';
            } else if (filterAction === 'Retour') {
                matchesAction = record.action === 'Retour';
            } else if (filterAction === 'Départ') {
                matchesAction = record.action === 'Départ';
            } else if (filterAction === 'Autre') {
                matchesAction = record.action === 'Autre';
            }

            return matchesSearch && matchesDate && matchesAction;
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                const dateCompare = sortOrder === 'asc'
                    ? new Date(a.datePresence || a.date) - new Date(b.datePresence || b.date)
                    : new Date(b.datePresence || b.date) - new Date(a.datePresence || a.date);
                if (dateCompare !== 0) return dateCompare;
                return sortOrder === 'asc'
                    ? (a.heurePresence || a.heure).localeCompare(b.heurePresence || b.heure)
                    : (b.heurePresence || b.heure).localeCompare(a.heurePresence || a.heure);
            }
            if (sortBy === 'heure') {
                return sortOrder === 'asc'
                    ? (a.heurePresence || a.heure).localeCompare(b.heurePresence || b.heure)
                    : (b.heurePresence || b.heure).localeCompare(a.heurePresence || a.heure);
            }
            if (sortBy === 'nom') {
                return sortOrder === 'asc'
                    ? (a.nom || '').localeCompare(b.nom || '')
                    : (b.nom || '').localeCompare(a.nom || '');
            }
            return 0;
        });

    const getActionColor = (action) => {
        if (action === 'Arrivée') return 'bg-green-100 text-green-800 border-green-200';
        if (action === 'Départ') return 'bg-red-100 text-red-800 border-red-200';
        if (action === 'Pause') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (action === 'Retour') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (action === 'Autre') return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Statistiques
    const today = new Date().toISOString().split('T')[0];
    const stats = {
        total: allHistory.length,
        today: allHistory.filter(r => (r.datePresence || r.date) === today).length,
        success: allHistory.filter(r => r.status === 'success').length,
        failed: allHistory.filter(r => r.status === 'failed' || r.status === 'failed').length,
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    const handleExport = () => {
        const dataToExport = filteredHistory;
        const csvContent = convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `historique_scans_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const convertToCSV = (data) => {
        const headers = ['Nom', 'Prénom', 'Matricule', 'Date', 'Heure', 'Action', 'Statut'];
        const rows = data.map(record => [
            record.nom || '',
            record.prenom || '',
            record.matricule || '',
            record.datePresence || record.date || '',
            record.heurePresence || record.heure || '',
            record.action || '',
            record.status || ''
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    };

    return (
        <div className="min-h-screen pt-20 pb-10 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4">

                {/* En-tête avec design AdminLogin */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-3">
                        Historique des Scans pour Admin
                    </h1>
                    <p className="text-gray-600 max-w-sm mx-auto">
                        Consultez l'historique complet des enregistrements de présence de vos employés.
                        <h3>seul l'Admin peux Voir l'historique</h3>
                    </p>
                </div>

                {/* Cartes statistiques - Design amélioré */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: 'Total scans',
                            value: stats.total,
                            icon: FileText,
                            gradient: 'from-emerald-500 to-emerald-600'
                        },
                        {
                            label: 'Scans aujourd\'hui',
                            value: stats.today,
                            icon: Calendar,
                            gradient: 'from-blue-500 to-blue-600'
                        },
                        {
                            label: 'Scans réussis',
                            value: stats.success,
                            icon: CheckCircle,
                            gradient: 'from-green-500 to-green-600'
                        },
                        {
                            label: 'Échecs de scan',
                            value: stats.failed,
                            icon: XCircle,
                            gradient: 'from-red-500 to-red-600'
                        }
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className={`bg-gradient-to-r ${stat.gradient} h-2`}></div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.icon === FileText ? 'bg-emerald-100 text-emerald-600' :
                                        stat.icon === Calendar ? 'bg-blue-100 text-blue-600' :
                                            stat.icon === CheckCircle ? 'bg-green-100 text-green-600' :
                                                'bg-red-100 text-red-600'}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Carte principale avec filtre */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-8">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>

                    <div className="p-8">
                        {/* Barre de filtres */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Recherche */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher un employé..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            {/* Filtre par date */}
                            <div>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                                />
                            </div>

                            {/* Filtre par action */}
                            <div>
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                                >
                                    <option value="all">Toutes les actions</option>
                                    <option value="Arrivée">Arrivée</option>
                                    <option value="pause">Pause</option>
                                    <option value="Retour">Retour de pause</option>
                                    <option value="Départ">Départ fin</option>
                                    <option value="Autre">Autre sortie</option>
                                </select>
                            </div>

                            {/* Tri */}
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                                >
                                    <option value="date">Trier par date</option>
                                    <option value="heure">Trier par heure</option>
                                    <option value="nom">Trier par nom</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <ChevronDown className={`w-5 h-5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Tableau */}
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement de l'historique...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                                        {['Nom & Prénom', 'Matricule', 'Date', 'Heure', 'Action', 'Statut'].map((header) => (
                                            <th
                                                key={header}
                                                scope="col"
                                                className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map((record) => (
                                            <tr key={record.id} className="hover:bg-emerald-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {record.prenom?.charAt(0) || record.nom?.charAt(0) || '?'}{record.nom?.charAt(0) || ''}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {record.nom} {record.prenom}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: {record.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {record.matricule}
                            </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {formatDate(record.datePresence || record.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                        {formatTime(record.heurePresence || record.heure)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getActionColor(record.action)}`}>
                              {record.action}
                            </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {record.status === 'success' ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Réussi
                              </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Échec
                              </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement trouvé</h3>
                                                    <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pied de tableau */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                                <p className="text-sm text-gray-700">
                                    Affichage de <span className="font-medium">{filteredHistory.length}</span> sur <span className="font-medium">{filteredHistory.length}</span> enregistrements
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="text-sm text-emerald-700 font-medium flex items-center">
                                    <span className="mr-2">💡</span>
                                    <span>Utilisez les filtres pour affiner votre recherche</span>
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600
                                     hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    <span>Exporter en CSV</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Légende */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Légende des actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { color: 'bg-green-500', label: 'Arrivée' },
                                { color: 'bg-yellow-500', label: 'Pause' },
                                { color: 'bg-blue-500', label: 'Retour de pause' },
                                { color: 'bg-red-500', label: 'Départ fin' },
                                { color: 'bg-purple-500', label: 'Autre sortie' }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full ${item.color} mr-3`}></span>
                                    <span className="text-sm text-gray-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200">
                        <FileText className="h-4 w-4 text-emerald-600 mr-2" />
                        <span>Données mises à jour en temps réel • Historique consultable par tous</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Historique;