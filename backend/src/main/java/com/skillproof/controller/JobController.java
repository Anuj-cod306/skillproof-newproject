package com.skillproof.controller;

import com.skillproof.entity.Job;
import com.skillproof.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobController {

    private final JobService jobService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    @GetMapping
    public ResponseEntity<?> getJobs(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok(jobService.getJobsForStudent(auth.getName()));
        }
        return ResponseEntity.ok(jobService.getAllJobsPublic());
    }

    @GetMapping("/matched")
    public ResponseEntity<?> getMatchedOpportunities(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok(jobService.getJobsForStudent(auth.getName()));
        }
        return ResponseEntity.ok(jobService.getAllJobsPublic());
    }

    @PostMapping
    public ResponseEntity<?> createJob(Authentication auth, @RequestBody JobService.CreateJobRequest req) {
        try {
            Job job = jobService.createJob(getEmail(auth), req);
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{jobId}/apply")
    public ResponseEntity<?> applyForJob(Authentication auth, @PathVariable Long jobId) {
        try {
            return ResponseEntity.ok(jobService.applyForJob(getEmail(auth), jobId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(Authentication auth) {
        return ResponseEntity.ok(jobService.getStudentApplications(getEmail(auth)));
    }

    @PostMapping("/applications/{applicationId}/respond")
    public ResponseEntity<?> respondToOffer(
            Authentication auth,
            @PathVariable Long applicationId,
            @RequestBody JobService.RespondToOfferRequest req
    ) {
        try {
            return ResponseEntity.ok(jobService.respondToOffer(
                    getEmail(auth),
                    applicationId,
                    req != null ? req.action : null,
                    req != null ? req.remarks : null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
