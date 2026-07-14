package com.leoni.pap.repository;

import com.leoni.pap.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SiteRepository extends JpaRepository<Site, Integer> {
    
}