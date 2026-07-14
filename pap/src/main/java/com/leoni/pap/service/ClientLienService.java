package com.leoni.pap.service;

import com.leoni.pap.dto.response.ClientResponse;
import com.leoni.pap.entity.Client;
import com.leoni.pap.entity.ClientLien;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.ClientLienRepository;
import com.leoni.pap.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientLienService {

    private final ClientLienRepository lienRepo;
    private final ClientRepository     clientRepo;
    private final ClientService        clientService;

    // ── Lire les membres d'un client ─────────────────────────────────
    @Transactional(readOnly = true)
    public List<ClientResponse> getMembres(Integer clientParentId) {
        getClient(clientParentId); // vérifie que le parent existe
        return lienRepo.findByClientParentId(clientParentId)
                .stream()
                .map(lien -> clientService.toResponse(lien.getClientMembre()))
                .collect(Collectors.toList());
    }

    // ── Ajouter un lien ──────────────────────────────────────────────
    public void ajouterMembre(Integer clientParentId, Integer clientMembreId) {
        if (clientParentId.equals(clientMembreId))
            throw new BusinessException("Un client ne peut pas être son propre membre.");

        Client parent = getClient(clientParentId);
        Client membre = getClient(clientMembreId);

        // Éviter le doublon
        lienRepo.findByClientParentIdAndClientMembreId(clientParentId, clientMembreId)
                .ifPresent(l -> { throw new BusinessException("Ce lien existe déjà."); });

        ClientLien lien = new ClientLien();
        lien.setClientParent(parent);
        lien.setClientMembre(membre);
        lienRepo.save(lien);
    }

    // ── Supprimer un lien ────────────────────────────────────────────
    public void supprimerMembre(Integer clientParentId, Integer clientMembreId) {
        lienRepo.deleteByClientParentIdAndClientMembreId(clientParentId, clientMembreId);
    }

    // ── Helper ───────────────────────────────────────────────────────
    private Client getClient(Integer id) {
        return clientRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Client introuvable (id=" + id + ")."));
    }
}