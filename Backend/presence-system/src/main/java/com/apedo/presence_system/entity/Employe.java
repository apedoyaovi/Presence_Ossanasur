package com.apedo.presence_system.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "employes")
@Getter
@Setter
public class Employe extends BaseEntity {

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "registration_number", nullable = false, unique = true)
    private String registrationNumber;

    @Column(unique = true)
    private String email;

    private String phone;

    private String department;

    private String position;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    private String address;

    private String city;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "has_user_account")
    private Boolean hasUserAccount = false;

    @Column(name = "qr_code_data")
    private String qrCodeData;
}