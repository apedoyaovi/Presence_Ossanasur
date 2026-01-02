package com.apedo.presence_system.config;

import com.apedo.presence_system.entity.Admin;
import com.apedo.presence_system.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

    @Component
    public class DataInitializer implements CommandLineRunner {

        @Autowired
        private AdminRepository adminRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) throws Exception {
            // On vérifie si un admin existe déjà pour ne pas le créer en double
            if (adminRepository.count() == 0) {
                Admin admin = new Admin();
                admin.setFullName("Super Admin");
                admin.setEmail("admin@system.com");
                // Important : On encode le mot de passe !
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setIsActive(true);

                adminRepository.save(admin);
                System.out.println("✅ SuperAdmin créé par défaut : admin@system.com / admin123");
            }
        }
    }
