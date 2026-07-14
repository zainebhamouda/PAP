package com.leoni.pap.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // ═════════════════════════════════════════════════════════
    // OBJECTMAPPER — nécessaire pour Spring Boot 4
    // Injecté dans SessionTestService, TestTheoriqueService...
    // ═════════════════════════════════════════════════════════
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(
                SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.disable(
                SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.registerModule(new JavaTimeModule());

        // ✅ Casse automatiquement toutes les boucles infinies
        mapper.configure(
                com.fasterxml.jackson.databind.SerializationFeature
                        .FAIL_ON_SELF_REFERENCES, false);
        mapper.setSerializationInclusion(
                com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);

        return mapper;
    }

    // ═════════════════════════════════════════════════════════
    // RESSOURCES STATIQUES — servir images + PDF
    // ═════════════════════════════════════════════════════════
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Sert tous les fichiers du dossier uploads/
        // Le chemin absolu Windows pour votre machine de dev
        String uploadPath = "file:C:/Users/zaine/OneDrive/Bureau/dev/pap/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);

    }

    // ═════════════════════════════════════════════════════════
    // CORS
    // ═════════════════════════════════════════════════════════
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // ✅ allowedOriginPatterns("*") — seule option compatible
                //    avec allowCredentials(true)
                // ❌ allowedOrigins("*") — provoque IllegalArgumentException
                //    quand allowCredentials = true
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }


}