package com.skillproof.controller;

import com.skillproof.service.CompetitiveCodingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/student/competitive-coding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompetitiveCodingController {

    private final CompetitiveCodingService competitiveCodingService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    @GetMapping
    public ResponseEntity<?> getCompetitiveCodingData(Authentication auth) {
        return ResponseEntity.ok(competitiveCodingService.getStudentCompetitiveData(getEmail(auth)));
    }

    // LeetCode endpoints
    @PostMapping(value = {"/leetcode/connect", "/connect/leetcode"})
    public ResponseEntity<?> connectLeetCode(Authentication auth, 
            @RequestParam(required = false) String username,
            @RequestBody(required = false) Map<String, String> body) {
        String email = getEmail(auth);
        try {
            String uname = username;
            if ((uname == null || uname.isBlank()) && body != null) {
                uname = body.getOrDefault("username", body.get("profileUrl"));
            }
            return ResponseEntity.ok(competitiveCodingService.connectProfile(email, "LEETCODE", uname));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Connection failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Connection failed"
            ));
        }
    }

    @PostMapping(value = {"/leetcode/verify", "/verify/leetcode"})
    public ResponseEntity<?> verifyLeetCode(Authentication auth, 
            @RequestParam(required = false) String username,
            @RequestBody(required = false) Map<String, String> body) {
        String email = getEmail(auth);
        try {
            String uname = username;
            if ((uname == null || uname.isBlank()) && body != null) {
                uname = body.getOrDefault("username", body.get("profileUrl"));
            }
            if (uname != null && !uname.isBlank()) {
                competitiveCodingService.connectProfile(email, "LEETCODE", uname);
            }
            return ResponseEntity.ok(competitiveCodingService.verifyProfile(email, "LEETCODE"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Verification failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Verification failed"
            ));
        }
    }

    @PostMapping("/leetcode/reverify")
    public ResponseEntity<?> reverifyLeetCode(Authentication auth) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(competitiveCodingService.reverifyProfile(email, "LEETCODE"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Re-verification failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Re-verification failed"
            ));
        }
    }

    // Codeforces endpoints
    @PostMapping(value = {"/codeforces/connect", "/connect/codeforces"})
    public ResponseEntity<?> connectCodeforces(Authentication auth, 
            @RequestParam(required = false) String handle,
            @RequestParam(required = false) String username,
            @RequestBody(required = false) Map<String, String> body) {
        String email = getEmail(auth);
        try {
            String uname = handle != null ? handle : username;
            if ((uname == null || uname.isBlank()) && body != null) {
                uname = body.getOrDefault("handle", body.getOrDefault("username", body.get("profileUrl")));
            }
            return ResponseEntity.ok(competitiveCodingService.connectProfile(email, "CODEFORCES", uname));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Connection failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Connection failed"
            ));
        }
    }

    @PostMapping(value = {"/codeforces/verify", "/verify/codeforces"})
    public ResponseEntity<?> verifyCodeforces(Authentication auth, 
            @RequestParam(required = false) String handle,
            @RequestParam(required = false) String username,
            @RequestBody(required = false) Map<String, String> body) {
        String email = getEmail(auth);
        try {
            String uname = handle != null ? handle : username;
            if ((uname == null || uname.isBlank()) && body != null) {
                uname = body.getOrDefault("handle", body.getOrDefault("username", body.get("profileUrl")));
            }
            if (uname != null && !uname.isBlank()) {
                competitiveCodingService.connectProfile(email, "CODEFORCES", uname);
            }
            return ResponseEntity.ok(competitiveCodingService.verifyProfile(email, "CODEFORCES"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Verification failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Verification failed"
            ));
        }
    }

    @PostMapping("/codeforces/reverify")
    public ResponseEntity<?> reverifyCodeforces(Authentication auth) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(competitiveCodingService.reverifyProfile(email, "CODEFORCES"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Re-verification failed",
                "verificationStatus", "FAILED",
                "keyFinding", e.getMessage() != null ? e.getMessage() : "Re-verification failed"
            ));
        }
    }

    // Disconnect
    @DeleteMapping(value = {"/{platform}", "/disconnect/{platform}"})
    public ResponseEntity<?> disconnect(Authentication auth, @PathVariable String platform) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(competitiveCodingService.disconnectProfile(email, platform));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<?> disconnectParam(Authentication auth, @RequestParam String platform) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(competitiveCodingService.disconnectProfile(email, platform));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
