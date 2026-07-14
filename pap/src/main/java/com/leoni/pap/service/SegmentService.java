package com.leoni.pap.service;

import com.leoni.pap.dto.request.SegmentRequest;
import com.leoni.pap.dto.response.SegmentResponse;
import com.leoni.pap.entity.Plant;
import com.leoni.pap.entity.Segment;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.PlantRepository;
import com.leoni.pap.repository.SegmentRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SegmentService {

    private final SegmentRepository segmentRepo;
    private final PlantRepository   plantRepo;

    public SegmentService(SegmentRepository segmentRepo, PlantRepository plantRepo) {
        this.segmentRepo = segmentRepo;
        this.plantRepo   = plantRepo;
    }

    public List<SegmentResponse> getAll() {
        return segmentRepo.findAll().stream().map(this::toResponse).toList();
    }

    public List<SegmentResponse> getByPlantId(Integer plantId) {
        return segmentRepo.findByPlantId(plantId).stream().map(this::toResponse).toList();
    }

    public SegmentResponse getById(Integer id) {
        return toResponse(segmentRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Segment introuvable.")));
    }

    public SegmentResponse creer(SegmentRequest req) {
        Plant plant = plantRepo.findById(req.getPlantId())
                .orElseThrow(() -> new BusinessException("Plant introuvable."));
        Segment seg = new Segment();
        seg.setNom(req.getNom());
        seg.setPlant(plant);
        return toResponse(segmentRepo.save(seg));
    }

    public SegmentResponse modifier(Integer id, SegmentRequest req) {
        Segment seg = segmentRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Segment introuvable."));
        Plant plant = plantRepo.findById(req.getPlantId())
                .orElseThrow(() -> new BusinessException("Plant introuvable."));
        seg.setNom(req.getNom());
        seg.setPlant(plant);
        return toResponse(segmentRepo.save(seg));
    }

    public void supprimer(Integer id) {
        if (!segmentRepo.existsById(id)) throw new BusinessException("Segment introuvable.");
        segmentRepo.deleteById(id);
    }

    private SegmentResponse toResponse(Segment s) {
        SegmentResponse r = new SegmentResponse();
        r.setId(s.getId());
        r.setNom(s.getNom());
        if (s.getPlant() != null) {
            r.setPlantId(s.getPlant().getId());
            r.setPlantNom(s.getPlant().getNom());
            if (s.getPlant().getSite() != null)
                r.setSiteNom(s.getPlant().getSite().getNom());
        }
        r.setNombreProjets(s.getProjets() != null ? s.getProjets().size() : 0);
        return r;
    }
}