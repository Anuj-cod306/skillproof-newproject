package com.skillproof.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class LlmService {

    @Value("${skillproof.llm.api-key:${GEMINI_API_KEY:${LLM_API_KEY:${OPENAI_API_KEY:}}}}")
    private String apiKey;

    @Value("${skillproof.llm.provider:${LLM_PROVIDER:gemini}}")
    private String provider;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public static class ResumeAnalysisResult {
        public List<String> technicalSkills = new ArrayList<>();
        public List<String> softSkills = new ArrayList<>();
        public List<String> skills = new ArrayList<>();
        public Map<String, Double> skillConfidence = new HashMap<>();
        public Map<String, String> skillEvidence = new HashMap<>();
        public List<Map<String, Object>> projects = new ArrayList<>();
        public List<Map<String, Object>> education = new ArrayList<>();
        public List<String> certifications = new ArrayList<>();
        public List<Map<String, Object>> experience = new ArrayList<>();
        public String summary;
        public String desiredRole;
    }

    /**
     * Extracts structured resume intelligence using real LLM API (or NLP heuristics if key is unconfigured).
     */
    public ResumeAnalysisResult analyzeResume(String rawText) {
        if (isConfigured()) {
            try {
                return callLlmForResume(rawText);
            } catch (Exception e) {
                log.warn("[LlmService] Error calling LLM API, falling back to heuristic parsing: {}", e.getMessage());
            }
        } else {
            log.info("[LlmService] Notice: GEMINI_API_KEY / LLM_API_KEY is not set in environment. Utilizing empirical text extraction.");
        }

        return fallbackResumeExtraction(rawText);
    }

    private ResumeAnalysisResult callLlmForResume(String rawText) throws Exception {
        String prompt = "You are an expert technical recruiter and resume parser. Analyze the following resume text and extract structured JSON matching this exact schema:\n"
                + "{\n"
                + "  \"technicalSkills\": [\"Java\", \"Spring Boot\", ...],\n"
                + "  \"softSkills\": [\"Problem Solving\", \"Team Leadership\", ...],\n"
                + "  \"projects\": [{\"title\": \"Project Name\", \"tech\": [\"Java\", \"SQL\"], \"description\": \"Summary of project\"}],\n"
                + "  \"education\": [{\"degree\": \"Degree\", \"institution\": \"College Name\", \"year\": 2027}],\n"
                + "  \"certifications\": [\"Cert 1\", ...],\n"
                + "  \"experience\": [{\"role\": \"Role\", \"company\": \"Company\", \"duration\": \"Dates\", \"highlights\": \"Highlights\"}],\n"
                + "  \"summary\": \"Brief executive summary of candidate\",\n"
                + "  \"desiredRole\": \"Extracted or inferred target role\"\n"
                + "}\n"
                + "Return ONLY pure valid JSON, no markdown formatting.\n\n"
                + "Resume Text:\n" + rawText;

        String responseJson = callLlm(prompt);
        return parseResumeJson(responseJson);
    }

    private String callLlm(String prompt) throws Exception {
        if ("openai".equalsIgnoreCase(provider) || apiKey.startsWith("sk-")) {
            // OpenAI API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> req = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(
                            Map.of("role", "system", "content", "You output strictly valid JSON."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "response_format", Map.of("type", "json_object")
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);
            ResponseEntity<String> response = restTemplate.postForEntity("https://api.openai.com/v1/chat/completions", entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();
        } else {
            // Google Gemini API (default)
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> genConfig = Map.of("response_mime_type", "application/json");

            Map<String, Object> req = Map.of(
                    "contents", List.of(content),
                    "generationConfig", genConfig
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        }
    }

    private ResumeAnalysisResult parseResumeJson(String jsonText) {
        try {
            // Clean markdown code fence if present
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
            if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
            if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);

            JsonNode node = objectMapper.readTree(cleaned.trim());
            ResumeAnalysisResult res = new ResumeAnalysisResult();

            if (node.has("technicalSkills") && node.get("technicalSkills").isArray()) {
                node.get("technicalSkills").forEach(s -> res.technicalSkills.add(s.asText()));
            }
            if (node.has("softSkills") && node.get("softSkills").isArray()) {
                node.get("softSkills").forEach(s -> res.softSkills.add(s.asText()));
            }
            res.skills.addAll(res.technicalSkills);

            if (node.has("projects") && node.get("projects").isArray()) {
                node.get("projects").forEach(p -> {
                    Map<String, Object> proj = new HashMap<>();
                    proj.put("title", p.path("title").asText("Project"));
                    proj.put("description", p.path("description").asText(""));
                    List<String> tech = new ArrayList<>();
                    if (p.has("tech") && p.get("tech").isArray()) {
                        p.get("tech").forEach(t -> tech.add(t.asText()));
                    }
                    proj.put("tech", tech);
                    res.projects.add(proj);
                });
            }

            if (node.has("education") && node.get("education").isArray()) {
                node.get("education").forEach(e -> {
                    Map<String, Object> edu = new HashMap<>();
                    edu.put("degree", e.path("degree").asText(""));
                    edu.put("institution", e.path("institution").asText(""));
                    edu.put("year", e.path("year").asInt(2027));
                    res.education.add(edu);
                });
            }

            if (node.has("experience") && node.get("experience").isArray()) {
                node.get("experience").forEach(e -> {
                    Map<String, Object> exp = new HashMap<>();
                    exp.put("role", e.path("role").asText(""));
                    exp.put("company", e.path("company").asText(""));
                    exp.put("duration", e.path("duration").asText(""));
                    exp.put("highlights", e.path("highlights").asText(""));
                    res.experience.add(exp);
                });
            }

            res.summary = node.path("summary").asText("");
            res.desiredRole = node.path("desiredRole").asText("Backend Developer");

            return res;
        } catch (Exception e) {
            log.error("[LlmService] Failed to deserialize LLM output: {}", e.getMessage());
            return fallbackResumeExtraction(jsonText);
        }
    }

    private static class SkillDef {
        final Pattern pattern;
        final String name;
        final String category;

        SkillDef(String regex, String name, String category) {
            this.pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
            this.name = name;
            this.category = category;
        }
    }

    private static final List<SkillDef> SKILL_CATALOG = List.of(
            // Backend & Languages
            new SkillDef("\\bpython\\b", "Python", "Backend"),
            new SkillDef("\\bdjango\\b", "Django", "Backend"),
            new SkillDef("\\bfastapi\\b", "FastAPI", "Backend"),
            new SkillDef("\\bflask\\b", "Flask", "Backend"),
            new SkillDef("\\bjava\\b", "Java", "Backend"),
            new SkillDef("\\bspring\\s+boot\\b", "Spring Boot", "Backend"),
            new SkillDef("\\bspring\\s+security\\b", "Spring Security", "Backend"),
            new SkillDef("\\bhibernate\\b", "Hibernate / JPA", "Backend"),
            new SkillDef("\\brest(\\s+api(s)?)?\\b", "REST APIs", "Backend"),
            new SkillDef("\\bmicroservices?\\b", "Microservices", "Backend"),
            new SkillDef("\\b(node(\\.js)?|nodejs)\\b", "Node.js", "Backend"),
            new SkillDef("\\bexpress(\\.js)?\\b", "Express.js", "Backend"),
            new SkillDef("(\\bc\\+\\+|\\bcpp\\b)", "C++", "Core CS"),
            new SkillDef("\\bc#\\b", "C#", "Backend"),
            new SkillDef("\\b(go|golang)\\b", "Go", "Backend"),
            new SkillDef("\\brust\\b", "Rust", "Backend"),

            // Frontend
            new SkillDef("\\breact(\\.js)?\\b", "React", "Frontend"),
            new SkillDef("\\bnext(\\.js|js)?\\b", "Next.js", "Frontend"),
            new SkillDef("\\btypescript\\b", "TypeScript", "Frontend"),
            new SkillDef("\\bjavascript\\b", "JavaScript", "Frontend"),
            new SkillDef("\\b(html5?|css3?)\\b", "HTML / CSS", "Frontend"),
            new SkillDef("\\btailwind(\\s+css)?\\b", "Tailwind CSS", "Frontend"),
            new SkillDef("\\bvue(\\.js)?\\b", "Vue.js", "Frontend"),
            new SkillDef("\\bangular\\b", "Angular", "Frontend"),
            new SkillDef("\\bredux\\b", "Redux", "Frontend"),

            // Database
            new SkillDef("\\b(postgresql|postgres)\\b", "PostgreSQL", "Database"),
            new SkillDef("\\bmysql\\b", "MySQL", "Database"),
            new SkillDef("\\bmongodb\\b", "MongoDB", "Database"),
            new SkillDef("\\bredis\\b", "Redis Caching", "Database"),
            new SkillDef("\\bsqlite\\b", "SQLite", "Database"),
            new SkillDef("\\bfirebase\\b", "Firebase", "Database"),
            new SkillDef("\\b(apache\\s+kafka|kafka)\\b", "Apache Kafka", "Backend"),
            new SkillDef("\\bsql\\b", "SQL", "Database"),

            // Cloud & DevOps
            new SkillDef("\\bdocker\\b", "Docker", "Cloud & DevOps"),
            new SkillDef("\\b(kubernetes|k8s)\\b", "Kubernetes", "Cloud & DevOps"),
            new SkillDef("\\b(aws|amazon\\s+web\\s+services)\\b", "AWS Cloud", "Cloud & DevOps"),
            new SkillDef("\\bazure\\b", "Azure Cloud", "Cloud & DevOps"),
            new SkillDef("\\b(gcp|google\\s+cloud)\\b", "Google Cloud", "Cloud & DevOps"),
            new SkillDef("\\b(git|github|gitlab)\\b", "Git & GitHub", "Cloud & DevOps"),
            new SkillDef("\\blinux\\b", "Linux", "Cloud & DevOps"),
            new SkillDef("\\bci/cd\\b", "CI/CD Pipelines", "Cloud & DevOps"),

            // Core CS & AI
            new SkillDef("\\b(machine\\s+learning|deep\\s+learning|\\bml\\b)\\b", "Machine Learning", "Core CS"),
            new SkillDef("\\b(data\\s+structures|algorithms)\\b", "Data Structures & Algorithms", "Core CS"),
            new SkillDef("\\bsystem\\s+design\\b", "System Design", "Core CS")
    );

    public ResumeAnalysisResult fallbackResumeExtraction(String rawText) {
        ResumeAnalysisResult res = new ResumeAnalysisResult();
        String raw = rawText != null ? rawText : "";
        String lower = raw.toLowerCase();

        String skillsSec = extractSection(lower, "skill", "competenc", "tech stack", "expertise");
        String projectsSec = extractSection(lower, "project", "portfolio", "key initiatives");
        String expSec = extractSection(lower, "experience", "employment", "internship", "work history");

        for (SkillDef def : SKILL_CATALOG) {
            Matcher m = def.pattern.matcher(raw);
            int totalMentions = 0;
            while (m.find()) {
                totalMentions++;
            }

            if (totalMentions == 0) {
                continue;
            }

            // Standalone SQL check: don't double count if only inside PostgreSQL
            if ("SQL".equals(def.name)) {
                String nonPostgresText = raw.replaceAll("(?i)\\bpostgre(sql)?\\b", "");
                Matcher sqlM = def.pattern.matcher(nonPostgresText);
                int sqlCount = 0;
                while (sqlM.find()) sqlCount++;
                if (sqlCount == 0) continue;
                totalMentions = sqlCount;
            }

            if (!res.technicalSkills.contains(def.name)) {
                res.technicalSkills.add(def.name);
            }

            int inSkills = countMatches(def.pattern, skillsSec);
            int inProjects = countMatches(def.pattern, projectsSec);
            int inExp = countMatches(def.pattern, expSec);

            // Dynamic evidence-weighted confidence calculation (Requirement 8)
            // Base detection: 45%
            double confidence = 0.45;

            // Skills section presence: 15% for first, +3% for repeated emphasis (up to 21%)
            if (inSkills > 0) {
                confidence += 0.15 + Math.min(0.06, (inSkills - 1) * 0.03);
            }

            // Projects section application: 12% for first, +5% for each additional project mention (up to 25%)
            if (inProjects > 0) {
                confidence += 0.12 + Math.min(0.13, (inProjects - 1) * 0.05);
            }

            // Experience section application: 12% for first, +4% for additional (up to 20%)
            if (inExp > 0) {
                confidence += 0.12 + Math.min(0.08, (inExp - 1) * 0.04);
            }

            // Document-wide frequency bonus: +2% per total mention beyond 2 (up to +8%)
            if (totalMentions > 2) {
                confidence += Math.min(0.08, (totalMentions - 2) * 0.02);
            }

            // Clamp between 45% and 95%
            confidence = Math.min(0.95, Math.max(0.45, confidence));
            double roundedConf = Math.round(confidence * 100.0) / 100.0;

            List<String> evidenceSources = new ArrayList<>();
            if (inSkills > 0) evidenceSources.add("Technical Skills (" + inSkills + "x)");
            if (inProjects > 0) evidenceSources.add("Projects (" + inProjects + "x)");
            if (inExp > 0) evidenceSources.add("Experience (" + inExp + "x)");
            if (evidenceSources.isEmpty()) evidenceSources.add(totalMentions + " mention" + (totalMentions > 1 ? "s" : ""));

            String evText = String.format("Resume Evidence: Mentioned in %s (Claim Confidence: %.0f%%). Practical assessment or code audit required for verified score.",
                    String.join(" & ", evidenceSources), roundedConf * 100.0);

            res.skillConfidence.put(def.name, roundedConf);
            res.skillEvidence.put(def.name, evText);
        }

        res.skills.addAll(res.technicalSkills);

        String[] softSkillsPool = {"Problem Solving", "System Architecture", "Analytical Thinking", "Team Collaboration"};
        for (String s : softSkillsPool) {
            if (lower.contains(s.toLowerCase())) {
                res.softSkills.add(s);
            }
        }

        if (lower.contains("project") || !res.technicalSkills.isEmpty()) {
            Map<String, Object> p1 = new HashMap<>();
            p1.put("title", "Technical Project");
            List<String> detectedTech = res.technicalSkills.stream().limit(4).toList();
            p1.put("tech", detectedTech.isEmpty() ? List.of("Software Engineering") : detectedTech);
            p1.put("description", "Engineered solutions applying " + String.join(", ", detectedTech));
            res.projects.add(p1);
        }

        if (!res.technicalSkills.isEmpty()) {
            res.summary = "Extracted from candidate resume: detected skills in " + String.join(", ", res.technicalSkills) + ".";
        } else {
            res.summary = "Resume parsed. No technical skills identified.";
        }

        res.desiredRole = lower.contains("frontend") ? "Frontend Developer" : (lower.contains("data") ? "Data Scientist" : "Software Engineer");

        return res;
    }

    private int countMatches(Pattern pattern, String text) {
        if (text == null || text.isBlank()) return 0;
        Matcher m = pattern.matcher(text);
        int c = 0;
        while (m.find()) c++;
        return c;
    }

    private String extractSection(String lowerText, String... headers) {
        for (String header : headers) {
            int idx = lowerText.indexOf(header);
            if (idx != -1) {
                int endIdx = Math.min(lowerText.length(), idx + 600);
                return lowerText.substring(idx, endIdx);
            }
        }
        return "";
    }

    private static final List<String> TECH_DICTIONARY = List.of(
            "java", "spring", "boot", "security", "jwt", "token", "sql", "postgres", "postgresql",
            "mysql", "jpa", "hibernate", "rest", "api", "controller", "service", "repository",
            "docker", "kubernetes", "microservice", "kafka", "redis", "cache", "acid", "transaction",
            "lock", "concurrency", "thread", "async", "exception", "test", "junit", "mock",
            "index", "latency", "scale", "git", "maven", "endpoint", "dto", "entity", "auth",
            "validation", "circuit breaker", "resilience4j", "load balancer", "cloud", "aws",
            "data structure", "algorithm", "tree", "graph", "hash", "frontend", "react", "node"
    );

    private boolean isNonAnswerOrEvasive(String text) {
        if (text == null) return true;
        String clean = text.trim().toLowerCase();
        if (clean.isEmpty()) return true;

        List<String> evasivePhrases = List.of(
                "yes", "no", "yep", "yeah", "ok", "okay", "sure", "fine", "yup",
                "i don't know", "i dont know", "dont know", "no idea", "dunno", "idk", "not sure",
                "what we do in project", "in project", "project", "nothing", "none", "na", "n/a",
                "skip", "pass", "idk man", "dunno man", "just project", "simple project"
        );

        if (evasivePhrases.contains(clean)) return true;

        // Check if string contains no technical keywords and is very brief (less than 4 words)
        String[] words = clean.split("\\s+");
        if (words.length <= 4) {
            boolean hasTech = false;
            for (String w : words) {
                if (TECH_DICTIONARY.contains(w.replaceAll("[^a-z0-9]", ""))) {
                    hasTech = true;
                    break;
                }
            }
            if (!hasTech) return true;
        }

        return false;
    }

    private List<String> extractDetectedTechTerms(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String lower = text.toLowerCase();
        Set<String> found = new LinkedHashSet<>();
        for (String term : TECH_DICTIONARY) {
            if (lower.matches("(?s).*\\b" + Pattern.quote(term) + "\\b.*")) {
                found.add(term);
            }
        }
        return new ArrayList<>(found);
    }

    public String resolvePrimarySkillForRole(String targetRole, List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return (targetRole != null && targetRole.toLowerCase().contains("frontend")) ? "React" : "Java";
        }
        boolean isBackend = targetRole != null && (targetRole.toLowerCase().contains("backend") || targetRole.toLowerCase().contains("systems"));
        if (isBackend) {
            // Find first backend-relevant skill from candidate's skills, avoiding frontend skills
            for (String s : skills) {
                String l = s.trim().toLowerCase();
                if (l.equals("java") || l.contains("spring") || l.contains("sql") || l.contains("postgres")
                        || l.contains("python") || l.contains("backend") || l.contains("rest") || l.contains("microservice")) {
                    return s.trim();
                }
            }
            return "Java";
        }
        return skills.get(0);
    }

    public List<String> identifyAssessedSkills(String targetRole, List<Map<String, String>> transcript) {
        Set<String> assessed = new LinkedHashSet<>();
        StringBuilder fullTextBuilder = new StringBuilder();
        if (targetRole != null) fullTextBuilder.append(targetRole).append(" ");
        if (transcript != null) {
            for (Map<String, String> t : transcript) {
                if (t.get("message") != null) fullTextBuilder.append(t.get("message")).append(" ");
            }
        }
        String fullText = fullTextBuilder.toString().toLowerCase();

        // 1. Strict Java check: Java without JavaScript
        String textWithoutJs = fullText.replaceAll("(?i)\\bjavascript\\b|\\bjs\\b", " ");
        if (textWithoutJs.matches("(?s).*\\bjava\\b.*")) {
            assessed.add("Java");
        }

        // 2. Check other backend core skills if questions/role covered them
        if (fullText.contains("spring") || fullText.contains("spring boot")) {
            assessed.add("Spring Boot");
        }
        if (fullText.contains("rest") || fullText.contains("api") || fullText.contains("controller") || fullText.contains("endpoint")) {
            assessed.add("REST APIs");
        }
        if (fullText.contains("sql") || fullText.contains("postgres") || fullText.contains("database") || fullText.contains("persistence") || fullText.contains("entity") || fullText.contains("entities")) {
            assessed.add("SQL");
            assessed.add("SQL / PostgreSQL");
        }
        if (fullText.contains("microservice") || fullText.contains("distributed")) {
            assessed.add("Microservices");
        }
        if (fullText.contains("redis") || fullText.contains("cache")) {
            assessed.add("Redis Caching");
        }

        // 3. Other languages
        if (fullText.matches("(?s).*\\bpython\\b.*")) {
            assessed.add("Python");
        }
        if (fullText.matches("(?s).*\\b(c\\+\\+|cpp)\\b.*")) {
            assessed.add("C++");
        }

        // 4. Frontend skills ONLY if role is Frontend/Fullstack AND explicitly discussed
        boolean isBackendRole = targetRole != null && (targetRole.toLowerCase().contains("backend") || targetRole.toLowerCase().contains("systems"));
        if (!isBackendRole) {
            if (fullText.matches("(?s).*\\b(javascript|es6)\\b.*")) {
                assessed.add("JavaScript");
            }
            if (fullText.contains("react")) {
                assessed.add("React");
            }
        }

        // Fallback for backend roles: always at least Java if targeting backend
        if (isBackendRole && assessed.isEmpty()) {
            assessed.add("Java");
        }

        return new ArrayList<>(assessed);
    }

    /**
     * Generates an adaptive interview question dynamically based on the candidate's actual previous response.
     */
    public String generateAdaptiveQuestion(String targetRole, List<String> skills, List<Map<String, String>> previousTurns) {
        // Identify the last student response
        String lastStudentAnswer = "";
        for (int i = previousTurns.size() - 1; i >= 0; i--) {
            if ("student".equalsIgnoreCase(previousTurns.get(i).get("sender"))) {
                lastStudentAnswer = previousTurns.get(i).getOrDefault("message", "").trim();
                break;
            }
        }

        if (isConfigured()) {
            try {
                String prompt = "You are an expert technical interviewer conducting an adaptive technical interview for a candidate targeting the role: "
                        + targetRole + ".\n"
                        + "Candidate's verified skills: " + String.join(", ", skills) + ".\n"
                        + "Interview history so far:\n";

                for (Map<String, String> turn : previousTurns) {
                    prompt += turn.get("sender") + ": " + turn.get("message") + "\n";
                }

                prompt += "\nCRITICAL ADAPTIVE RULES:\n"
                        + "- Evaluate the candidate's last answer: '" + lastStudentAnswer + "'.\n"
                        + "- If the candidate gave a minimal, non-technical, or evasive answer (e.g. 'yes', 'I don't know', 'what we do in project'), explicitly address their lack of detail and challenge them to provide concrete technical implementation, or pivot to core fundamentals.\n"
                        + "- If the candidate provided technical substance, drill deeper into architecture, edge cases, trade-offs, or concurrency.\n"
                        + "- Output ONLY ONE concise, direct interview question without pleasantries or markdown.";

                String result = callLlm(prompt);
                return result.replaceAll("^\"|\"$", "").trim();
            } catch (Exception e) {
                log.warn("[LlmService] Interview LLM call failed, utilizing dynamic adaptive engine: {}", e.getMessage());
            }
        }

        int turnCount = previousTurns.size();
        if (turnCount == 0) {
            String primarySkill = resolvePrimarySkillForRole(targetRole, skills);
            return "Welcome! Looking at your background targeting " + targetRole + " and " + primarySkill
                    + ", could you walk me through the architecture of a project you built, focusing on how you structured your services and managed data persistence?";
        }

        // Dynamically adapt to the candidate's last answer
        String cleanAnswer = lastStudentAnswer.toLowerCase().trim();

        if (isNonAnswerOrEvasive(cleanAnswer)) {
            if (cleanAnswer.contains("know") || cleanAnswer.equals("idk") || cleanAnswer.equals("no idea")) {
                return "Understood that you are unfamiliar with that specific topic. Let's pivot to core backend fundamentals: How do you implement input validation and handle exceptions in a RESTful API controller?";
            } else if (cleanAnswer.contains("project") || cleanAnswer.equals("what we do in project")) {
                return "You mentioned '" + lastStudentAnswer + "', which is very high-level. To evaluate your practical contribution: What exact database entities, API endpoints, or business logic did you personally write in that codebase?";
            } else if (cleanAnswer.equals("yes") || cleanAnswer.equals("yep") || cleanAnswer.equals("yeah") || cleanAnswer.equals("ok")) {
                return "You responded with '" + lastStudentAnswer + "', but technical defense requires concrete specifics. Can you explain the actual architectural components, database schema, or design patterns you implemented?";
            } else {
                return "Your response was very brief. Can you provide a concrete technical example of how you structured your code, handled errors, and verified functionality?";
            }
        }

        // Candidate gave technical content -> probe deeper into their mentioned topics
        List<String> detectedTech = extractDetectedTechTerms(cleanAnswer);
        if (!detectedTech.isEmpty()) {
            if (detectedTech.contains("database") || detectedTech.contains("sql") || detectedTech.contains("postgres") || detectedTech.contains("jpa")) {
                return "Regarding your database implementation with " + detectedTech.get(0) + ": How did you configure transaction boundaries and handle potential race conditions or lock contention during concurrent updates?";
            } else if (detectedTech.contains("redis") || detectedTech.contains("cache")) {
                return "On your caching layer with Redis: What cache invalidation policies (TTL, LRU) did you use, and how did your system prevent cache penetration or stale reads?";
            } else if (detectedTech.contains("jwt") || detectedTech.contains("security") || detectedTech.contains("auth")) {
                return "Looking at your authentication flow: How did you handle token expiration, secret key rotation, and ensure stateless authorization across distributed requests?";
            } else if (detectedTech.contains("microservice") || detectedTech.contains("kafka")) {
                return "In your distributed architecture: How did you ensure event delivery guarantees and handle message deduplication or consumer failures?";
            }
        }

        // Generic substantive follow-ups based on turn progression
        if (turnCount <= 2) {
            return "Good context. If that service experienced a sudden 10x traffic spike and database read latency increased, what caching or scaling strategy would you implement?";
        } else if (turnCount <= 4) {
            return "How did you handle error recovery and graceful degradation when downstream services or dependencies became temporarily unavailable?";
        } else {
            return "Final question: How did you approach automated unit and integration testing to ensure zero regression before deploying to production?";
        }
    }

    /**
     * Evaluates the completed interview transcript into a structured, evidence-grounded rubric.
     */
    public Map<String, Object> evaluateInterviewTranscript(String targetRole, List<Map<String, String>> transcript) {
        Map<String, Object> rubric = new HashMap<>();
        List<String> assessedSkillsList = identifyAssessedSkills(targetRole, transcript);
        String assessedSkillsStr = String.join(",", assessedSkillsList);
        rubric.put("assessedSkills", assessedSkillsStr);

        // Extract candidate answers
        List<String> studentAnswers = new ArrayList<>();
        int totalStudentWordCount = 0;
        int nonAnswerCount = 0;
        Set<String> allDetectedTechTerms = new LinkedHashSet<>();

        for (Map<String, String> t : transcript) {
            if ("student".equalsIgnoreCase(t.get("sender"))) {
                String ans = t.getOrDefault("message", "").trim();
                studentAnswers.add(ans);
                String[] words = ans.split("\\s+");
                totalStudentWordCount += (ans.isEmpty() ? 0 : words.length);

                if (isNonAnswerOrEvasive(ans)) {
                    nonAnswerCount++;
                }
                allDetectedTechTerms.addAll(extractDetectedTechTerms(ans));
            }
        }

        int totalAnswers = studentAnswers.size();
        boolean isPredominantlyWeak = totalAnswers > 0 && (nonAnswerCount >= (totalAnswers - 1) && allDetectedTechTerms.isEmpty() && totalStudentWordCount < 30);

        // Format candidate quotes for evidence citation in recruiter summary
        List<String> quotedSamples = new ArrayList<>();
        for (int i = 0; i < Math.min(studentAnswers.size(), 3); i++) {
            String sample = studentAnswers.get(i);
            if (sample.length() > 30) sample = sample.substring(0, 27) + "...";
            quotedSamples.add("\"" + sample + "\"");
        }
        String quotesEvidenceStr = String.join(", ", quotedSamples);

        if (isConfigured()) {
            try {
                String prompt = "You are a senior technical interviewer evaluating this candidate transcript for role: " + targetRole + ".\n"
                        + "CRITICAL EVALUATION MANDATES:\n"
                        + "1. Candidate gave answers including: " + quotesEvidenceStr + ".\n"
                        + "2. If answers are brief, non-technical, evasive, or minimal (e.g. 'yes', 'I don't know', 'what we do in project'), technicalScore, projectScore, problemSolvingScore, and overallScore MUST be between 10.0 and 25.0 out of 100. DO NOT award passing scores to non-answers.\n"
                        + "3. The 'summaryVerdict' MUST explicitly quote the candidate's actual answers (e.g. " + quotesEvidenceStr + ") and critique their lack of depth.\n"
                        + "4. If candidate provided strong technical explanations, score accordingly and cite their specific points.\n\n"
                        + "Transcript:\n";
                for (Map<String, String> t : transcript) {
                    prompt += t.get("sender") + ": " + t.get("message") + "\n";
                }
                prompt += "\nReturn strictly valid JSON:\n"
                        + "{\n"
                        + "  \"technicalScore\": 15.0,\n"
                        + "  \"projectScore\": 15.0,\n"
                        + "  \"problemSolvingScore\": 12.0,\n"
                        + "  \"communicationScore\": 18.0,\n"
                        + "  \"overallScore\": 15.0,\n"
                        + "  \"strengths\": \"Honest answers / Attempted prompts\",\n"
                        + "  \"improvements\": \"Needs foundational study in architecture and coding\",\n"
                        + "  \"verdict\": \"Candidate gave weak answers...\"\n"
                        + "}";

                String json = callLlm(prompt);
                JsonNode node = objectMapper.readTree(json.trim());

                double techScore = node.path("technicalScore").asDouble(isPredominantlyWeak ? 15.0 : 75.0);
                double projScore = node.path("projectScore").asDouble(isPredominantlyWeak ? 14.0 : 75.0);
                double psScore = node.path("problemSolvingScore").asDouble(isPredominantlyWeak ? 12.0 : 70.0);
                double commScore = node.path("communicationScore").asDouble(isPredominantlyWeak ? 18.0 : 75.0);
                double ovScore = node.path("overallScore").asDouble(isPredominantlyWeak ? 14.8 : 74.0);

                // Anti-hallucination clamp: if candidate gave only non-answers, never allow score > 25.0
                if (isPredominantlyWeak) {
                    techScore = Math.min(22.0, techScore);
                    projScore = Math.min(22.0, projScore);
                    psScore = Math.min(20.0, psScore);
                    commScore = Math.min(28.0, commScore);
                    ovScore = Math.min(22.5, ovScore);
                }

                rubric.put("technicalScore", Math.round(techScore * 10.0) / 10.0);
                rubric.put("projectScore", Math.round(projScore * 10.0) / 10.0);
                rubric.put("problemSolvingScore", Math.round(psScore * 10.0) / 10.0);
                rubric.put("communicationScore", Math.round(commScore * 10.0) / 10.0);
                rubric.put("overallScore", Math.round(ovScore * 10.0) / 10.0);
                rubric.put("strengths", node.path("strengths").asText(isPredominantlyWeak ? "Candidate completed the interview rounds." : "Clear grasp of core architectural patterns."));
                rubric.put("improvements", node.path("improvements").asText(isPredominantlyWeak ? "Must build hands-on project implementations and study fundamental system design." : "Deepen distributed system resilience and production testing."));
                rubric.put("verdict", node.path("verdict").asText("Candidate evaluated for " + targetRole));
                return rubric;
            } catch (Exception e) {
                log.warn("[LlmService] Evaluation call failed, using evidence-grounded rubric: {}", e.getMessage());
            }
        }

        // Deterministic, Evidence-Grounded Rubric Evaluation
        if (studentAnswers.isEmpty() || isPredominantlyWeak) {
            double tech = 15.0;
            double proj = 14.0;
            double ps = 12.0;
            double comm = 18.0;
            double overall = Math.round((0.35 * tech + 0.25 * proj + 0.25 * ps + 0.15 * comm) * 10.0) / 10.0;

            rubric.put("technicalScore", tech);
            rubric.put("projectScore", proj);
            rubric.put("problemSolvingScore", ps);
            rubric.put("communicationScore", comm);
            rubric.put("overallScore", overall);
            rubric.put("strengths", "Candidate was willing to attend the session and submit responses across all turns.");
            rubric.put("improvements", "Comprehensive technical upskilling required. Focus on hands-on project building, architecture explanation, and database fundamentals.");
            rubric.put("verdict", String.format(
                    "Candidate provided minimal and non-technical responses (e.g., %s). Failed to articulate project architecture, concurrency control, or system design trade-offs. Overall defense score of %.1f/100 reflects a lack of demonstrated competence for %s.",
                    quotesEvidenceStr, overall, targetRole
            ));
            return rubric;
        }

        // Substantive / Technical Answers Evaluation
        double baseTech = Math.min(94.0, 35.0 + (allDetectedTechTerms.size() * 10.0) + (totalStudentWordCount / 8.0));
        double baseProj = Math.min(92.0, 30.0 + (totalStudentWordCount / 7.0));
        double basePs = Math.min(90.0, 25.0 + (allDetectedTechTerms.size() * 8.0) + (totalStudentWordCount / 9.0));
        double baseComm = Math.min(95.0, 40.0 + (totalStudentWordCount / 6.0) - (nonAnswerCount * 12.0));

        baseTech = Math.max(25.0, Math.min(96.0, baseTech));
        baseProj = Math.max(25.0, Math.min(95.0, baseProj));
        basePs = Math.max(20.0, Math.min(92.0, basePs));
        baseComm = Math.max(25.0, Math.min(95.0, baseComm));

        double overall = Math.round((0.35 * baseTech + 0.25 * baseProj + 0.25 * basePs + 0.15 * baseComm) * 10.0) / 10.0;

        rubric.put("technicalScore", Math.round(baseTech * 10.0) / 10.0);
        rubric.put("projectScore", Math.round(baseProj * 10.0) / 10.0);
        rubric.put("problemSolvingScore", Math.round(basePs * 10.0) / 10.0);
        rubric.put("communicationScore", Math.round(baseComm * 10.0) / 10.0);
        rubric.put("overallScore", overall);

        String techMentionSummary = !allDetectedTechTerms.isEmpty()
                ? "demonstrated understanding of " + String.join(", ", allDetectedTechTerms)
                : "provided structured procedural explanations";

        rubric.put("strengths", "Candidate " + techMentionSummary + " and articulated key engineering workflows.");
        rubric.put("improvements", "Continue deepening production observability, distributed fault tolerance, and comprehensive automated test suites.");
        rubric.put("verdict", String.format(
                "Candidate successfully cleared the adaptive technical defense with a score of %.1f/100. Articulated relevant engineering practices (%s) appropriate for %s.",
                overall, techMentionSummary, targetRole
        ));
        return rubric;
    }

    /**
     * Generates a personalized weekly roadmap for a student bridging specific role deficits.
     */
    public List<Map<String, Object>> generatePersonalizedRoadmap(
            String targetRole,
            List<Map<String, Object>> currentSkills,
            List<Map<String, Object>> skillGaps
    ) {
        if (skillGaps == null || skillGaps.isEmpty()) {
            return Collections.emptyList();
        }

        if (isConfigured()) {
            try {
                String prompt = buildRoadmapPrompt(targetRole, currentSkills, skillGaps);
                String json = callLlm(prompt);
                List<Map<String, Object>> parsed = parseRoadmapJson(json);
                if (parsed != null && !parsed.isEmpty()) {
                    return parsed;
                }
            } catch (Exception e) {
                log.warn("[LlmService] LLM roadmap call failed, using intelligent heuristic roadmap: {}", e.getMessage());
            }
        }

        return generateHeuristicRoadmap(targetRole, skillGaps);
    }

    private String buildRoadmapPrompt(String targetRole, List<Map<String, Object>> currentSkills, List<Map<String, Object>> skillGaps) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an elite Engineering Director and Technical Hiring Mentor. ");
        sb.append("Generate a personalized, progressive weekly roadmap for a candidate targeting the role: ").append(targetRole).append(".\n\n");

        sb.append("Candidate's Current Verified Skills:\n");
        if (currentSkills != null) {
            for (Map<String, Object> s : currentSkills) {
                sb.append("- ").append(s.get("name")).append(": Score ").append(s.get("score")).append("% (Status: ").append(s.get("status")).append(")\n");
            }
        }

        sb.append("\nIdentified Competency Gaps to Target:\n");
        for (Map<String, Object> g : skillGaps) {
            sb.append("- ").append(g.get("name")).append(": Current ").append(g.get("currentScore")).append("%, Target ").append(g.get("targetScore"))
              .append("%, Deficit: ").append(g.get("deficit")).append("%\n");
        }

        sb.append("\nReturn a JSON array of weekly milestones (1 milestone per gap, max ").append(Math.min(8, skillGaps.size())).append(" weeks):\n");
        sb.append("[\n");
        sb.append("  {\n");
        sb.append("    \"week\": 1,\n");
        sb.append("    \"title\": \"Milestone Title\",\n");
        sb.append("    \"skills\": [\"SkillName\"],\n");
        sb.append("    \"description\": \"In-depth conceptual and architectural focus\",\n");
        sb.append("    \"action\": \"Concrete hands-on project challenge\",\n");
        sb.append("    \"verificationMethod\": \"Practical Assessment / GitHub Code Audit\"\n");
        sb.append("  }\n");
        sb.append("]\n");
        sb.append("Return ONLY pure JSON, no markdown formatting.");
        return sb.toString();
    }

    private List<Map<String, Object>> parseRoadmapJson(String jsonText) {
        try {
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
            if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
            if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);

            JsonNode root = objectMapper.readTree(cleaned.trim());
            if (!root.isArray()) return null;

            List<Map<String, Object>> list = new ArrayList<>();
            int w = 1;
            for (JsonNode n : root) {
                Map<String, Object> m = new HashMap<>();
                m.put("week", n.path("week").asInt(w++));
                m.put("title", n.path("title").asText("Target Upskilling Milestone"));
                m.put("description", n.path("description").asText(""));
                m.put("action", n.path("action").asText("Implement hands-on code and complete verification."));
                m.put("verificationMethod", n.path("verificationMethod").asText("Practical Assessment & GitHub Verification"));

                List<String> skills = new ArrayList<>();
                if (n.has("skills") && n.get("skills").isArray()) {
                    n.get("skills").forEach(s -> skills.add(s.asText()));
                }
                m.put("skills", skills);
                list.add(m);
            }
            return list;
        } catch (Exception e) {
            log.warn("[LlmService] Failed to parse roadmap JSON from LLM: {}", e.getMessage());
            return null;
        }
    }

    public List<Map<String, Object>> generateHeuristicRoadmap(String targetRole, List<Map<String, Object>> skillGaps) {
        List<Map<String, Object>> milestones = new ArrayList<>();
        int week = 1;

        for (Map<String, Object> gap : skillGaps) {
            String skill = (String) gap.get("name");
            int current = gap.get("currentScore") != null ? ((Number) gap.get("currentScore")).intValue() : 0;
            int target = gap.get("targetScore") != null ? ((Number) gap.get("targetScore")).intValue() : 75;
            int deficit = gap.get("deficit") != null ? ((Number) gap.get("deficit")).intValue() : (target - current);

            Map<String, Object> m = new HashMap<>();
            m.put("week", week++);
            m.put("title", resolveMilestoneTitle(skill, deficit));
            m.put("skills", List.of(skill));
            m.put("description", resolveMilestoneDescription(skill, targetRole));
            m.put("action", String.format("Bridge %d%% deficit in %s: Current verified score is %d%% (Target: %d%%). %s",
                    deficit, skill, current, target, resolveMilestoneAction(skill)));
            m.put("verificationMethod", resolveVerificationMethod(skill, current));
            milestones.add(m);
        }

        return milestones;
    }

    private String resolveMilestoneTitle(String skill, int deficit) {
        String s = skill.toLowerCase();
        if (s.contains("java") && !s.contains("script")) return String.format("Advanced Java 17 Concurrency & JVM Architecture (Bridge %d%% Deficit)", deficit);
        if (s.contains("spring")) return String.format("Spring Boot Microservices & Reactive Data Flow (Bridge %d%% Deficit)", deficit);
        if (s.contains("sql") || s.contains("postgres")) return String.format("Relational Database Optimization & ACID Design (Bridge %d%% Deficit)", deficit);
        if (s.contains("react")) return String.format("High-Performance React & Concurrent UI Systems (Bridge %d%% Deficit)", deficit);
        if (s.contains("javascript") || s.equals("js")) return String.format("Modern ES6+ JavaScript & Event Loop Internals (Bridge %d%% Deficit)", deficit);
        if (s.contains("typescript")) return String.format("Strict TypeScript Types & Enterprise Domain Modeling (Bridge %d%% Deficit)", deficit);
        if (s.contains("docker")) return String.format("Multi-Stage Production Containerization with Docker (Bridge %d%% Deficit)", deficit);
        if (s.contains("kubernetes")) return String.format("Kubernetes Cluster Orchestration & Ingress Traffic (Bridge %d%% Deficit)", deficit);
        if (s.contains("aws")) return String.format("AWS Cloud Infrastructure & Serverless Microservices (Bridge %d%% Deficit)", deficit);
        if (s.contains("python")) return String.format("Production Python & Algorithmic Scalability (Bridge %d%% Deficit)", deficit);
        if (s.contains("machine learning") || s.equals("ml")) return String.format("Machine Learning Model Engineering & Evaluation (Bridge %d%% Deficit)", deficit);
        if (s.contains("deep learning")) return String.format("Deep Neural Networks & Transformer Architectures (Bridge %d%% Deficit)", deficit);
        if (s.contains("ci/cd")) return String.format("Automated CI/CD Deployment Pipelines & Guardrails (Bridge %d%% Deficit)", deficit);
        if (s.contains("html")) return String.format("Semantic HTML5 & Accessible Component Architecture (Bridge %d%% Deficit)", deficit);
        if (s.contains("css")) return String.format("Responsive CSS3, Flex/Grid & Design Token Systems (Bridge %d%% Deficit)", deficit);
        if (s.contains("system design")) return String.format("Distributed High-Availability System Design (Bridge %d%% Deficit)", deficit);
        return String.format("Production Mastery in %s (Bridge %d%% Deficit)", skill, deficit);
    }

    private String resolveMilestoneDescription(String skill, String targetRole) {
        String s = skill.toLowerCase();
        if (s.contains("java") && !s.contains("script")) return "Master memory visibility (happens-before), lock-free atomics, virtual threads, and Garbage Collection tuning for high-throughput enterprise systems.";
        if (s.contains("spring")) return "Architect resilient microservices with Spring Data JPA pessimistic locking, Micrometer observability, and Spring Security stateless JWT pipelines.";
        if (s.contains("sql") || s.contains("postgres")) return "Profile execution plans using EXPLAIN ANALYZE, implement composite B-Tree indexes, and guarantee consistency across concurrent transactions.";
        if (s.contains("react")) return "Design accessible component architectures, memoization strategies, custom state reducers, and server-driven optimistic UI updates.";
        if (s.contains("javascript") || s.equals("js")) return "Deep dive into microtask queues, closure memory leaks, asynchronous stream processing, and V8 engine execution semantics.";
        if (s.contains("typescript")) return "Leverage conditional types, mapped utility types, discriminated unions, and strict generic constraints for zero-runtime type errors.";
        if (s.contains("docker")) return "Build lightweight, secure Alpine multi-stage container images, handle non-root privileges, and implement health-check probes.";
        if (s.contains("kubernetes")) return "Deploy declarative manifests with ConfigMaps, Secrets, Horizontal Pod Autoscaling (HPA), and rolling update rollbacks.";
        if (s.contains("aws")) return "Configure secure VPC subnets, IAM role policies, ECS/Fargate container clusters, S3 buckets, and CloudWatch metrics.";
        if (s.contains("python")) return "Write idiomatic, vectorized Python with NumPy/Pandas, profile memory allocations, and construct scalable backend pipelines.";
        if (s.contains("machine learning") || s.equals("ml")) return "Engineer feature pipelines, train cross-validated scikit-learn models, and monitor precision/recall curves for production deployments.";
        return String.format("Develop enterprise-grade competency in %s tailored for %s production environments.", skill, targetRole);
    }

    private String resolveMilestoneAction(String skill) {
        String s = skill.toLowerCase();
        if (s.contains("java") && !s.contains("script")) return "Build a multithreaded producer-consumer task processor with non-blocking queues and unit tests.";
        if (s.contains("spring")) return "Implement a secure REST microservice with JPA repository pagination, exception handlers, and actuator health checks.";
        if (s.contains("sql") || s.contains("postgres")) return "Write normalized DDL schemas, create index profiles, and benchmark query performance against 100,000 mock records.";
        if (s.contains("react")) return "Develop an interactive data grid with keyboard accessibility, virtualized rows, and optimistic updates.";
        if (s.contains("javascript") || s.equals("js")) return "Implement a custom Promise pool limiter and async retry mechanism with exponential backoff.";
        if (s.contains("docker")) return "Containerize a sample microservice into a multi-stage Dockerfile under 120MB and verify compose orchestration.";
        if (s.contains("aws")) return "Author Terraform or CloudFormation scripts to provision an ALB, container task, and secure RDS database.";
        return String.format("Develop and commit an end-to-end %s implementation to GitHub with verified automated test coverage.", skill);
    }

    private String resolveVerificationMethod(String skill, int currentScore) {
        if (currentScore == 0) {
            return "Pass Tier 3 Assessment Quiz & commit verified project to GitHub repository.";
        } else {
            return "Tier 4 AI Interview Defense & Live Code Architecture Audit.";
        }
    }
}
