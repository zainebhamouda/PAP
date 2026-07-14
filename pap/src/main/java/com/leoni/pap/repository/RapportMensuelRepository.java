package com.leoni.pap.repository;

import com.leoni.pap.entity.RapportMensuel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RapportMensuelRepository extends JpaRepository<RapportMensuel, Long> {

    Optional<RapportMensuel> findByPlantIdAndAnneeAndMois(Integer plantId, Integer annee, Integer mois);

    List<RapportMensuel> findAllByOrderByAnneeDescMoisDesc();

    /**
     * ✅ Liste filtrée par année/plant, SANS toucher à la colonne texte
     * plant.nom — utilisée quand aucune recherche libre n'est demandée.
     * (Évite d'exécuter un LOWER(nom) inutilement à chaque chargement de
     * la page ; voir rechercherParTexte pour la recherche par nom.)
     */
    @Query("""
        SELECT r FROM RapportMensuel r
        WHERE (:annee IS NULL OR r.annee = :annee)
          AND (:plantId IS NULL OR r.plant.id = :plantId)
        ORDER BY r.annee DESC, r.mois DESC, r.plant.nom ASC
        """)
    List<RapportMensuel> rechercherSansTexte(@Param("annee") Integer annee,
                                             @Param("plantId") Integer plantId);

    /**
     * ✅ Liste + recherche libre sur le nom du plant, restreinte au plant de
     * l'utilisateur connecté (:plantId). Si :plantId est null (rôle central
     * sans plant assigné, ex: RESPONSABLE_QUALITE_CENTRALE ou ADMIN), aucune
     * restriction n'est appliquée et tous les plants sont visibles.
     *
     * ⚠️ N'appeler cette méthode que lorsque `recherche` est réellement
     * renseignée (non null / non vide) — voir rechercherSansTexte() sinon.
     * Lier :recherche à null dans une expression CONCAT/LOWER fait échouer
     * la requête côté PostgreSQL (le driver ne peut pas déterminer le type
     * du paramètre et retombe sur bytea → "lower(bytea) n'existe pas"),
     * même si la colonne plant.nom est correctement typée en varchar.
     */
    @Query("""
        SELECT r FROM RapportMensuel r
        WHERE (:annee IS NULL OR r.annee = :annee)
          AND (:plantId IS NULL OR r.plant.id = :plantId)
          AND LOWER(r.plant.nom) LIKE LOWER(CONCAT('%', CAST(:recherche AS string), '%'))
        ORDER BY r.annee DESC, r.mois DESC, r.plant.nom ASC
        """)
    List<RapportMensuel> rechercherParTexte(@Param("annee") Integer annee,
                                            @Param("recherche") String recherche,
                                            @Param("plantId") Integer plantId);

    @Query("SELECT DISTINCT r.annee FROM RapportMensuel r WHERE (:plantId IS NULL OR r.plant.id = :plantId) ORDER BY r.annee DESC")
    List<Integer> findAnneesDisponibles(@Param("plantId") Integer plantId);
}