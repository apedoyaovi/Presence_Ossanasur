package com.apedo.presence_system.controller;

import com.apedo.presence_system.dto.AuthRequest;
import com.apedo.presence_system.dto.AuthResponse;
import com.apedo.presence_system.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authService.login(authRequest);

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(@RequestHeader("Authorization") String token) {
        // Supprimer "Bearer " du token
        String jwtToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(new AuthResponse(
                jwtToken,
                null,
                null,
                "Token valide",
                true
        ));
    }
}