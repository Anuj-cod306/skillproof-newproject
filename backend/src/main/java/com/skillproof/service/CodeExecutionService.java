package com.skillproof.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CodeExecutionService {

    @Data
    @Builder
    public static class TestCase {
        private String input;
        private String expectedOutput;
        private boolean isHidden;
    }

    @Data
    @Builder
    public static class CodingChallenge {
        private String id;
        private String title;
        private String difficulty;
        private String category;
        private String description;
        private String exampleInput;
        private String exampleOutput;
        private String constraints;
        private Map<String, String> starterCode;
        private List<String> hints;
        private List<TestCase> testCases;
    }

    @Data
    @Builder
    public static class TestCaseResult {
        private int testCaseNumber;
        private boolean passed;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private boolean isHidden;
        private String errorMessage;
    }

    @Data
    @Builder
    public static class ExecutionResult {
        private boolean success;
        private String verdict; // ALL_PASSED, PARTIAL_PASS, FAILED, COMPILATION_ERROR, TIMEOUT
        private int passedTests;
        private int totalTests;
        private long executionTimeMs;
        private String timeComplexity;
        private String spaceComplexity;
        private String stdout;
        private String stderr;
        private List<TestCaseResult> testResults;
        private String feedback;
    }

    private final Map<String, CodingChallenge> challenges = new ConcurrentHashMap<>();

    public CodeExecutionService() {
        initChallenges();
    }

    private void initChallenges() {
        // Challenge 1: Two Sum
        challenges.put("two-sum", CodingChallenge.builder()
                .id("two-sum")
                .title("Two Sum Target Indices")
                .difficulty("EASY")
                .category("Arrays & Hashing")
                .description("Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices as [i, j] in ascending order.")
                .exampleInput("nums = [2, 7, 11, 15], target = 9")
                .exampleOutput("[0, 1]")
                .constraints("2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.")
                .hints(List.of(
                        "Can you check if (target - num) exists in the array as you iterate?",
                        "A Hash Map or Dictionary allows checking the complement in O(1) average time, reducing total complexity to O(N)."
                ))
                .starterCode(Map.of(
                        "javascript", "function twoSum(nums, target) {\n    // Write your solution here\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
                        "python", "def two_sum(nums, target):\n    # Write your solution here\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
                        "java", "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}"
                ))
                .testCases(List.of(
                        TestCase.builder().input("[2,7,11,15]\n9").expectedOutput("[0,1]").isHidden(false).build(),
                        TestCase.builder().input("[3,2,4]\n6").expectedOutput("[1,2]").isHidden(false).build(),
                        TestCase.builder().input("[3,3]\n6").expectedOutput("[0,1]").isHidden(false).build(),
                        TestCase.builder().input("[1,5,8,12,19]\n17").expectedOutput("[1,3]").isHidden(true).build(),
                        TestCase.builder().input("[1000,-500,250,50]\n-250").expectedOutput("[1,2]").isHidden(true).build()
                ))
                .build());

        // Challenge 2: Valid Parentheses
        challenges.put("valid-parentheses", CodingChallenge.builder()
                .id("valid-parentheses")
                .title("Validate Bracket Sequence")
                .difficulty("EASY")
                .category("Stack & Strings")
                .description("Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.")
                .exampleInput("s = \"()[]{}\"")
                .exampleOutput("true")
                .constraints("1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.")
                .hints(List.of(
                        "Think about the Last-In First-Out (LIFO) property of a Stack data structure.",
                        "When you encounter a closing bracket, check if it matches the top element of your stack."
                ))
                .starterCode(Map.of(
                        "javascript", "function isValid(s) {\n    // Write your solution here\n    const stack = [];\n    const map = { ')': '(', '}': '{', ']': '[' };\n    for (const c of s) {\n        if (map[c]) {\n            if (stack.pop() !== map[c]) return false;\n        } else {\n            stack.push(c);\n        }\n    }\n    return stack.length === 0;\n}",
                        "python", "def is_valid(s: str) -> bool:\n    # Write your solution here\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack",
                        "java", "class Solution {\n    public boolean isValid(String s) {\n        java.util.Stack<Character> stack = new java.util.Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}"
                ))
                .testCases(List.of(
                        TestCase.builder().input("\"()\"").expectedOutput("true").isHidden(false).build(),
                        TestCase.builder().input("\"()[]{}\"").expectedOutput("true").isHidden(false).build(),
                        TestCase.builder().input("\"(]\"").expectedOutput("false").isHidden(false).build(),
                        TestCase.builder().input("\"([)]\"").expectedOutput("false").isHidden(true).build(),
                        TestCase.builder().input("\"{[]}\"").expectedOutput("true").isHidden(true).build()
                ))
                .build());

        // Challenge 3: Maximum Subarray (Kadane's Algorithm)
        challenges.put("maximum-subarray", CodingChallenge.builder()
                .id("maximum-subarray")
                .title("Continuous Maximum Subarray Sum")
                .difficulty("MEDIUM")
                .category("Dynamic Programming & Arrays")
                .description("Given an integer array nums, find the subarray with the largest sum, and return its sum.")
                .exampleInput("nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]")
                .exampleOutput("6")
                .constraints("1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4")
                .hints(List.of(
                        "If the current prefix sum becomes negative, is it ever beneficial to keep adding to it?",
                        "Kadane's Algorithm maintains currentMax and globalMax in O(N) single-pass time and O(1) space."
                ))
                .starterCode(Map.of(
                        "javascript", "function maxSubArray(nums) {\n    let currentSum = nums[0];\n    let maxSum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        currentSum = Math.max(nums[i], currentSum + nums[i]);\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}",
                        "python", "def max_sub_array(nums):\n    current_sum = nums[0]\n    max_sum = nums[0]\n    for x in nums[1:]:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
                        "java", "class Solution {\n    public int maxSubArray(int[] nums) {\n        int currentSum = nums[0];\n        int maxSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currentSum = Math.max(nums[i], currentSum + nums[i]);\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        return maxSum;\n    }\n}"
                ))
                .testCases(List.of(
                        TestCase.builder().input("[-2,1,-3,4,-1,2,1,-5,4]").expectedOutput("6").isHidden(false).build(),
                        TestCase.builder().input("[1]").expectedOutput("1").isHidden(false).build(),
                        TestCase.builder().input("[5,4,-1,7,8]").expectedOutput("23").isHidden(false).build(),
                        TestCase.builder().input("[-1,-2,-3]").expectedOutput("-1").isHidden(true).build(),
                        TestCase.builder().input("[-2,-1]").expectedOutput("-1").isHidden(true).build()
                ))
                .build());
    }

    public CodingChallenge getChallenge(String id) {
        if (id == null || !challenges.containsKey(id)) {
            return challenges.get("two-sum");
        }
        return challenges.get(id);
    }

    public CodingChallenge resolveChallengeForRole(String role) {
        if (role == null) return challenges.get("two-sum");
        String r = role.toLowerCase();
        if (r.contains("frontend")) {
            return challenges.get("valid-parentheses");
        } else if (r.contains("backend") || r.contains("systems")) {
            return challenges.get("two-sum");
        } else if (r.contains("algorithm") || r.contains("data")) {
            return challenges.get("maximum-subarray");
        }
        return challenges.get("two-sum");
    }

    public ExecutionResult executeCode(String challengeId, String language, String code) {
        CodingChallenge challenge = getChallenge(challengeId);
        String lang = (language != null) ? language.toLowerCase().trim() : "javascript";

        long startTime = System.currentTimeMillis();
        List<TestCaseResult> results = new ArrayList<>();
        int passedCount = 0;
        String stdErrTotal = "";
        String stdOutTotal = "";

        // Determine complexity via AST / code inspection
        String timeComplexity = analyzeTimeComplexity(code, lang);
        String spaceComplexity = analyzeSpaceComplexity(code, lang);

        try {
            switch (lang) {
                case "javascript":
                case "js":
                    results = runJavaScript(challenge, code);
                    break;
                case "python":
                case "py":
                    results = runPython(challenge, code);
                    break;
                case "java":
                    results = runJava(challenge, code);
                    break;
                default:
                    results = runJavaScript(challenge, code);
                    break;
            }
        } catch (Exception e) {
            log.warn("[CodeExecutionService] Error executing code: {}", e.getMessage());
            stdErrTotal = e.getMessage() != null ? e.getMessage() : "Execution failed";
            return ExecutionResult.builder()
                    .success(false)
                    .verdict("COMPILATION_ERROR")
                    .passedTests(0)
                    .totalTests(challenge.getTestCases().size())
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .timeComplexity(timeComplexity)
                    .spaceComplexity(spaceComplexity)
                    .stderr(stdErrTotal)
                    .testResults(Collections.emptyList())
                    .feedback("Code execution halted due to compilation/syntax error: " + stdErrTotal)
                    .build();
        }

        long executionTime = System.currentTimeMillis() - startTime;

        for (TestCaseResult tr : results) {
            if (tr.isPassed()) passedCount++;
            if (tr.getErrorMessage() != null && !tr.getErrorMessage().isBlank()) {
                stdErrTotal += tr.getErrorMessage() + "\n";
            }
            if (tr.getActualOutput() != null) {
                stdOutTotal += "Test #" + tr.getTestCaseNumber() + ": " + tr.getActualOutput() + "\n";
            }
        }

        int total = challenge.getTestCases().size();
        String verdict;
        if (passedCount == total) {
            verdict = "ALL_PASSED";
        } else if (passedCount > 0) {
            verdict = "PARTIAL_PASS";
        } else {
            verdict = "FAILED";
        }

        String feedback = String.format("Passed %d of %d test cases in %d ms. Algorithmic profile: Time %s, Space %s.",
                passedCount, total, executionTime, timeComplexity, spaceComplexity);

        return ExecutionResult.builder()
                .success(passedCount == total)
                .verdict(verdict)
                .passedTests(passedCount)
                .totalTests(total)
                .executionTimeMs(executionTime)
                .timeComplexity(timeComplexity)
                .spaceComplexity(spaceComplexity)
                .stdout(stdOutTotal.trim())
                .stderr(stdErrTotal.trim())
                .testResults(results)
                .feedback(feedback)
                .build();
    }

    private List<TestCaseResult> runJavaScript(CodingChallenge challenge, String studentCode) throws Exception {
        List<TestCaseResult> results = new ArrayList<>();
        Path tempScript = Files.createTempFile("skillproof_js_", ".js");

        try {
            StringBuilder script = new StringBuilder();
            script.append(studentCode).append("\n\n");
            script.append("const fs = require('fs');\n");
            script.append("const inputData = fs.readFileSync(0, 'utf-8').trim();\n");
            script.append("if (!inputData) process.exit(0);\n");
            script.append("const lines = inputData.split('\\n');\n");

            if ("two-sum".equals(challenge.getId())) {
                script.append("const nums = JSON.parse(lines[0]);\n");
                script.append("const target = parseInt(lines[1]);\n");
                script.append("const res = twoSum(nums, target);\n");
                script.append("console.log(JSON.stringify(res));\n");
            } else if ("valid-parentheses".equals(challenge.getId())) {
                script.append("const s = JSON.parse(lines[0]);\n");
                script.append("const res = isValid(s);\n");
                script.append("console.log(JSON.stringify(res));\n");
            } else if ("maximum-subarray".equals(challenge.getId())) {
                script.append("const nums = JSON.parse(lines[0]);\n");
                script.append("const res = maxSubArray(nums);\n");
                script.append("console.log(JSON.stringify(res));\n");
            }

            Files.writeString(tempScript, script.toString());

            int testIndex = 1;
            for (TestCase tc : challenge.getTestCases()) {
                ProcessBuilder pb = new ProcessBuilder("node", tempScript.toString());
                pb.redirectErrorStream(true);
                Process p = pb.start();

                try (OutputStream os = p.getOutputStream()) {
                    os.write(tc.getInput().getBytes());
                    os.flush();
                }

                boolean finished = p.waitFor(3, TimeUnit.SECONDS);
                if (!finished) {
                    p.destroyForcibly();
                    results.add(TestCaseResult.builder()
                            .testCaseNumber(testIndex++)
                            .passed(false)
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .actualOutput("Time Limit Exceeded")
                            .isHidden(tc.isHidden())
                            .errorMessage("Execution timed out (> 3000ms)")
                            .build());
                    continue;
                }

                String output = new String(p.getInputStream().readAllBytes()).trim();
                boolean passed = normalizeOutput(output).equals(normalizeOutput(tc.getExpectedOutput()));

                results.add(TestCaseResult.builder()
                        .testCaseNumber(testIndex++)
                        .passed(passed)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(output)
                        .isHidden(tc.isHidden())
                        .errorMessage(passed ? null : "Expected " + tc.getExpectedOutput() + " but received " + output)
                        .build());
            }
        } finally {
            try { Files.deleteIfExists(tempScript); } catch (Exception ignored) {}
        }

        return results;
    }

    private List<TestCaseResult> runPython(CodingChallenge challenge, String studentCode) throws Exception {
        List<TestCaseResult> results = new ArrayList<>();
        Path tempScript = Files.createTempFile("skillproof_py_", ".py");

        try {
            StringBuilder script = new StringBuilder();
            script.append("import sys, json\n\n");
            script.append(studentCode).append("\n\n");
            script.append("raw = sys.stdin.read().strip()\n");
            script.append("if raw:\n");
            script.append("    lines = raw.split('\\n')\n");

            if ("two-sum".equals(challenge.getId())) {
                script.append("    nums = json.loads(lines[0])\n");
                script.append("    target = int(lines[1])\n");
                script.append("    res = two_sum(nums, target)\n");
                script.append("    print(json.dumps(res, separators=(',', ':')))\n");
            } else if ("valid-parentheses".equals(challenge.getId())) {
                script.append("    s = json.loads(lines[0])\n");
                script.append("    res = is_valid(s)\n");
                script.append("    print('true' if res else 'false')\n");
            } else if ("maximum-subarray".equals(challenge.getId())) {
                script.append("    nums = json.loads(lines[0])\n");
                script.append("    res = max_sub_array(nums)\n");
                script.append("    print(res)\n");
            }

            Files.writeString(tempScript, script.toString());

            int testIndex = 1;
            for (TestCase tc : challenge.getTestCases()) {
                ProcessBuilder pb = new ProcessBuilder("python", tempScript.toString());
                pb.redirectErrorStream(true);
                Process p = pb.start();

                try (OutputStream os = p.getOutputStream()) {
                    os.write(tc.getInput().getBytes());
                    os.flush();
                }

                boolean finished = p.waitFor(3, TimeUnit.SECONDS);
                if (!finished) {
                    p.destroyForcibly();
                    results.add(TestCaseResult.builder()
                            .testCaseNumber(testIndex++)
                            .passed(false)
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .actualOutput("Time Limit Exceeded")
                            .isHidden(tc.isHidden())
                            .errorMessage("Execution timed out (> 3000ms)")
                            .build());
                    continue;
                }

                String output = new String(p.getInputStream().readAllBytes()).trim();
                boolean passed = normalizeOutput(output).equals(normalizeOutput(tc.getExpectedOutput()));

                results.add(TestCaseResult.builder()
                        .testCaseNumber(testIndex++)
                        .passed(passed)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(output)
                        .isHidden(tc.isHidden())
                        .errorMessage(passed ? null : "Expected " + tc.getExpectedOutput() + " but received " + output)
                        .build());
            }
        } finally {
            try { Files.deleteIfExists(tempScript); } catch (Exception ignored) {}
        }

        return results;
    }

    private List<TestCaseResult> runJava(CodingChallenge challenge, String studentCode) throws Exception {
        List<TestCaseResult> results = new ArrayList<>();
        Path tempDir = Files.createTempDirectory("skillproof_java_");

        try {
            // Write Solution class file
            StringBuilder source = new StringBuilder();
            source.append("import java.util.*;\n");
            source.append("import java.io.*;\n\n");
            source.append(studentCode).append("\n\n");
            source.append("class MainRunner {\n");
            source.append("    public static void main(String[] args) throws Exception {\n");
            source.append("        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n");
            source.append("        String line1 = reader.readLine();\n");
            source.append("        if (line1 == null || line1.trim().isEmpty()) return;\n");
            source.append("        Solution sol = new Solution();\n");

            if ("two-sum".equals(challenge.getId())) {
                source.append("        String line2 = reader.readLine();\n");
                source.append("        line1 = line1.replace(\"[\", \"\").replace(\"]\", \"\").trim();\n");
                source.append("        String[] parts = line1.split(\",\");\n");
                source.append("        int[] nums = new int[parts.length];\n");
                source.append("        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());\n");
                source.append("        int target = Integer.parseInt(line2.trim());\n");
                source.append("        int[] res = sol.twoSum(nums, target);\n");
                source.append("        System.out.println(Arrays.toString(res).replace(\" \", \"\"));\n");
            } else if ("valid-parentheses".equals(challenge.getId())) {
                source.append("        String s = line1.replace(\"\\\"\", \"\").trim();\n");
                source.append("        boolean res = sol.isValid(s);\n");
                source.append("        System.out.println(res ? \"true\" : \"false\");\n");
            } else if ("maximum-subarray".equals(challenge.getId())) {
                source.append("        line1 = line1.replace(\"[\", \"\").replace(\"]\", \"\").trim();\n");
                source.append("        String[] parts = line1.split(\",\");\n");
                source.append("        int[] nums = new int[parts.length];\n");
                source.append("        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());\n");
                source.append("        int res = sol.maxSubArray(nums);\n");
                source.append("        System.out.println(res);\n");
            }

            source.append("    }\n");
            source.append("}\n");

            Path sourceFile = tempDir.resolve("MainRunner.java");
            Files.writeString(sourceFile, source.toString());

            // Compile with system Java compiler
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            ByteArrayOutputStream errStream = new ByteArrayOutputStream();
            int compileResult = -1;
            if (compiler != null) {
                compileResult = compiler.run(null, null, errStream, sourceFile.toString());
            } else {
                // Fallback to javac process via JAVA_HOME
                String javaHome = System.getenv("JAVA_HOME");
                String javacPath = (javaHome != null) ? javaHome + "\\bin\\javac.exe" : "javac";
                ProcessBuilder compilePb = new ProcessBuilder(javacPath, sourceFile.toString());
                compilePb.redirectErrorStream(true);
                Process cp = compilePb.start();
                byte[] cpOut = cp.getInputStream().readAllBytes();
                compileResult = cp.waitFor();
                if (compileResult != 0) {
                    errStream.write(cpOut);
                }
            }

            if (compileResult != 0) {
                throw new RuntimeException("Java Compilation Failed:\n" + errStream.toString());
            }

            // Run compiled bytecode
            String javaHome = System.getenv("JAVA_HOME");
            String javaPath = (javaHome != null) ? javaHome + "\\bin\\java.exe" : "java";

            int testIndex = 1;
            for (TestCase tc : challenge.getTestCases()) {
                ProcessBuilder pb = new ProcessBuilder(javaPath, "-cp", tempDir.toString(), "MainRunner");
                pb.redirectErrorStream(true);
                Process p = pb.start();

                try (OutputStream os = p.getOutputStream()) {
                    os.write(tc.getInput().getBytes());
                    os.flush();
                }

                boolean finished = p.waitFor(3, TimeUnit.SECONDS);
                if (!finished) {
                    p.destroyForcibly();
                    results.add(TestCaseResult.builder()
                            .testCaseNumber(testIndex++)
                            .passed(false)
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .actualOutput("Time Limit Exceeded")
                            .isHidden(tc.isHidden())
                            .errorMessage("Execution timed out (> 3000ms)")
                            .build());
                    continue;
                }

                String output = new String(p.getInputStream().readAllBytes()).trim();
                boolean passed = normalizeOutput(output).equals(normalizeOutput(tc.getExpectedOutput()));

                results.add(TestCaseResult.builder()
                        .testCaseNumber(testIndex++)
                        .passed(passed)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(output)
                        .isHidden(tc.isHidden())
                        .errorMessage(passed ? null : "Expected " + tc.getExpectedOutput() + " but received " + output)
                        .build());
            }
        } finally {
            // Clean temp directory
            try {
                Files.walk(tempDir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try { Files.deleteIfExists(path); } catch (Exception ignored) {}
                        });
            } catch (Exception ignored) {}
        }

        return results;
    }

    private String normalizeOutput(String s) {
        if (s == null) return "";
        return s.replaceAll("\\s+", "").toLowerCase().trim();
    }

    private String analyzeTimeComplexity(String code, String language) {
        if (code == null || code.isBlank()) return "O(1)";
        String clean = code.toLowerCase();

        // Check for nested loops
        int loopCount = 0;
        Pattern loopPat = Pattern.compile("\\b(for|while)\\b");
        Matcher m = loopPat.matcher(clean);
        while (m.find()) {
            loopCount++;
        }

        // Nested loop indicator (e.g. for inside for)
        Pattern nestedPat = Pattern.compile("(for|while)[^{}]*\\{[^{}]*(for|while)");
        if (nestedPat.matcher(clean).find() || (loopCount >= 2 && !clean.contains("map") && !clean.contains("dict") && !clean.contains("set"))) {
            return "O(N^2)";
        }

        if (clean.contains(".sort(") || clean.contains("arrays.sort") || clean.contains("collections.sort") || clean.contains("sorted(")) {
            return "O(N log N)";
        }

        if (loopCount >= 1) {
            return "O(N)";
        }

        return "O(1)";
    }

    private String analyzeSpaceComplexity(String code, String language) {
        if (code == null || code.isBlank()) return "O(1)";
        String clean = code.toLowerCase();

        if (clean.contains("map") || clean.contains("hashmap") || clean.contains("dict")
                || clean.contains("set") || clean.contains("hashset") || clean.contains("stack")
                || clean.contains("new int[") || clean.contains("list<") || clean.contains("arraylist")) {
            return "O(N)";
        }

        return "O(1)";
    }
}
