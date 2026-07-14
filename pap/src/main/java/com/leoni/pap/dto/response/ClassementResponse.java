package com.leoni.pap.dto.response;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class ClassementResponse {
    private Integer rang;
    private String nom;
    private String prenom;
    private String matricule;
    private String siteNom;
    private Double scoreFinal;
    private Double scoreTheorique;
    private Double scorePratique;
    private String niveauBadge;
    private LocalDateTime dateObtention;
    private Long joursAvantExpiration;
}