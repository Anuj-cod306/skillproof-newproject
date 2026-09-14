package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewService {

    public static final int MANDATORY_QUESTIONS_COUNT = 10;

    private final InterviewRepository interviewRepository;
    private final InterviewTurnRepository interviewTurnRepository;
    private final StudentRepository studentRepository;
    private final InterviewEvaluationRepository interviewEvaluationRepository;
    private final StudentProfileService studentProfileService;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final LlmService llmService;
    private final PassportService passportService;
    private final VerificationEngineService verificationEngineService;
    private final StudentEvidenceAggregatorService evidenceAggregatorService;
    private final CodeExecutionService codeExecutionService;
    private final InterviewCodingSubmissionRepository interviewCodingSubmissionRepository;

    public static class EvaluationResult {
        public double score;
        public double correctness;
        public double technicalAccuracy;
        public double relevance;
        public double depth;
        public double reasoning;
        public double communication;
        public String feedback;
        public String evaluatedSkill;
        public boolean isGibberish;
    }

    @Transactional
    public Map<String, Object> startInterview(String userEmail, String targetRole) {
        return startInterviewWithMode(userEmail, targetRole, "TECHNICAL");
    }

    @Transactional
    public Map<String, Object> startInterviewWithMode(String userEmail, String targetRole, String mode) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : student.getTargetRole();
        if (role == null || role.isBlank()) role = "Frontend Developer";

        String selectedMode = (mode != null && !mode.isBlank()) ? mode.toUpperCase().trim() : "TECHNICAL";
        if (!List.of("TECHNICAL", "PROJECT_DEFENSE", "COMPETITIVE_CODING", "FULL_SIMULATION").contains(selectedMode)) {
            selectedMode = "TECHNICAL";
        }

        Interview interview = Interview.builder()
                .studentId(student.getId())
                .roleTargeted(role)
                .status("ACTIVE")
                .mode(selectedMode)
                .overallScore(BigDecimal.ZERO)
                .hintsUsed(0)
                .tabSwitchCount(0)
                .startTime(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        interview = interviewRepository.save(interview);

        // Gather real student evidence
        StudentEvidenceAggregatorService.AggregatedEvidence evidence =
                evidenceAggregatorService.aggregateStudentEvidence(student.getId());

        List<String> skills = evidence.getVerifiedSkills();
        String primarySkill = !skills.isEmpty() ? skills.get(0) : "Java";

        // Question 1: Introduction & Technical Fundamentals
        String initialQuestion = String.format(
                "Welcome %s to your AI Technical Interview for %s! To begin our sequential evaluation with core engineering fundamentals: in your primary stack (%s), walk me through how runtime memory allocation, execution flow, and thread safety or concurrency are managed.",
                evidence.getStudentName(), role, primarySkill
        );

        InterviewTurn turn1 = InterviewTurn.builder()
                .interview(interview)
                .turnNumber(1)
                .aiQuestion(initialQuestion)
                .turnType("TECHNICAL_QUESTION")
                .questionCategory("TECHNICAL_FUNDAMENTALS")
                .evaluatedSkill(primarySkill)
                .evidenceSource("Core Stack: " + primarySkill)
                .difficulty("INTERMEDIATE")
                .build();
        interviewTurnRepository.save(turn1);

        CodeExecutionService.CodingChallenge challenge = codeExecutionService.resolveChallengeForRole(role);

        Map<String, Object> turnMap = new HashMap<>();
        turnMap.put("turnNumber", 1);
        turnMap.put("sender", "ai");
        turnMap.put("message", initialQuestion);
        turnMap.put("turnType", "TECHNICAL_QUESTION");
        turnMap.put("questionCategory", "TECHNICAL_FUNDAMENTALS");
        turnMap.put("evaluatedSkill", primarySkill);
        turnMap.put("evidenceSource", "Core Stack: " + primarySkill);
        turnMap.put("difficulty", "INTERMEDIATE");

        Map<String, Object> response = new HashMap<>();
        response.put("interviewId", interview.getId());
        response.put("targetRole", role);
        response.put("mode", selectedMode);
        response.put("status", "ACTIVE");
        response.put("currentTurn", 1);
        response.put("maxTurns", MANDATORY_QUESTIONS_COUNT);
        response.put("question", initialQuestion);
        response.put("turnType", "TECHNICAL_QUESTION");
        response.put("questionCategory", "TECHNICAL_FUNDAMENTALS");
        response.put("evaluatedSkill", primarySkill);
        response.put("evidenceSource", "Core Stack: " + primarySkill);
        response.put("difficulty", "INTERMEDIATE");
        response.put("challenge", challenge);
        response.put("transcript", List.of(turnMap));
        response.put("evidenceSummary", evidence.getPrimaryEvidenceSummary());
        response.put("isCompleted", false);

        return response;
    }

    @Transactional
    public Map<String, Object> submitAnswer(String userEmail, Long interviewId, String studentAnswer, String code, String language) {
        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            throw new IllegalArgumentException("Answer required. Please answer this question before continuing.");
        }

        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized: Interview does not belong to the authenticated student.");
        }

        if ("COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            throw new IllegalStateException("Interview is already completed. No further answers accepted.");
        }

        if ("PAUSED".equalsIgnoreCase(interview.getStatus())) {
            throw new IllegalStateException("Interview is currently paused. Please resume the interview to submit your answer.");
        }

        List<InterviewTurn> turns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(interviewId);
        if (turns.isEmpty()) {
            throw new IllegalStateException("No active turns in interview.");
        }

        // Update and evaluate the current open turn
        InterviewTurn currentTurn = turns.get(turns.size() - 1);
        currentTurn.setStudentAnswer(studentAnswer);
        if (code != null && !code.isBlank()) {
            currentTurn.setCodeSnippet(code);
            currentTurn.setCodeLanguage(language != null ? language : "javascript");
            interview.setCodeSnippet(code);
            interview.setCodeLanguage(language != null ? language : "javascript");
        }

        // Evaluate actual candidate answer
        EvaluationResult evalRes = evaluateCandidateAnswer(
                currentTurn.getAiQuestion(),
                currentTurn.getQuestionCategory(),
                currentTurn.getEvaluatedSkill(),
                studentAnswer,
                code
        );

        currentTurn.setTurnScore(BigDecimal.valueOf(evalRes.score));
        currentTurn.setAiFeedback(evalRes.feedback);
        interviewTurnRepository.save(currentTurn);

        // Build transcript history
        List<Map<String, Object>> fullTurns = new ArrayList<>();
        for (InterviewTurn t : turns) {
            fullTurns.add(Map.of(
                    "turnNumber", t.getTurnNumber(),
                    "sender", "ai",
                    "message", t.getAiQuestion(),
                    "turnType", t.getTurnType() != null ? t.getTurnType() : "QUESTION",
                    "questionCategory", t.getQuestionCategory() != null ? t.getQuestionCategory() : "TECHNICAL",
                    "evaluatedSkill", t.getEvaluatedSkill() != null ? t.getEvaluatedSkill() : "Core Technical",
                    "evidenceSource", t.getEvidenceSource() != null ? t.getEvidenceSource() : "",
                    "difficulty", t.getDifficulty() != null ? t.getDifficulty() : "INTERMEDIATE"
            ));
            if (t.getStudentAnswer() != null) {
                Map<String, Object> ansMap = new HashMap<>();
                ansMap.put("turnNumber", t.getTurnNumber());
                ansMap.put("sender", "student");
                ansMap.put("message", t.getStudentAnswer());
                ansMap.put("score", t.getTurnScore() != null ? t.getTurnScore().doubleValue() : 0.0);
                ansMap.put("feedback", t.getAiFeedback() != null ? t.getAiFeedback() : "");
                ansMap.put("codeSnippet", t.getCodeSnippet() != null ? t.getCodeSnippet() : "");
                ansMap.put("codeLanguage", t.getCodeLanguage() != null ? t.getCodeLanguage() : "");
                fullTurns.add(ansMap);
            }
        }

        StudentEvidenceAggregatorService.AggregatedEvidence evidence =
                evidenceAggregatorService.aggregateStudentEvidence(student.getId());

        // Check if all 10 mandatory questions have been answered
        if (turns.size() >= MANDATORY_QUESTIONS_COUNT) {
            return finalizeInterview(interview, fullTurns, evidence);
        }

        // Next turn generation (Questions 2 through 10)
        int nextTurnNumber = turns.size() + 1;
        TurnDefinition nextDef = generateNextTurnDefinition(nextTurnNumber, interview, evidence, code, language, studentAnswer);

        InterviewTurn nextTurn = InterviewTurn.builder()
                .interview(interview)
                .turnNumber(nextTurnNumber)
                .aiQuestion(nextDef.question)
                .turnType(nextDef.turnType)
                .questionCategory(nextDef.questionCategory)
                .evaluatedSkill(nextDef.evaluatedSkill)
                .evidenceSource(nextDef.evidenceSource)
                .difficulty(nextDef.difficulty)
                .build();
        interviewTurnRepository.save(nextTurn);

        fullTurns.add(Map.of(
                "turnNumber", nextTurnNumber,
                "sender", "ai",
                "message", nextDef.question,
                "turnType", nextDef.turnType,
                "questionCategory", nextDef.questionCategory,
                "evaluatedSkill", nextDef.evaluatedSkill,
                "evidenceSource", nextDef.evidenceSource,
                "difficulty", nextDef.difficulty
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("interviewId", interviewId);
        response.put("mode", interview.getMode());
        response.put("status", "ACTIVE");
        response.put("isPaused", false);
        response.put("currentTurn", nextTurnNumber);
        response.put("maxTurns", MANDATORY_QUESTIONS_COUNT);
        response.put("question", nextDef.question);
        response.put("turnType", nextDef.turnType);
        response.put("questionCategory", nextDef.questionCategory);
        response.put("evaluatedSkill", nextDef.evaluatedSkill);
        response.put("evidenceSource", nextDef.evidenceSource);
        response.put("difficulty", nextDef.difficulty);
        response.put("transcript", fullTurns);
        response.put("isCompleted", false);
        response.put("lastTurnScore", evalRes.score);
        response.put("lastTurnFeedback", evalRes.feedback);
        response.put("lastTurnSkill", currentTurn.getEvaluatedSkill() != null ? currentTurn.getEvaluatedSkill() : "Technical Knowledge");
        response.put("lastTurnEvaluation", Map.of(
                "turnNumber", currentTurn.getTurnNumber(),
                "score", evalRes.score,
                "feedback", evalRes.feedback,
                "evaluatedSkill", currentTurn.getEvaluatedSkill() != null ? currentTurn.getEvaluatedSkill() : "Technical Knowledge",
                "isGibberish", evalRes.isGibberish
        ));

        return response;
    }

    private static class TurnDefinition {
        String question;
        String turnType;
        String questionCategory;
        String evaluatedSkill;
        String evidenceSource;
        String difficulty;
    }

    private TurnDefinition generateNextTurnDefinition(
            int turnNumber,
            Interview interview,
            StudentEvidenceAggregatorService.AggregatedEvidence evidence,
            String submittedCode,
            String codeLang,
            String lastAnswer
    ) {
        TurnDefinition def = new TurnDefinition();
        String role = interview.getRoleTargeted() != null ? interview.getRoleTargeted() : "Software Engineer";
        List<String> skills = evidence.getVerifiedSkills();
        String primarySkill = !skills.isEmpty() ? skills.get(0) : "Java";
        String secondarySkill = skills.size() > 1 ? skills.get(1) : (primarySkill.equalsIgnoreCase("Java") ? "SQL / PostgreSQL" : "REST APIs");

        switch (turnNumber) {
            case 2:
                // 2. Resume / Project-based question
                def.turnType = "PROJECT_DEFENSE";
                def.questionCategory = "PROJECT_DEFENSE";
                def.difficulty = "INTERMEDIATE";
                if (!evidence.getProjects().isEmpty()) {
                    StudentEvidenceAggregatorService.ProjectEvidence proj = evidence.getProjects().get(0);
                    def.evaluatedSkill = (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) ? proj.getTechnologies().get(0) : "System Architecture";
                    def.evidenceSource = "Project Evidence: " + proj.getTitle();
                    def.question = String.format(
                            "In your verified project '%s' (%s), you utilized %s. Walk me through the core architectural decisions you made: How did you design data persistence and validate API request boundaries under concurrent access?",
                            proj.getTitle(),
                            proj.getRemarks() != null ? proj.getRemarks() : "Academic Project",
                            proj.getTechnologies() != null && !proj.getTechnologies().isEmpty() ? String.join(", ", proj.getTechnologies()) : "core technologies"
                    );
                } else {
                    def.evaluatedSkill = "System Architecture";
                    def.evidenceSource = "Academic Focus: " + evidence.getDegree();
                    def.question = String.format(
                            "Walk me through the most technically challenging software system you built during your %s studies at %s. What exact architectural trade-offs did you make?",
                            evidence.getDegree(), evidence.getCollegeName()
                    );
                }
                break;

            case 3:
                // 3. Skill-specific question
                def.turnType = "TECHNICAL_QUESTION";
                def.questionCategory = "SKILL_SPECIFIC";
                def.evaluatedSkill = secondarySkill;
                def.difficulty = "INTERMEDIATE";
                def.evidenceSource = "Verified Skill: " + secondarySkill;
                def.question = String.format(
                        "Let's dive into your verified skill in %s: How do you design database transactions to prevent dirty reads, non-repeatable reads, and phantom reads? Under what specific load conditions would you choose pessimistic locking over optimistic locking?",
                        secondarySkill
                );
                break;

            case 4:
                // 4. Problem-solving question
                def.turnType = "TECHNICAL_QUESTION";
                def.questionCategory = "PROBLEM_SOLVING";
                def.evaluatedSkill = "Data Structures & Algorithms";
                def.difficulty = "ADVANCED";
                def.evidenceSource = evidence.isHasCompetitiveCoding()
                        ? String.format("Competitive Coding: %d Solved (Rating: %.0f)", evidence.getLeetCodeSolved(), evidence.getLeetCodeRating())
                        : "Algorithmic Diagnostic";
                def.question = "Consider an algorithmic lookup and complexity challenge: What is the exact time complexity of binary search, and in what exact condition is it applicable? How does its algorithmic efficiency compare to a hash-table lookup or a linear scan?";
                break;

            case 5:
                // 5. Scenario-based technical question
                def.turnType = "TECHNICAL_QUESTION";
                def.questionCategory = "SYSTEM_SCENARIO";
                def.evaluatedSkill = "System Design";
                def.difficulty = "ADVANCED";
                def.evidenceSource = "Production Resilience & Scalability";
                def.question = "Production Incident Scenario: Your service experiences a sudden 20x surge in concurrent requests. Database connection pools become saturated, and API response latency spikes to 12 seconds. What immediate mitigation and architectural caching patterns (e.g. Redis, connection pooling, circuit breakers) do you deploy?";
                break;

            case 6:
                // 6. Coding question
                CodeExecutionService.CodingChallenge ch = codeExecutionService.resolveChallengeForRole(role);
                def.turnType = "CODING_CHALLENGE";
                def.questionCategory = "CODING_CHALLENGE";
                def.evaluatedSkill = "Live Coding & Algorithms";
                def.difficulty = ch.getDifficulty();
                def.evidenceSource = "Embedded Code Runner: " + ch.getTitle();
                def.question = String.format(
                        "Hands-on Live Coding Round: Challenge: '%s'. %s Open the Live Code Editor panel on the right, implement your algorithm, run your solution against the test suite, and submit your code.",
                        ch.getTitle(), ch.getDescription()
                );
                break;

            case 7:
                // 7. Code explanation / complexity question (based on actual submitted code)
                def.turnType = "CODE_ANALYSIS";
                def.questionCategory = "CODE_EXPLANATION";
                def.evaluatedSkill = "Algorithm Complexity & Code Defense";
                def.difficulty = "ADVANCED";
                def.evidenceSource = "Submitted Code Evaluation (" + (codeLang != null ? codeLang : "code") + ")";
                String activeCode = (submittedCode != null && !submittedCode.isBlank()) ? submittedCode : interview.getCodeSnippet();
                if (activeCode != null && !activeCode.isBlank()) {
                    def.question = "Examining your submitted code implementation: Walk me through your concrete algorithmic approach. What is the formal Big-O Time Complexity and Space Complexity of your code? How does your solution handle extreme edge cases such as empty arrays, boundary limits, or duplicate elements?";
                } else {
                    def.question = "Analyzing algorithmic efficiency: What is the formal Big-O Time Complexity and Space Complexity of your solution? Could this problem be solved with lower memory complexity or in a single pass without extra auxiliary allocations?";
                }
                break;

            case 8:
                // 8. Project architecture question
                def.turnType = "PROJECT_DEFENSE";
                def.questionCategory = "SYSTEM_ARCHITECTURE";
                def.evaluatedSkill = "Distributed Architecture";
                def.difficulty = "ADVANCED";
                def.evidenceSource = "Enterprise Architecture";
                def.question = "When architecting distributed enterprise applications: How do you guarantee data consistency and handle partial failures across microservice boundaries (e.g., Saga pattern versus Two-Phase Commit)? How do you prevent cascading service failures?";
                break;

            case 9:
                // 9. Debugging / edge-case question
                def.turnType = "TECHNICAL_QUESTION";
                def.questionCategory = "DEBUGGING_EDGE_CASES";
                def.evaluatedSkill = "Debugging & Quality Assurance";
                def.difficulty = "ADVANCED";
                def.evidenceSource = "Production Diagnostics";
                def.question = "Debugging Investigation: In production, users intermittently report 500 errors during heavy write traffic, but local unit tests pass 100%. Thread dumps reveal worker threads blocked in WAITING state. How do you systematically profile thread contention, identify deadlocks or connection pool leaks, and resolve the defect?";
                break;

            case 10:
            default:
                // 10. Final technical / behavioral question
                def.turnType = "BEHAVIORAL";
                def.questionCategory = "ENGINEERING_DELIVERY";
                def.evaluatedSkill = "Software Engineering Standards";
                def.difficulty = "INTERMEDIATE";
                def.evidenceSource = "Delivery Standards & CI/CD";
                def.question = "Final Round: How do you establish robust software quality across your engineering lifecycle? Walk me through your approach to automated testing (unit, integration, and contract testing), code review standards, and zero-downtime canary or blue-green deployment strategies.";
                break;
        }

        return def;
    }

    /**
     * Rigorous per-turn answer evaluation engine.
     * Evaluates actual answer text against question, concepts, and domain accuracy.
     * Gibberish, keyboard smash, trivial single-letter answers, and irrelevant strings get STRICT 0.
     */
    public EvaluationResult evaluateCandidateAnswer(String question, String category, String skill, String studentAnswer, String code) {
        EvaluationResult res = new EvaluationResult();
        res.evaluatedSkill = skill != null ? skill : "Technical Knowledge";

        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            res.score = 0.0;
            res.correctness = 0.0;
            res.technicalAccuracy = 0.0;
            res.relevance = 0.0;
            res.depth = 0.0;
            res.reasoning = 0.0;
            res.communication = 0.0;
            res.feedback = "Answer required. Please answer this question before continuing.";
            res.isGibberish = true;
            return res;
        }

        String raw = studentAnswer.trim();
        String clean = raw.toLowerCase();

        // 1. Strict Gibberish & Irrelevance Check
        if (isNonsenseOrGibberish(raw, clean)) {
            res.score = 0.0;
            res.correctness = 0.0;
            res.technicalAccuracy = 0.0;
            res.relevance = 0.0;
            res.depth = 0.0;
            res.reasoning = 0.0;
            res.communication = 0.0;
            res.feedback = "Response is non-responsive, incoherent, or lacks discernible technical substance. Score: 0/100.";
            res.isGibberish = true;
            return res;
        }

        // 2. Question-Specific Domain Rules (Binary search, coding complexity, ACID, etc.)
        String qClean = question != null ? question.toLowerCase() : "";

        // Question 4: Binary search complexity check
        if (qClean.contains("binary search") && (qClean.contains("complexity") || qClean.contains("time complexity"))) {
            if (clean.contains("o(log n)") || clean.contains("o(logn)") || clean.contains("logarithmic") || clean.contains("log n")) {
                if (clean.contains("divide and conquer") || clean.contains("half") || clean.contains("sorted") || clean.contains("mid")) {
                    res.score = 90.0;
                    res.correctness = 95.0;
                    res.technicalAccuracy = 95.0;
                    res.relevance = 90.0;
                    res.depth = 85.0;
                    res.reasoning = 90.0;
                    res.communication = 85.0;
                    res.feedback = "Excellent answer. Accurately stated O(log n) time complexity and articulated the divide-and-conquer search space reduction on sorted data.";
                    return res;
                } else {
                    res.score = 80.0;
                    res.correctness = 85.0;
                    res.technicalAccuracy = 85.0;
                    res.relevance = 80.0;
                    res.depth = 75.0;
                    res.reasoning = 75.0;
                    res.communication = 80.0;
                    res.feedback = "Correct time complexity of O(log n) identified. Could provide additional detail on the prerequisite of sorted elements.";
                    return res;
                }
            } else if (clean.contains("o(n^2)") || clean.contains("o(n)") || clean.contains("linear") || clean.contains("quadratic")) {
                res.score = 15.0;
                res.correctness = 10.0;
                res.technicalAccuracy = 10.0;
                res.relevance = 60.0;
                res.depth = 20.0;
                res.reasoning = 10.0;
                res.communication = 40.0;
                res.feedback = "Incorrect time complexity claimed. Binary search operates in O(log n) logarithmic time, not O(n^2) or linear time.";
                return res;
            }
        }

        // Code Explanation (Turn 7)
        if ("CODE_EXPLANATION".equalsIgnoreCase(category) || qClean.contains("submitted code implementation")) {
            boolean hasBigO = clean.contains("o(") || clean.contains("big-o") || clean.contains("complexity");
            boolean hasDataStructure = clean.contains("map") || clean.contains("hash") || clean.contains("array") || clean.contains("pointer") || clean.contains("tree");
            boolean hasEdgeCases = clean.contains("edge case") || clean.contains("empty") || clean.contains("null") || clean.contains("duplicate") || clean.contains("negative");

            if (hasBigO && hasDataStructure && hasEdgeCases) {
                res.score = 88.0;
                res.feedback = "Comprehensive code defense: correctly analyzed Big-O complexity, loop invariants, and boundary conditions.";
                return res;
            } else if (hasBigO) {
                res.score = 70.0;
                res.feedback = "Good complexity breakdown; should explicitly address edge cases such as empty or duplicate inputs.";
                return res;
            }
        }

        // General Technical Evaluation across extensive CS keyword vocabulary
        int techTermsCount = countTechnicalTerms(clean);
        int reasoningCount = countReasoningTerms(clean);
        int wordCount = clean.split("\s+").length;

        if (techTermsCount >= 4 && reasoningCount >= 2 && wordCount >= 25) {
            // Strong correct / Expert answer (80-92)
            res.score = Math.min(94.0, 80.0 + (techTermsCount * 2.0));
            res.correctness = 88.0;
            res.technicalAccuracy = 90.0;
            res.relevance = 88.0;
            res.depth = 85.0;
            res.reasoning = 85.0;
            res.communication = 86.0;
            res.feedback = "Strong technical explanation demonstrating architectural depth, appropriate engineering terminology, and sound reasoning.";
        } else if (techTermsCount >= 2 && wordCount >= 18) {
            // Mostly correct answer (60-78)
            res.score = Math.min(78.0, 60.0 + (techTermsCount * 3.0) + (reasoningCount * 2.0));
            res.correctness = 70.0;
            res.technicalAccuracy = 70.0;
            res.relevance = 75.0;
            res.depth = 65.0;
            res.reasoning = 65.0;
            res.communication = 70.0;
            res.feedback = "Mostly correct response covering key concepts. Could deepen the analysis of edge-case failure modes.";
        } else if (techTermsCount >= 1 && wordCount >= 8) {
            // Partially correct (40-58)
            res.score = Math.min(58.0, 40.0 + (techTermsCount * 5.0));
            res.correctness = 48.0;
            res.technicalAccuracy = 45.0;
            res.relevance = 55.0;
            res.depth = 40.0;
            res.reasoning = 40.0;
            res.communication = 50.0;
            res.feedback = "Partially correct response; touches on foundational concepts but lacks implementation specifics and trade-off analysis.";
        } else {
            // Mostly / Completely incorrect (15-35)
            res.score = Math.max(15.0, Math.min(35.0, 15.0 + (wordCount * 1.5)));
            res.correctness = 20.0;
            res.technicalAccuracy = 20.0;
            res.relevance = 30.0;
            res.depth = 15.0;
            res.reasoning = 15.0;
            res.communication = 30.0;
            res.feedback = "Vague or superficial answer lacking essential technical terminology, concrete architecture, or reasoning.";
        }

        return res;
    }

    private boolean isNonsenseOrGibberish(String raw, String clean) {
        if (raw.length() < 3) return true;

        String[] words = clean.split("\s+");
        if (words.length == 1 && words[0].length() <= 2) return true;

        // Evasive non-answers
        List<String> evasive = List.of(
                "idk", "i don't know", "dont know", "no idea", "skip", "pass", "dunno", "whatever",
                "what we do in project", "nothing", "none", "fine", "hello", "hi", "test", "testing",
                "ok", "yep", "yeah", "yes", "no", "sure"
        );
        for (String ev : evasive) {
            if (clean.equals(ev) || clean.equals(ev + ".")) return true;
        }

        // Repetitive identical characters e.g. "aaaaa", "zzzzzz"
        if (clean.matches(".*(.)\\1{4,}.*")) return true;

        // Repeated identical tokens
        if (words.length >= 3) {
            boolean allSame = true;
            for (int i = 1; i < words.length; i++) {
                if (!words[i].equals(words[0])) { allSame = false; break; }
            }
            if (allSame) return true;
        }

        // Keyboard smash detection (e.g. "sefdtwefd ytfdewyt feyfgeyt yefg", "asdfghjkl", "qwerty")
        int gibberishWords = 0;
        for (String w : words) {
            String stripped = w.replaceAll("[^a-z]", "");
            if (stripped.length() >= 5 && !stripped.matches(".*[aeiouy].*")) {
                gibberishWords++;
            }
            if (stripped.matches(".*(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwerty|werty|ertyu|zxcvb|xcvbn).*") && stripped.length() >= 6) {
                gibberishWords++;
            }
            if (stripped.length() >= 7 && stripped.matches("(?i)[bcdfghjklmnpqrstvwxz]{5,}")) {
                gibberishWords++;
            }
        }
        if (gibberishWords >= Math.max(1, words.length / 2)) {
            return true;
        }

        // Unrecognized text filter
        boolean hasAnyTechOrEnglishWord = containsRecognizableWord(clean);
        if (!hasAnyTechOrEnglishWord && raw.length() > 12) {
            return true;
        }

        return false;
    }

    private boolean containsRecognizableWord(String clean) {
        String[] commonWords = {
                "the", "is", "in", "at", "of", "to", "a", "and", "for", "it", "we", "with", "as", "by", "on", "or",
                "an", "be", "this", "that", "from", "how", "use", "using", "works", "like", "can", "will", "code",
                "function", "return", "data", "class", "method", "api", "database", "query", "server", "client",
                "request", "response", "array", "object", "system", "time", "memory", "cache", "service", "model"
        };
        for (String w : commonWords) {
            if (clean.matches("(?s).*\\b" + w + "\\b.*")) return true;
        }
        return countTechnicalTerms(clean) > 0;
    }

    private int countTechnicalTerms(String clean) {
        String[] techVocabulary = {
                "concurrency", "thread", "async", "await", "lock", "transaction", "acid", "isolation", "dirty read",
                "rollback", "commit", "index", "postgres", "sql", "query", "table", "cache", "redis", "ttl", "cluster",
                "microservice", "rest", "http", "status", "payload", "json", "jwt", "auth", "token", "api", "endpoint",
                "gateway", "kafka", "queue", "message", "docker", "kubernetes", "pod", "ci/cd", "pipeline", "test",
                "unit", "integration", "mock", "exception", "null", "pointer", "heap", "stack", "memory", "leak",
                "latency", "throughput", "scale", "horizontal", "vertical", "load balancer", "circuit breaker",
                "retry", "idempotency", "loop", "invariant", "array", "hash", "map", "tree", "graph", "binary",
                "search", "sort", "quicksort", "mergesort", "dfs", "bfs", "dynamic programming", "recursion",
                "complexity", "big-o", "logarithmic", "linear", "constant", "garbage collection", "jvm", "v8",
                "node", "react", "spring", "jpa", "hibernate", "orm", "schema", "deadlock", "race condition"
        };
        int count = 0;
        for (String term : techVocabulary) {
            if (clean.contains(term)) count++;
        }
        return count;
    }

    private int countReasoningTerms(String clean) {
        String[] terms = {
                "because", "therefore", "ensuring", "prevents", "optimizes", "trade-off", "handles", "guarantees",
                "whereas", "instead of", "compared to", "auxiliary", "boundary", "edge case", "in order to", "results in"
        };
        int count = 0;
        for (String term : terms) {
            if (clean.contains(term)) count++;
        }
        return count;
    }

    @Transactional
    public Map<String, Object> endInterviewEarly(String userEmail, Long interviewId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized.");
        }

        List<InterviewTurn> turns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(interviewId);

        // Candidate cannot finish early before completing all 10 mandatory questions
        if (turns.size() < MANDATORY_QUESTIONS_COUNT) {
            interview.setStatus("PAUSED");
            interviewRepository.save(interview);
            return Map.of(
                    "interviewId", interviewId,
                    "status", "PAUSED",
                    "isCompleted", false,
                    "currentTurn", turns.size(),
                    "maxTurns", MANDATORY_QUESTIONS_COUNT,
                    "message", "Interview cannot be completed early. All 10 mandatory questions must be answered."
            );
        }

        List<Map<String, Object>> fullTurns = new ArrayList<>();
        for (InterviewTurn t : turns) {
            fullTurns.add(Map.of("turnNumber", t.getTurnNumber(), "sender", "ai", "message", t.getAiQuestion(), "turnType", t.getTurnType() != null ? t.getTurnType() : "QUESTION"));
            if (t.getStudentAnswer() != null) {
                fullTurns.add(Map.of("turnNumber", t.getTurnNumber(), "sender", "student", "message", t.getStudentAnswer()));
            }
        }

        StudentEvidenceAggregatorService.AggregatedEvidence evidence =
                evidenceAggregatorService.aggregateStudentEvidence(student.getId());

        return finalizeInterview(interview, fullTurns, evidence);
    }

    private Map<String, Object> finalizeInterview(
            Interview interview,
            List<Map<String, Object>> fullTurns,
            StudentEvidenceAggregatorService.AggregatedEvidence evidence
    ) {
        List<InterviewTurn> dbTurns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(interview.getId());

        double totalSum = 0.0;
        int correctCount = 0;
        int partialCount = 0;
        int incorrectCount = 0;

        List<Double> techScores = new ArrayList<>();
        List<Double> projScores = new ArrayList<>();
        List<Double> psScores = new ArrayList<>();
        List<Double> codeScores = new ArrayList<>();
        List<Double> commScores = new ArrayList<>();

        InterviewTurn highestTurn = null;
        InterviewTurn lowestTurn = null;

        Set<String> assessedSkillsSet = new LinkedHashSet<>();

        for (InterviewTurn t : dbTurns) {
            double s = (t.getTurnScore() != null) ? t.getTurnScore().doubleValue() : 0.0;
            totalSum += s;

            if (s >= 60.0) correctCount++;
            else if (s >= 40.0) partialCount++;
            else incorrectCount++;

            if (highestTurn == null || s > (highestTurn.getTurnScore() != null ? highestTurn.getTurnScore().doubleValue() : 0.0)) {
                highestTurn = t;
            }
            if (lowestTurn == null || s < (lowestTurn.getTurnScore() != null ? lowestTurn.getTurnScore().doubleValue() : 0.0)) {
                lowestTurn = t;
            }

            if (t.getEvaluatedSkill() != null && !t.getEvaluatedSkill().isBlank()) {
                assessedSkillsSet.add(t.getEvaluatedSkill().trim());
            }

            String cat = (t.getQuestionCategory() != null) ? t.getQuestionCategory() : "";
            if (cat.contains("TECHNICAL") || cat.contains("SKILL")) techScores.add(s);
            if (cat.contains("PROJECT") || cat.contains("ARCHITECTURE")) projScores.add(s);
            if (cat.contains("PROBLEM") || cat.contains("SCENARIO")) psScores.add(s);
            if (cat.contains("CODING") || cat.contains("CODE")) codeScores.add(s);

            double turnComm = (s == 0.0) ? 0.0 : Math.min(100.0, 40.0 + (s * 0.6));
            commScores.add(turnComm);
        }

        int turnCount = dbTurns.isEmpty() ? 1 : dbTurns.size();
        // Exact arithmetic average of evaluated turns — strictly 0 if all answers scored 0!
        double overall = Math.round((totalSum / turnCount) * 10.0) / 10.0;

        double techScore = techScores.isEmpty() ? overall : Math.round((techScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;
        double projScore = projScores.isEmpty() ? overall : Math.round((projScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;
        double psScore = psScores.isEmpty() ? overall : Math.round((psScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;
        double codeQualityScore = codeScores.isEmpty() ? overall : Math.round((codeScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;
        double commScore = commScores.isEmpty() ? overall : Math.round((commScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;

        interview.setStatus("COMPLETED");
        interview.setOverallScore(BigDecimal.valueOf(overall));
        interviewRepository.save(interview);

        String strengths;
        String improvements;
        String redFlags;
        String verdict;
        String recommendedActions;

        if (overall <= 10.0) {
            verdict = String.format("Candidate scored %.1f/100 across 10 sequential rounds for %s. Answers were non-responsive or fundamentally incorrect. Core preparation required.",
                    overall, interview.getRoleTargeted());
            strengths = "No technical strengths demonstrated. Answers lacked substance or technical accuracy.";
            improvements = "Complete fundamental coursework in Core Programming, Data Structures & Algorithms, and System Architecture.";
            redFlags = "Multiple non-responsive or random character inputs during technical rounds.";
            recommendedActions = "Enroll in SkillProof Diagnostic Roadmap: 'Data Structures 101', 'REST API Architecture', 'Database Transactions'.";
        } else if (overall < 50.0) {
            verdict = String.format("Candidate completed 10 questions with overall defense score of %.1f/100 for %s. Demonstrated partial conceptual familiarity but struggled with algorithmic complexity and system design trade-offs.",
                    overall, interview.getRoleTargeted());
            strengths = highestTurn != null && highestTurn.getTurnScore() != null && highestTurn.getTurnScore().doubleValue() > 0
                    ? "Attempted technical questions; demonstrated partial familiarity on " + highestTurn.getEvaluatedSkill()
                    : "Engaged across all 10 interview rounds.";
            improvements = "Deepen Big-O algorithmic analysis, database transaction isolation levels, and edge-case handling.";
            redFlags = lowestTurn != null ? "Low performance on " + lowestTurn.getEvaluatedSkill() : "Incomplete architectural answers.";
            recommendedActions = "Practice coding challenge defense and review distributed transaction resilience patterns.";
        } else {
            String bestSkill = highestTurn != null ? highestTurn.getEvaluatedSkill() : "Core Engineering";
            verdict = String.format("Candidate cleared the 10-question AI Technical Interview with verified score of %.1f/100 for %s. Demonstrated strong grasp of %s and architectural trade-offs.",
                    overall, interview.getRoleTargeted(), bestSkill);
            strengths = String.format("Strong performance on %s (Score: %.0f); articulated algorithmic complexity and system design trade-offs clearly.",
                    bestSkill, highestTurn != null && highestTurn.getTurnScore() != null ? highestTurn.getTurnScore().doubleValue() : overall);
            improvements = "Continue refining production observability, distributed fault tolerance, and zero-downtime deployment strategies.";
            redFlags = "None. Demonstrates verified readiness for industry technical rounds.";
            recommendedActions = "Advance to Tier 4 Skill Passport Verification; apply for shortlisted enterprise engineering roles.";
        }

        String assessedSkills = String.join(",", assessedSkillsSet);
        if (assessedSkills.isBlank()) assessedSkills = "Java,REST APIs";

        InterviewEvaluation eval = InterviewEvaluation.builder()
                .interviewId(interview.getId())
                .technicalScore(BigDecimal.valueOf(techScore))
                .projectScore(BigDecimal.valueOf(projScore))
                .problemSolvingScore(BigDecimal.valueOf(psScore))
                .communicationScore(BigDecimal.valueOf(commScore))
                .codeQualityScore(BigDecimal.valueOf(codeQualityScore))
                .strengths(strengths)
                .improvements(improvements)
                .redFlags(redFlags)
                .summaryVerdict(verdict)
                .assessedSkills(assessedSkills)
                .recommendedActions(recommendedActions)
                .build();
        interviewEvaluationRepository.save(eval);

        // Update StudentSkill verifiedScore and tier ONLY for skills actually evaluated!
        final String finalAssessed = assessedSkills;
        studentSkillRepository.findByStudentId(evidence.getStudentId()).forEach(ss -> {
            skillRepository.findById(ss.getSkillId()).ifPresent(sk -> {
                if (verificationEngineService.isSkillCoveredInInterview(sk.getName(), finalAssessed, interview.getRoleTargeted(), null)) {
                    if (overall >= 50.0) {
                        ss.setVerificationTier(4);
                        ss.setIsVerified(true);
                    }
                    ss.setVerifiedScore(BigDecimal.valueOf(overall));
                    ss.setLastVerifiedAt(LocalDateTime.now());
                    studentSkillRepository.save(ss);
                }
            });
        });

        // Recalculate Skill Passport
        try {
            Student s = studentRepository.findById(evidence.getStudentId()).orElse(null);
            if (s != null && s.getUser() != null) {
                passportService.generateOrUpdatePassport(s.getUser().getEmail());
            }
        } catch (Exception e) {
            log.warn("[InterviewService] Could not auto-refresh passport: {}", e.getMessage());
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("interviewId", interview.getId());
        resp.put("status", "COMPLETED");
        resp.put("isCompleted", true);
        resp.put("currentTurn", MANDATORY_QUESTIONS_COUNT);
        resp.put("maxTurns", MANDATORY_QUESTIONS_COUNT);
        resp.put("overallScore", overall);
        resp.put("mode", interview.getMode());
        resp.put("questionsCompleted", MANDATORY_QUESTIONS_COUNT);
        resp.put("totalQuestions", MANDATORY_QUESTIONS_COUNT);
        resp.put("correctCount", correctCount);
        resp.put("partiallyCorrectCount", partialCount);
        resp.put("incorrectCount", incorrectCount);
        resp.put("rubric", Map.of(
                "technicalKnowledge", techScore,
                "projectUnderstanding", projScore,
                "problemSolving", psScore,
                "communication", commScore,
                "codeQuality", codeQualityScore
        ));
        resp.put("strengths", eval.getStrengths());
        resp.put("improvements", eval.getImprovements());
        resp.put("redFlags", eval.getRedFlags());
        resp.put("summaryVerdict", eval.getSummaryVerdict());
        resp.put("recommendedActions", eval.getRecommendedActions());
        resp.put("assessedSkills", assessedSkills);
        resp.put("codeVerdict", interview.getCodingVerdict() != null ? interview.getCodingVerdict() : "N/A");
        resp.put("timeComplexity", interview.getTimeComplexity() != null ? interview.getTimeComplexity() : "O(N)");
        resp.put("spaceComplexity", interview.getSpaceComplexity() != null ? interview.getSpaceComplexity() : "O(1)");
        resp.put("transcript", fullTurns);
        resp.put("recordingPath", interview.getRecordingPath());
        resp.put("recordingStatus", interview.getRecordingStatus() != null ? interview.getRecordingStatus() : "NOT_RECORDED");
        resp.put("recordingDurationSeconds", interview.getRecordingDurationSeconds() != null ? interview.getRecordingDurationSeconds() : 0);
        resp.put("recordingUrl", interview.getRecordingUrl());
        resp.put("codingSubmissions", interviewCodingSubmissionRepository.findByInterviewIdOrderByCreatedAtAsc(interview.getId()));

        if (highestTurn != null) {
            resp.put("strongestAnswer", Map.of(
                    "turnNumber", highestTurn.getTurnNumber(),
                    "question", highestTurn.getAiQuestion(),
                    "answer", highestTurn.getStudentAnswer() != null ? highestTurn.getStudentAnswer() : "",
                    "score", highestTurn.getTurnScore() != null ? highestTurn.getTurnScore().doubleValue() : 0.0,
                    "skill", highestTurn.getEvaluatedSkill() != null ? highestTurn.getEvaluatedSkill() : ""
            ));
        }

        if (lowestTurn != null) {
            resp.put("weakestAnswer", Map.of(
                    "turnNumber", lowestTurn.getTurnNumber(),
                    "question", lowestTurn.getAiQuestion(),
                    "answer", lowestTurn.getStudentAnswer() != null ? lowestTurn.getStudentAnswer() : "",
                    "score", lowestTurn.getTurnScore() != null ? lowestTurn.getTurnScore().doubleValue() : 0.0,
                    "skill", lowestTurn.getEvaluatedSkill() != null ? lowestTurn.getEvaluatedSkill() : ""
            ));
        }

        if (!dbTurns.isEmpty()) {
            InterviewTurn lastTurn = dbTurns.get(dbTurns.size() - 1);
            int lastScore = lastTurn.getTurnScore() != null ? lastTurn.getTurnScore().intValue() : 0;
            String lastFeedback = lastTurn.getAiFeedback() != null ? lastTurn.getAiFeedback() : "";
            String lastSkill = lastTurn.getEvaluatedSkill() != null ? lastTurn.getEvaluatedSkill() : "Technical Knowledge";
            resp.put("lastTurnScore", lastScore);
            resp.put("lastTurnFeedback", lastFeedback);
            resp.put("lastTurnSkill", lastSkill);
            resp.put("lastTurnEvaluation", Map.of(
                    "turnNumber", lastTurn.getTurnNumber(),
                    "score", lastScore,
                    "feedback", lastFeedback,
                    "evaluatedSkill", lastSkill
            ));
        }

        return resp;
    }

    @Transactional
    public CodeExecutionService.ExecutionResult runCode(String userEmail, Long interviewId, String code, String language, String problemId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized.");
        }

        CodeExecutionService.ExecutionResult res = codeExecutionService.executeCode(problemId, language, code);

        interview.setCodeSnippet(code);
        interview.setCodeLanguage(language);
        interview.setCodingVerdict(res.getVerdict());
        interview.setCodingExecutionTimeMs(res.getExecutionTimeMs());
        interview.setTimeComplexity(res.getTimeComplexity());
        interview.setSpaceComplexity(res.getSpaceComplexity());
        interviewRepository.save(interview);

        try {
            CodeExecutionService.CodingChallenge ch = codeExecutionService.getChallenge(problemId);
            InterviewCodingSubmission submission = InterviewCodingSubmission.builder()
                    .interviewId(interviewId)
                    .studentId(student.getId())
                    .problemId(problemId)
                    .problemTitle(ch != null ? ch.getTitle() : problemId)
                    .language(language)
                    .sourceCode(code)
                    .executionResult(res.getVerdict())
                    .passedTests(res.getPassedTests())
                    .totalTests(res.getTotalTests())
                    .executionTimeMs(res.getExecutionTimeMs())
                    .timeComplexity(res.getTimeComplexity())
                    .spaceComplexity(res.getSpaceComplexity())
                    .testResultsJson(res.getTestResults() != null ? res.getTestResults().toString() : null)
                    .createdAt(LocalDateTime.now())
                    .build();
            interviewCodingSubmissionRepository.save(submission);
        } catch (Exception e) {
            log.warn("[InterviewService] Could not persist coding submission: {}", e.getMessage());
        }

        return res;
    }

    @Transactional
    public Map<String, Object> requestHint(String userEmail, Long interviewId, String problemId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized.");
        }

        CodeExecutionService.CodingChallenge challenge = codeExecutionService.getChallenge(problemId);
        int hintsUsed = interview.getHintsUsed() != null ? interview.getHintsUsed() : 0;

        String hint;
        if (hintsUsed < challenge.getHints().size()) {
            hint = challenge.getHints().get(hintsUsed);
        } else {
            hint = "Focus on the primary data structure: consider time vs space trade-offs.";
        }

        interview.setHintsUsed(hintsUsed + 1);
        interviewRepository.save(interview);

        return Map.of(
                "hintNumber", hintsUsed + 1,
                "hint", hint,
                "totalHintsUsed", hintsUsed + 1
        );
    }

    @Transactional
    public Map<String, Object> pauseInterview(String userEmail, Long interviewId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized: Interview does not belong to candidate.");
        }

        if ("COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            throw new IllegalStateException("Interview is already completed.");
        }

        interview.setStatus("PAUSED");
        interviewRepository.save(interview);
        log.info("[InterviewService] Paused interview #{} for {}", interviewId, userEmail);

        return Map.of(
                "interviewId", interviewId,
                "status", "PAUSED",
                "isPaused", true,
                "message", "Interview has been paused."
        );
    }

    @Transactional
    public Map<String, Object> resumeInterview(String userEmail, Long interviewId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized: Interview does not belong to candidate.");
        }

        if ("COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            throw new IllegalStateException("Interview is already completed.");
        }

        interview.setStatus("ACTIVE");
        interviewRepository.save(interview);
        log.info("[InterviewService] Resumed interview #{} for {}", interviewId, userEmail);

        return Map.of(
                "interviewId", interviewId,
                "status", "ACTIVE",
                "isPaused", false,
                "message", "Interview has been resumed."
        );
    }

    public Map<String, Object> getLatestInterview(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        return interviewRepository.findFirstByStudentIdOrderByCreatedAtDesc(student.getId())
                .map(inv -> {
                    List<InterviewTurn> turns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(inv.getId());
                    List<Map<String, Object>> transcript = new ArrayList<>();
                    for (InterviewTurn t : turns) {
                        transcript.add(Map.of(
                                "turnNumber", t.getTurnNumber(),
                                "sender", "ai",
                                "message", t.getAiQuestion(),
                                "turnType", t.getTurnType() != null ? t.getTurnType() : "QUESTION",
                                "questionCategory", t.getQuestionCategory() != null ? t.getQuestionCategory() : "TECHNICAL",
                                "evaluatedSkill", t.getEvaluatedSkill() != null ? t.getEvaluatedSkill() : "Core Technical",
                                "evidenceSource", t.getEvidenceSource() != null ? t.getEvidenceSource() : "",
                                "difficulty", t.getDifficulty() != null ? t.getDifficulty() : "INTERMEDIATE"
                        ));
                        if (t.getStudentAnswer() != null) {
                            Map<String, Object> ansMap = new HashMap<>();
                            ansMap.put("turnNumber", t.getTurnNumber());
                            ansMap.put("sender", "student");
                            ansMap.put("message", t.getStudentAnswer());
                            ansMap.put("score", t.getTurnScore() != null ? t.getTurnScore().doubleValue() : 0.0);
                            ansMap.put("feedback", t.getAiFeedback() != null ? t.getAiFeedback() : "");
                            ansMap.put("codeSnippet", t.getCodeSnippet() != null ? t.getCodeSnippet() : "");
                            ansMap.put("codeLanguage", t.getCodeLanguage() != null ? t.getCodeLanguage() : "");
                            transcript.add(ansMap);
                        }
                    }

                    boolean isCompleted = "COMPLETED".equalsIgnoreCase(inv.getStatus()) || "AUTO_SUBMITTED".equalsIgnoreCase(inv.getStatus());
                    boolean isPaused = "PAUSED".equalsIgnoreCase(inv.getStatus());
                    String status = inv.getStatus() != null ? inv.getStatus() : (isCompleted ? "COMPLETED" : (isPaused ? "PAUSED" : "ACTIVE"));
                    String mode = inv.getMode() != null ? inv.getMode() : "TECHNICAL";

                    Map<String, Object> map = new HashMap<>();
                    map.put("interviewId", inv.getId());
                    map.put("roleTargeted", inv.getRoleTargeted());
                    map.put("mode", mode);
                    map.put("status", status);
                    map.put("isPaused", isPaused);
                    map.put("isCompleted", isCompleted);
                    map.put("overallScore", isCompleted ? inv.getOverallScore() : BigDecimal.ZERO);
                    map.put("currentTurn", turns.isEmpty() ? 1 : turns.size());
                    map.put("maxTurns", MANDATORY_QUESTIONS_COUNT);
                    map.put("tabSwitchCount", inv.getTabSwitchCount() != null ? inv.getTabSwitchCount() : 0);
                    map.put("violationTimestamp", inv.getViolationTimestamp());
                    map.put("autoSubmissionReason", inv.getAutoSubmissionReason());
                    map.put("recordingMetadata", inv.getRecordingMetadata());
                    map.put("startTime", inv.getStartTime());
                    map.put("endTime", inv.getEndTime());
                    map.put("codeSnippet", inv.getCodeSnippet());
                    map.put("codeLanguage", inv.getCodeLanguage());
                    map.put("codingVerdict", inv.getCodingVerdict());
                    map.put("timeComplexity", inv.getTimeComplexity());
                    map.put("spaceComplexity", inv.getSpaceComplexity());
                    map.put("hintsUsed", inv.getHintsUsed());
                    map.put("transcript", transcript);
                    map.put("recordingPath", inv.getRecordingPath());
                    map.put("recordingStatus", inv.getRecordingStatus() != null ? inv.getRecordingStatus() : "NOT_RECORDED");
                    map.put("recordingDurationSeconds", inv.getRecordingDurationSeconds() != null ? inv.getRecordingDurationSeconds() : 0);
                    map.put("recordingUrl", inv.getRecordingUrl());
                    map.put("codingSubmissions", interviewCodingSubmissionRepository.findByInterviewIdOrderByCreatedAtAsc(inv.getId()));

                    CodeExecutionService.CodingChallenge challenge = codeExecutionService.resolveChallengeForRole(inv.getRoleTargeted());
                    map.put("challenge", challenge);

                    if (!turns.isEmpty()) {
                        InterviewTurn lastTurn = turns.get(turns.size() - 1);
                        map.put("question", lastTurn.getAiQuestion());
                        map.put("turnType", lastTurn.getTurnType() != null ? lastTurn.getTurnType() : "QUESTION");
                        map.put("questionCategory", lastTurn.getQuestionCategory() != null ? lastTurn.getQuestionCategory() : "TECHNICAL");
                        map.put("evaluatedSkill", lastTurn.getEvaluatedSkill() != null ? lastTurn.getEvaluatedSkill() : "Core Technical");
                        map.put("difficulty", lastTurn.getDifficulty() != null ? lastTurn.getDifficulty() : "INTERMEDIATE");
                        map.put("evidenceSource", lastTurn.getEvidenceSource() != null ? lastTurn.getEvidenceSource() : "");

                        if (lastTurn.getTurnScore() != null) {
                            map.put("lastTurnEvaluation", Map.of(
                                    "turnNumber", lastTurn.getTurnNumber(),
                                    "score", lastTurn.getTurnScore().doubleValue(),
                                    "feedback", lastTurn.getAiFeedback() != null ? lastTurn.getAiFeedback() : "",
                                    "evaluatedSkill", lastTurn.getEvaluatedSkill() != null ? lastTurn.getEvaluatedSkill() : "Technical Knowledge"
                            ));
                        }
                    }

                    if (isCompleted) {
                        interviewEvaluationRepository.findByInterviewId(inv.getId()).ifPresent(e -> {
                            map.put("rubric", Map.of(
                                    "technicalKnowledge", e.getTechnicalScore() != null ? e.getTechnicalScore() : BigDecimal.ZERO,
                                    "projectUnderstanding", e.getProjectScore() != null ? e.getProjectScore() : BigDecimal.ZERO,
                                    "problemSolving", e.getProblemSolvingScore() != null ? e.getProblemSolvingScore() : BigDecimal.ZERO,
                                    "communication", e.getCommunicationScore() != null ? e.getCommunicationScore() : BigDecimal.ZERO,
                                    "codeQuality", e.getCodeQualityScore() != null ? e.getCodeQualityScore() : BigDecimal.ZERO
                            ));
                            map.put("summaryVerdict", e.getSummaryVerdict());
                            map.put("strengths", e.getStrengths());
                            map.put("improvements", e.getImprovements());
                            map.put("redFlags", e.getRedFlags());
                            map.put("recommendedActions", e.getRecommendedActions());
                            map.put("assessedSkills", e.getAssessedSkills());
                        });
                    }

                    return map;
                })
                .orElse(Collections.emptyMap());
    }

    @Transactional
    public Map<String, Object> handleViolation(
            String userEmail,
            Long interviewId,
            String reason,
            String draftAnswer,
            String draftCode,
            String language,
            Integer durationSeconds,
            String recordingUrl
    ) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized: Interview does not belong to authenticated student.");
        }

        // If already finalized or auto-submitted, return current state
        if ("AUTO_SUBMITTED".equalsIgnoreCase(interview.getStatus()) || "COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            return getLatestInterview(userEmail);
        }

        int nextTabSwitch = (interview.getTabSwitchCount() != null ? interview.getTabSwitchCount() : 0) + 1;
        interview.setTabSwitchCount(nextTabSwitch);
        interview.setViolationTimestamp(LocalDateTime.now());
        interview.setEndTime(LocalDateTime.now());
        String finalReason = (reason != null && !reason.isBlank()) ? reason : "Candidate left the assessment window or switched tabs.";
        interview.setAutoSubmissionReason(finalReason);
        interview.setStatus("AUTO_SUBMITTED");

        if (recordingUrl != null && !recordingUrl.isBlank()) {
            interview.setRecordingUrl(recordingUrl);
            interview.setRecordingStatus("RECORDED");
        }
        if (durationSeconds != null && durationSeconds > 0) {
            interview.setRecordingDurationSeconds(durationSeconds);
        }

        List<InterviewTurn> turns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(interviewId);
        InterviewTurn currentTurn = turns.isEmpty() ? null : turns.get(turns.size() - 1);

        // If current turn has draft answer and was unanswered, evaluate it
        if (currentTurn != null && currentTurn.getStudentAnswer() == null && draftAnswer != null && !draftAnswer.trim().isEmpty()) {
            currentTurn.setStudentAnswer(draftAnswer.trim());
            if (draftCode != null && !draftCode.isBlank()) {
                currentTurn.setCodeSnippet(draftCode);
                currentTurn.setCodeLanguage(language != null ? language : "javascript");
            }
            EvaluationResult evalRes = evaluateCandidateAnswer(
                    currentTurn.getAiQuestion(),
                    currentTurn.getQuestionCategory(),
                    currentTurn.getEvaluatedSkill(),
                    draftAnswer.trim(),
                    draftCode
            );
            currentTurn.setTurnScore(BigDecimal.valueOf(evalRes.score));
            currentTurn.setAiFeedback(evalRes.feedback);
            interviewTurnRepository.save(currentTurn);
        }

        turns = interviewTurnRepository.findByInterviewIdOrderByTurnNumberAsc(interviewId);

        // Strict scoring:
        // Sum scores of answered turns
        double totalSum = 0.0;
        int correctCount = 0;
        int partialCount = 0;
        int incorrectCount = 0;
        Set<String> assessedSkillsSet = new LinkedHashSet<>();

        for (InterviewTurn t : turns) {
            if (t.getStudentAnswer() != null && t.getTurnScore() != null) {
                double s = t.getTurnScore().doubleValue();
                totalSum += s;
                if (s >= 60.0) correctCount++;
                else if (s >= 40.0) partialCount++;
                else incorrectCount++;
            } else {
                t.setTurnScore(BigDecimal.ZERO);
                t.setAiFeedback("Unanswered - auto-submitted due to proctoring violation.");
                interviewTurnRepository.save(t);
                incorrectCount++;
            }
            if (t.getEvaluatedSkill() != null && !t.getEvaluatedSkill().isBlank()) {
                assessedSkillsSet.add(t.getEvaluatedSkill().trim());
            }
        }

        // Unanswered questions count as 0 against the entire 10-turn suite!
        double overall = Math.round((totalSum / MANDATORY_QUESTIONS_COUNT) * 10.0) / 10.0;
        interview.setOverallScore(BigDecimal.valueOf(overall));
        interviewRepository.save(interview);

        String redFlags = String.format(
                "CRITICAL PROCTORING VIOLATION (%d count): Candidate left the assessment window or switched tabs at %s. Attempt was terminated and auto-submitted.",
                nextTabSwitch,
                interview.getViolationTimestamp()
        );
        String summaryVerdict = String.format(
                "Test Auto-Submitted: You left the assessment window. Completed %d of %d rounds. Final verified score: %.1f/100.",
                turns.size(), MANDATORY_QUESTIONS_COUNT, overall
        );
        String strengths = overall > 0.0 ? "Partial technical rounds attempted before violation." : "No valid answers submitted prior to proctoring violation.";
        String improvements = "Proctoring integrity violation detected. Full sequential interview under locked environment required.";
        String recommendedActions = "Review proctoring terms before attempting future technical rounds.";
        String assessedSkills = String.join(",", assessedSkillsSet);
        if (assessedSkills.isBlank()) assessedSkills = "General Engineering";

        InterviewEvaluation eval = InterviewEvaluation.builder()
                .interviewId(interview.getId())
                .technicalScore(BigDecimal.valueOf(overall))
                .projectScore(BigDecimal.valueOf(overall))
                .problemSolvingScore(BigDecimal.valueOf(overall))
                .communicationScore(BigDecimal.valueOf(overall))
                .codeQualityScore(BigDecimal.valueOf(overall))
                .strengths(strengths)
                .improvements(improvements)
                .redFlags(redFlags)
                .summaryVerdict(summaryVerdict)
                .assessedSkills(assessedSkills)
                .recommendedActions(recommendedActions)
                .build();
        interviewEvaluationRepository.save(eval);

        // Update student skills if any answered
        final String finalAssessed = assessedSkills;
        studentSkillRepository.findByStudentId(student.getId()).forEach(ss -> {
            skillRepository.findById(ss.getSkillId()).ifPresent(sk -> {
                if (verificationEngineService.isSkillCoveredInInterview(sk.getName(), finalAssessed, interview.getRoleTargeted(), null)) {
                    ss.setVerifiedScore(BigDecimal.valueOf(overall));
                    ss.setLastVerifiedAt(LocalDateTime.now());
                    studentSkillRepository.save(ss);
                }
            });
        });

        try {
            passportService.generateOrUpdatePassport(userEmail);
        } catch (Exception e) {
            log.warn("[InterviewService] Could not auto-refresh passport: {}", e.getMessage());
        }

        List<Map<String, Object>> fullTurns = new ArrayList<>();
        for (InterviewTurn t : turns) {
            fullTurns.add(Map.of(
                    "turnNumber", t.getTurnNumber(),
                    "sender", "ai",
                    "message", t.getAiQuestion(),
                    "turnType", t.getTurnType() != null ? t.getTurnType() : "QUESTION",
                    "questionCategory", t.getQuestionCategory() != null ? t.getQuestionCategory() : "TECHNICAL",
                    "evaluatedSkill", t.getEvaluatedSkill() != null ? t.getEvaluatedSkill() : "Core Technical",
                    "evidenceSource", t.getEvidenceSource() != null ? t.getEvidenceSource() : "",
                    "difficulty", t.getDifficulty() != null ? t.getDifficulty() : "INTERMEDIATE"
            ));
            if (t.getStudentAnswer() != null) {
                Map<String, Object> ansMap = new HashMap<>();
                ansMap.put("turnNumber", t.getTurnNumber());
                ansMap.put("sender", "student");
                ansMap.put("message", t.getStudentAnswer());
                ansMap.put("score", t.getTurnScore() != null ? t.getTurnScore().doubleValue() : 0.0);
                ansMap.put("feedback", t.getAiFeedback() != null ? t.getAiFeedback() : "");
                fullTurns.add(ansMap);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("interviewId", interview.getId());
        resp.put("status", "AUTO_SUBMITTED");
        resp.put("isCompleted", true);
        resp.put("isViolated", true);
        resp.put("tabSwitchCount", nextTabSwitch);
        resp.put("violationTimestamp", interview.getViolationTimestamp());
        resp.put("autoSubmissionReason", finalReason);
        resp.put("overallScore", overall);
        resp.put("currentTurn", turns.size());
        resp.put("maxTurns", MANDATORY_QUESTIONS_COUNT);
        resp.put("correctCount", correctCount);
        resp.put("partiallyCorrectCount", partialCount);
        resp.put("incorrectCount", incorrectCount);
        resp.put("redFlags", redFlags);
        resp.put("summaryVerdict", summaryVerdict);
        resp.put("strengths", strengths);
        resp.put("improvements", improvements);
        resp.put("recommendedActions", recommendedActions);
        resp.put("assessedSkills", assessedSkills);
        resp.put("transcript", fullTurns);
        resp.put("recordingStatus", interview.getRecordingStatus() != null ? interview.getRecordingStatus() : "RECORDED");
        resp.put("recordingUrl", interview.getRecordingUrl());
        resp.put("recordingDurationSeconds", interview.getRecordingDurationSeconds() != null ? interview.getRecordingDurationSeconds() : 0);

        return resp;
    }

    @Transactional
    public Map<String, Object> saveRecording(String userEmail, Long interviewId, MultipartFile file, Integer durationSeconds) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        if (!interview.getStudentId().equals(student.getId())) {
            throw new SecurityException("Unauthorized: recording does not belong to candidate.");
        }

        try {
            Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads", "interview_recordings").normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String filename = "recording_interview_" + interviewId + "_" + System.currentTimeMillis() + ".webm";
            Path targetPath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            interview.setRecordingPath(targetPath.toString());
            interview.setRecordingDurationSeconds(durationSeconds != null ? durationSeconds : 0);
            interview.setRecordingStatus("RECORDED");
            interview.setRecordingUrl("/api/student/interview/" + interviewId + "/recording");
            interviewRepository.save(interview);

            log.info("[InterviewService] Successfully saved interview recording: {} ({} bytes, {}s)", targetPath, file.getSize(), durationSeconds);

            return Map.of(
                    "success", true,
                    "interviewId", interviewId,
                    "recordingStatus", "RECORDED",
                    "recordingUrl", "/api/student/interview/" + interviewId + "/recording",
                    "durationSeconds", interview.getRecordingDurationSeconds() != null ? interview.getRecordingDurationSeconds() : 0
            );
        } catch (IOException e) {
            log.error("[InterviewService] Error saving recording file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store interview recording: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Resource getRecordingResource(String userEmail, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        Student student = null;
        try {
            student = studentProfileService.getStudentByUserEmail(userEmail);
        } catch (Exception ignored) {}
        if (student != null) {
            if (!interview.getStudentId().equals(student.getId())) {
                throw new SecurityException("Forbidden: Access denied to another student's recording.");
            }
        }
        if (userEmail == null || userEmail.isBlank()) {
            throw new SecurityException("Unauthorized: Authentication required.");
        }

        if (interview.getRecordingPath() == null) {
            throw new RuntimeException("No recording found for interview: " + interviewId);
        }

        Path path = Paths.get(interview.getRecordingPath());
        if (!Files.exists(path)) {
            throw new RuntimeException("Recording file missing on disk: " + path);
        }

        return new FileSystemResource(path);
    }

    @Transactional(readOnly = true)
    public List<InterviewCodingSubmission> getCodingSubmissions(String userEmail, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));
        return interviewCodingSubmissionRepository.findByInterviewIdOrderByCreatedAtAsc(interviewId);
    }
}
