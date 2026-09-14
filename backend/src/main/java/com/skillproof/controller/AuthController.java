package com.skillproof.controller;

import com.skillproof.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public static class LoginRequest {
        public String email;
        public String password;
        public String role; // student, industry, academia, institution
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthService.RegisterRequest request) {
        try {
            AuthService.AuthResult result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthService.AuthResult result = authService.login(request.email, request.password, request.role);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        try {
            String email = authentication.getName();
            return ResponseEntity.ok(authService.getCurrentUser(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/demo-users")
    public ResponseEntity<?> getDemoPersonas() {
        Map<String, Object> personas = new HashMap<>();
        personas.put("student", Map.of("email", "leooo@gmail.com", "password", "password123", "role", "student", "name", "leo"));
        personas.put("industry", Map.of("email", "priya.mehta@novatech.io", "password", "password123", "role", "industry", "name", "Priya Mehta"));
        personas.put("academician", Map.of("email", "sverma@iitdelhi.ac.in", "password", "password123", "role", "academician", "name", "Dr. S. K. Verma"));
        personas.put("academia", Map.of("email", "sverma@iitdelhi.ac.in", "password", "password123", "role", "academician", "name", "Dr. S. K. Verma"));
        personas.put("institution", Map.of("email", "dean@abes.ac.in", "password", "password123", "role", "institution", "name", "Prof. Rajesh K. Bansal"));
        return ResponseEntity.ok(personas);
    }
}
