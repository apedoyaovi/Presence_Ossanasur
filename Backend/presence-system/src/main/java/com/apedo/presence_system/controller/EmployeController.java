package com.apedo.presence_system.controller;

import com.apedo.presence_system.dto.EmployeDTO;
import com.apedo.presence_system.service.EmployeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employes")
@CrossOrigin
public class EmployeController {

    @Autowired
    private EmployeService employeService;

    @GetMapping
    public ResponseEntity<List<EmployeDTO>> getAllEmployes() {
        List<EmployeDTO> employes = employeService.getAllEmployes();
        return ResponseEntity.ok(employes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeDTO> getEmployeById(@PathVariable Long id) {
        EmployeDTO employe = employeService.getEmployeById(id);
        return ResponseEntity.ok(employe);
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<EmployeDTO>> getEmployesByDepartment(@PathVariable String department) {
        List<EmployeDTO> employes = employeService.getEmployesByDepartment(department);
        return ResponseEntity.ok(employes);
    }

    @PostMapping
    public ResponseEntity<EmployeDTO> createEmploye(@Valid @RequestBody EmployeDTO employeDTO) {
        EmployeDTO createdEmploye = employeService.createEmploye(employeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEmploye);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeDTO> updateEmploye(
            @PathVariable Long id,
            @Valid @RequestBody EmployeDTO employeDTO) {
        EmployeDTO updatedEmploye = employeService.updateEmploye(id, employeDTO);
        return ResponseEntity.ok(updatedEmploye);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmploye(@PathVariable Long id) {
        employeService.deleteEmploye(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<String> generateQRData(@PathVariable Long id) {
        String qrData = employeService.generateQRData(id);
        return ResponseEntity.ok(qrData);
    }
}