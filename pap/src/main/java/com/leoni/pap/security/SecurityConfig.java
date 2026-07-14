package com.leoni.pap.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable())
                        .xssProtection(xss -> xss.headerValue(
                                XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                        .contentTypeOptions(ct -> {}))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // ✅ HEAD ajouté — utilisé par le fetch mobile sur /public/verify
                        .requestMatchers(HttpMethod.HEAD, "/api/certificats/public/verify/**").permitAll()

                        // ── Auth & fichiers statiques ──────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/sites/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/certificates/**").permitAll()
                        .requestMatchers("/api/certificats/public/verify/**").permitAll()

                        // ── Swagger ───────────────────────────────────────────
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                                "/v3/api-docs/**", "/webjars/**").permitAll()

                        // ── Public ────────────────────────────────────────────
                        .requestMatchers("/api/public/**").permitAll()

                        .requestMatchers(
                                "/api/audit-special/action/valider/**",
                                "/api/audit-special/action/en-cours/**"
                        ).permitAll()

                        // ── Routes authentifiées ──────────────────────────────
                        .requestMatchers("/api/commun/**").authenticated()
                        .requestMatchers("/api/profil/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/historique/**").authenticated()

                        // ── Rôles spécifiques ─────────────────────────────────
                        .requestMatchers("/api/admin/utilisateurs/auditeurs")
                        .hasAnyRole("ADMIN", "CHEF_SERVICE",
                                "RESPONSABLE_QUALITE_CENTRALE", "EXPERT_PRODUCT_AUDIT")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auditeur/**").hasRole("AUDITEUR")
                        .requestMatchers("/api/chef-service/**").hasRole("CHEF_SERVICE")
                        .requestMatchers("/api/responsable-centrale/**")
                        .hasRole("RESPONSABLE_QUALITE_CENTRALE")
                        .requestMatchers("/api/expert-audit/**").hasRole("EXPERT_PRODUCT_AUDIT")

                        .requestMatchers("/api/audit-special/**")
                        .hasAnyRole("EXPERT_PRODUCT_AUDIT", "AUDITEUR",
                                "RESPONSABLE_MAGASIN", "RESPONSABLE_QUALITE_CENTRALE")

                        .requestMatchers("/api/responsable-magasin/**")
                        .hasRole("RESPONSABLE_MAGASIN")
                        .requestMatchers("/api/ia/**").hasAnyRole(
                                "AUDITEUR", "EXPERT_PRODUCT_AUDIT", "ADMIN",
                                "CHEF_SERVICE", "RESPONSABLE_QUALITE_CENTRALE")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of("*")); // ← remplace setAllowedOrigins

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}