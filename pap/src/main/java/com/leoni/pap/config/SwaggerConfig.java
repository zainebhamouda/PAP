package com.leoni.pap.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Swagger — active le bouton Authorize avec JWT Bearer
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "PAP - Product Audit Platform",
                version = "1.0",
                description = "API de la plateforme d'audit produit LEONI"
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class SwaggerConfig {
}