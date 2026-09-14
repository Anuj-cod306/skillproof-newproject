package com.skillproof.controller;

import com.skillproof.service.PassportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/passports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PassportController {

    private final PassportService passportService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    @GetMapping("/my-passport")
    public ResponseEntity<?> getMyPassport(Authentication auth) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(passportService.getMyPassport(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generatePassport(Authentication auth) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(passportService.generateOrUpdatePassport(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/recalibrate")
    public ResponseEntity<?> recalibratePassport(Authentication auth) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(passportService.generateOrUpdatePassport(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/public/{hash}")
    public ResponseEntity<?> getPublicPassport(@PathVariable String hash) {
        try {
            return ResponseEntity.ok(passportService.getPublicPassport(hash));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Passport not found: " + hash));
        }
    }
}
