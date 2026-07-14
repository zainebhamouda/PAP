package com.leoni.pap.service;

import com.leoni.pap.dto.request.ClientRequest;
import com.leoni.pap.dto.response.ClientResponse;
import com.leoni.pap.entity.Client;
import com.leoni.pap.entity.ClientLien;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.ClientRepository;
import com.leoni.pap.repository.ClientLienRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientService {

    private final ClientRepository     clientRepo;
    private final ClientLienRepository clientLienRepo;

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void initialiserClientsLeoni() {

        // Nettoyage
        clientLienRepo.deleteAll();
        clientLienRepo.flush();
        clientRepo.deleteAll();
        clientRepo.flush();
        em.clear();

        // ════════════════════════════════════════════════════════════
        // 1. MARQUES (estGroupe = false)
        // ════════════════════════════════════════════════════════════
        List<Object[]> marques = List.of(
                // Groupe VW
                new Object[]{"Volkswagen",  "VW",    "#1B3A6B", "Allemagne",   "Volkswagen AG"},
                new Object[]{"Audi",        "AUDI",  "#BB0A30", "Allemagne",   "Audi AG"},
                new Object[]{"Porsche",     "POR",   "#C8112A", "Allemagne",   "Porsche AG"},
                new Object[]{"Bentley",     "BENT",  "#2D5234", "Royaume-Uni", "Bentley Motors"},
                new Object[]{"Lamborghini", "LAMB",  "#FFC72C", "Italie",      "Automobili Lamborghini"},
                new Object[]{"Skoda",       "SKO",   "#4BA82E", "Tchéquie",    "Škoda Auto"},

                // Groupe BMW
                new Object[]{"BMW",         "BMW",   "#1C69D4", "Allemagne",   "Bayerische Motoren Werke AG"},
                new Object[]{"Mini",        "MINI",  "#F36F21", "Royaume-Uni", "Mini"},
                new Object[]{"Rolls-Royce", "RR",    "#6A2C3E", "Royaume-Uni", "Rolls-Royce Motor Cars"},

                // Groupe Mercedes (MS)
                new Object[]{"Mercedes",    "MS",    "#00A19C", "Allemagne",   "Mercedes-Benz Group AG"},
                new Object[]{"Smart",       "SMART", "#E6E6E6", "Allemagne",   "Smart"},

                // Groupe Stellantis
                new Object[]{"Peugeot",     "PEU",   "#003189", "France",      "Peugeot"},
                new Object[]{"Citroën",     "CIT",   "#8C0000", "France",      "Citroën"},
                new Object[]{"Fiat",        "FIAT",  "#C8112A", "Italie",      "Fiat"},
                new Object[]{"Alfa Romeo",  "ALFA",  "#A50F0F", "Italie",      "Alfa Romeo"},
                new Object[]{"Jeep",        "JEEP",  "#1C5D3A", "États-Unis",  "Jeep"},

                // Groupe Ford
                new Object[]{"Ford",        "FORD",  "#003087", "États-Unis",  "Ford Motor Company"},
                new Object[]{"Lincoln",     "LINC",  "#B8860B", "États-Unis",  "Lincoln"},

                // Autres
                new Object[]{"Jaguar",      "JAG",   "#C8A951", "Royaume-Uni", "Jaguar"},
                new Object[]{"Land Rover",  "LR",    "#4B8B3B", "Royaume-Uni", "Land Rover"},
                new Object[]{"Volvo",       "VOL",   "#00529B", "Suède",       "Volvo Cars"},
                new Object[]{"Tesla",       "TSLA",  "#E82127", "États-Unis",  "Tesla Inc."}
        );

        Map<String, Client> marqueMap = new HashMap<>();
        for (Object[] m : marques) {
            Client c = new Client();
            c.setNom((String) m[0]);
            c.setCode((String) m[1]);
            c.setCouleur((String) m[2]);
            c.setPaysOrigine((String) m[3]);
            c.setDescription((String) m[4]);
            c.setActif(true);
            c.setEstGroupe(false);
            marqueMap.put((String) m[0], clientRepo.save(c));
        }

        // ════════════════════════════════════════════════════════════
        // 2. GROUPES (estGroupe = true) — VW, BMW, MS, etc.
        // ════════════════════════════════════════════════════════════
        List<Object[]> groupes = List.of(
                new Object[]{"VW", "VW", "#1B3A6B", "Allemagne",
                        "Volkswagen AG",
                        new String[]{"Volkswagen", "Audi", "Porsche", "Bentley", "Lamborghini", "Skoda"}},

                new Object[]{"BMW", "BMW", "#1C69D4", "Allemagne",
                        "Bayerische Motoren Werke AG",
                        new String[]{"BMW", "Mini", "Rolls-Royce"}},

                new Object[]{"MS", "MS", "#00A19C", "Allemagne",
                        "Mercedes-Benz Group AG",
                        new String[]{"Mercedes", "Smart"}},

                new Object[]{"Stellantis", "STE", "#0066CC", "International",
                        "Stellantis N.V.",
                        new String[]{"Peugeot", "Citroën", "Fiat", "Alfa Romeo", "Jeep"}},

                new Object[]{"Ford", "FORD", "#003087", "États-Unis",
                        "Ford Motor Company",
                        new String[]{"Ford", "Lincoln"}},

                new Object[]{"Jaguar Land Rover", "JLR", "#C8A951", "Royaume-Uni",
                        "Jaguar Land Rover Automotive PLC",
                        new String[]{"Jaguar", "Land Rover"}},

                new Object[]{"OEM Supplier", "OEM", "#6B7280", "International",
                        "Fournisseurs OEM",
                        new String[]{}}
        );

        for (Object[] g : groupes) {
            Client groupe = new Client();
            groupe.setNom((String) g[0]);
            groupe.setCode((String) g[1]);
            groupe.setCouleur((String) g[2]);
            groupe.setPaysOrigine((String) g[3]);
            groupe.setDescription((String) g[4]);
            groupe.setActif(true);
            groupe.setEstGroupe(true);
            clientRepo.save(groupe);

            String[] nomsMarques = (String[]) g[5];
            for (String nomMarque : nomsMarques) {
                Client marque = marqueMap.get(nomMarque);
                if (marque != null) {
                    ClientLien lien = new ClientLien();
                    lien.setClientParent(groupe);
                    lien.setClientMembre(marque);
                    clientLienRepo.save(lien);
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // CRUD
    // ════════════════════════════════════════════════════════════════

    public ClientResponse creer(ClientRequest req) {
        if (req.getNom() == null || req.getNom().isBlank())
            throw new BusinessException("Le nom du client est obligatoire.");
        if (clientRepo.existsByNomIgnoreCase(req.getNom()))
            throw new BusinessException("Un client avec ce nom existe déjà.");
        Client c = new Client();
        c.setNom(req.getNom().trim());
        c.setCode(req.getCode() != null ? req.getCode().toUpperCase().trim() : null);
        c.setLogoUrl(req.getLogoUrl());
        c.setCouleur(req.getCouleur());
        c.setDescription(req.getDescription());
        c.setPaysOrigine(req.getPaysOrigine());
        c.setActif(req.getActif() != null ? req.getActif() : true);
        c.setEstGroupe(req.getEstGroupe() != null ? req.getEstGroupe() : true);
        return toResponse(clientRepo.save(c));
    }

    public ClientResponse modifier(Integer id, ClientRequest req) {
        Client c = getClient(id);
        if (req.getNom() != null && !req.getNom().isBlank()) {
            if (!c.getNom().equalsIgnoreCase(req.getNom())
                    && clientRepo.existsByNomIgnoreCase(req.getNom()))
                throw new BusinessException("Un client avec ce nom existe déjà.");
            c.setNom(req.getNom().trim());
        }
        if (req.getCode()        != null) c.setCode(req.getCode().toUpperCase().trim());
        if (req.getLogoUrl()     != null) c.setLogoUrl(req.getLogoUrl());
        if (req.getCouleur()     != null) c.setCouleur(req.getCouleur());
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getPaysOrigine() != null) c.setPaysOrigine(req.getPaysOrigine());
        if (req.getActif()       != null) c.setActif(req.getActif());
        if (req.getEstGroupe()   != null) c.setEstGroupe(req.getEstGroupe());
        return toResponse(clientRepo.save(c));
    }

    public void supprimer(Integer id) {
        Client c = getClient(id);
        clientLienRepo.deleteByClientParentId(id);
        clientLienRepo.deleteByClientMembreId(id);
        clientRepo.delete(c);
    }

    public ClientResponse toggleActif(Integer id) {
        Client c = getClient(id);
        c.setActif(!Boolean.TRUE.equals(c.getActif()));
        return toResponse(clientRepo.save(c));
    }

    // ════════════════════════════════════════════════════════════════
    // LECTURE
    // ════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<ClientResponse> getAll() {
        return clientRepo.findAllByOrderByNomAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getActifs() {
        return clientRepo.findByActifTrueOrderByNomAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getGroupesActifs() {
        return clientRepo.findByActifTrueAndEstGroupeTrueOrderByNomAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getMarques() {
        return clientRepo.findByEstGroupeFalseOrderByNomAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientResponse getById(Integer id) {
        return toResponse(getClient(id));
    }

    private Client getClient(Integer id) {
        return clientRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Client introuvable."));
    }

    public ClientResponse toResponse(Client c) {
        ClientResponse r = new ClientResponse();
        r.setId(c.getId());
        r.setNom(c.getNom());
        r.setCode(c.getCode());
        r.setLogoUrl(c.getLogoUrl());
        r.setCouleur(c.getCouleur());
        r.setDescription(c.getDescription());
        r.setActif(c.getActif());
        r.setPaysOrigine(c.getPaysOrigine());
        r.setEstGroupe(c.getEstGroupe());
        return r;
    }
}