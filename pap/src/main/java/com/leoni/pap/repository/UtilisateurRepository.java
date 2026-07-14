package com.leoni.pap.repository;

import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.RoleUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {
    // ⚠️ Integer car getId() retourne Integer dans ton entité

    Optional<Utilisateur> findByMatricule(String matricule);

    Optional<Utilisateur> findByEmail(String email);

    List<Utilisateur> findByRole(RoleUser role);

    List<Utilisateur> findByActifTrue();

    List<Utilisateur> findByRoleAndActifTrue(RoleUser role);

    boolean existsByMatricule(String matricule);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Integer id);

    boolean existsByMatriculeAndRole(String matricule, RoleUser role);
    Optional<Utilisateur> findByResetToken(String resetToken);



}