package com.leoni.pap.service;

import com.leoni.pap.dto.request.ProjetRequest;
import com.leoni.pap.dto.response.ProjetResponse;
import com.leoni.pap.entity.Projet;
import com.leoni.pap.entity.Segment;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.ProjetRepository;
import com.leoni.pap.repository.SegmentRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProjetService {

    private final ProjetRepository  projetRepo;
    private final SegmentRepository segmentRepo;

    public ProjetService(ProjetRepository projetRepo, SegmentRepository segmentRepo) {
        this.projetRepo  = projetRepo;
        this.segmentRepo = segmentRepo;
    }

    public List<ProjetResponse> getAll() {
        return projetRepo.findAll().stream().map(this::toResponse).toList();
    }

    public List<ProjetResponse> getBySegmentId(Integer segmentId) {
        return projetRepo.findBySegmentId(segmentId).stream().map(this::toResponse).toList();
    }

    public ProjetResponse getById(Integer id) {
        return toResponse(projetRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Projet introuvable.")));
    }

    public ProjetResponse creer(ProjetRequest req) {
        Segment seg = segmentRepo.findById(req.getSegmentId())
                .orElseThrow(() -> new BusinessException("Segment introuvable."));
        Projet p = new Projet();
        p.setNom(req.getNom());
        p.setDescription(req.getDescription());
        p.setSegment(seg);
        return toResponse(projetRepo.save(p));
    }

    public ProjetResponse modifier(Integer id, ProjetRequest req) {
        Projet p = projetRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Projet introuvable."));
        Segment seg = segmentRepo.findById(req.getSegmentId())
                .orElseThrow(() -> new BusinessException("Segment introuvable."));
        p.setNom(req.getNom());
        p.setDescription(req.getDescription());
        p.setSegment(seg);
        return toResponse(projetRepo.save(p));
    }

    public void supprimer(Integer id) {
        if (!projetRepo.existsById(id)) throw new BusinessException("Projet introuvable.");
        projetRepo.deleteById(id);
    }

    private ProjetResponse toResponse(Projet p) {
        ProjetResponse r = new ProjetResponse();
        r.setId(p.getId());
        r.setNom(p.getNom());
        r.setDescription(p.getDescription());
        if (p.getSegment() != null) {
            r.setSegmentId(p.getSegment().getId());
            r.setSegmentNom(p.getSegment().getNom());
            if (p.getSegment().getPlant() != null) {
                r.setPlantNom(p.getSegment().getPlant().getNom());
                if (p.getSegment().getPlant().getSite() != null)
                    r.setSiteNom(p.getSegment().getPlant().getSite().getNom());
            }
        }
        return r;
    }
}