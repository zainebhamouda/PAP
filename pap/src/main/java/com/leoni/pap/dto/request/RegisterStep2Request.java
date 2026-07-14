package com.leoni.pap.dto.request;

/**
 * Étape 2 : Choix du rôle et du site
 */
public class RegisterStep2Request {
    private String matricule;
    private String roleChoisi;  // ex: "AUDITEUR", "CHEF_SERVICE"
    private Integer siteId;
    private Integer plantId;

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getRoleChoisi() { return roleChoisi; }
    public void setRoleChoisi(String roleChoisi) { this.roleChoisi = roleChoisi; }

    public Integer getSiteId() { return siteId; }
    public void setSiteId(Integer siteId) { this.siteId = siteId; }

    public Integer getPlantId()              { return plantId; }
    public void    setPlantId(Integer v)     { this.plantId = v; }
}