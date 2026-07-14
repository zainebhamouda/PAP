package com.leoni.pap.dto.response;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Integer       id;
    private String        titre;
    private String        message;
    private String        type;
    private Boolean       lue;
    private String        lienAction;
    private Integer       priorite;
    private LocalDateTime dateCreation;

    public Integer       getId()            { return id; }
    public void          setId(Integer v)   { this.id = v; }
    public String        getTitre()         { return titre; }
    public void          setTitre(String v) { this.titre = v; }
    public String        getMessage()       { return message; }
    public void          setMessage(String v){ this.message = v; }
    public String        getType()          { return type; }
    public void          setType(String v)  { this.type = v; }
    public Boolean       getLue()           { return lue; }
    public void          setLue(Boolean v)  { this.lue = v; }
    public String        getLienAction()    { return lienAction; }
    public void          setLienAction(String v){ this.lienAction = v; }
    public Integer       getPriorite()      { return priorite; }
    public void          setPriorite(Integer v){ this.priorite = v; }
    public LocalDateTime getDateCreation()  { return dateCreation; }
    public void          setDateCreation(LocalDateTime v){ this.dateCreation = v; }
}