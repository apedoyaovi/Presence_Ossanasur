package com.apedo.presence_system.controller;

import com.apedo.presence_system.dto.PresenceDTO;
import com.apedo.presence_system.service.PresenceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/presences")
@CrossOrigin(origins = "http://localhost:5173")
public class PresenceController {

    @Autowired
    private PresenceService presenceService;

    @GetMapping
    public ResponseEntity<List<PresenceDTO>> getAllPresences() {
        List<PresenceDTO> presences = presenceService.getAllPresences();
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PresenceDTO> getPresenceById(@PathVariable Long id) {
        PresenceDTO presence = presenceService.getPresenceById(id);
        return ResponseEntity.ok(presence);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<PresenceDTO>> getPresencesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<PresenceDTO> presences = presenceService.getPresencesByDate(date);
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PresenceDTO>> searchPresences(@RequestParam String query) {
        List<PresenceDTO> presences = presenceService.searchPresences(query);
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/stats")
    public ResponseEntity<PresenceService.PresenceStatsDTO> getStats() {
        PresenceService.PresenceStatsDTO stats = presenceService.getStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    public ResponseEntity<PresenceDTO> createPresence(@Valid @RequestBody PresenceDTO presenceDTO) {
        PresenceDTO createdPresence = presenceService.createPresence(presenceDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPresence);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresenceDTO> updatePresence(
            @PathVariable Long id,
            @Valid @RequestBody PresenceDTO presenceDTO) {
        PresenceDTO updatedPresence = presenceService.updatePresence(id, presenceDTO);
        return ResponseEntity.ok(updatedPresence);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePresence(@PathVariable Long id) {
        presenceService.deletePresence(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch-delete")
    public ResponseEntity<Void> deleteMultiplePresences(@RequestBody List<Long> ids) {
        presenceService.deleteMultiplePresences(ids);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/scan")
    public ResponseEntity<PresenceDTO> scanQRCode(@Valid @RequestBody com.apedo.presence_system.dto.QRScanRequest scanRequest) {
        PresenceDTO presence = presenceService.recordPresenceFromQRScan(
            scanRequest.getQrData(),
            scanRequest.getAction(),
            scanRequest.getReason()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(presence);
    }
}