package com.leoni.pap.dto.response;

import com.leoni.pap.entity.enums.StatutPassage;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PassageResponse {

    private Long          id;
    private String        auditeurNom;
    private String        auditeurMatricule;
    private String        certificationTitre;
    private StatutPassage statut;

    // Théorique
    private Long          sessionTestId;
    private Boolean       theoriqueReussi;
    private Integer       scoreTheorique;
    private Integer       scoreTheoriqueMax;
    private Integer       scoreTheoriquePct;
    private Integer       seuilTheorique;
    private LocalDateTime dateTheorique;
    private Integer       nbTentativesTheorique;

    // Pratique
    private Boolean       pratiqueReussi;
    private Integer       nbDefautsIdentifies;
    private Integer       nbDefautsTotal;
    private Double        scorePratique;
    private LocalDateTime datePratique;
    private Integer       nbTentativesPratique;
    private Integer       seuilPratique;   // SPRINT 2 : seuil du test pratique en %

    // Rapport PDF
    private String        rapportPratiqueJson;
    private String        rapportPdfNom;

    // Blocage
    private Boolean       bloque;
    private LocalDateTime dateDeblocage;
    private String        causeDeblocage;


    // Flags
    private Boolean       peutReessayerTheorique;
    private Boolean       peutReessayerPratique;

    // Certificat
    private Long          certificatId;

    // Formation
    private String        formationUrl;
    private String        formationNom;

    // ── NOUVEAU : Certificat workflow expert→chef ─────────────
    private String        statutCertificat;       // NON_GENERE, GENERE, EN_ATTENTE_CHEF, VALIDE_CHEF, INVALIDE_CHEF
    private String        certificatPdfPath;       // chemin relatif pour téléchargement
    private Boolean       certificatEnvoyeChef;
    private String        chefValidateurNom;
    private String        chefValidateurId;
    private String        remarqueExpert;
    private LocalDateTime dateGenerationCertif;
    private LocalDateTime dateValidationChef;
    private String        commentaireChef;
    private String        expertGenerateurNom;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private boolean       annule;
}