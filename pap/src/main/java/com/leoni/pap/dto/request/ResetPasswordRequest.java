// src/main/java/com/leoni/pap/dto/request/ResetPasswordRequest.java
package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequest {

    @NotBlank
    private String matricule;

    @NotBlank
    private String password;
    @NotBlank
    private String confirm;

    public String getConfirm() { return confirm; }
    public void setConfirm(String confirm) { this.confirm = confirm; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}