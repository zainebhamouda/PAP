package com.leoni.pap.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

public class FicheReparationRequest {

    private String zoneAffectee;
    private String origineNC;
    private String codeArticle;
    private String descriptionNC;
    private String remarquesOptionnelles;
    private List<Destinataire> destinataires;

    public FicheReparationRequest() {}

    public String getZoneAffectee()                        { return zoneAffectee; }
    public void setZoneAffectee(String zoneAffectee)       { this.zoneAffectee = zoneAffectee; }

    public String getOrigineNC()                           { return origineNC; }
    public void setOrigineNC(String origineNC)             { this.origineNC = origineNC; }

    public String getCodeArticle()                         { return codeArticle; }
    public void setCodeArticle(String codeArticle)         { this.codeArticle = codeArticle; }

    public String getDescriptionNC()                       { return descriptionNC; }
    public void setDescriptionNC(String descriptionNC)     { this.descriptionNC = descriptionNC; }

    public String getRemarquesOptionnelles()               { return remarquesOptionnelles; }
    public void setRemarquesOptionnelles(String r)         { this.remarquesOptionnelles = r; }

    public List<Destinataire> getDestinataires()           { return destinataires; }
    public void setDestinataires(List<Destinataire> d)     { this.destinataires = d; }



    // ── Classe interne Destinataire ───────────────────────────
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Destinataire {

        private String email;
        private String matricule;
        private String nom;
        private Integer utilisateurId;

        public Destinataire() {}

        public String getEmail()             { return email; }
        public void setEmail(String email)   { this.email = email; }

        public String getNom()               { return nom; }
        public void setNom(String nom)       { this.nom = nom; }

        public String getMatricule() {
            if (matricule != null && !matricule.isBlank()) return matricule;
            if (nom       != null && !nom.isBlank())       return nom;
            return email;
        }
        public void setMatricule(String matricule) { this.matricule = matricule; }

        public String getNomAffichage() {
            if (nom       != null && !nom.isBlank())       return nom;
            if (matricule != null && !matricule.isBlank()) return matricule;
            return email;
        }

        public Integer getUtilisateurId()                    { return utilisateurId; }
        public void setUtilisateurId(Integer utilisateurId)  { this.utilisateurId = utilisateurId; }

    }
}