package com.leoni.pap.dto.request;
import lombok.Data;
import java.util.List;
@Data
public class QuestionQCMRequest {
    private String enonce;
    private List<String> options;   // A, B, C, D
    private List<Integer> bonnesReponsesIndexes; // 0-3
    private Integer points;
    private Integer chronoSecondes;
    private Boolean dansPool;       // si true → dans le pool aléatoire
}