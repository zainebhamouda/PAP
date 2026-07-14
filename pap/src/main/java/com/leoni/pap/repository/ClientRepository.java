package com.leoni.pap.repository;

import com.leoni.pap.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    // ── Tous / actifs ─────────────────────────────────────────────
    List<Client>     findAllByOrderByNomAsc();
    List<Client>     findByActifTrueOrderByNomAsc();

    // ── Groupes seulement (pour selects qualification) ────────────
    List<Client>     findByEstGroupeTrueOrderByNomAsc();
    List<Client>     findByActifTrueAndEstGroupeTrueOrderByNomAsc();

    // ── Marques seulement (pour le panel marques) ─────────────────
    List<Client>     findByEstGroupeFalseOrderByNomAsc();

    // ── Lookup ───────────────────────────────────────────────────
    Optional<Client> findByNomIgnoreCase(String nom);
    Optional<Client> findByCodeIgnoreCase(String code);
    boolean          existsByNomIgnoreCase(String nom);
    boolean          existsByCodeIgnoreCase(String code);
}