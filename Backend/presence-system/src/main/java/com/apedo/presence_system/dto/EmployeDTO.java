package com.apedo.presence_system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class EmployeDTO {

    private Long id;

    @NotBlank(message = "Le nom est requis")
    private String lastName;

    @NotBlank(message = "Le prénom est requis")
    private String firstName;

    @NotBlank(message = "Le matricule est requis")
    private String registrationNumber;

    private String email;

    private String phone;

    private String department;

    private String position;

    private LocalDate hireDate;

    private String address;

    private String city;

    private String postalCode;

    private Boolean hasUserAccount = false;

    private Boolean isActive = true;
}