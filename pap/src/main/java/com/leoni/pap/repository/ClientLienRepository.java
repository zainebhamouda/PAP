package com.leoni.pap.repository;

import com.leoni.pap.entity.ClientLien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientLienRepository extends JpaRepository<ClientLien, Integer> {

    // Tous les membres liés à un client parent
    List<ClientLien> findByClientParentId(Integer clientParentId);

    // Vérifier si un lien existe déjà (par objet)
    Optional<ClientLien> findByClientParentIdAndClientMembreId(
            Integer clientParentId, Integer clientMembreId
    );

    // ── NOUVEAU : vérification booléenne (utilisée dans initialiserClientsLeoni) ──
    boolean existsByClientParentIdAndClientMembreId(
            Integer clientParentId, Integer clientMembreId
    );

    // Supprimer un lien précis
    void deleteByClientParentIdAndClientMembreId(
            Integer clientParentId, Integer clientMembreId
    );

    // Supprimer tous les liens d'un parent ou d'un membre (si on supprime le client)
    void deleteByClientParentId(Integer clientParentId);
    void deleteByClientMembreId(Integer clientMembreId);
}