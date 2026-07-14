package com.leoni.pap.service;

import com.leoni.pap.dto.request.PlantRequest;
import com.leoni.pap.dto.response.PlantResponse;
import com.leoni.pap.entity.Plant;
import com.leoni.pap.entity.Site;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.PlantRepository;
import com.leoni.pap.repository.SiteRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PlantService {

    private final PlantRepository plantRepo;
    private final SiteRepository  siteRepo;

    public PlantService(PlantRepository plantRepo, SiteRepository siteRepo) {
        this.plantRepo = plantRepo;
        this.siteRepo  = siteRepo;
    }

    public List<PlantResponse> getAll() {
        return plantRepo.findAll().stream().map(this::toResponse).toList();
    }

    public List<PlantResponse> getBySiteId(Integer siteId) {
        return plantRepo.findBySiteId(siteId).stream().map(this::toResponse).toList();
    }

    public PlantResponse getById(Integer id) {
        return toResponse(plantRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Plant introuvable.")));
    }

    public PlantResponse creer(PlantRequest req) {
        Site site = siteRepo.findById(req.getSiteId())
                .orElseThrow(() -> new BusinessException("Site introuvable."));
        Plant plant = new Plant();
        plant.setNom(req.getNom());
        plant.setSite(site);
        return toResponse(plantRepo.save(plant));
    }

    public PlantResponse modifier(Integer id, PlantRequest req) {
        Plant plant = plantRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Plant introuvable."));
        Site site = siteRepo.findById(req.getSiteId())
                .orElseThrow(() -> new BusinessException("Site introuvable."));
        plant.setNom(req.getNom());
        plant.setSite(site);
        return toResponse(plantRepo.save(plant));
    }

    public void supprimer(Integer id) {
        if (!plantRepo.existsById(id)) throw new BusinessException("Plant introuvable.");
        plantRepo.deleteById(id);
    }
    public List<PlantResponse> getPlantsBySiteId(Integer siteId) {
        return plantRepo.findBySiteId(siteId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    private PlantResponse toResponse(Plant p) {
        PlantResponse r = new PlantResponse();
        r.setId(p.getId());
        r.setNom(p.getNom());
        if (p.getSite() != null) {
            r.setSiteId(p.getSite().getId());
            r.setSiteNom(p.getSite().getNom());
        }
        r.setNombreSegments(p.getSegments() != null ? p.getSegments().size() : 0);
        return r;
    }
}