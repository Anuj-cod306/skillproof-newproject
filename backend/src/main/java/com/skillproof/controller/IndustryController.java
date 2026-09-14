package com.skillproof.controller;

import com.skillproof.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/industry")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IndustryController {

    private final JobService jobService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    @GetMapping("/candidates")
    public ResponseEntity<?> searchCandidates(
            Authentication auth,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Double minReadiness) {
        return ResponseEntity.ok(jobService.getCandidatesForCompany(getEmail(auth), search, skill, minReadiness));
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(Authentication auth) {
        try {
            return ResponseEntity.ok(jobService.getCompanyApplications(getEmail(auth)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/applications/{applicationId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long applicationId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required."));
        }
        try {
            return ResponseEntity.ok(jobService.updateApplicationStatus(applicationId, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/applications/{applicationId}/send-joining-letter")
    public ResponseEntity<?> sendJoiningLetter(
            Authentication auth,
            @PathVariable Long applicationId,
            @RequestBody JobService.SendJoiningLetterRequest req
    ) {
        try {
            return ResponseEntity.ok(jobService.sendJoiningLetter(applicationId, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
