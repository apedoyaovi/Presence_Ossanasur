package com.apedo.presence_system.repository;

import com.apedo.presence_system.entity.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByRegistrationNumber(String registrationNumber);
    List<Employe> findByIsActiveTrue();
    List<Employe> findByDepartment(String department);
    Boolean existsByRegistrationNumber(String registrationNumber);
    Boolean existsByEmail(String email);
}