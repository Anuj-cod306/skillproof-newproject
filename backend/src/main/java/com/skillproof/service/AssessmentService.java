package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final StudentProfileService studentProfileService;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final PassportService passportService;

    /**
     * Returns available assessment subjects tailored strictly to the authenticated student's current mapped skills.
     */
    public List<Map<String, Object>> getAvailableAssessments(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(student.getId());

        if (studentSkills.isEmpty()) {
            ensureSkillPresent(student.getId(), "React");
            ensureSkillPresent(student.getId(), "Java");
            ensureSkillPresent(student.getId(), "SQL / PostgreSQL");
            studentSkills = studentSkillRepository.findByStudentId(student.getId());
        }

        if (studentSkills.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> available = new ArrayList<>();
        for (StudentSkill ss : studentSkills) {
            Skill skill = skillRepository.findById(ss.getSkillId()).orElse(null);
            if (skill == null) continue;

            String skillName = skill.getName();
            String category = skill.getCategory() != null ? skill.getCategory() : resolveSkillCategory(skillName);

            // Find highest previous assessment score if any
            Optional<AssessmentResult> lastResult = assessmentResultRepository
                    .findFirstByStudentIdAndSkillNameIgnoreCaseOrderByScorePercentageDesc(student.getId(), skillName);

            double pastScore = lastResult.map(ar -> ar.getScorePercentage() != null ? ar.getScorePercentage().doubleValue() : 0.0).orElse(0.0);
            boolean isAssessed = pastScore > 0;
            boolean passed = isAssessed && pastScore >= 60.0;

            Assessment assessment = getOrCreateAssessmentForSkill(skillName);

            Map<String, Object> item = new HashMap<>();
            item.put("skillName", skillName);
            item.put("category", category);
            item.put("assessmentId", assessment.getId());
            item.put("title", assessment.getTitle());
            item.put("description", assessment.getDescription());
            item.put("totalQuestions", assessment.getTotalQuestions());
            item.put("durationMinutes", assessment.getDurationMinutes());
            item.put("passingScore", assessment.getPassingScore());
            item.put("claimConfidence", ss.getSelfClaimScore() != null ? ss.getSelfClaimScore().intValue() : 60);
            item.put("isAssessed", isAssessed);
            item.put("pastScore", (int) Math.round(pastScore));
            item.put("passed", passed);
            item.put("status", passed ? "ASSESSED_PASSED" : isAssessed ? "ASSESSED_FAILED" : "READY_FOR_DIAGNOSTIC");

            available.add(item);
        }

        return available;
    }

    public Assessment getOrCreateAssessmentForSkill(String skillName) {
        return assessmentRepository.findBySkillNameIgnoreCase(skillName)
                .orElseGet(() -> createDefaultAssessmentForSkill(skillName));
    }

    private boolean isOutdatedTemplate(List<Question> questions, String skillName) {
        String lower = skillName.toLowerCase();
        // If non-Java skill contains enterprise Java template questions
        if (lower.contains("javascript") || lower.contains("python") || lower.contains("react")) {
            for (Question q : questions) {
                String text = q.getQuestionText().toLowerCase();
                if (text.contains("dependency injection in enterprise") || text.contains("transactions typically managed") || text.contains("b-tree database backing")) {
                    return true;
                }
            }
        }
        return false;
    }

    private Assessment createDefaultAssessmentForSkill(String skillName) {
        Assessment a = Assessment.builder()
                .skillName(skillName)
                .title(skillName + " Core Diagnostic Assessment")
                .description("Standardized technical assessment evaluating architectural mastery, syntax idioms, and runtime semantics in " + skillName)
                .totalQuestions(5)
                .durationMinutes(15)
                .passingScore(new BigDecimal("60.0"))
                .build();
        a = assessmentRepository.save(a);

        List<Question> list = generateQuestionsForSkill(a, skillName);
        questionRepository.saveAll(list);
        return a;
    }

    private List<Question> generateQuestionsForSkill(Assessment a, String skillName) {
        String lower = skillName.trim().toLowerCase();
        List<Question> list = new ArrayList<>();

        if (lower.contains("javascript") || lower.equals("js")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In the JavaScript V8 event loop, in what relative order are Microtasks (e.g., Promise callbacks, queueMicrotask) and Macrotasks (e.g., setTimeout, setInterval) executed?")
                    .optionA("The microtask queue is completely drained after each individual macrotask, before the next macrotask is processed")
                    .optionB("Macrotasks always execute before microtasks in the task loop")
                    .optionC("They execute concurrently across separate OS threads")
                    .optionD("Execution order is non-deterministic and depends on CPU throttling")
                    .correctOption("A")
                    .explanation("The microtask queue has higher priority than macrotasks; after any macrotask runs, the V8 engine drains all available microtasks before rendering or picking the next macrotask.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What does the following snippet log to the console?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}")
                    .codeSnippet("for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}")
                    .optionA("0, 1, 2")
                    .optionB("3, 3, 3")
                    .optionC("undefined, undefined, undefined")
                    .optionD("ReferenceError: i is not defined")
                    .correctOption("B")
                    .explanation("Because 'var' is function-scoped rather than block-scoped, all three callbacks close over the exact same binding of 'i', which equals 3 by the time the timer callbacks execute.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What will `typeof null` and `[1, 2] + [3, 4]` evaluate to in modern ECMAScript?")
                    .optionA("'object' and '1,23,4'")
                    .optionB("'null' and [1, 2, 3, 4]")
                    .optionC("'undefined' and NaN")
                    .optionD("'object' and TypeError")
                    .correctOption("A")
                    .explanation("typeof null returns 'object' due to a legacy 31-bit type tag bug in original JS, and the binary '+' operator coerces both arrays to strings ('1,2' and '3,4') resulting in '1,23,4'.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("How does property lookup behave when accessing a property on a JavaScript object?")
                    .optionA("It traverses the internal [[Prototype]] chain upwards until the property is found or null is reached")
                    .optionB("It immediately checks the global Window / globalThis object")
                    .optionC("It performs a binary hash search across class descriptors")
                    .optionD("Properties cannot be inherited dynamically in JavaScript")
                    .correctOption("A")
                    .explanation("If an own property is not found on an object, JavaScript inspects its prototype via [[Prototype]], recursively climbing up the prototype chain until Object.prototype.__proto__ (null) is reached.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What happens if a Promise rejects inside an async function without an enclosing try/catch block?")
                    .optionA("The Promise returned by the async function is rejected with that error")
                    .optionB("The entire Node.js/browser thread is killed without error handling")
                    .optionC("The rejected error is silently ignored and returns null")
                    .optionD("It automatically retries the operation up to 3 times")
                    .correctOption("A")
                    .explanation("An uncaught rejection inside an async function propagates as the rejection value of the Promise returned by that async function.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else if (lower.contains("python")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In CPython, what is the primary consequence of the Global Interpreter Lock (GIL) on multi-threaded programs?")
                    .optionA("Only one native thread can execute Python bytecode at any given moment, limiting CPU-bound multi-core speedup")
                    .optionB("It prevents Python programs from performing non-blocking network socket I/O")
                    .optionC("It encrypts memory pointers across child processes")
                    .optionD("It forces all functions to be declared as coroutines")
                    .correctOption("A")
                    .explanation("The GIL ensures thread-safe memory management in CPython, but serializes bytecode execution across threads; CPU-bound tasks require multiprocessing or C extensions for true parallelism.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the output of running this Python code?\n\ndef append_to(elem, target=[]):\n    target.append(elem)\n    return target\n\nprint(append_to(1), append_to(2))")
                    .codeSnippet("def append_to(elem, target=[]):\n    target.append(elem)\n    return target\n\nprint(append_to(1), append_to(2))")
                    .optionA("[1] [2]")
                    .optionB("[1, 2] [1, 2]")
                    .optionC("[1] [1, 2]")
                    .optionD("[2] [2]")
                    .correctOption("B")
                    .explanation("Default arguments in Python are evaluated once when the function is defined. The mutable list 'target' is shared across calls, so append_to(2) mutates the same list instance, returning [1, 2] for both.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Why are Python generator functions (using the 'yield' keyword) preferred over returning complete lists when processing large datasets?")
                    .optionA("Generators produce items lazily on demand, reducing peak memory consumption from O(N) to O(1)")
                    .optionB("Generators compile Python code to native assembly")
                    .optionC("Generators bypass Python's garbage collector completely")
                    .optionD("Generators can only run on GPU hardware")
                    .correctOption("A")
                    .explanation("Generators maintain state across yield expressions and compute items lazily, allowing streaming of massive datasets with negligible memory overhead.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary architectural purpose of using '@functools.wraps(fn)' inside a custom Python decorator?")
                    .optionA("It preserves the original function's __name__, __doc__, and introspection metadata")
                    .optionB("It turns synchronous functions into asynchronous generators")
                    .optionC("It prevents recursion depth exceptions")
                    .optionD("It caches function return values like memoization")
                    .correctOption("A")
                    .explanation("@functools.wraps copies the original function's identity attributes (docstring, name, module) onto the wrapper, preventing loss of debugging and introspection metadata.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the fundamental difference between 'copy.copy(x)' and 'copy.deepcopy(x)' in Python?")
                    .optionA("Shallow copy copies the outer container while referencing child objects; deep copy recursively duplicates all nested objects")
                    .optionB("Shallow copy works only on integers; deep copy works on strings")
                    .optionC("Deep copy converts objects to JSON strings")
                    .optionD("There is no difference in modern Python 3.12")
                    .correctOption("A")
                    .explanation("A shallow copy creates a new compound object and inserts references to the original child objects, whereas deep copy recursively duplicates all referenced child structures.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else if (lower.contains("java") && !lower.contains("javascript")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary architectural difference between ConcurrentHashMap and Collections.synchronizedMap in high-throughput Java applications?")
                    .optionA("ConcurrentHashMap uses bucket-level striped locking and CAS avoiding global thread contention")
                    .optionB("ConcurrentHashMap allows multiple null keys")
                    .optionC("synchronizedMap is lock-free using atomic CAS operations")
                    .optionD("There is no performance difference")
                    .correctOption("A")
                    .explanation("ConcurrentHashMap employs CAS and synchronized blocks on individual hash bin nodes rather than locking the entire map instance.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Which locking mechanism guarantees ACID consistency when two threads concurrently increment an account balance in Spring Data JPA?")
                    .codeSnippet("@Transactional\npublic void deposit(Long accountId, BigDecimal amount) {\n    Account acc = accountRepository.findById(accountId);\n    acc.setBalance(acc.getBalance().add(amount));\n}")
                    .optionA("Use @Async on the deposit method")
                    .optionB("Use Pessimistic Write Lock (@Lock(LockModeType.PESSIMISTIC_WRITE))")
                    .optionC("Use volatile keyword on Account entity field")
                    .optionD("Disable Hibernate 2nd Level Cache")
                    .correctOption("B")
                    .explanation("Pessimistic write locking locks the database row on select (SELECT ... FOR UPDATE), preventing other transactions from reading or updating the row until commit.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In Java Project Loom (Virtual Threads), how does the JVM handle blocking socket I/O calls?")
                    .optionA("It creates a new OS carrier thread for every blocking call")
                    .optionB("It throws an IllegalThreadStateException")
                    .optionC("The virtual thread is unmounted from its carrier thread until I/O completes")
                    .optionD("It forces synchronous busy-polling on the CPU")
                    .correctOption("C")
                    .explanation("When a virtual thread blocks on socket I/O, it unmounts from the underlying OS carrier thread, freeing the carrier thread to execute other virtual threads.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What memory visibility and ordering guarantee does the 'volatile' keyword provide according to the Java Memory Model (JMM)?")
                    .optionA("Guarantees atomic compound updates like i++ without locks")
                    .optionB("Ensures reads/writes flush directly to main memory and establishes a happens-before memory barrier against instruction reordering")
                    .optionC("Allocates the variable in native off-heap memory")
                    .optionD("Makes the object immutable")
                    .correctOption("B")
                    .explanation("Volatile guarantees that any thread reading the field sees the most recent write, establishing happens-before memory barriers, though compound operations still require synchronization or atomic classes.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Which JVM garbage collector is specifically engineered for ultra-low pause times (< 1ms) on multi-terabyte heaps?")
                    .optionA("ZGC (Z Garbage Collector)")
                    .optionB("Serial GC")
                    .optionC("Parallel GC")
                    .optionD("DefNew GC")
                    .correctOption("A")
                    .explanation("ZGC performs all heavy GC work (marking, relocation) concurrently with application threads using load barriers and colored pointers, ensuring sub-millisecond pauses.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else if (lower.contains("spring")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("How should stateless JWT tokens be validated in Spring Security 6 without invoking the database on every HTTP request?")
                    .optionA("Implement a OncePerRequestFilter that parses cryptographic signatures and claims in-memory")
                    .optionB("Store tokens in HTTP Session")
                    .optionC("Disable CORS and CSRF without filters")
                    .optionD("Use BasicAuthenticationFilter with synchronous SQL queries")
                    .correctOption("A")
                    .explanation("A custom OncePerRequestFilter validates the cryptographic HMAC/RSA signature and expiry in-memory, populating SecurityContextHolder without database I/O.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("How do you prevent the N+1 select query problem when fetching an Order entity and its child OrderItems with Spring Data JPA?")
                    .optionA("Mark OrderItems as FetchType.EAGER")
                    .optionB("Use @EntityGraph or JOIN FETCH in a custom JPQL query")
                    .optionC("Wrap all repository calls in @Transactional(readOnly = true)")
                    .optionD("Increase Hibernate batch size to 1000")
                    .correctOption("B")
                    .explanation("JOIN FETCH instructs the JPA provider to retrieve both the parent and associated child entities in a single SQL inner/left join query.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Why does calling an internal method annotated with @Transactional from another method in the same Spring bean fail to create a new transaction?")
                    .optionA("Spring's CGLIB/JDK dynamic proxy interceptors only intercept external method invocations entering from outside the bean")
                    .optionB("Transactions cannot be nested in Spring Boot")
                    .optionC("The database driver forbids multiple method calls")
                    .optionD("Hibernate automatically rolls back internal calls")
                    .correctOption("A")
                    .explanation("Spring AOP uses dynamic proxies. Calling 'this.internalMethod()' bypasses the proxy wrapper, so transaction advice is never triggered.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the default bean scope in the Spring ApplicationContext container?")
                    .optionA("Singleton (one shared instance per Spring IoC container)")
                    .optionB("Prototype (new instance every injection point)")
                    .optionC("Request (one instance per HTTP request)")
                    .optionD("Session")
                    .correctOption("A")
                    .explanation("By default, Spring beans are singletons, meaning exactly one instance is created and shared across the entire ApplicationContext.")
                    .difficulty("BASIC")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Which Spring Boot module provides production-ready features like health checks, metrics, and application environment auditing?")
                    .optionA("Spring Boot Actuator")
                    .optionB("Spring Boot DevTools")
                    .optionC("Spring HATEOAS")
                    .optionD("Spring WebFlux")
                    .correctOption("A")
                    .explanation("Spring Boot Actuator exposes operational endpoints (/actuator/health, /actuator/metrics) for monitoring and production health telemetry.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else if (lower.contains("react")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Why must list items in React have stable, unique 'key' props during rendering?")
                    .optionA("Keys allow React's reconciliation algorithm to identify which items have changed, been added, or been removed")
                    .optionB("Keys determine the CSS z-index of elements")
                    .optionC("Keys are required to bind native DOM event listeners")
                    .optionD("Keys encrypt state in browser memory")
                    .correctOption("A")
                    .explanation("Keys help React distinguish items across re-renders to minimize unnecessary DOM mutations and preserve component state.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What problem can occur if a variable used inside a useEffect hook is omitted from its dependency array?")
                    .optionA("The effect creates a stale closure, capturing obsolete values from previous renders")
                    .optionB("React will crash with an unhandled DOMException")
                    .optionC("The component will unmount immediately")
                    .optionD("State updates will be persisted to localStorage")
                    .correctOption("A")
                    .explanation("Omitting dependencies causes the effect closure to reference variables from the render cycle where the effect was created, leading to stale state bugs.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary difference between useCallback and useMemo in React?")
                    .optionA("useCallback memoizes a callback function definition; useMemo memoizes the computed result of a function")
                    .optionB("useCallback runs asynchronously; useMemo runs synchronously")
                    .optionC("useCallback only works in class components")
                    .optionD("useMemo triggers an immediate component re-render")
                    .correctOption("A")
                    .explanation("useCallback(fn, deps) is equivalent to useMemo(() => fn, deps), returning the memoized function reference rather than its executed result.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In React 18 / 19, how do React Server Components (RSC) differ from standard Client Components?")
                    .optionA("Server Components execute exclusively on the server, generating no client-side JavaScript bundle footprint")
                    .optionB("Server Components cannot access databases directly")
                    .optionC("Server Components require Redux for state management")
                    .optionD("Server Components can use useState and useEffect hooks")
                    .correctOption("A")
                    .explanation("RSCs render on the server into a streaming JSON-like UI tree without shipping their implementation code to the client bundle.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("When should you pass a function updater to setState (e.g., setCount(prev => prev + 1)) rather than a direct value?")
                    .optionA("Whenever the next state calculation depends on the preceding state, avoiding stale batching race conditions")
                    .optionB("Only when updating strings")
                    .optionC("To trigger an immediate synchronous DOM paint")
                    .optionD("Function updaters are deprecated in React 18")
                    .correctOption("A")
                    .explanation("Because state updates are batched, using the functional form guarantees you receive the most up-to-date state.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else if (lower.contains("sql") || lower.contains("postgres")) {
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("How does Multi-Version Concurrency Control (MVCC) in PostgreSQL handle concurrent reads and writes on the same row?")
                    .optionA("Writers do not block readers, and readers do not block writers by maintaining multiple tuple versions with transaction IDs (xmin/xmax)")
                    .optionB("PostgreSQL acquires a global exclusive table lock on every UPDATE")
                    .optionC("All reads are queued until transactions commit")
                    .optionD("MVCC disables ACID compliance for write performance")
                    .correctOption("A")
                    .explanation("MVCC creates new versions of tuples instead of updating in-place, allowing transactions to view consistent snapshots without table or row read-blocking.")
                    .difficulty("ADVANCED")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the time complexity of looking up a row by an indexed column using a standard B-Tree index in SQL databases?")
                    .optionA("O(log N) logarithmic depth traversal")
                    .optionB("O(N) full sequential scan")
                    .optionC("O(N^2) quadratic search")
                    .optionD("O(1) constant hash lookup")
                    .correctOption("A")
                    .explanation("B-Tree indices maintain balanced trees of height O(log N), allowing rapid logarithmic traversal from root to leaf node.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Which transaction isolation level prevents dirty reads, non-repeatable reads, and phantom reads according to ANSI SQL standard?")
                    .optionA("SERIALIZABLE")
                    .optionB("READ COMMITTED")
                    .optionC("REPEATABLE READ")
                    .optionD("READ UNCOMMITTED")
                    .correctOption("A")
                    .explanation("SERIALIZABLE is the highest isolation level, guaranteeing execution equivalent to completely sequential transaction processing.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In PostgreSQL EXPLAIN ANALYZE output, what does a 'Seq Scan' on a large table indicate?")
                    .optionA("The database engine scanned every page and row sequentially without leveraging an index")
                    .optionB("An index was used to filter results efficiently")
                    .optionC("The query executed entirely in CPU L1 cache")
                    .optionD("The table was truncated before reading")
                    .correctOption("A")
                    .explanation("Seq Scan indicates a sequential scan across all disk pages, which can cause high I/O latency if an index should have been used.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary architectural purpose of using Common Table Expressions (WITH clause / CTE) in complex SQL queries?")
                    .optionA("To improve readability, create modular temporary result sets, and enable recursive queries")
                    .optionB("To automatically encrypt database columns")
                    .optionC("To eliminate database transactions")
                    .optionD("To replace foreign key constraints")
                    .correctOption("A")
                    .explanation("CTEs define auxiliary statements that exist within the scope of a single query, significantly improving clarity and supporting recursion.")
                    .difficulty("INTERMEDIATE")
                    .build());

        } else {
            // Specialized technical questions for any other skill
            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary industry standard methodology for establishing automated regression testing in " + skillName + "?")
                    .optionA("Writing isolated unit tests with mock boundaries and asserting deterministic output")
                    .optionB("Manual testing in production after deployment")
                    .optionC("Disabling automated builds to speed up delivery")
                    .optionD("Relying solely on user bug reports")
                    .correctOption("A")
                    .explanation("Automated unit and integration testing isolates components and guarantees that updates do not break existing contracts.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("When optimizing runtime performance for applications utilizing " + skillName + ", which profiling technique is most effective?")
                    .optionA("Benchmarking hot execution paths using metrics profiling to pinpoint memory and CPU bottlenecks")
                    .optionB("Guessing slow methods and refactoring them without measurement")
                    .optionC("Disabling logging completely across all tiers")
                    .optionD("Rebooting the server whenever requests slow down")
                    .correctOption("A")
                    .explanation("Evidence-driven performance tuning relies on profilers to measure latency distributions and heap allocation hotspots.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("In modern enterprise architecture, what is the best practice for managing external secrets and credentials in " + skillName + "?")
                    .optionA("Injecting secrets at runtime via environment variables or a secure key management vault (KMS)")
                    .optionB("Hardcoding API keys directly in source code")
                    .optionC("Committing plain-text credentials to public git repositories")
                    .optionD("Transmitting keys unencrypted in URL query parameters")
                    .correctOption("A")
                    .explanation("Externalizing credentials into environment variables or secret vaults prevents credential leakage and ensures secure rotation.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("Which architectural pattern best promotes loose coupling and separation of concerns in " + skillName + " modules?")
                    .optionA("Layered architecture with well-defined interface contracts and dependency inversion")
                    .optionB("Monolithic god-classes combining UI, database queries, and business logic")
                    .optionC("Global mutable state shared across all components")
                    .optionD("Tightly coupled circular imports")
                    .correctOption("A")
                    .explanation("Separating concerns via interfaces and dependency inversion isolates business logic from underlying infrastructure.")
                    .difficulty("INTERMEDIATE")
                    .build());

            list.add(Question.builder()
                    .assessment(a)
                    .questionText("What is the primary benefit of maintaining semantic versioning (SemVer) for packages and libraries in " + skillName + "?")
                    .optionA("Clear contracts for breaking changes (MAJOR), backward-compatible features (MINOR), and patches (PATCH)")
                    .optionB("Faster execution speeds in production")
                    .optionC("Automatic removal of deprecated code")
                    .optionD("Guaranteed zero security vulnerabilities")
                    .correctOption("A")
                    .explanation("SemVer communicates the risk of upgrades to consumers, distinguishing non-breaking bug fixes from breaking API overhauls.")
                    .difficulty("INTERMEDIATE")
                    .build());
        }

        return list;
    }

    public Map<String, Object> getAssessmentQuestions(String skillName) {
        Assessment a = getOrCreateAssessmentForSkill(skillName);
        List<Question> questions = questionRepository.findByAssessmentId(a.getId());

        List<Map<String, Object>> qList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", q.getId());
            m.put("questionText", q.getQuestionText());
            m.put("codeSnippet", q.getCodeSnippet());
            m.put("options", Map.of(
                    "A", q.getOptionA(),
                    "B", q.getOptionB(),
                    "C", q.getOptionC(),
                    "D", q.getOptionD()
            ));
            m.put("difficulty", q.getDifficulty());
            qList.add(m);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("assessmentId", a.getId());
        res.put("skillName", a.getSkillName());
        res.put("title", a.getTitle());
        res.put("description", a.getDescription());
        res.put("totalQuestions", questions.size());
        res.put("durationMinutes", a.getDurationMinutes());
        res.put("questions", qList);
        return res;
    }

    @Transactional
    public Map<String, Object> submitAssessmentAnswers(String userEmail, Long assessmentId, Map<Long, String> answers) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));

        List<Question> questions = questionRepository.findByAssessmentId(assessmentId);
        int total = questions.size();
        int correct = 0;
        List<Map<String, Object>> review = new ArrayList<>();

        for (Question q : questions) {
            String studentChoice = answers.get(q.getId());
            boolean isCorrect = studentChoice != null && studentChoice.trim().equalsIgnoreCase(q.getCorrectOption().trim());
            if (isCorrect) correct++;

            Map<String, Object> item = new HashMap<>();
            item.put("questionId", q.getId());
            item.put("questionText", q.getQuestionText());
            item.put("yourAnswer", studentChoice);
            item.put("correctAnswer", q.getCorrectOption());
            item.put("isCorrect", isCorrect);
            item.put("explanation", q.getExplanation());
            review.add(item);
        }

        double scorePct = (total > 0) ? ((double) correct / total) * 100.0 : 0.0;
        BigDecimal finalScore = BigDecimal.valueOf(scorePct).setScale(1, RoundingMode.HALF_UP);
        boolean passed = scorePct >= assessment.getPassingScore().doubleValue();

        AssessmentResult result = AssessmentResult.builder()
                .studentId(student.getId())
                .assessmentId(assessment.getId())
                .skillName(assessment.getSkillName())
                .scorePercentage(finalScore)
                .correctCount(correct)
                .totalCount(total)
                .passed(passed)
                .status("COMPLETED")
                .recordingStatus("RECORDED")
                .completedAt(LocalDateTime.now())
                .build();

        assessmentResultRepository.save(result);

        // Elevate student_skills to Tier 3 evidence without overwriting Tier 1 resume claim score
        String skillCategory = resolveSkillCategory(assessment.getSkillName());
        Skill skill = skillRepository.findByNameIgnoreCase(assessment.getSkillName())
                .orElseGet(() -> skillRepository.save(Skill.builder()
                        .name(assessment.getSkillName())
                        .category(skillCategory)
                        .industryDemandIndex(new BigDecimal("0.90"))
                        .build()));

        StudentSkill studentSkill = studentSkillRepository
                .findByStudentIdAndSkillId(student.getId(), skill.getId())
                .orElseGet(() -> StudentSkill.builder()
                        .studentId(student.getId())
                        .skillId(skill.getId())
                        .selfClaimScore(new BigDecimal("60.00"))
                        .build());

        studentSkill.setVerifiedScore(finalScore);
        int currentTier = studentSkill.getVerificationTier() != null ? studentSkill.getVerificationTier() : 1;
        studentSkill.setVerificationTier(Math.max(currentTier, 3));
        studentSkill.setIsVerified(passed);
        studentSkill.setLastVerifiedAt(LocalDateTime.now());
        studentSkillRepository.save(studentSkill);

        Map<String, Object> response = new HashMap<>();
        response.put("resultId", result.getId());
        response.put("skillName", assessment.getSkillName());
        response.put("scorePercentage", finalScore);
        response.put("correctCount", correct);
        response.put("totalCount", total);
        response.put("passed", passed);
        response.put("status", "COMPLETED");
        response.put("verdict", passed ? "Passed Tier 3 Practical Assessment" : "Needs Review (Passing threshold: 60%)");
        response.put("review", review);

        // Recalculate Skill Passport immediately with new assessment score
        try {
            passportService.generateOrUpdatePassport(userEmail);
        } catch (Exception e) {
            log.warn("[AssessmentService] Could not auto-refresh passport: {}", e.getMessage());
        }

        return response;
    }

    @Transactional
    public Map<String, Object> handleViolation(
            String userEmail,
            Long assessmentId,
            Map<Long, String> answers,
            String reason,
            Integer durationSeconds,
            String recordingUrl
    ) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));

        List<Question> questions = questionRepository.findByAssessmentId(assessmentId);
        int total = questions.size();
        int correct = 0;
        List<Map<String, Object>> review = new ArrayList<>();

        Map<Long, String> safeAnswers = answers != null ? answers : Collections.emptyMap();

        for (Question q : questions) {
            String studentChoice = safeAnswers.get(q.getId());
            boolean isCorrect = studentChoice != null && studentChoice.trim().equalsIgnoreCase(q.getCorrectOption().trim());
            if (isCorrect) correct++;

            Map<String, Object> item = new HashMap<>();
            item.put("questionId", q.getId());
            item.put("questionText", q.getQuestionText());
            item.put("yourAnswer", studentChoice);
            item.put("correctAnswer", q.getCorrectOption());
            item.put("isCorrect", isCorrect);
            item.put("explanation", q.getExplanation());
            review.add(item);
        }

        // Strict scoring: unanswered count as 0, score percentage calculated strictly against total questions
        double scorePct = (total > 0) ? ((double) correct / total) * 100.0 : 0.0;
        BigDecimal finalScore = BigDecimal.valueOf(scorePct).setScale(1, RoundingMode.HALF_UP);
        String finalReason = (reason != null && !reason.isBlank()) ? reason : "Candidate left the assessment window or switched tabs.";

        AssessmentResult result = AssessmentResult.builder()
                .studentId(student.getId())
                .assessmentId(assessment.getId())
                .skillName(assessment.getSkillName())
                .scorePercentage(finalScore)
                .correctCount(correct)
                .totalCount(total)
                .passed(false) // Violations fail the diagnostic threshold
                .status("AUTO_SUBMITTED")
                .tabSwitchCount(1)
                .violationTimestamp(LocalDateTime.now())
                .autoSubmissionReason(finalReason)
                .recordingStatus(recordingUrl != null ? "RECORDED" : "NOT_RECORDED")
                .recordingUrl(recordingUrl)
                .completedAt(LocalDateTime.now())
                .build();

        assessmentResultRepository.save(result);

        // Update student skill verified score
        String skillCategory = resolveSkillCategory(assessment.getSkillName());
        Skill skill = skillRepository.findByNameIgnoreCase(assessment.getSkillName())
                .orElseGet(() -> skillRepository.save(Skill.builder()
                        .name(assessment.getSkillName())
                        .category(skillCategory)
                        .industryDemandIndex(new BigDecimal("0.90"))
                        .build()));

        StudentSkill studentSkill = studentSkillRepository
                .findByStudentIdAndSkillId(student.getId(), skill.getId())
                .orElseGet(() -> StudentSkill.builder()
                        .studentId(student.getId())
                        .skillId(skill.getId())
                        .selfClaimScore(new BigDecimal("60.00"))
                        .build());

        studentSkill.setVerifiedScore(finalScore);
        studentSkill.setIsVerified(false);
        studentSkill.setLastVerifiedAt(LocalDateTime.now());
        studentSkillRepository.save(studentSkill);

        try {
            passportService.generateOrUpdatePassport(userEmail);
        } catch (Exception e) {
            log.warn("[AssessmentService] Could not auto-refresh passport: {}", e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("resultId", result.getId());
        response.put("skillName", assessment.getSkillName());
        response.put("scorePercentage", finalScore);
        response.put("correctCount", correct);
        response.put("totalCount", total);
        response.put("passed", false);
        response.put("status", "AUTO_SUBMITTED");
        response.put("isViolated", true);
        response.put("tabSwitchCount", 1);
        response.put("violationTimestamp", result.getViolationTimestamp());
        response.put("autoSubmissionReason", finalReason);
        response.put("verdict", "Test Auto-Submitted: You left the assessment window. This attempt has been submitted automatically.");
        response.put("review", review);
        response.put("recordingUrl", recordingUrl);

        return response;
    }

    public Map<String, Object> getLatestAssessmentResult(String userEmail, Long assessmentId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Optional<AssessmentResult> opt = assessmentId != null
                ? assessmentResultRepository.findFirstByStudentIdAndAssessmentIdOrderByCompletedAtDesc(student.getId(), assessmentId)
                : assessmentResultRepository.findFirstByStudentIdOrderByCompletedAtDesc(student.getId());

        return opt.map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("resultId", r.getId());
            m.put("assessmentId", r.getAssessmentId());
            m.put("skillName", r.getSkillName());
            m.put("scorePercentage", r.getScorePercentage());
            m.put("correctCount", r.getCorrectCount());
            m.put("totalCount", r.getTotalCount());
            m.put("passed", r.getPassed());
            m.put("status", r.getStatus() != null ? r.getStatus() : "COMPLETED");
            m.put("tabSwitchCount", r.getTabSwitchCount() != null ? r.getTabSwitchCount() : 0);
            m.put("violationTimestamp", r.getViolationTimestamp());
            m.put("autoSubmissionReason", r.getAutoSubmissionReason());
            m.put("recordingStatus", r.getRecordingStatus());
            m.put("recordingUrl", r.getRecordingUrl());
            m.put("completedAt", r.getCompletedAt());
            return m;
        }).orElse(Collections.emptyMap());
    }

    public List<AssessmentResult> getAssessmentHistory(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        return assessmentResultRepository.findByStudentIdOrderByCompletedAtDesc(student.getId());
    }

    private String resolveSkillCategory(String skillName) {
        String lower = skillName.toLowerCase();
        if (lower.contains("react") || lower.contains("vue") || lower.contains("angular") || lower.contains("javascript") || lower.contains("typescript") || lower.contains("html") || lower.contains("css") || lower.contains("tailwind")) {
            return "Frontend";
        }
        if (lower.contains("python") || lower.contains("tensorflow") || lower.contains("pytorch") || lower.contains("pandas") || lower.contains("machine learning") || lower.contains("ai") || lower.contains("nlp")) {
            return "AI & ML";
        }
        if (lower.contains("sql") || lower.contains("postgres") || lower.contains("mongo") || lower.contains("redis") || lower.contains("database")) {
            return "Database";
        }
        if (lower.contains("docker") || lower.contains("kubernetes") || lower.contains("aws") || lower.contains("cloud") || lower.contains("devops") || lower.contains("ci/cd")) {
            return "DevOps & Cloud";
        }
        return "Backend";
    }

    private void ensureSkillPresent(Long studentId, String skillName) {
        if (skillName == null || skillName.isBlank()) return;
        String cleanName = skillName.trim();
        Skill skill = skillRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> skillRepository.save(Skill.builder()
                        .name(cleanName)
                        .category(resolveSkillCategory(cleanName))
                        .industryDemandIndex(new BigDecimal("0.90"))
                        .build()));

        Optional<StudentSkill> existing = studentSkillRepository.findByStudentIdAndSkillId(studentId, skill.getId());
        if (existing.isEmpty()) {
            studentSkillRepository.save(StudentSkill.builder()
                    .studentId(studentId)
                    .skillId(skill.getId())
                    .selfClaimScore(new BigDecimal("70.00"))
                    .verifiedScore(BigDecimal.ZERO)
                    .verificationTier(1)
                    .isVerified(false)
                    .build());
        }
    }
}
