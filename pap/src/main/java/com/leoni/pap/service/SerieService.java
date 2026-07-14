package com.leoni.pap.service;

import com.leoni.pap.dto.request.SerieRequest;
import com.leoni.pap.dto.response.SerieResponse;
import com.leoni.pap.entity.Projet;
import com.leoni.pap.entity.Serie;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.ProjetRepository;
import com.leoni.pap.repository.SerieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service CRUD pour les Séries.
 * Les séries sont gérées par l'Admin, comme les Segments, Plants, etc.
 *
 * Hiérarchie : Projet → Série (chaque projet contient plusieurs séries)
 * Les audits sont planifiés PAR SÉRIE.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SerieService {

    private final SerieRepository  serieRepo;
    private final ProjetRepository projetRepo;

    // ── LECTURE ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SerieResponse> getAll() {
        return serieRepo.findAll().stream().map(SerieResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SerieResponse getById(Integer id) {
        return SerieResponse.from(
                serieRepo.findById(id).orElseThrow(() -> new BusinessException("Série introuvable."))
        );
    }

    @Transactional(readOnly = true)
    public List<SerieResponse> getByProjet(Integer projetId) {
        return serieRepo.findByProjetId(projetId).stream().map(SerieResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SerieResponse> getByProjetActives(Integer projetId) {
        return serieRepo.findByProjetIdAndActifTrue(projetId).stream().map(SerieResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SerieResponse> getByPlant(Integer plantId) {
        return serieRepo.findByPlantId(plantId).stream().map(SerieResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SerieResponse> getBySegment(Integer segmentId) {
        return serieRepo.findBySegmentId(segmentId).stream().map(SerieResponse::from).collect(Collectors.toList());
    }

    // ── CRÉATION ──────────────────────────────────────────────

    public SerieResponse creer(SerieRequest req) {
        Projet projet = projetRepo.findById(req.getProjetId())
                .orElseThrow(() -> new BusinessException("Projet introuvable."));

        if (serieRepo.existsByNomAndProjetId(req.getNom(), req.getProjetId()))
            throw new BusinessException("Une série avec ce nom existe déjà dans ce projet.");

        Serie s = new Serie();
        s.setNom(req.getNom());
        s.setDescription(req.getDescription());
        s.setCode(req.getCode());
        s.setDomaine(req.getDomaine());
        s.setFamilleCablage(req.getFamilleCablage());
        s.setProjet(projet);
        s.setActif(true);

        return SerieResponse.from(serieRepo.save(s));
    }

    // ── MODIFICATION ──────────────────────────────────────────

    public SerieResponse modifier(Integer id, SerieRequest req) {
        Serie s = serieRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Série introuvable."));

        Projet projet = projetRepo.findById(req.getProjetId())
                .orElseThrow(() -> new BusinessException("Projet introuvable."));

        // Vérifier doublon uniquement si le nom a changé
        if (!s.getNom().equals(req.getNom()) && serieRepo.existsByNomAndProjetId(req.getNom(), req.getProjetId()))
            throw new BusinessException("Une série avec ce nom existe déjà dans ce projet.");

        s.setNom(req.getNom());
        s.setDescription(req.getDescription());
        s.setCode(req.getCode());
        s.setDomaine(req.getDomaine());
        s.setFamilleCablage(req.getFamilleCablage());
        s.setProjet(projet);

        return SerieResponse.from(serieRepo.save(s));
    }

    // ── ACTIVATION / DÉSACTIVATION ────────────────────────────

    public SerieResponse toggleActif(Integer id) {
        Serie s = serieRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Série introuvable."));
        s.setActif(!Boolean.TRUE.equals(s.getActif()));
        return SerieResponse.from(serieRepo.save(s));
    }

    // ── SUPPRESSION ───────────────────────────────────────────

    public void supprimer(Integer id) {
        Serie s = serieRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Série introuvable."));
        // Vérifier qu'il n'y a pas d'audits liés
        if (s.getAudits() != null && !s.getAudits().isEmpty())
            throw new BusinessException("Impossible de supprimer cette série : des audits y sont associés.");
        serieRepo.deleteById(id);
    }
}