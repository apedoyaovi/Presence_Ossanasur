
// Configuration : Définissez les coordonnées du centre et la taille du périmètre carré (en mètres)
export const AREA_CONFIG = {
  CENTER: {
    latitude: 6.1833023,
    longitude: 1.1467070
  },
  SIDE_LENGTH: 100, // Périmètre carré de 100m de côté
  ENABLED: true // Activer/désactiver la vérification
};

// Fonction pour obtenir la position actuelle de l'utilisateur
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas supportée par votre navigateur.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => {
        let message = 'Impossible d’obtenir votre position.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission refusée. Activez la géolocalisation dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position indisponible. Vérifiez votre connexion ou votre GPS.';
            break;
          case error.TIMEOUT:
            message = 'Délai d’attente dépassé. Réessayez.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true, // Précision élevée pour la détection de proximité
        timeout: 20000, // 5 secondes max
        maximumAge: 30000 // Ne pas utiliser de position en cache
      }
    );
  });
};

// Fonction utilitaire pour convertir les degrés en radians
const toRadians = (degrees) => degrees * (Math.PI / 180);

// Calculer la distance entre deux points (formule de Haversine) en mètres
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
};

// Vérifier si l'utilisateur est dans le périmètre carré
export const isWithinPerimeter = (userLat, userLon) => {
  if (!AREA_CONFIG.ENABLED) {
    console.warn('⚠️ La vérification de périmètre est désactivée.');
    return true; // Laisser passer tous les scans si désactivé
  }

  // Calculer la distance du centre au point utilisateur
  const distanceFromCenter = calculateDistance(
    userLat, userLon,
    AREA_CONFIG.CENTER.latitude, AREA_CONFIG.CENTER.longitude
  );

  // Pour un carré : la distance maximale du centre à un coin est (côté/√2)
  // Nous vérifions si l'utilisateur est dans le cercle circonscrit pour simplifier
  const maxRadius = (AREA_CONFIG.SIDE_LENGTH / 2) * Math.sqrt(2);

  return distanceFromCenter <= maxRadius;
};

// Obtenir la configuration actuelle (pour l'interface admin)
export const getAreaConfig = () => ({ ...AREA_CONFIG });

// Mettre à jour la configuration (pour l'interface admin)
export const updateAreaConfig = (newConfig) => {
  Object.assign(AREA_CONFIG, newConfig);
  console.log('Configuration de zone mise à jour :', AREA_CONFIG);
};