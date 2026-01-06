package com.apedo.presence_system.service;

import com.apedo.presence_system.dto.PresenceDTO;
import com.apedo.presence_system.entity.Employe;
import com.apedo.presence_system.entity.Presence;
import com.apedo.presence_system.exception.ResourceNotFoundException;
import com.apedo.presence_system.repository.EmployeRepository;
import com.apedo.presence_system.repository.PresenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    @Autowired
    private PresenceRepository presenceRepository;

    @Autowired
    private EmployeRepository employeRepository;

    public List<PresenceDTO> getAllPresences() {
        return presenceRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PresenceDTO getPresenceById(Long id) {
        Presence presence = presenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enregistrement de présence non trouvé avec l'ID: " + id));
        return convertToDTO(presence);
    }

    public List<PresenceDTO> getPresencesByDate(LocalDate date) {
        return presenceRepository.findByDatePresence(date).stream()
                .filter(Presence::getIsActive)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PresenceDTO> searchPresences(String searchTerm) {
        return presenceRepository.searchByMatriculeOrNom(searchTerm).stream()
                .filter(Presence::getIsActive)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PresenceDTO createPresence(PresenceDTO presenceDTO) {
        // Vérifier si l'employé existe
        Employe employe = null;
        if (presenceDTO.getEmployeId() != null) {
            employe = employeRepository.findById(presenceDTO.getEmployeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + presenceDTO.getEmployeId()));
        }

        Presence presence = convertToEntity(presenceDTO);
        presence.setEmploye(employe);
        presence.setIsActive(true);

        // Si la date n'est pas fournie, utiliser la date actuelle
        if (presence.getDatePresence() == null) {
            presence.setDatePresence(LocalDate.now());
        }

        // Si l'heure n'est pas fournie, utiliser l'heure actuelle
        if (presence.getHeurePresence() == null) {
            presence.setHeurePresence(LocalTime.now());
        }

        presence = presenceRepository.save(presence);
        return convertToDTO(presence);
    }

    public PresenceDTO updatePresence(Long id, PresenceDTO presenceDTO) {
        Presence presence = presenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enregistrement de présence non trouvé avec l'ID: " + id));

        // Mettre à jour les champs
        updateEntityFromDTO(presence, presenceDTO);

        // Mettre à jour l'employé si nécessaire
        if (presenceDTO.getEmployeId() != null) {
            Employe employe = employeRepository.findById(presenceDTO.getEmployeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + presenceDTO.getEmployeId()));
            presence.setEmploye(employe);
        }

        presence = presenceRepository.save(presence);
        return convertToDTO(presence);
    }

    public void deletePresence(Long id) {
        Presence presence = presenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enregistrement de présence non trouvé avec l'ID: " + id));

        // Soft delete
        presence.setIsActive(false);
        presenceRepository.save(presence);
    }

    public void deleteMultiplePresences(List<Long> ids) {
        List<Presence> presences = presenceRepository.findAllById(ids);
        for (Presence presence : presences) {
            presence.setIsActive(false);
        }
        presenceRepository.saveAll(presences);
    }

    public PresenceStatsDTO getStats() {
        LocalDate today = LocalDate.now();
        long total = presenceRepository.count();
        long todayCount = presenceRepository.countByDatePresence(today);
        long successCount = presenceRepository.countByStatus("success");
        long failedCount = presenceRepository.countByStatus("failed");

        return new PresenceStatsDTO(total, todayCount, successCount, failedCount);
    }

    // Enregistrer une présence à partir d'un scan QR
    public PresenceDTO recordPresenceFromQRScan(String qrData, String action, String reason) {
        // Parser les données du QR : EMP:matricule:nom:prenom
        String[] parts = qrData.split(":");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Données QR invalides");
        }

        String matricule = parts.length > 1 ? parts[1] : "";
        String nom = parts.length > 2 ? parts[2] : "";
        String prenom = parts.length > 3 ? parts[3] : "";

        // Chercher l'employé par matricule
        Employe employe = employeRepository.findByRegistrationNumber(matricule)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec le matricule: " + matricule));

        // Vérifier s'il existe déjà une action identique pour cet employé aujourd'hui
        List<Presence> existingActions = presenceRepository.findByEmployeAndActionAndDate(
                employe.getId(), 
                LocalDate.now(), 
                action
        );
        
        if (!existingActions.isEmpty()) {
            throw new IllegalArgumentException("L'action '" + action + "' a déjà été enregistrée pour cet employé aujourd'hui.");
        }

        // ===== VALIDATIONS MÉTIER =====
        LocalTime now = LocalTime.now();
        List<Presence> todayPresences = presenceRepository.findByEmployeId(employe.getId()).stream()
                .filter(p -> p.getDatePresence().equals(LocalDate.now()) && p.getIsActive())
                .collect(Collectors.toList());

        // Validation 1: L'arrivée doit être la première action de la journée
        if (!action.equals("ARRIVAL")) {
            boolean hasArrival = todayPresences.stream()
                    .anyMatch(p -> p.getAction().equals("ARRIVAL"));
            
            if (!hasArrival) {
                throw new IllegalArgumentException("Vous devez d'abord enregistrer votre arrivée avant d'effectuer une autre action.");
            }
        }

        // Validation 2: Les actions de pause doivent être entre 12h et 15h
        if (action.equals("PAUSE_START") || action.equals("PAUSE_END")) {
            int hour = now.getHour();
            if (hour < 12 || hour >= 15) {
                throw new IllegalArgumentException("Les actions de pause doivent être effectuées entre 12h00 et 14h59.");
            }
        }

        // Validation 3: Le retour de pause (PAUSE_END) ne peut être fait que si PAUSE_START a été enregistré
        if (action.equals("PAUSE_END")) {
            boolean hasPauseStart = todayPresences.stream()
                    .anyMatch(p -> p.getAction().equals("PAUSE_START"));
            
            if (!hasPauseStart) {
                throw new IllegalArgumentException("Vous devez d'abord enregistrer un départ pour la pause avant de pouvoir enregistrer un retour de pause.");
            }
        }

        // Validation 4: Le départ fin (DEPARTURE) ne peut être fait que après 18h
        if (action.equals("DEPARTURE")) {
            int hour = now.getHour();
            if (hour < 18) {
                throw new IllegalArgumentException("Vous pouvez enregistrer un départ fin uniquement à partir de 18h00.");
            }
        }

        // Créer un nouvel enregistrement de présence
        Presence presence = new Presence();
        presence.setEmploye(employe);
        presence.setNom(nom + " " + prenom);
        presence.setMatricule(matricule);
        presence.setDatePresence(LocalDate.now());
        presence.setHeurePresence(LocalTime.now());
        presence.setAction(action);
        presence.setStatus("success");
        presence.setNotes(reason != null && !reason.isEmpty() ? reason : "");
        presence.setScanMethod("QR_CODE");
        presence.setIsActive(true);

        presence = presenceRepository.save(presence);
        return convertToDTO(presence);
    }

    // DTO pour les statistiques
    public record PresenceStatsDTO(long total, long today, long success, long failed) {}

    private PresenceDTO convertToDTO(Presence presence) {
        PresenceDTO dto = new PresenceDTO();
        dto.setId(presence.getId());
        dto.setNom(presence.getNom());
        dto.setMatricule(presence.getMatricule());
        dto.setDatePresence(presence.getDatePresence());
        dto.setHeurePresence(presence.getHeurePresence());
        dto.setAction(presence.getAction());
        dto.setStatus(presence.getStatus());
        dto.setNotes(presence.getNotes());
        dto.setScanMethod(presence.getScanMethod());
        dto.setIsActive(presence.getIsActive());

        if (presence.getEmploye() != null) {
            dto.setEmployeId(presence.getEmploye().getId());
        }

        return dto;
    }

    private Presence convertToEntity(PresenceDTO dto) {
        Presence presence = new Presence();
        updateEntityFromDTO(presence, dto);
        return presence;
    }

    private void updateEntityFromDTO(Presence presence, PresenceDTO dto) {
        presence.setNom(dto.getNom());
        presence.setMatricule(dto.getMatricule());
        presence.setDatePresence(dto.getDatePresence());
        presence.setHeurePresence(dto.getHeurePresence());
        presence.setAction(dto.getAction());
        presence.setStatus(dto.getStatus());
        presence.setNotes(dto.getNotes());
        presence.setScanMethod(dto.getScanMethod());
    }
}