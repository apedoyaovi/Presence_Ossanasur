import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    ArrowLeft,
    Pause,
    Play,
    HelpCircle,
    Camera,
    Download,
    AlertTriangle,
    User,
    FileText,
    ChevronDown,
    QrCode
} from 'lucide-react';
import { scanService } from '../services/api';

// Types d'actions
const ACTION_TYPES = {
    ARRIVAL: {
        id: 'ARRIVAL',
        label: 'Arrivée',
        color: 'emerald',
        icon: <ArrowRight className="w-6 h-6" />,
        description: 'Enregistrer votre heure d\'arrivée',
        gradient: 'from-emerald-500 to-emerald-600'
    },
    PAUSE_START: {
        id: 'PAUSE_START',
        label: 'Départ pause',
        color: 'amber',
        icon: <Pause className="w-6 h-6" />,
        description: 'Début de pause',
        gradient: 'from-amber-500 to-amber-600'
    },
    PAUSE_END: {
        id: 'PAUSE_END',
        label: 'Retour pause',
        color: 'blue',
        icon: <Play className="w-6 h-6" />,
        description: 'Fin de pause',
        gradient: 'from-blue-500 to-blue-600'
    },
    DEPARTURE: {
        id: 'DEPARTURE',
        label: 'Départ fin',
        color: 'rose',
        icon: <ArrowLeft className="w-6 h-6" />,
        description: 'Départ pour la journée',
        gradient: 'from-rose-500 to-rose-600'
    },
    OTHER: {
        id: 'OTHER',
        label: 'Autre sortie',
        color: 'purple',
        icon: <HelpCircle className="w-6 h-6" />,
        description: 'Sortie pour une raison spécifique',
        gradient: 'from-purple-500 to-purple-600'
    }
}

