package com.apedo.presence_system.service;

import com.apedo.presence_system.dto.AuthRequest;
import com.apedo.presence_system.dto.AuthResponse;
import com.apedo.presence_system.entity.Admin;
import com.apedo.presence_system.repository.AdminRepository;
import com.apedo.presence_system.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse login(AuthRequest authRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Admin admin = (Admin) authentication.getPrincipal();
            String token = jwtUtil.generateToken(admin);

            // Si "Se souvenir de moi" est coché
            if (authRequest.getRememberMe() != null && authRequest.getRememberMe()) {
                // Vous pouvez implémenter une logique de token long-term ici
            }

            return new AuthResponse(
                    token,
                    admin.getEmail(),
                    admin.getFullName(),
                    "Connexion réussie",
                    true
            );

        } catch (Exception e) {
            return new AuthResponse(
                    null,
                    null,
                    null,
                    "Échec de connexion. Vérifiez les identifiants.",
                    false
            );
        }
    }

    public void createDefaultAdmin() {
        if (!adminRepository.existsByEmail("admin@system.com")) {
            Admin admin = new Admin();
            admin.setEmail("admin@system.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Administrateur Principal");
            admin.setIsActive(true);
            adminRepository.save(admin);
            System.out.println("Admin par défaut créé: admin@system.com / admin123");
        }
    }
}