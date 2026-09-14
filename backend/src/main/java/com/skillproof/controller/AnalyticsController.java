package com.skillproof.controller;

import com.skillproof.service.InstitutionalAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final InstitutionalAnalyticsService analyticsService;

    @GetMapping("/institution")
    public ResponseEntity<?> getInstitutionOverview() {
        return ResponseEntity.ok(analyticsService.getInstitutionOverview());
    }

    @GetMapping("/demand-vs-availability")
    public ResponseEntity<?> getDemandVsAvailability() {
        return ResponseEntity.ok(analyticsService.getDemandVsAvailabilityMetrics());
    }
}