const Accueil = () => {
    // États de l'application
    const [selectedAction, setSelectedAction] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customReason, setCustomReason] = useState('');
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const [lastPresence, setLastPresence] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isScannerReady, setIsScannerReady] = useState(false);

    // Références
    const scannerRef = useRef(null);
    const qrScannerInstance = useRef(null);

    // Cleanup: Arrêter le scanner si le composant se démonte
    useEffect(() => {
        return () => {
            if (qrScannerInstance.current) {
                qrScannerInstance.current.clear().catch(error => {
                    console.error('Erreur lors de l\'arrêt du scanner:', error);
                });
            }
        };
    }, []);

    // Gérer la sélection d'une action
    const handleActionSelect = (action) => {
        // Arrêter le scanner s'il est actif
        if (qrScannerInstance.current) {
            qrScannerInstance.current.clear().catch(error => {
                console.error('Erreur lors de l\'arrêt du scanner:', error);
            });
            qrScannerInstance.current = null;
        }

        setSelectedAction(action);
        setScanResult(null);
        setCustomReason('');
        setCameraError(null);
        setIsScanning(false);
    };

    // Démarrer le scan avec html5-qrcode
    const handleStartScan = async () => {
        if (selectedAction.id === 'OTHER' && !customReason.trim()) {
            toast.error('Veuillez spécifier la raison de votre sortie');
            return;
        }

        setIsScanning(true);
        setCameraError(null);
        setIsScannerReady(false);

        // Initialiser le scanner html5-qrcode
        setTimeout(() => {
            try {
                const scanner = new Html5QrcodeScanner(
                    "qr-reader",
                    { 
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        facingMode: "environment"
                    },
                    /* verbose= */ false
                );

                const onScanSuccess = (decodedText) => {
                    // Vérifier que le QR code correspond au format attendu
                    if (decodedText.startsWith('EMP:')) {
                        // Laisser `handleScanSuccess` arrêter/clear le scanner pour éviter
                        // d'appels concurrents à `clear()` qui provoquent des transitions en conflit.
                        handleScanSuccess(decodedText);
                    } else {
                        toast.warning('Format de QR code invalide');
                    }
                };

                const onScanFailure = (error) => {
                    // Ignorer les erreurs de scan qui sont normales quand aucun QR n'est détecté
                    console.debug('Scanning attempt failed:', error);
                };

                scanner.render(onScanSuccess, onScanFailure);
                qrScannerInstance.current = scanner;
                setIsScannerReady(true);

            } catch (error) {
                console.error('Erreur lors de l\'initialisation du scanner:', error);
                setCameraError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
                setIsScanning(false);
            }
        }, 300);
    };

    // Gérer le scan réussi
    const handleScanSuccess = async (qrData) => {
        // Arrêter le scanner immédiatement après détection
        if (qrScannerInstance.current) {
            try {
                await qrScannerInstance.current.clear();
            } catch (error) {
                console.error('Erreur lors de l\'arrêt du scanner:', error);
            }
            qrScannerInstance.current = null;
        }

        setIsLoading(true);
        setIsScanning(false);
        setIsScannerReady(false);

        try {
            // Parser le QR code pour extraire les infos employé
            // Format attendu: "EMP:registrationNumber:lastName:firstName"
            const parts = qrData.split(':');
            if (parts[0] !== 'EMP' || parts.length < 2) {
                throw new Error('Format de QR code invalide');
            }

            const registrationNumber = parts[1];
            const lastName = parts[2] || 'Employé';
            const firstName = parts[3] || '';
            
            // Afficher les infos de l'employé scanné
            setEmployeeInfo({
                registrationNumber,
                lastName,
                firstName
            });

            const result = await scanService.scanQRCode(
                qrData,
                selectedAction.id,
                selectedAction.id === 'OTHER' ? customReason : ''
            );

            if (result.success) {
                setScanResult({
                    success: true,
                    message: `${selectedAction.label} enregistrée avec succès`,
                    details: `À ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                    timestamp: new Date().toLocaleTimeString('fr-FR'),
                    action: selectedAction.label,
                    presenceData: result.presence
                });

                toast.success('Pointage enregistré avec succès !');

                setTimeout(() => {
                    resetForm();
                }, 8000);

            } else {
                setScanResult({
                    success: false,
                    message: 'Échec de l\'enregistrement',
                    details: result.message || 'Erreur lors de l\'enregistrement du pointage',
                    timestamp: new Date().toLocaleTimeString('fr-FR')
                });

                toast.error(result.message || 'Erreur lors de l\'enregistrement du pointage');

                setTimeout(() => {
                    setScanResult(null);
                }, 5000);
            }

        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);

            setScanResult({
                success: false,
                message: 'Erreur système',
                details: 'Une erreur est survenue lors du traitement',
                timestamp: new Date().toLocaleTimeString('fr-FR')
            });

            toast.error('Erreur système. Veuillez réessayer.');

            setTimeout(() => {
                setScanResult(null);
            }, 5000);
        } finally {
            setIsLoading(false);
        }
    };

    // Simuler le scan d'un QR code
    // Annuler le scan
    const handleCancelScan = () => {
        if (qrScannerInstance.current) {
            qrScannerInstance.current.clear().then(() => {
                qrScannerInstance.current = null;
            }).catch(error => {
                console.error('Erreur lors de l\'arrêt du scanner:', error);
                qrScannerInstance.current = null;
            });
        }
        setIsScanning(false);
        setIsScannerReady(false);
        resetForm();
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setSelectedAction(null);
        setIsScanning(false);
        setIsScannerReady(false);
        setScanResult(null);
        setCustomReason('');
        setCameraError(null);
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

    return (
        <div className="min-h-screen pt-20 pb-10 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            <ToastContainer position="top-right" autoClose={5000} />

            <div className="max-w-7xl mx-auto px-4">
                {/* En-tête avec design unifié */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-3">
                        Système de Pointage
                    </h1>
                    <p className="text-gray-600 max-w-sm mx-auto">
                        Scannez votre QR code pour enregistrer votre présence
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Section principale */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Carte principale */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>

                            <div className="p-8">
                                {/* En-tête avec informations employé */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    {employeeInfo && (
                                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full md:w-auto">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        {employeeInfo.firstName?.charAt(0)}{employeeInfo.lastName?.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {employeeInfo.firstName} {employeeInfo.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {employeeInfo.registrationNumber ?
                                                            `Matricule: ${employeeInfo.registrationNumber}` :
                                                            employeeInfo.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dernier pointage */}
                                    {lastPresence && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">
                                                        Dernier pointage: {lastPresence.action}
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        Le {formatDate(lastPresence.datePresence)} à {formatTime(lastPresence.heurePresence)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sélection d'action */}
                                {!selectedAction && !isScanning && !scanResult && (
                                    <>
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                Sélectionnez une action
                                            </h2>
                                            <p className="text-gray-600">
                                                Choisissez le type de pointage à effectuer
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {Object.values(ACTION_TYPES).map((action) => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleActionSelect(action)}
                                                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                                                >
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className={`mb-4 p-4 rounded-full ${action.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                            action.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                                                action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                                    action.color === 'rose' ? 'bg-rose-100 text-rose-600' :
                                                                        'bg-purple-100 text-purple-600'}`}>
                                                            {action.icon}
                                                        </div>
                                                        <h3 className={`text-lg font-bold mb-2 ${action.color === 'emerald' ? 'text-emerald-800' :
                                                            action.color === 'amber' ? 'text-amber-800' :
                                                                action.color === 'blue' ? 'text-blue-800' :
                                                                    action.color === 'rose' ? 'text-rose-800' :
                                                                        'text-purple-800'}`}>
                                                            {action.label}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {action.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Zone de scan */}
                                {(selectedAction || isScanning || scanResult) && (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className={`inline-flex items-center justify-center p-5 rounded-full mb-4 ${selectedAction?.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                selectedAction?.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                                    selectedAction?.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                        selectedAction?.color === 'rose' ? 'bg-rose-100 text-rose-600' :
                                                            'bg-purple-100 text-purple-600'}`}>
                                                {selectedAction?.icon}
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                {selectedAction?.label}
                                            </h2>
                                            <p className="text-gray-600">
                                                {selectedAction?.id === 'OTHER'
                                                    ? 'Spécifiez la raison puis scannez votre QR code'
                                                    : 'Scannez votre QR code pour enregistrer'
                                                }
                                            </p>
                                        </div>

                                        {/* Champ de raison personnalisée */}
                                        {selectedAction?.id === 'OTHER' && !isScanning && !scanResult && (
                                            <div className="max-w-md mx-auto mb-8">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Raison de la sortie *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    placeholder="Ex: Rendez-vous médical, réunion externe..."
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                    maxLength={100}
                                                    required
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Cette information sera enregistrée avec votre pointage
                                                </p>
                                            </div>
                                        )}

                                        {/* Zone de scanner */}
                                        {isScanning && !scanResult && (
                                            <div className="space-y-6">
                                                {cameraError ? (
                                                    <div className="text-center py-8">
                                                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                            Problème de caméra
                                                        </h3>
                                                        <p className="text-gray-600 mb-4">{cameraError}</p>
                                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                            <button
                                                                onClick={handleStartScan}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                                            >
                                                                Réessayer
                                                            </button>
                                                            <button
                                                                onClick={handleCancelScan}
                                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative mx-auto w-full max-w-md">
                                                        {/* Conteneur du scanner */}
                                                        <div 
                                                            id="qr-reader" 
                                                            className="rounded-xl overflow-hidden border-4 border-emerald-500 border-dashed bg-gray-50"
                                                        ></div>

                                                        {/* Instructions */}
                                                        <div className="mt-4 text-center">
                                                            {!isScannerReady && !cameraError && (
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                                                                    <span className="text-emerald-600">
                                                                        Initialisation de la caméra...
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isScannerReady && (
                                                                <div className="text-emerald-600 font-medium">
                                                                    Caméra prête • Présentez le QR code
                                                                </div>
                                                            )}
                                                            {isLoading && (
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce"></div>
                                                                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                                                                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                                                                    <span className="ml-2 text-emerald-600">
                                                                        Traitement en cours...
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Bouton de démarrage */}
                                        {!isScanning && !scanResult && (
                                            <div className="text-center">
                                                <button
                                                    onClick={handleStartScan}
                                                    disabled={selectedAction?.id === 'OTHER' && !customReason.trim()}
                                                    className={`px-8 py-4 rounded-xl font-medium text-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 
                                                        focus:ring-offset-2 focus:ring-emerald-500 bg-gradient-to-r ${selectedAction?.gradient} text-white hover:opacity-90 cursor-pointer`}
                                                >
                                                    <Camera className="w-5 h-5 inline-block mr-2" />
                                                    {selectedAction?.id === 'OTHER' && !customReason.trim()
                                                        ? 'Saisissez la raison d\'abord'
                                                        : 'Démarrer le scan'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Résultat du scan */}
                                        {scanResult && (
                                            <div className={`mt-8 p-6 rounded-xl border-l-4 ${
                                                scanResult.success
                                                    ? 'bg-emerald-50 border-emerald-500'
                                                    : 'bg-red-50 border-red-500'
                                            }`}>
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        {scanResult.success ? (
                                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                                        ) : (
                                                            <XCircle className="w-8 h-8 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <h3 className={`text-lg font-medium ${
                                                            scanResult.success ? 'text-emerald-800' : 'text-red-800'
                                                        }`}>
                                                            {scanResult.message}
                                                        </h3>
                                                        {scanResult.details && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {scanResult.details}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-4">
                                                            <span className="text-sm text-gray-500">
                                                                {scanResult.timestamp}
                                                            </span>
                                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                                                scanResult.success
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {selectedAction?.label}
                                                            </span>
                                                        </div>
                                                        {scanResult.presenceData && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <p className="text-xs text-gray-500">
                                                                    ID: {scanResult.presenceData.id}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Boutons d'action */}
                                        {!scanResult && (
                                            <div className="mt-8 flex justify-center space-x-4">
                                                <button
                                                    onClick={handleCancelScan}
                                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    Annuler
                                                </button>

                                                {isScanning && isScannerReady && !isLoading && (
                                                    <button
                                                        onClick={handleCancelScan}
                                                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                                                    >
                                                        Arrêter le scan
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Bouton pour retourner */}
                                        {scanResult && (
                                            <div className="mt-8 text-center">
                                                <button
                                                    onClick={resetForm}
                                                    className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                                                >
                                                    Nouveau scan
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panneau latéral */}
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>
                            <div className="p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-gray-500" />
                                    Instructions
                                </h3>
                                <ol className="space-y-4">
                                    {[
                                        'Sélectionnez une action',
                                        selectedAction?.id === 'OTHER' ? 'Spécifiez la raison de la sortie' : 'Récupérez votre QR code personnel',
                                        'Démarrer le scan et positionnez le QR code',
                                        'Attendez la confirmation'
                                    ].map((step, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mr-3 mt-0.5">
                                                {index + 1}
                                            </span>
                                            <span className="text-gray-700">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-2"></div>
                            <div className="p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">
                                    Actions rapides
                                </h3>
                                <div className="space-y-3">
                                    {Object.values(ACTION_TYPES)
                                        .filter(action => action.id !== 'OTHER')
                                        .map((action) => (
                                            <button
                                                key={action.id}
                                                onClick={() => {
                                                    handleActionSelect(action);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors hover:bg-gray-50 cursor-pointer"
                                            >
                                                <div className={`p-2 rounded-full mr-3 ${action.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                    action.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                                        action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-rose-100 text-rose-600'}`}>
                                                    {action.icon}
                                                </div>
                                                <span className={`font-medium ${action.color === 'emerald' ? 'text-emerald-800' :
                                                    action.color === 'amber' ? 'text-amber-800' :
                                                        action.color === 'blue' ? 'text-blue-800' :
                                                            'text-rose-800'}`}>
                                                    {action.label}
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Note */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200">
                        <Shield className="h-4 w-4 text-emerald-600 mr-2" />
                        <span>Système de pointage sécurisé • Enregistrement en temps réel</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accueil;