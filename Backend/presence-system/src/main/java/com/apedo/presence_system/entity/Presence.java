package com.apedo.presence_system.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "presences")
@Getter
@Setter
public class Presence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id")
    private Employe employe;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "matricule", nullable = false)
    private String matricule;

    @Column(name = "date_presence", nullable = false)
    private LocalDate datePresence;

    @Column(name = "heure_presence", nullable = false)
    private LocalTime heurePresence;

    @Column(name = "action", nullable = false)
    private String action; // "Arrivée", "Départ", "Pause", "Retour", "Autre"

    @Column(name = "status", nullable = false)
    private String status; // "success", "failed"

    @Column(name = "notes")
    private String notes;

    @Column(name = "scan_method")
    private String scanMethod; // "QR", "Badge", "Manuel"
}