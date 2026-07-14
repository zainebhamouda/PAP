package com.leoni.pap.service;

import com.leoni.pap.dto.response.DefautReferenceResponse;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class DefautReferenceService {

    private static final String CSV_PATH = "/static/defauts_cablage.csv";

    public List<DefautReferenceResponse> getAll() {
        List<DefautReferenceResponse> result = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        Objects.requireNonNull(
                                getClass().getResourceAsStream(CSV_PATH),
                                "Fichier introuvable : " + CSV_PATH),
                        StandardCharsets.UTF_8))) {

            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                if (line.isBlank()) continue;

                // Séparateur point-virgule
                String[] cols = line.split(";", -1);
                if (cols.length < 3) continue;

                DefautReferenceResponse dto = new DefautReferenceResponse();
                dto.setCode(cols[0].trim());
                dto.setDescriptionEng(cols[1].trim());
                dto.setDescriptionFr(cols[2].trim());
                result.add(dto);
            }

        } catch (Exception e) {
            System.err.println("[DefautReferenceService] Erreur lecture CSV : " + e.getMessage());
        }

        return result;
    }
}