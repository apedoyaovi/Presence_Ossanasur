// Utilitaires pour la génération de QR codes

// Fonction pour générer les données d'un QR code unique par employé
export const generateQRData = (employeeId, registrationNumber) => {
  return JSON.stringify({
    employeeId: employeeId,
    registrationNumber: registrationNumber,
    timestamp: new Date().toISOString(),
    type: 'employee_qr',
    version: '1.0'
  });
};

// Fonction pour valider les données d'un QR code
export const validateQRData = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    
    // Vérifier que les champs requis sont présents
    if (!parsed.employeeId || !parsed.registrationNumber || !parsed.timestamp || !parsed.type) {
      return { valid: false, error: 'Données QR invalides: champs manquants' };
    }
    
    // Vérifier que le type est correct
    if (parsed.type !== 'employee_qr') {
      return { valid: false, error: 'Type de QR code invalide' };
    }
    
    // Vérifier que le timestamp est valide
    const timestamp = new Date(parsed.timestamp);
    if (isNaN(timestamp.getTime())) {
      return { valid: false, error: 'Date invalide dans les données QR' };
    }
    
    // Vérifier que le QR code n'est pas trop ancien (optionnel)
    const now = new Date();
    const diffMinutes = (now - timestamp) / (1000 * 60);
    if (diffMinutes > 5) { // 5 minutes max
      return { valid: false, error: 'QR code expiré' };
    }
    
    return { valid: true, data: parsed };
  } catch (error) {
    return { valid: false, error: 'Erreur de parsing des données QR' };
  }
};

// Fonction pour générer un QR code avec des données aléatoires (pour tests)
export const generateTestQRData = (employeeId, registrationNumber) => {
  return generateQRData(employeeId, registrationNumber);
};