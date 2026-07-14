package com.leoni.pap.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class QuestionImageRequest {
    private Integer ordre;           // 1-10
    private String  imageBase64;     // image encodée base64
    private String  imageName;       // nom original du fichier

    private String  bonneReponse;    // défaut correct (toujours obligatoire)

    /**
     * Type de réponse attendue de l'auditeur :
     *   "QCM"   → l'auditeur choisit parmi defautsDisponibles (4 options)
     *   "LIBRE" → l'auditeur écrit librement la réponse dans un champ texte
     *
     * Si null → comportement par défaut = QCM si defautsDisponibles non vide, sinon LIBRE
     */
    private String       typeReponse;        // "QCM" | "LIBRE"
    private List<String> defautsDisponibles; // obligatoire si typeReponse = "QCM" (min 2)

    private Integer points;
    private Integer chronoSecondes;
}