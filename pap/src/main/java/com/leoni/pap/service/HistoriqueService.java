package com.leoni.pap.service;

import com.leoni.pap.entity.*;
import com.leoni.pap.repository.HistoriqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.time.LocalDateTime;
import java.util.List;
import com.leoni.pap.entity.enums.*;

@Service
@RequiredArgsConstructor
public class HistoriqueService {

    private final HistoriqueRepository repo;

    // ── ENREGISTRER (méthode principale) ─────────────────────
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Historique enregistrer(Historique.HistoriqueBuilder builder) {
        try {
            Historique h = builder.dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            return repo.save(h);
        } catch (DataIntegrityViolationException ex) {
            return null;
        }
    }

    // ── RACCOURCIS COURANTS ───────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Utilisateur acteur, TypeHistorique type, String details) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).details(details)
                    .dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    /**
     * Enregistre une action liée à un audit (planification, démarrage,
     * modification, réassignation, annulation…). Le plant est celui de
     * l'audit lui-même (fiable même si l'acteur n'a pas de plant renseigné),
     * avec repli sur le plant de l'acteur si l'audit n'en a pas.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(Utilisateur acteur, TypeHistorique type, AuditProduit audit, String details) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).audit(audit).details(details)
                    .dateAction(LocalDateTime.now()).build();
            if (audit != null && audit.getPlant() != null) {
                h.setPlant(audit.getPlant());
            } else {
                completerPlant(h);
            }
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCertif(Utilisateur acteur, TypeHistorique type,
                          Certification certif, String details, Double score) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).certification(certif)
                    .details(details).scoreSnapshot(score)
                    .dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSession(Utilisateur acteur, TypeHistorique type,
                           SessionTest session, String details) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).sessionTest(session)
                    .details(details).dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logTest(Utilisateur acteur, TypeHistorique type,
                        TestTheorique test, String details) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).testTheorique(test)
                    .details(details).dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAdmin(Utilisateur acteur, TypeHistorique type,
                         Utilisateur cible, String details) {
        try {
            Historique h = Historique.builder()
                    .utilisateur(acteur).type(type).cible(cible)
                    .details(details).dateAction(LocalDateTime.now()).build();
            completerPlant(h);
            repo.save(h);
        } catch (DataIntegrityViolationException ex) {
        }
    }

    // Recopie le plant de l'acteur sur l'entrée d'historique (dénormalisation
    // pour permettre le filtrage "historique de mon plant" sans jointure).
    private void completerPlant(Historique h) {
        if (h.getPlant() == null && h.getUtilisateur() != null) {
            h.setPlant(h.getUtilisateur().getPlant());
        }
    }

    // ── LECTURES ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Historique> getHistoriqueUtilisateur(Utilisateur u) {
        return repo.findByUtilisateurOrderByDateActionDesc(u);
    }

    @Transactional(readOnly = true)
    public List<Historique> getHistoriqueCertification(Certification c) {
        return repo.findByCertificationOrderByDateActionDesc(c);
    }

    @Transactional(readOnly = true)
    public List<Historique> getHistoriqueCompletAuditeur(Utilisateur u) {
        return repo.findHistoriqueCompletAuditeur(u);
    }

    @Transactional(readOnly = true)
    public List<Historique> getHistoriqueTest(TestTheorique t) {
        return repo.findByTestTheoriqueOrderByDateActionDesc(t);
    }

    /**
     * Historique de TOUT un plant (tous les acteurs rattachés : auditeurs,
     * expert, chef de service…), filtrable par type et/ou par rôle de
     * l'acteur. Chaque plant est indépendant : cette méthode ne renvoie
     * jamais les entrées d'un autre plant.
     */
    @Transactional(readOnly = true)
    public List<Historique> getHistoriquePlant(Plant plant, TypeHistorique type, RoleUser role) {
        return repo.findByPlantFiltre(plant, type, role);
    }

    @Transactional(readOnly = true)
    public List<Historique> getHistoriqueAudit(AuditProduit audit) {
        return repo.findByAuditOrderByDateActionDesc(audit);
    }

    public void enregistrer(TypeHistorique typeHistorique, String s, Utilisateur expert) {
    }
}
