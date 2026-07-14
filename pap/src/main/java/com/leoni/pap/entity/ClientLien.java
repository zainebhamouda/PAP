package com.leoni.pap.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "client_lien",
        uniqueConstraints = @UniqueConstraint(columnNames = {"client_parent_id", "client_membre_id"})
)
public class ClientLien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Le client "principal" (ex: BMW, VW, MS...)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_parent_id", nullable = false)
    private Client clientParent;

    // Le client "membre" lié (parmi les 16 existants)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_membre_id", nullable = false)
    private Client clientMembre;

    // ── Getters & Setters ─────────────────────────────
    public Integer getId()                          { return id; }
    public void    setId(Integer id)                { this.id = id; }
    public Client  getClientParent()                { return clientParent; }
    public void    setClientParent(Client c)        { this.clientParent = c; }
    public Client  getClientMembre()                { return clientMembre; }
    public void    setClientMembre(Client c)        { this.clientMembre = c; }
}