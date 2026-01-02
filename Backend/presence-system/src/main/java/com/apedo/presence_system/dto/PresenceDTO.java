package com.apedo.presence_system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class PresenceDTO {

    private Long id;

    private Long employeId;

    @NotBlank(message = "Le nom est requis")
    private String nom;

    @NotBlank(message = "Le matricule est requis")
    private String matricule;

    private LocalDate datePresence;

    private LocalTime heurePresence;

    @NotBlank(message = "L'action est requise")
    private String action;

    @NotBlank(message = "Le statut est requis")
    private String status;

    private String notes;

    private String scanMethod;

    private Boolean isActive = true;
}
