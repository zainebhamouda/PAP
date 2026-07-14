package com.leoni.pap.service;

import com.leoni.pap.dto.request.PreferencesRequest;
import com.leoni.pap.dto.request.UpdateUtilisateurRequest;
import com.leoni.pap.dto.response.PreferencesResponse;
import com.leoni.pap.dto.response.ProfilResponse;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfilService {

    private final UtilisateurRepository utilisateurRepo;
    private final PasswordEncoder       passwordEncoder;

    // ─────────────────────────────────────────────────────────────
    // LIRE LE PROFIL
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProfilResponse getMonProfil(String matricule) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        return toResponse(u);
    }

    /**
     * Conversion Utilisateur → ProfilResponse.
     *
     * CORRIGÉ : ajout de siteId et plantId dans le mapping.
     * Ces IDs sont indispensables côté front pour charger
     * les plants du site de l'utilisateur connecté.
     */
    public ProfilResponse toResponse(Utilisateur u) {
        ProfilResponse r = new ProfilResponse();
        r.setId(u.getId());
        r.setNom(u.getNom());
        r.setPrenom(u.getPrenom());
        r.setEmail(u.getEmail());
        r.setMatricule(u.getMatricule());
        r.setRole(u.getRole().name());
        r.setTelephone(u.getTelephone());
        r.setActif(u.getActif());
        r.setDateCreation(u.getDateCreation());

        // ── Site : nom + localisation + ID (priorité au site du plant) ──
        if (u.getPlant() != null && u.getPlant().getSite() != null) {
            r.setSiteId(u.getPlant().getSite().getId());
            r.setSiteNom(u.getPlant().getSite().getNom());
            r.setSiteLocalisation(u.getPlant().getSite().getLocalisation());
        } else if (u.getSite() != null) {
            r.setSiteId(u.getSite().getId());
            r.setSiteNom(u.getSite().getNom());
            r.setSiteLocalisation(u.getSite().getLocalisation());
        }

        // ── Plant : nom + ID (CORRIGÉ : plantId ajouté) ──────────────
        if (u.getPlant() != null) {
            r.setPlantId(u.getPlant().getId());             // ← CORRIGÉ
            r.setPlantNom(u.getPlant().getNom());
        }

        r.setPeutCreerCertif(Boolean.TRUE.equals(u.getPeutCreerCertif()));

        // ── Préférences UI ─────────────────────────────────────────────
        r.setTheme(u.getTheme() != null ? u.getTheme() : "light");
        r.setModeCompact(Boolean.TRUE.equals(u.getModeCompact()));
        r.setAnimations(u.getAnimations() == null || u.getAnimations());
        r.setLangue(u.getLangue() != null ? u.getLangue() : "fr");
        r.setTimezone(u.getTimezone() != null ? u.getTimezone() : "Africa/Tunis");
        r.setDateFormat(u.getDateFormat() != null ? u.getDateFormat() : "DD/MM/YYYY");

        // ── Préférences email notifications ────────────────────────────
        r.setEmailNotificationsActif(Boolean.TRUE.equals(u.getEmailNotificationsActif()));
        r.setEmailNotificationsTypes(parseTypes(u.getEmailNotificationsTypes()));
        r.setPush(Boolean.TRUE.equals(u.getRecevoirNotifications()));

        return r;
    }

    // ─────────────────────────────────────────────────────────────
    // PRÉFÉRENCES
    // ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(String matricule) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        PreferencesResponse r = new PreferencesResponse();
        r.setTheme(u.getTheme() != null ? u.getTheme() : "light");
        r.setModeCompact(Boolean.TRUE.equals(u.getModeCompact()));
        r.setAnimations(u.getAnimations() == null || u.getAnimations());
        r.setLangue(u.getLangue() != null ? u.getLangue() : "fr");
        r.setTimezone(u.getTimezone() != null ? u.getTimezone() : "Africa/Tunis");
        r.setDateFormat(u.getDateFormat() != null ? u.getDateFormat() : "DD/MM/YYYY");
        r.setEmailNotificationsActif(Boolean.TRUE.equals(u.getEmailNotificationsActif()));
        r.setEmailNotificationsTypes(parseTypes(u.getEmailNotificationsTypes()));
        r.setPush(Boolean.TRUE.equals(u.getRecevoirNotifications()));
        return r;
    }

    @Transactional
    public PreferencesResponse sauvegarderPreferences(String matricule, PreferencesRequest req) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (req.getTheme()   != null) u.setTheme(req.getTheme());
        if (req.getLangue()  != null) u.setLangue(req.getLangue());
        if (req.getTimezone()!= null) u.setTimezone(req.getTimezone());
        if (req.getDateFormat()!=null)u.setDateFormat(req.getDateFormat());
        if (req.getModeCompact() != null) u.setModeCompact(req.getModeCompact());
        if (req.getAnimations()  != null) u.setAnimations(req.getAnimations());
        if (req.getEmailNotificationsActif() != null)
            u.setEmailNotificationsActif(req.getEmailNotificationsActif());
        if (req.getEmailNotificationsTypes() != null)
            u.setEmailNotificationsTypes(String.join(",", req.getEmailNotificationsTypes()));
        if (req.getPush() != null) u.setRecevoirNotifications(req.getPush());

        utilisateurRepo.save(u);
        return getPreferences(matricule);
    }

    @Transactional
    public PreferencesResponse savePreferences(String matricule, PreferencesRequest req) {
        return sauvegarderPreferences(matricule, req);
    }

    // ─────────────────────────────────────────────────────────────
    // MODIFIER LE PROFIL
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ProfilResponse modifierProfil(String matricule, UpdateUtilisateurRequest req) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (req.getTelephone() != null) u.setTelephone(req.getTelephone());
        if (req.getEmail()     != null) {
            if (utilisateurRepo.existsByEmailAndIdNot(req.getEmail(), u.getId()))
                throw new BusinessException("Cet email est déjà utilisé.");
            u.setEmail(req.getEmail());
        }

        utilisateurRepo.save(u);
        return toResponse(u);
    }

    @Transactional
    public void changerMotDePasse(String matricule, String ancien, String nouveau) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (!passwordEncoder.matches(ancien, u.getMotDePasse()))
            throw new BusinessException("Mot de passe actuel incorrect.");
        u.setMotDePasse(passwordEncoder.encode(nouveau));
        utilisateurRepo.save(u);
    }

    // ─────────────────────────────────────────────────────────────
    // UTILITAIRE PRIVÉ
    // ─────────────────────────────────────────────────────────────

    private List<String> parseTypes(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.asList(csv.split(","));
    }
}