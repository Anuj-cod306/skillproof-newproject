package com.skillproof.controller;

import com.skillproof.entity.CollaborativeProject;
import com.skillproof.entity.FacultyProgram;
import com.skillproof.service.AcademiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/academia")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademiaController {

    private final AcademiaService academiaService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    @GetMapping("/programs")
    public ResponseEntity<?> getFacultyPrograms(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(academiaService.getFacultyPrograms(type));
    }

    @PostMapping("/programs")
    public ResponseEntity<?> createProgram(@RequestBody FacultyProgram program) {
        try {
            return ResponseEntity.ok(academiaService.createFacultyProgram(program));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects")
    public ResponseEntity<?> getCollaborativeProjects() {
        return ResponseEntity.ok(academiaService.getCollaborativeProjects());
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody CollaborativeProject project) {
        try {
            return ResponseEntity.ok(academiaService.createCollaborativeProject(project));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mentorship/students")
    public ResponseEntity<?> getMentorshipStudents(Authentication auth) {
        return ResponseEntity.ok(academiaService.getMentorshipStudents(getEmail(auth)));
    }

    @GetMapping("/mentorship/students/{studentId}")
    public ResponseEntity<?> getStudentMentorshipDetail(Authentication auth, @PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(academiaService.getStudentMentorshipDetail(getEmail(auth), studentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/mentorship/students/{studentId}/endorsement")
    public ResponseEntity<?> updateStudentEndorsement(
            Authentication auth,
            @PathVariable Long studentId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        try {
            Boolean endorsed = null;
            String projectTitle = null;
            String remarks = null;
            if (body != null) {
                if (body.get("endorsed") != null) {
                    endorsed = Boolean.valueOf(body.get("endorsed").toString());
                }
                if (body.get("projectTitle") != null) {
                    projectTitle = body.get("projectTitle").toString();
                }
                if (body.get("remarks") != null) {
                    remarks = body.get("remarks").toString();
                }
            }
            return ResponseEntity.ok(academiaService.updateStudentEndorsement(getEmail(auth), studentId, endorsed, projectTitle, remarks));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/programs/{programId}/nominate")
    public ResponseEntity<?> nominateProgram(Authentication auth, @PathVariable Long programId) {
        try {
            return ResponseEntity.ok(academiaService.nominateFacultyProgram(getEmail(auth), programId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-nominations")
    public ResponseEntity<?> getMyNominations(Authentication auth) {
        try {
            return ResponseEntity.ok(academiaService.getMyNominations(getEmail(auth)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/opportunity-approvals")
    public ResponseEntity<?> getOpportunityApprovals(Authentication auth) {
        try {
            return ResponseEntity.ok(academiaService.getOpportunityApprovals(getEmail(auth)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/opportunity-approvals/{applicationId}/respond")
    public ResponseEntity<?> respondToOpportunityApproval(
            Authentication auth,
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> body
    ) {
        try {
            String action = body != null ? body.get("action") : null;
            String comments = body != null ? body.get("comments") : null;
            return ResponseEntity.ok(academiaService.respondToOpportunityApproval(getEmail(auth), applicationId, action, comments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
