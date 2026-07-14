package com.leoni.pap.repository;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistoriqueRepository extends JpaRepository<Historique, Long> {

    // Par utilisateur (acteur)
    List<Historique> findByUtilisateurOrderByDateActionDesc(Utilisateur u);
    // Par utilisateur + type
    List<Historique> findByUtilisateurAndTypeOrderByDateActionDesc(
            Utilisateur u, TypeHistorique type);

    // Par certification
    List<Historique> findByCertificationOrderByDateActionDesc(Certification c);

    // Par session
    List<Historique> findBySessionTestOrderByDateActionDesc(SessionTest s);

    // Par test théorique
    List<Historique> findByTestTheoriqueOrderByDateActionDesc(TestTheorique t);

    // Par type (ex: tous les BLOQUE du dernier mois)
    @Query("SELECT h FROM Historique h WHERE h.type = :type " +
            "AND h.dateAction >= :depuis ORDER BY h.dateAction DESC")
    List<Historique> findByTypeDepuis(@Param("type") TypeHistorique type,
                                      @Param("depuis") LocalDateTime depuis);

    // Historique complet d'un auditeur (lui + certifs + sessions)
    @Query("SELECT h FROM Historique h WHERE h.utilisateur = :u OR h.cible = :u " +
            "ORDER BY h.dateAction DESC")
    List<Historique> findHistoriqueCompletAuditeur(@Param("u") Utilisateur u);

    // Count par type
    long countByType(TypeHistorique type);

    // ── PLANT (isolation par plant) ───────────────────────────
    // Historique de tous les acteurs (auditeur, expert, chef de service…)
    // rattachés à un même plant, filtrable par type et/ou rôle de l'acteur.
    // Un chef de service / expert d'un plant NE VOIT JAMAIS l'historique
    // d'un autre plant : le plant est fixé côté serveur (voir Controller).
    @Query("SELECT h FROM Historique h WHERE h.plant = :plant " +
            "AND (:type IS NULL OR h.type = :type) " +
            "AND (:role IS NULL OR h.utilisateur.role = :role) " +
            "ORDER BY h.dateAction DESC")
    List<Historique> findByPlantFiltre(@Param("plant") Plant plant,
                                       @Param("type") TypeHistorique type,
                                       @Param("role") RoleUser role);

    // Historique lié à un audit précis (planification, modif, réassignation…)
    List<Historique> findByAuditOrderByDateActionDesc(AuditProduit audit);

    // Historique de tous les plants (admin / responsable qualité)
    @Query("SELECT h FROM Historique h ORDER BY h.dateAction DESC")
    List<Historique> findAllByOrderByDateActionDesc();

    // Historique par plant (responsable qualité peut filtrer)
    @Query("SELECT h FROM Historique h WHERE h.plant.id = :plantId ORDER BY h.dateAction DESC")
    List<Historique> findByPlantIdOrderByDateActionDesc(@Param("plantId") Integer plantId);
}