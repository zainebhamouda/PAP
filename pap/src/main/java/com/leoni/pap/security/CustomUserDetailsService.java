package com.leoni.pap.security;

import com.leoni.pap.repository.UtilisateurRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Charge l'utilisateur par MATRICULE pour Spring Security.
 * Utilise authorities() avec préfixe ROLE_ explicite
 * pour éviter tout problème de double-préfixage.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository repo;

    public CustomUserDetailsService(UtilisateurRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String matricule) throws UsernameNotFoundException {
        return repo.findByMatricule(matricule)
                .map(u -> User.builder()
                        .username(u.getMatricule())
                        .password(u.getMotDePasse())
                        // authorities() avec ROLE_ explicite — pas de double préfixe
                        .authorities(List.of(
                                new SimpleGrantedAuthority("ROLE_" + u.getRole().name())
                        ))
                        .accountExpired(false)
                        .accountLocked(false)
                        .credentialsExpired(false)
                        .disabled(!Boolean.TRUE.equals(u.getActif()))
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + matricule));
    }
}