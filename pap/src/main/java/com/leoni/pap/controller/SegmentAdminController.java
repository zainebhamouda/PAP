package com.leoni.pap.controller;

import com.leoni.pap.dto.request.SegmentRequest;
import com.leoni.pap.dto.response.SegmentResponse;
import com.leoni.pap.service.SegmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/segments")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Segments")
public class SegmentAdminController {

    private final SegmentService segmentService;
    public SegmentAdminController(SegmentService segmentService) { this.segmentService = segmentService; }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SegmentResponse>> getAll() {
        return ResponseEntity.ok(segmentService.getAll());
    }

    @GetMapping("/by-plant/{plantId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Segments d'un plant")
    public ResponseEntity<List<SegmentResponse>> getByPlant(@PathVariable Integer plantId) {
        return ResponseEntity.ok(segmentService.getByPlantId(plantId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(segmentService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(description = "{ \"nom\": \"Segment 1\", \"plantId\": 1 }")
    public ResponseEntity<SegmentResponse> creer(@RequestBody SegmentRequest req) {
        return ResponseEntity.ok(segmentService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentResponse> modifier(@PathVariable Integer id, @RequestBody SegmentRequest req) {
        return ResponseEntity.ok(segmentService.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> supprimer(@PathVariable Integer id) {
        segmentService.supprimer(id);
        return ResponseEntity.ok("Segment supprimé.");
    }
}