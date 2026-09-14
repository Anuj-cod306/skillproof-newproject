package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final RoadmapMilestoneRepository milestoneRepository;
    private final StudentProfileService studentProfileService;
    private final StudentSkillService studentSkillService;
    private final StudentRepository studentRepository;
    private final LlmService llmService;

    public static final List<String> SUPPORTED_ROLES = List.of(
            "Backend Developer",
            "Frontend Developer",
            "Full Stack Developer",
            "Data Scientist",
            "ML Engineer",
            "DevOps Engineer",
            "Cloud Engineer",
            "Software Engineer"
    );

    public static class TargetSkillRequirement {
        public String name;
        public String category;
        public double targetScore;
        public double importance; // 1.0 = Critical, 0.85 = High, 0.7 = Moderate
        public String milestoneTitle;
        public String actionItem;
        public String description;

        public TargetSkillRequirement(String name, String category, double targetScore, double importance,
                                      String milestoneTitle, String actionItem, String description) {
            this.name = name;
            this.category = category;
            this.targetScore = targetScore;
            this.importance = importance;
            this.milestoneTitle = milestoneTitle;
            this.actionItem = actionItem;
            this.description = description;
        }
    }

    @Transactional
    public Map<String, Object> updateStudentTargetRole(String userEmail, String newRole) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String resolvedRole = SUPPORTED_ROLES.stream()
                .filter(r -> r.equalsIgnoreCase(newRole.trim()))
                .findFirst()
                .orElse(newRole.trim());

        student.setTargetRole(resolvedRole);
        studentRepository.save(student);
        log.info("[RoadmapService] Updated target role for student {} to '{}'", student.getId(), resolvedRole);
        return getOrGenerateRoadmap(userEmail);
    }

    @Transactional
    public Map<String, Object> getOrGenerateRoadmap(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String targetRole = student.getTargetRole() != null && !student.getTargetRole().isBlank()
                ? student.getTargetRole()
                : "Backend Developer";

        // 1. Fetch student's CURRENT live Skill Map from studentSkillService (Single Source of Truth)
        List<Map<String, Object>> liveSkillMap = studentSkillService.getStudentSkillMap(userEmail);

        // 2. Resolve target role requirements
        List<TargetSkillRequirement> requirements = getRoleRequirements(targetRole);

        // 3. Evaluate skill gaps vs target requirements
        List<Map<String, Object>> matchedSkills = new ArrayList<>();
        List<Map<String, Object>> missingSkills = new ArrayList<>();

        List<String> matchedDisplayStrings = new ArrayList<>();
        List<String> missingDisplayStrings = new ArrayList<>();

        double totalDeficit = 0.0;
        double totalRequiredThreshold = 0.0;

        for (TargetSkillRequirement req : requirements) {
            totalRequiredThreshold += req.targetScore;

            // Match student skill from live Skill Map
            Map<String, Object> found = findStudentSkillInMap(liveSkillMap, req.name);
            double currentScore = 0.0;
            if (found != null && found.get("score") != null) {
                currentScore = ((Number) found.get("score")).doubleValue();
            }

            if (currentScore >= req.targetScore) {
                // Target Role Strength / Ready
                String explanation = String.format("Skill '%s' meets or exceeds the %s requirement (Verified %d%% vs Target %d%%). Production ready.",
                        req.name, targetRole, (int) Math.round(currentScore), (int) Math.round(req.targetScore));

                Map<String, Object> m = new HashMap<>();
                m.put("name", req.name);
                m.put("category", req.category);
                m.put("currentScore", (int) Math.round(currentScore));
                m.put("targetScore", (int) Math.round(req.targetScore));
                m.put("status", "Ready");
                m.put("deficit", 0);
                m.put("explanation", explanation);
                matchedSkills.add(m);

                matchedDisplayStrings.add(String.format("%s (Verified %d%% vs Target %d%% - Ready)",
                        req.name, (int) Math.round(currentScore), (int) Math.round(req.targetScore)));
            } else {
                // Skill Gap / Deficit
                double deficit = req.targetScore - currentScore;
                totalDeficit += deficit;
                double priorityScore = (deficit / 100.0) * req.importance;

                String explanation = String.format("Skill '%s' has a verified score of %d%% against the %s benchmark of %d%% (Deficit: %d%%). %s",
                        req.name, (int) Math.round(currentScore), targetRole, (int) Math.round(req.targetScore), (int) Math.round(deficit),
                        currentScore > 0 ? "Additional assessment or code depth needed." : "No verified code or assessment found.");

                Map<String, Object> m = new HashMap<>();
                m.put("name", req.name);
                m.put("category", req.category);
                m.put("currentScore", (int) Math.round(currentScore));
                m.put("targetScore", (int) Math.round(req.targetScore));
                m.put("deficit", (int) Math.round(deficit));
                m.put("priorityScore", priorityScore);
                m.put("importance", req.importance);
                m.put("status", currentScore > 0 ? "In Progress" : "Missing");
                m.put("milestoneTitle", req.milestoneTitle);
                m.put("actionItem", req.actionItem);
                m.put("description", req.description);
                m.put("explanation", explanation);
                missingSkills.add(m);

                missingDisplayStrings.add(String.format("%s (Current: %d%% vs Target %d%% - Deficit: %d%%)",
                        req.name, (int) Math.round(currentScore), (int) Math.round(req.targetScore), (int) Math.round(deficit)));
            }
        }

        // 4. Sort missing skills by priority (deficit size * importance) descending
        missingSkills.sort((a, b) -> Double.compare(
                ((Number) b.get("priorityScore")).doubleValue(),
                ((Number) a.get("priorityScore")).doubleValue()
        ));

        // 5. Fetch or create Roadmap entity
        Roadmap roadmap = roadmapRepository.findFirstByStudentIdOrderByCreatedAtDesc(student.getId())
                .orElseGet(() -> Roadmap.builder()
                        .studentId(student.getId())
                        .title("Personalized " + targetRole + " Production Accelerator")
                        .targetRole(targetRole)
                        .durationWeeks(missingSkills.size())
                        .progressPercentage(BigDecimal.ZERO)
                        .build());

        roadmap.setTargetRole(targetRole);
        roadmap.setTitle("Personalized " + targetRole + " Production Accelerator");
        roadmap = roadmapRepository.save(roadmap);

        // Fetch existing milestones to preserve any previously completed status
        List<RoadmapMilestone> existingMilestones = milestoneRepository.findByRoadmapIdOrderByWeekNumberAsc(roadmap.getId());
        Map<String, Boolean> completedStatusMap = new HashMap<>();
        for (RoadmapMilestone em : existingMilestones) {
            if (em.getTitle() != null) {
                completedStatusMap.put(em.getTitle().toLowerCase(), Boolean.TRUE.equals(em.getIsCompleted()));
            }
            if (em.getSkillsCovered() != null) {
                completedStatusMap.put(em.getSkillsCovered().toLowerCase(), Boolean.TRUE.equals(em.getIsCompleted()));
            }
        }

        // Clear previous milestones to regenerate strictly from actual current gaps
        milestoneRepository.deleteAll(existingMilestones);

        // 6. Generate milestones dynamically using LlmService (AI or intelligent heuristic fallback)
        List<RoadmapMilestone> newMilestones = new ArrayList<>();

        if (missingSkills.isEmpty()) {
            // Zero critical skill gaps! Genuine placement-ready state with 0-week roadmap
            log.info("Student {} is genuinely placement-ready for {}. 0 skill gaps.", student.getId(), targetRole);
        } else {
            List<Map<String, Object>> aiMilestones = llmService.generatePersonalizedRoadmap(targetRole, liveSkillMap, missingSkills);
            int weekIndex = 1;

            for (Map<String, Object> aiM : aiMilestones) {
                int w = aiM.get("week") != null ? ((Number) aiM.get("week")).intValue() : weekIndex++;
                String title = (String) aiM.getOrDefault("title", "Target Upskilling Milestone");
                String desc = (String) aiM.getOrDefault("description", "Master core domain concepts and architecture patterns.");
                String action = (String) aiM.getOrDefault("action", "Implement hands-on code and complete verification.");
                String verMethod = (String) aiM.getOrDefault("verificationMethod", "Tier 3 Quiz Assessment & GitHub Code Audit");

                Object skillsObj = aiM.get("skills");
                String skillsCoveredStr = "";
                if (skillsObj instanceof List) {
                    skillsCoveredStr = String.join(", ", (List<String>) skillsObj);
                } else if (skillsObj != null) {
                    skillsCoveredStr = skillsObj.toString();
                }

                boolean wasCompleted = completedStatusMap.getOrDefault(title.toLowerCase(),
                        completedStatusMap.getOrDefault(skillsCoveredStr.toLowerCase(), false));

                String combinedAction = verMethod != null && !verMethod.isBlank()
                        ? action + " [Verification: " + verMethod + "]"
                        : action;

                RoadmapMilestone rm = RoadmapMilestone.builder()
                        .roadmap(roadmap)
                        .weekNumber(w)
                        .title(title)
                        .description(desc)
                        .skillsCovered(skillsCoveredStr)
                        .actionItem(combinedAction)
                        .isCompleted(wasCompleted)
                        .build();
                newMilestones.add(rm);
            }
        }

        milestoneRepository.saveAll(newMilestones);

        boolean isPlacementReady = missingSkills.isEmpty() && !matchedSkills.isEmpty();
        long completedCount = newMilestones.stream().filter(m -> Boolean.TRUE.equals(m.getIsCompleted())).count();
        double progress = newMilestones.isEmpty() ? (isPlacementReady ? 100.0 : 0.0) : ((double) completedCount / newMilestones.size()) * 100.0;
        roadmap.setProgressPercentage(BigDecimal.valueOf(progress).setScale(1, RoundingMode.HALF_UP));
        roadmap.setDurationWeeks(newMilestones.size());
        roadmapRepository.save(roadmap);

        double gapPercentage = totalRequiredThreshold > 0
                ? (totalDeficit / totalRequiredThreshold) * 100.0
                : 0.0;

        List<Map<String, Object>> msResponse = new ArrayList<>();
        for (RoadmapMilestone m : newMilestones) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("week", m.getWeekNumber());
            map.put("weekNumber", m.getWeekNumber());
            map.put("title", m.getTitle());
            map.put("description", m.getDescription());
            map.put("skills", m.getSkillsCovered() != null ? Arrays.asList(m.getSkillsCovered().split(",")) : Collections.emptyList());
            map.put("skillsCovered", m.getSkillsCovered());
            map.put("action", m.getActionItem());
            map.put("actionItem", m.getActionItem());
            map.put("completed", Boolean.TRUE.equals(m.getIsCompleted()));
            map.put("isCompleted", Boolean.TRUE.equals(m.getIsCompleted()));
            msResponse.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("roadmapId", roadmap.getId());
        response.put("targetRole", targetRole);
        response.put("supportedRoles", SUPPORTED_ROLES);
        response.put("gapScore", (int) Math.round(gapPercentage));
        response.put("isPlacementReady", isPlacementReady);
        response.put("durationWeeks", newMilestones.size());
        response.put("matchedSkills", matchedDisplayStrings);
        response.put("missingSkills", missingDisplayStrings);
        response.put("matchedSkillDetails", matchedSkills);
        response.put("missingSkillDetails", missingSkills);
        response.put("progress", roadmap.getProgressPercentage());
        response.put("milestones", msResponse);

        return response;
    }

    @Transactional
    public Map<String, Object> toggleMilestone(Long milestoneId) {
        RoadmapMilestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found: " + milestoneId));

        m.setIsCompleted(!Boolean.TRUE.equals(m.getIsCompleted()));
        milestoneRepository.save(m);

        Roadmap roadmap = m.getRoadmap();
        if (roadmap != null) {
            List<RoadmapMilestone> msList = milestoneRepository.findByRoadmapIdOrderByWeekNumberAsc(roadmap.getId());
            long completedCount = msList.stream().filter(x -> Boolean.TRUE.equals(x.getIsCompleted())).count();
            double progress = msList.isEmpty() ? 100.0 : ((double) completedCount / msList.size()) * 100.0;
            roadmap.setProgressPercentage(BigDecimal.valueOf(progress).setScale(1, RoundingMode.HALF_UP));
            roadmapRepository.save(roadmap);
        }

        return Map.of("milestoneId", m.getId(), "completed", m.getIsCompleted());
    }

    private Map<String, Object> findStudentSkillInMap(List<Map<String, Object>> skillMap, String targetName) {
        if (skillMap == null || skillMap.isEmpty() || targetName == null) return null;
        String t = targetName.trim().toLowerCase();
        for (Map<String, Object> s : skillMap) {
            String name = (String) s.get("name");
            if (name == null) continue;
            String n = name.trim().toLowerCase();
            if (n.equals(t)) return s;
            // Distinct Java vs JavaScript
            if (t.equals("java") && n.contains("javascript")) continue;
            if (n.equals("java") && t.contains("javascript")) continue;
            // Handle Spring Boot / Spring
            if (t.contains("spring") && n.contains("spring")) return s;
            // Handle SQL / PostgreSQL variants
            if ((t.contains("sql") || t.contains("postgres")) && (n.contains("sql") || n.contains("postgres"))) return s;
            // Handle Docker / Containerization
            if (t.contains("docker") && n.contains("docker")) return s;
            // Handle Kubernetes / k8s
            if ((t.contains("kubernetes") || t.contains("k8s")) && (n.contains("kubernetes") || n.contains("k8s"))) return s;
            // Handle AWS Cloud variants
            if ((t.contains("aws") || t.contains("cloud")) && (n.contains("aws") || n.contains("cloud"))) return s;
            // Handle Linux
            if (t.contains("linux") && n.contains("linux")) return s;
            // Handle CI/CD
            if (t.contains("ci/cd") && n.contains("ci/cd")) return s;
            // Handle Machine Learning / ML
            if ((t.contains("machine learning") || t.equals("ml")) && (n.contains("machine learning") || n.equals("ml"))) return s;
            // Handle Deep Learning
            if (t.contains("deep learning") && n.contains("deep learning")) return s;
            // Handle Python
            if (t.contains("python") && n.contains("python")) return s;
            // Handle System Design / Architecture
            if (t.contains("system design") && (n.contains("system design") || n.contains("distributed"))) return s;
            // Handle Microservices
            if (t.contains("microservice") && n.contains("microservice")) return s;
            // Handle HTML / CSS / React
            if (t.contains("html") && n.contains("html")) return s;
            if (t.contains("css") && n.contains("css") && !n.contains("scss") && !t.contains("scss")) return s;
            if (t.contains("react") && n.contains("react")) return s;
            if (t.contains("redis") && n.contains("redis")) return s;
            if (t.contains("typescript") && n.contains("typescript")) return s;
            if (t.contains("javascript") && n.contains("javascript")) return s;
            if (t.contains(n) || n.contains(t)) return s;
        }
        return null;
    }

    private List<TargetSkillRequirement> getRoleRequirements(String roleName) {
        String lower = roleName != null ? roleName.toLowerCase() : "";
        List<TargetSkillRequirement> list = new ArrayList<>();

        if (lower.contains("frontend") || lower.contains("ui") || lower.contains("web designer")) {
            // Role 2: Frontend Developer
            list.add(new TargetSkillRequirement("JavaScript", "Frontend", 75.0, 1.0,
                    "Modern JavaScript (ES6+), Event Loop & Async Architecture",
                    "Deep-dive into microtask queue resolution, closures, and prototypical inheritance.",
                    "Master asynchronous JavaScript runtime characteristics, promises, and memory management."));
            list.add(new TargetSkillRequirement("React", "Frontend", 75.0, 1.0,
                    "High-Performance React Component Design & State Systems",
                    "Build accessible, high-performance UI components avoiding unnecessary re-renders.",
                    "Master hooks lifecycle, memoization, context splitting, and concurrent UI rendering."));
            list.add(new TargetSkillRequirement("TypeScript", "Frontend", 70.0, 0.9,
                    "Strict TypeScript Types & Enterprise Domain Modeling",
                    "Implement conditional generics, discriminated unions, and mapped utility types.",
                    "Eliminate runtime type mismatches and enforce type-safe API boundaries."));
            list.add(new TargetSkillRequirement("HTML", "Frontend", 70.0, 0.8,
                    "Semantic HTML5 & Web Accessibility (WCAG 2.1)",
                    "Audit semantic landmarks, keyboard navigation, and ARIA attributes.",
                    "Ensure production compliance with web accessibility and SEO standards."));
            list.add(new TargetSkillRequirement("CSS", "Frontend", 70.0, 0.8,
                    "Responsive CSS3, Grid/Flexbox & Design Tokens",
                    "Implement modern responsive layouts using container queries and Tailwind CSS.",
                    "Build fluid, adaptive web applications across all display viewports."));
            list.add(new TargetSkillRequirement("REST APIs", "Integration", 70.0, 0.85,
                    "Client-Side API Integration, Interceptors & Caching",
                    "Implement resilient data fetching layer with error boundaries and caching.",
                    "Handle optimistic mutations, token rotation, and network retry pipelines."));

        } else if (lower.contains("fullstack") || lower.contains("full stack")) {
            // Role 3: Full Stack Developer
            list.add(new TargetSkillRequirement("JavaScript", "Frontend", 75.0, 1.0,
                    "Fullstack JavaScript & Async Web Architecture",
                    "Master client-side and server-side JavaScript execution models.",
                    "Bridge frontend interactions with backend REST microservices."));
            list.add(new TargetSkillRequirement("React", "Frontend", 75.0, 0.95,
                    "Modern Reactive User Interfaces with React",
                    "Develop interactive dashboards connected to live backend APIs.",
                    "Implement secure JWT authentication flows and responsive design."));
            list.add(new TargetSkillRequirement("Java", "Backend", 70.0, 0.9,
                    "Java Object-Oriented Design & Core Algorithms",
                    "Implement clean enterprise domain models and unit tests.",
                    "Master JVM performance, collections, and multi-threading."));
            list.add(new TargetSkillRequirement("Spring Boot", "Backend", 70.0, 0.9,
                    "Spring Boot Microservices & Data Persistence",
                    "Construct authenticated RESTful services with Spring Data JPA.",
                    "Configure database transactions, validations, and security filters."));
            list.add(new TargetSkillRequirement("SQL / PostgreSQL", "Database", 75.0, 0.9,
                    "Relational Database Modeling & ACID Transactions",
                    "Design normalized PostgreSQL schemas with foreign keys and indexes.",
                    "Ensure transactional consistency and prevent SQL injection."));
            list.add(new TargetSkillRequirement("REST APIs", "Backend", 70.0, 0.85,
                    "RESTful Service Architecture & OpenAPI Standards",
                    "Design standard OpenAPI 3.0 contracts and structured response payloads.",
                    "Implement rate limiting, idempotency keys, and versioning."));
            list.add(new TargetSkillRequirement("Docker", "Cloud & DevOps", 65.0, 0.75,
                    "Containerization for Fullstack Microservices",
                    "Package frontend static bundles and backend JARs with docker-compose.",
                    "Standardize local development environments and multi-container networks."));

        } else if (lower.contains("data scientist") || (lower.contains("data") && !lower.contains("base"))) {
            // Role 4: Data Scientist
            list.add(new TargetSkillRequirement("Python", "Core CS", 75.0, 1.0,
                    "Vectorized Python, Pandas & Scientific Computing",
                    "Optimize data manipulation pipelines with vectorized Pandas and NumPy operations.",
                    "Master memory footprints, dataframe broadcasting, and algorithmic efficiency."));
            list.add(new TargetSkillRequirement("SQL / PostgreSQL", "Database", 75.0, 0.95,
                    "Analytical SQL, Window Functions & CTE Aggregations",
                    "Construct complex analytical SQL queries using partitioning and window functions.",
                    "Extract cohorts, cohort retention curves, and financial aggregates at scale."));
            list.add(new TargetSkillRequirement("Machine Learning", "Core CS", 75.0, 1.0,
                    "Supervised & Unsupervised Machine Learning Systems",
                    "Train, evaluate, and tune regression, classification, and clustering models.",
                    "Prevent data leakage, manage cross-validation splits, and analyze ROC-AUC curves."));
            list.add(new TargetSkillRequirement("Data Structures & Algorithms", "Core CS", 70.0, 0.85,
                    "Algorithmic Data Processing & Complexity Analysis",
                    "Implement graph traversals, dynamic programming, and binary search operations.",
                    "Master Big-O time and space trade-offs across data transformations."));
            list.add(new TargetSkillRequirement("System Design", "Core CS", 65.0, 0.75,
                    "Scalable Data Ingestion & Batch Architecture",
                    "Design batch and streaming data architectures with Kafka and message buffers.",
                    "Address data drift, model registry versioning, and feature store caching."));

        } else if (lower.contains("ml") || lower.contains("machine learning") || lower.contains("ai engineer")) {
            // Role 5: ML Engineer
            list.add(new TargetSkillRequirement("Python", "Core CS", 75.0, 1.0,
                    "High-Throughput Python & Model Pipeline Engineering",
                    "Write asynchronous, memory-efficient Python services for model inference.",
                    "Implement GPU memory pinning, ONNX runtime conversion, and batching."));
            list.add(new TargetSkillRequirement("Machine Learning", "Core CS", 75.0, 1.0,
                    "Production ML Models & Distributed Training",
                    "Train ensemble models (XGBoost, LightGBM) and evaluate latency budgets.",
                    "Implement feature scaling, automated hyperparameter tuning, and metric monitoring."));
            list.add(new TargetSkillRequirement("Deep Learning", "Core CS", 75.0, 0.95,
                    "Deep Neural Architectures & Transformer Fine-Tuning",
                    "Design convolutional and transformer networks with PyTorch/TensorFlow.",
                    "Apply gradient accumulation, mixed precision FP16, and transfer learning."));
            list.add(new TargetSkillRequirement("Docker", "Cloud & DevOps", 70.0, 0.85,
                    "Containerized ML Inference & Model Serving",
                    "Containerize PyTorch and Triton model inference engines with CUDA drivers.",
                    "Optimize Docker image size and cold start initialization times."));
            list.add(new TargetSkillRequirement("SQL / PostgreSQL", "Database", 70.0, 0.8,
                    "Feature Store Database Persistence & Querying",
                    "Store and query high-dimensional embeddings and tabular training feature tables.",
                    "Manage pgvector extensions for similarity search and vector indexing."));

        } else if (lower.contains("devops") || lower.contains("site reliability") || lower.contains("sre")) {
            // Role 6: DevOps Engineer
            list.add(new TargetSkillRequirement("Docker", "Cloud & DevOps", 75.0, 1.0,
                    "Production Multi-Stage Containerization & Hardening",
                    "Author secure, multi-stage Dockerfiles adhering to CIS security benchmarks.",
                    "Enforce unprivileged user execution, vulnerability scanning, and buildkit caching."));
            list.add(new TargetSkillRequirement("Kubernetes", "Cloud & DevOps", 75.0, 1.0,
                    "Kubernetes Cluster Operations, Ingress & Mesh",
                    "Configure Deployments, StatefulSets, HPA autoscaling, and Istio service mesh.",
                    "Manage zero-downtime rolling rollouts, canary deployments, and health probes."));
            list.add(new TargetSkillRequirement("AWS Cloud", "Cloud & DevOps", 75.0, 0.95,
                    "AWS Infrastructure Architecture & IAM Security",
                    "Architect multi-AZ VPC networks, private subnets, security groups, and IAM roles.",
                    "Configure automated backup policies, KMS encryption, and ALB traffic routing."));
            list.add(new TargetSkillRequirement("Linux", "Cloud & DevOps", 75.0, 0.9,
                    "Linux Kernel Administration & Performance Diagnostics",
                    "Troubleshoot system bottlenecks using top, vmstat, netstat, and strace.",
                    "Manage systemd service daemons, cron scheduling, and file permission ACLs."));
            list.add(new TargetSkillRequirement("CI/CD", "Cloud & DevOps", 75.0, 0.9,
                    "Automated CI/CD Pipelines & Continuous Delivery",
                    "Build reusable GitHub Actions workflows with linting, tests, and deployment stages.",
                    "Implement automated canary testing, semantic versioning, and environment approvals."));

        } else if (lower.contains("cloud")) {
            // Role 7: Cloud Engineer
            list.add(new TargetSkillRequirement("AWS Cloud", "Cloud & DevOps", 75.0, 1.0,
                    "Enterprise AWS Architecture & Cloud Adoption",
                    "Design resilient cloud architectures spanning ECS, RDS, S3, and CloudFront CDN.",
                    "Implement Well-Architected Framework pillars for reliability and cost optimization."));
            list.add(new TargetSkillRequirement("Docker", "Cloud & DevOps", 75.0, 0.95,
                    "Container Infrastructure & Image Registries",
                    "Configure AWS ECR repository lifecycle policies and immutable image tags.",
                    "Manage containerized microservice execution on AWS Fargate serverless compute."));
            list.add(new TargetSkillRequirement("Kubernetes", "Cloud & DevOps", 70.0, 0.9,
                    "Managed Kubernetes (AWS EKS) Architecture",
                    "Provision and configure managed EKS clusters with managed node groups.",
                    "Configure AWS Load Balancer Controller and external-dns for automated ingress."));
            list.add(new TargetSkillRequirement("Linux", "Cloud & DevOps", 70.0, 0.85,
                    "Cloud Compute Instance Provisioning & Hardening",
                    "Harden EC2 compute AMIs, configure SSH key rotation, and setup CloudWatch log agents.",
                    "Tune TCP socket buffers and file descriptors for high network traffic."));
            list.add(new TargetSkillRequirement("CI/CD", "Cloud & DevOps", 70.0, 0.85,
                    "Infrastructure as Code & GitOps Deployments",
                    "Automate cloud resource provisioning using Terraform and continuous integration.",
                    "Enforce plan validation, drift detection, and state file remote locking with S3/DynamoDB."));

        } else if (lower.contains("software engineer") || lower.contains("sde") || lower.contains("software developer")) {
            // Role 8: General Software Engineer
            list.add(new TargetSkillRequirement("Data Structures & Algorithms", "Core CS", 75.0, 1.0,
                    "Core Data Structures & Algorithmic Problem Solving",
                    "Master dynamic programming, tree traversals, graphs, and heap priorities.",
                    "Optimize algorithmic performance for clean Big-O runtime and space efficiency."));
            list.add(new TargetSkillRequirement("Java", "Backend", 70.0, 0.9,
                    "Object-Oriented Programming & Clean Code Patterns",
                    "Implement SOLID design principles, factory/strategy patterns, and unit test suites.",
                    "Master object lifecycles, exception handling, and concurrent threads."));
            list.add(new TargetSkillRequirement("SQL / PostgreSQL", "Database", 70.0, 0.85,
                    "Relational Database Design & Query Execution",
                    "Design normalized entity-relationship schemas with foreign key integrity.",
                    "Write optimized queries avoiding N+1 selects and full table scans."));
            list.add(new TargetSkillRequirement("System Design", "Core CS", 70.0, 0.85,
                    "Distributed System Architecture & Scalability",
                    "Design scalable client-server architectures with caching, load balancing, and replication.",
                    "Evaluate latency, throughput, and consistency trade-offs."));
            list.add(new TargetSkillRequirement("REST APIs", "Backend", 70.0, 0.8,
                    "Web Protocols & RESTful API Communication",
                    "Build authenticated HTTP REST endpoints with structured JSON schemas.",
                    "Handle error responses, query parameters, and pagination gracefully."));

        } else {
            // Role 1 (Default): Backend Developer
            list.add(new TargetSkillRequirement("Java", "Backend", 75.0, 1.0,
                    "Advanced Java 17 Concurrency & JVM Performance Tuning",
                    "Implement high-throughput producer-consumer pipeline with Virtual Threads and CAS atomics.",
                    "Master memory visibility (happens-before), lock-free data structures, and GC latency."));
            list.add(new TargetSkillRequirement("Spring Boot", "Backend", 75.0, 1.0,
                    "Production Spring Boot Architecture & Reactive Microservices",
                    "Build resilient microservices with Spring Data JPA pessimistic locking and Actuator telemetry.",
                    "Master IoC container lifecycles, dynamic proxy interceptors, and HikariCP connection pooling."));
            list.add(new TargetSkillRequirement("SQL / PostgreSQL", "Database", 75.0, 0.95,
                    "PostgreSQL Index Optimization & ACID Transactions",
                    "Profile query execution plans using EXPLAIN ANALYZE and implement B-Tree composite indexing.",
                    "Deep-dive into write-ahead logs, transaction isolation levels, and vacuuming."));
            list.add(new TargetSkillRequirement("REST APIs", "Backend", 70.0, 0.85,
                    "RESTful Microservice Contracts & Security Protocols",
                    "Design authenticated REST APIs using Spring Security JWT and role-based authorization.",
                    "Implement idempotent operations, rate limiters, and standardized exception handling."));
            list.add(new TargetSkillRequirement("Docker", "Cloud & DevOps", 70.0, 0.8,
                    "Docker Multi-Stage Production Containerization",
                    "Containerize Spring Boot services into minimal Alpine Linux images with health checks.",
                    "Master layer caching, non-root user execution, and docker-compose service clustering."));
            list.add(new TargetSkillRequirement("AWS Cloud", "Cloud & DevOps", 70.0, 0.8,
                    "AWS Cloud Infrastructure & Serverless Microservices",
                    "Deploy containerized applications on ECS/Fargate with ALB, IAM roles, and S3 integration.",
                    "Configure CloudWatch telemetry, VPC security groups, and automated scaling policies."));
            list.add(new TargetSkillRequirement("System Design", "Core CS", 70.0, 0.9,
                    "High-Availability Distributed System Design",
                    "Architect fault-tolerant microservices handling 50,000 requests/sec with circuit breakers.",
                    "Balance CAP theorem trade-offs, horizontal sharding, and eventual consistency."));
        }

        return list;
    }
}
