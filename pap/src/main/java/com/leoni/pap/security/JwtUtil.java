package com.leoni.pap.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Clé secrète — minimum 32 caractères pour HS256
    private final String SECRET    = "pap_leoni_jwt_secret_key_minimum_32chars!!";
    private final long   EXPIRATION = 86400000L; // 24h

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    /** Génère un token JWT */
    public String generateToken(String matricule, String role) {
        return Jwts.builder()
                .subject(matricule)           // 0.12.x : .subject() au lieu de .setSubject()
                .claim("role", role)
                .issuedAt(new Date())         // 0.12.x : .issuedAt()
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION)) // 0.12.x : .expiration()
                .signWith(getSigningKey())     // 0.12.x : plus besoin de spécifier l'algo
                .compact();
    }

    /** Extrait le matricule depuis le token */
    public String extractMatricule(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extrait le rôle depuis le token */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Vérifie si le token est valide et non expiré */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()                  // 0.12.x : .parser() au lieu de .parserBuilder()
                .verifyWith(getSigningKey())   // 0.12.x : .verifyWith()
                .build()
                .parseSignedClaims(token)     // 0.12.x : .parseSignedClaims() au lieu de .parseClaimsJws()
                .getPayload();                // 0.12.x : .getPayload() au lieu de .getBody()
    }
}