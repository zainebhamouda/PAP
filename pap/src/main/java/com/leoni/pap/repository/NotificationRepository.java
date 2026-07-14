package com.leoni.pap.repository;

import com.leoni.pap.entity.Notification;
import com.leoni.pap.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    void deleteByDestinataire(Utilisateur destinataire);
    // Toutes les notifs d'un utilisateur
    List<Notification> findByDestinataireOrderByDateCreationDesc(Utilisateur destinataire);

    // Notifs non lues
    List<Notification> findByDestinataireAndLueFalseOrderByDateCreationDesc(Utilisateur destinataire);
    // Supprimer toutes les notifications liées à une certification
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.certification.id = :certificationId")
    void deleteByCertificationId(@Param("certificationId") Long certificationId);
    // Compter les non lues
    long countByDestinataireAndLueFalse(Utilisateur destinataire);

    // Marquer toutes lues
    @Modifying
    @Query("UPDATE Notification n SET n.lue = true, n.dateLecture = :now " +
            "WHERE n.destinataire = :destinataire AND n.lue = false")
    void marquerToutesLues(@Param("destinataire") Utilisateur destinataire,
                           @Param("now") LocalDateTime now);

    // Supprimer les notifs lues de plus de 30 jours
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.lue = true AND n.dateLecture < :avant")
    void supprimerAnciennesLues(@Param("avant") LocalDateTime avant);
}