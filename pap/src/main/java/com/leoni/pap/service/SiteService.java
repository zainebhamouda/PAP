package com.leoni.pap.service;

import com.leoni.pap.dto.request.SiteRequest;
import com.leoni.pap.dto.response.SiteResponse;
import com.leoni.pap.entity.Site;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.SiteRepository;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * SiteService — MODIFIÉ Sprint 3
 * Gère les nouveaux attributs des sites Leoni réels
 */
@Service
public class SiteService {

    private final SiteRepository siteRepo;

    public SiteService(SiteRepository siteRepo) {
        this.siteRepo = siteRepo;
    }

    public List<SiteResponse> getAll() {
        return siteRepo.findAll().stream().map(SiteResponse::from).toList();
    }

    public SiteResponse getById(Integer id) {
        return SiteResponse.from(siteRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Site introuvable.")));
    }

    public SiteResponse creer(SiteRequest req) {
        Site site = new Site();
        mapRequest(site, req);
        return SiteResponse.from(siteRepo.save(site));
    }

    public SiteResponse modifier(Integer id, SiteRequest req) {
        Site site = siteRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Site introuvable."));
        mapRequest(site, req);
        return SiteResponse.from(siteRepo.save(site));
    }

    public void supprimer(Integer id) {
        if (!siteRepo.existsById(id)) throw new BusinessException("Site introuvable.");
        siteRepo.deleteById(id);
    }

    // ── Mapping interne ───────────────────────────────────────

    private void mapRequest(Site site, SiteRequest req) {
        site.setNom(req.getNom());
        site.setLocalisation(req.getLocalisation());
        site.setTotalSpaceM2(req.getTotalSpaceM2());
        site.setProductionSpaceM2(req.getProductionSpaceM2());
        site.setNumberOfPlants(req.getNumberOfPlants());
        site.setTotalHc(req.getTotalHc());
        site.setDirectHc(req.getDirectHc());
        site.setIndirectHc(req.getIndirectHc());
    }
}