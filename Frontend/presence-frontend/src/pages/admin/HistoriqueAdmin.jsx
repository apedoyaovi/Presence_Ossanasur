import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Search, Download, Eye, ChevronDown, User, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { presenceService } from '../../services/api';
import * as XLSX from 'xlsx';
import { Document, Packer, Table, TableCell, TableRow, Paragraph, TextRun, BorderStyle } from 'docx';

const HistoriqueAdmin = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // État de chargement pour les actions (suppression/export)
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    // État pour la pagination par jour
    const [daysToShow, setDaysToShow] = useState(1);

    // ----------------------------------------------------------------------
    // 1. CHARGEMENT INITIAL DES DONNÉES (API simulée)
    // ----------------------------------------------------------------------

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Simuler un délai de chargement
            await new Promise(resolve => setTimeout(resolve, 500));

            // Récupérer l'historique complet
            const historyData = await presenceService.getAll();
            setHistory(historyData || []);

        } catch (err) {
            console.error("Erreur de chargement de l'historique:", err);
            setError("Échec du chargement de l'historique.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ----------------------------------------------------------------------
    // 2. LOGIQUE DE FILTRAGE, TRI et STATISTIQUES
    // ----------------------------------------------------------------------

    // Construire la liste des dates uniques qui ont au moins un enregistrement
    const uniqueDates = Array.from(new Set(history.map(r => r.datePresence))).sort((a, b) => new Date(b) - new Date(a));
    // Nombre de jours (avec enregistrements) disponibles
    const totalDaysAvailable = uniqueDates.length;
    // Dates actuellement affichées selon `daysToShow` (les plus récentes)
    const displayedDates = uniqueDates.slice(0, daysToShow);
    const canLoadMore = daysToShow < totalDaysAvailable;

    // Filtrage des données (n'affiche que les enregistrements appartenant aux dates affichées)
    const filteredHistory = history.filter(record => {
        const recordDate = record.datePresence;
        // If a specific date is selected, show records for that date regardless of displayedDates.
        const isInDisplayedDates = selectedDate ? recordDate === selectedDate : (displayedDates.length > 0 && displayedDates.includes(recordDate));

        const matchesSearch =
            record.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.matricule.toLowerCase().includes(searchTerm.toLowerCase());

        // matchesDate kept for backward compatibility in case other UI depends on it
        const matchesDate = !selectedDate || record.datePresence === selectedDate;

        let matchesAction = true;
        if (filterAction === 'Arrivée') {
            matchesAction = record.action === 'ARRIVAL' || record.action.includes('Arrivée');
        } else if (filterAction === 'pause') {
            matchesAction = record.action === 'PAUSE_START' || record.action === 'PAUSE_END' || record.action.includes('pause');
        } else if (filterAction === 'Retour') {
            matchesAction = record.action === 'PAUSE_END' || record.action.includes('Retour');
        } else if (filterAction === 'Départ') {
            matchesAction = (record.action === 'DEPARTURE' || record.action.includes('Départ')) && !record.action.includes('pause');
        } else if (filterAction === 'Autre') {
            matchesAction = record.action === 'OTHER' || record.action.includes('Autre');
        }

        return isInDisplayedDates && matchesSearch && matchesDate && matchesAction;
    });

    // Trier les données (Utilise les données filtrées)
    const sortedHistory = [...filteredHistory].sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = new Date(a.datePresence);
            const dateB = new Date(b.datePresence);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === 'heure') {
            return sortOrder === 'asc'
                ? a.heurePresence.localeCompare(b.heurePresence)
                : b.heurePresence.localeCompare(a.heurePresence);
        }
        if (sortBy === 'nom') {
            return sortOrder === 'asc'
                ? a.nom.localeCompare(b.nom)
                : b.nom.localeCompare(a.nom);
        }
        return 0;
    });

    // Statistiques (Basé sur l'historique non filtré)
    const stats = {
        total: history.length,
        today: history.filter(r => r.datePresence === new Date().toISOString().split('T')[0]).length,
        success: history.filter(r => r.status === 'success').length,
        failed: history.filter(r => r.status === 'failed').length,
    };

    // `totalDaysAvailable` et `canLoadMore` sont déterminés plus haut à partir des dates uniques (uniqueDates).

    // ----------------------------------------------------------------------
    // 3. ACTIONS CRUD (simulées)
    // ----------------------------------------------------------------------

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ? Cette action est irréversible.")) {
            return;
        }

        setIsActionLoading(true);
        try {
            // Simuler un délai pour la suppression
            await new Promise(resolve => setTimeout(resolve, 500));

            // Supprimer l'enregistrement
            await presenceService.delete(id);

            // Mettre à jour l'état local après succès
            setHistory(prev => prev.filter(rec => rec.id !== id));
            toast.success(`Enregistrement ID ${id} supprimé avec succès.`, { position: "top-right" });

        } catch (err) {
            console.error(`Erreur de suppression de l'enregistrement ${id}:`, err);
            toast.error("Échec de la suppression. Erreur.", { position: "top-right" });
        } finally {
            setIsActionLoading(false);
        }
    };

    // Les fonctions handleSelectAll, handleSelectRow, handleExport, getActionColor...
    const exportToExcel = (useFiltered = false) => {
        const dataToExport = (useFiltered ? sortedHistory : history).map(record => ({
            'ID': record.id,
            'Nom': record.nom,
            'Matricule': record.matricule,
            'Date': formatDate(record.datePresence),
            'Heure': formatTime(record.heurePresence),
            'Action': translateAction(record.action),
            'Statut': record.status === 'success' ? 'Réussi' : 'Échec',
            'Raison/Notes': record.notes || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Présences');

        // Définir les largeurs de colonnes
        worksheet['!cols'] = [
            { wch: 8 },   // ID
            { wch: 20 },  // Nom
            { wch: 15 },  // Matricule
            { wch: 15 },  // Date
            { wch: 10 },  // Heure
            { wch: 15 },  // Action
            { wch: 12 },  // Statut
            { wch: 25 }   // Notes
        ];

        XLSX.writeFile(workbook, `Historique_Presences_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Historique exporté en Excel avec succès!', { position: "top-right" });
    };

    const exportToWord = async (useFiltered = false) => {
        const dataToExport = useFiltered ? sortedHistory : history;

        // Créer les lignes du tableau
        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph('ID')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Nom')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Matricule')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Date')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Heure')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Action')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                    new TableCell({
                        children: [new Paragraph('Statut')],
                        shading: { fill: '0BA346', color: 'auto' },
                    }),
                ]
            })
        ];

        // Ajouter les données
        dataToExport.forEach(record => {
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph(String(record.id))],
                        }),
                        new TableCell({
                            children: [new Paragraph(record.nom)],
                        }),
                        new TableCell({
                            children: [new Paragraph(record.matricule)],
                        }),
                        new TableCell({
                            children: [new Paragraph(formatDate(record.datePresence))],
                        }),
                        new TableCell({
                            children: [new Paragraph(formatTime(record.heurePresence))],
                        }),
                        new TableCell({
                            children: [new Paragraph(translateAction(record.action))],
                        }),
                        new TableCell({
                            children: [new Paragraph(record.status === 'success' ? 'Réussi' : 'Échec')],
                        }),
                    ]
                })
            );
        });

        // Créer le document
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'Historique des Présences',
                        bold: true,
                        size: 28,
                    }),
                    new Paragraph(''),
                    new Paragraph(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`),
                    new Paragraph(''),
                    new Table({
                        width: { size: 100, type: 'pct' },
                        rows: tableRows,
                    })
                ]
            }]
        });

        // Télécharger le document
        const blob = await Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Historique_Presences_${new Date().toISOString().split('T')[0]}.docx`;
        link.click();

        toast.success('Historique exporté en Word avec succès!', { position: "top-right" });
    };

    const handleExport = () => {
        // Afficher un dialogue avec options d'export
        const exportAll = window.confirm('Exporter tous les enregistrements (OK) ou seulement les triés/filtrés (Annuler)?');
        const useFiltered = !exportAll;
        
        const choice = window.confirm('Exporter en Excel (OK) ou Word (Annuler)?');
        
        if (choice) {
            exportToExcel(useFiltered);
        } else {
            exportToWord(useFiltered);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('ARRIVAL') || action.includes('Arrivée')) return 'bg-green-100 text-green-800 border-green-200';
        if (action.includes('DEPARTURE') || (action.includes('Départ') && !action.includes('pause'))) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('PAUSE') || action.includes('pause')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (action.includes('Retour')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (action.includes('OTHER') || action.includes('Autre')) return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Traduire les codes d'action en français
    const translateAction = (action) => {
        const translations = {
            'ARRIVAL': 'Arrivée',
            'PAUSE_START': 'Départ pause',
            'PAUSE_END': 'Retour pause',
            'DEPARTURE': 'Départ fin',
            'OTHER': 'Autre sortie'
        };
        return translations[action] || action;
    };

    const handleEdit = (record) => {
        // Édition désactivée
        alert('Modification désactivée pour les enregistrements de présence.');
    };

    const handleView = (record) => {
        const actionDisplay = translateAction(record.action);
        let details = `Détails de l'enregistrement ID ${record.id}\n\nNom: ${record.nom}\nMatricule: ${record.matricule}\nDate: ${record.datePresence}\nHeure: ${record.heurePresence}\nAction: ${actionDisplay}\nStatut: ${record.status}`;
        
        // Ajouter les notes si c'est une action "Autre" ou si des notes existent
        if (record.notes && record.notes.trim() !== '') {
            details += `\n\nRaison/Notes: ${record.notes}`;
        }
        
        alert(details);
    };

    const handleRefreshNoRecords = async () => {
        // Réinitialiser le filtre de date et la pagination, puis recharger l'historique
        setSelectedDate('');
        setDaysToShow(1);
        try {
            await fetchHistory();
            toast.info('Données actualisées.', { position: 'top-right' });
        } catch (err) {
            console.error('Erreur lors de l actualisation :', err);
            toast.error("Échec de l'actualisation.", { position: 'top-right' });
        }
    };

    // Remplacement des icônes SVG inline par les icônes Lucide
    const icons = {
        search: <Search className="w-5 h-5" />,
        download: <Download className="w-5 h-5" />,
        calendar: <Calendar className="w-4 h-4" />,
        user: <User className="w-6 h-6" />,
        clock: <Clock className="w-4 h-4" />,
        check: <CheckCircle className="w-3 h-3" />,
        x: <XCircle className="w-3 h-3" />,
        eye: <Eye className="w-4 h-4" />,
        chevronDown: <ChevronDown className="w-5 h-5" />
    };

    // Helpers format date/time
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString('fr-FR');
        } catch (e) {
            return dateString;
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // If time is stored as HH:mm:ss or ISO time
        if (timeString.includes('T')) {
            try {
                const t = new Date(timeString);
                return t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return timeString;
            }
        }
        return timeString.substring(0,5);
    };

    return (
        <div translate='no' className="min-h-screen bg-gray-50 p-4 md:p-8 pt-24">
            <ToastContainer />
            <div className="max-w-7xl mx-auto">

                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-emerald-700 mb-2">
                                Historique des Présences
                            </h1>
                            <p className="text-gray-600">
                                Gérez et consultez tous les enregistrements de présence
                            </p>
                        </div>
                    </div>

                    {/* Cartes statistiques - style unifié */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total enregistrements', value: stats.total, icon: User, gradient: 'from-emerald-500 to-emerald-600' },
                            { label: "Scans aujourd'hui", value: stats.today, icon: Calendar, gradient: 'from-blue-500 to-blue-600' },
                            { label: 'Scans réussis', value: stats.success, icon: CheckCircle, gradient: 'from-green-500 to-green-600' },
                            { label: 'Échecs de scan', value: stats.failed, icon: XCircle, gradient: 'from-red-500 to-red-600' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className={`bg-gradient-to-r ${stat.gradient} h-2`}></div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.icon === User ? 'bg-emerald-100 text-emerald-600' : stat.icon === Calendar ? 'bg-blue-100 text-blue-600' : stat.icon === CheckCircle ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Barre de filtres */}
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Filtre par date */}
                            <div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                />
                            </div>

                            {/* Filtre par action */}
                            <div>
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-gray-200"
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
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-gray-200 cursor-pointer"
                                >
                                    <option value="date">Trier par date</option>
                                    <option value="heure">Trier par heure</option>
                                    <option value="nom">Trier par nom</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    <svg className={`w-5 h-5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                    {loading ? (
                        <div className="p-12 text-center text-emerald-600">
                            <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
                            Chargement de l'historique...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center bg-red-50 text-red-700">
                            <XCircle className="w-6 h-6 mx-auto mb-3" />
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-emerald-600">
                                <tr>
                                    {['ID', 'Nom', 'Matricule', 'Date', 'Heure', 'Action', 'Statut', 'Actions'].map((header) => (
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
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map((record) => (
                                        <tr
                                            key={record.id}
                                            className={`hover:bg-gray-50`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                                        #{record.id}
                                        </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                                        {record.nom.charAt(0)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">{record.nom}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                        {record.matricule}
                                        </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {formatDate(record.datePresence)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                    {formatTime(record.heurePresence)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                        <div>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border block ${getActionColor(record.action)}`}>
                                                {translateAction(record.action)}
                                            </span>
                                            {record.action === 'OTHER' && record.notes && (
                                                <p className="text-xs text-gray-600 mt-2">
                                                    <span className="font-semibold">Raison:</span> {record.notes}
                                                </p>
                                            )}
                                        </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {record.status === 'success' ? (
                                                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Réussi
                                        </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Échec
                                        </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleView(record)}
                                                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Voir détails"
                                                        disabled={isActionLoading}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="w-10 h-10 text-gray-300 mb-4" />
                                                {selectedDate ? (
                                                    <>
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement trouvé pour {formatDate(selectedDate)}</h3>
                                                        <p className="text-gray-500">Cliquez sur Actualiser pour recharger les données ou réinitialiser le filtre.</p>
                                                        <button
                                                            onClick={handleRefreshNoRecords}
                                                            className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                                        >
                                                            Actualiser
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement trouvé</h3>
                                                        <p className="text-gray-500">Essayez de modifier vos critères de recherche ou ajoutez des données.</p>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Bouton "Voir plus" pour charger les jours précédents */}
                    {!loading && (history.length > 0 || canLoadMore) && (
                        <div className="bg-white px-6 py-4 border-t border-gray-200 text-center">
                            <button
                                onClick={() => {
                                    if (canLoadMore) {
                                        setDaysToShow(daysToShow + 1);
                                    } else {
                                        toast.info("Tous les historiques sont déjà affichés.", { position: "top-right" });
                                    }
                                }}
                                disabled={!canLoadMore}
                                className={`inline-flex items-center px-6 py-2 font-medium rounded-lg transition-colors shadow-md hover:shadow-lg ${
                                    canLoadMore
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Voir plus
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </button>

                            {!canLoadMore && (
                                <button
                                    onClick={handleRefreshNoRecords}
                                    className="inline-flex items-center px-6 py-2 ml-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
                                >
                                    Réinitialiser
                                </button>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                                Affichage des {daysToShow} sur {totalDaysAvailable} jour(s)
                            </p>
                        </div>
                    )}

                    {/* Pied de tableau */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                                <p className="text-sm text-gray-700">
                                    Affichage de <span className="font-medium">{sortedHistory.length}</span> sur{' '}
                                    <span className="font-medium">{history.length}</span> enregistrements
                                </p>
                                
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleExport}
                                    disabled={isActionLoading}
                                   className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600
                                     hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    <span>Exporter</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        <strong>Note :</strong> L'historique affiché est chargé depuis la base de données locale.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HistoriqueAdmin;