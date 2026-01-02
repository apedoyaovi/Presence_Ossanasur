package com.apedo.presence_system.service;

import com.apedo.presence_system.dto.EmployeDTO;
import com.apedo.presence_system.entity.Employe;
import com.apedo.presence_system.exception.ResourceNotFoundException;
import com.apedo.presence_system.repository.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeService {

    @Autowired
    private EmployeRepository employeRepository;

    @Autowired
    private com.apedo.presence_system.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<EmployeDTO> getAllEmployes() {
        return employeRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeDTO> getEmployesByDepartment(String department) {
        return employeRepository.findByDepartment(department).stream()
                .filter(Employe::getIsActive)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public EmployeDTO getEmployeById(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + id));
        return convertToDTO(employe);
    }

    public EmployeDTO createEmploye(EmployeDTO employeDTO) {
        // Vérifier l'unicité du matricule
        if (employeRepository.existsByRegistrationNumber(employeDTO.getRegistrationNumber())) {
            throw new IllegalArgumentException("Le matricule existe déjà");
        }

        // Vérifier l'unicité de l'email si fourni
        if (employeDTO.getEmail() != null && !employeDTO.getEmail().isEmpty()
                && employeRepository.existsByEmail(employeDTO.getEmail())) {
            throw new IllegalArgumentException("L'email existe déjà");
        }

        Employe employe = convertToEntity(employeDTO);
        employe.setIsActive(true);
        employe.setCreatedAt(null); // Laissera Hibernate générer la date
        employe = employeRepository.save(employe);

        // Si un email est fourni, créer automatiquement un compte utilisateur
        try {
            if (employe.getEmail() != null && !employe.getEmail().isEmpty()) {
                // Eviter de créer si un user/admin existe déjà avec cet email
                boolean userExists = userRepository.existsByEmail(employe.getEmail());
                boolean adminExists = false;
                try {
                    adminExists = java.util.Optional.ofNullable(com.apedo.presence_system.repository.AdminRepository.class)
                            .isPresent();
                } catch (Exception ignored) {}

                if (!userExists) {
                    com.apedo.presence_system.entity.User user = new com.apedo.presence_system.entity.User();
                    user.setEmail(employe.getEmail());
                    // Mot de passe par défaut : matricule si disponible, sinon 'changeme123'
                    String defaultPassword = (employe.getRegistrationNumber() != null && !employe.getRegistrationNumber().isEmpty())
                            ? employe.getRegistrationNumber()
                            : "changeme123";
                    user.setPassword(passwordEncoder.encode(defaultPassword));
                    user.setFullName(employe.getFirstName() + " " + employe.getLastName());
                    user.setIsActive(true);
                    userRepository.save(user);

                    employe.setHasUserAccount(true);
                    employeRepository.save(employe);
                }
            }
        } catch (Exception e) {
            // Ne pas faire échouer la création d'employé si la création du compte utilisateur échoue
            System.err.println("Erreur création compte utilisateur pour employé: " + e.getMessage());
        }

        return convertToDTO(employe);
    }

    public EmployeDTO updateEmploye(Long id, EmployeDTO employeDTO) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + id));

        // Vérifier l'unicité du matricule (sauf pour l'employé actuel)
        if (!employe.getRegistrationNumber().equals(employeDTO.getRegistrationNumber())
                && employeRepository.existsByRegistrationNumber(employeDTO.getRegistrationNumber())) {
            throw new IllegalArgumentException("Le matricule existe déjà");
        }

        // Vérifier l'unicité de l'email
        if (employeDTO.getEmail() != null && !employeDTO.getEmail().isEmpty()
                && !employeDTO.getEmail().equals(employe.getEmail())
                && employeRepository.existsByEmail(employeDTO.getEmail())) {
            throw new IllegalArgumentException("L'email existe déjà");
        }

        updateEntityFromDTO(employe, employeDTO);
        employe = employeRepository.save(employe);

        return convertToDTO(employe);
    }

    public void deleteEmploye(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + id));

        // Désactiver plutôt que supprimer (soft delete)
        employe.setIsActive(false);
        employeRepository.save(employe);
    }

    public String generateQRData(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé non trouvé avec l'ID: " + id));

        // Générer les données pour le QR code
        String qrData = String.format("EMP:%s:%s:%s",
                employe.getRegistrationNumber(),
                employe.getLastName(),
                employe.getFirstName()
        );

        // Sauvegarder les données QR dans l'entité
        employe.setQrCodeData(qrData);
        employeRepository.save(employe);

        return qrData;
    }

    private EmployeDTO convertToDTO(Employe employe) {
        EmployeDTO dto = new EmployeDTO();
        dto.setId(employe.getId());
        dto.setLastName(employe.getLastName());
        dto.setFirstName(employe.getFirstName());
        dto.setRegistrationNumber(employe.getRegistrationNumber());
        dto.setEmail(employe.getEmail());
        dto.setPhone(employe.getPhone());
        dto.setDepartment(employe.getDepartment());
        dto.setPosition(employe.getPosition());
        dto.setHireDate(employe.getHireDate());
        dto.setAddress(employe.getAddress());
        dto.setCity(employe.getCity());
        dto.setPostalCode(employe.getPostalCode());
        dto.setHasUserAccount(employe.getHasUserAccount());
        dto.setIsActive(employe.getIsActive());
        return dto;
    }

    private Employe convertToEntity(EmployeDTO dto) {
        Employe employe = new Employe();
        updateEntityFromDTO(employe, dto);
        return employe;
    }

    private void updateEntityFromDTO(Employe employe, EmployeDTO dto) {
        employe.setLastName(dto.getLastName());
        employe.setFirstName(dto.getFirstName());
        employe.setRegistrationNumber(dto.getRegistrationNumber());
        employe.setEmail(dto.getEmail());
        employe.setPhone(dto.getPhone());
        employe.setDepartment(dto.getDepartment());
        employe.setPosition(dto.getPosition());
        employe.setHireDate(dto.getHireDate() != null ? dto.getHireDate() : LocalDate.now());
        employe.setAddress(dto.getAddress());
        employe.setCity(dto.getCity());
        employe.setPostalCode(dto.getPostalCode());
        employe.setHasUserAccount(dto.getHasUserAccount());
    }
}