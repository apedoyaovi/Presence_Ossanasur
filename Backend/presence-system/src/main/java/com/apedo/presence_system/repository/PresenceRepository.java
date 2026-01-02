package com.apedo.presence_system.repository;

import com.apedo.presence_system.entity.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, Long> {

    List<Presence> findByIsActiveTrue();

    List<Presence> findByDatePresence(LocalDate date);

    List<Presence> findByMatricule(String matricule);

    List<Presence> findByAction(String action);

    List<Presence> findByStatus(String status);

    List<Presence> findByEmployeId(Long employeId);

    @Query("SELECT p FROM Presence p WHERE p.datePresence >= :startDate AND p.datePresence <= :endDate")
    List<Presence> findByDateRange(@Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM Presence p WHERE p.matricule LIKE %:search% OR p.nom LIKE %:search%")
    List<Presence> searchByMatriculeOrNom(@Param("search") String search);

    @Query("SELECT p FROM Presence p WHERE p.employe.id = :employeId AND p.datePresence = :date AND p.action = :action AND p.isActive = true")
    List<Presence> findByEmployeAndActionAndDate(@Param("employeId") Long employeId, 
                                                    @Param("date") LocalDate date, 
                                                    @Param("action") String action);

    long countByDatePresence(LocalDate date);

    long countByStatus(String status);
}