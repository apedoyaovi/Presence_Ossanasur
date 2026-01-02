package com.apedo.presence_system.security;

import com.apedo.presence_system.entity.Admin;
import com.apedo.presence_system.entity.User;
import com.apedo.presence_system.repository.AdminRepository;
import com.apedo.presence_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Chercher d'abord un admin
        var adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (!admin.getIsActive()) {
                throw new UsernameNotFoundException("Compte admin désactivé");
            }
            return admin;
        }

        // Chercher ensuite un user (employé)
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.getIsActive()) {
                throw new UsernameNotFoundException("Compte utilisateur désactivé");
            }
            return user;
        }

        throw new UsernameNotFoundException("Utilisateur non trouvé avec l'email: " + email);
    }
}