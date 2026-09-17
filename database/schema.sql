
-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_required_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS collaborative_projects CASCADE;
DROP TABLE IF EXISTS faculty_programs CASCADE;
DROP TABLE IF EXISTS roadmap_milestones CASCADE;
DROP TABLE IF EXISTS roadmaps CASCADE;
DROP TABLE IF EXISTS skill_gaps CASCADE;
DROP TABLE IF EXISTS skill_scores CASCADE;
DROP TABLE IF EXISTS skill_passports CASCADE;
DROP TABLE IF EXISTS interview_evaluations CASCADE;
DROP TABLE IF EXISTS interview_turns CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS assessment_results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS repo_tech_evidence CASCADE;
DROP TABLE IF EXISTS github_repositories CASCADE;
DROP TABLE IF EXISTS student_skills CASCADE;
DROP TABLE IF EXISTS extracted_skills CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP TABLE IF EXISTS academicians CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_STUDENT', 'ROLE_INDUSTRY', 'ROLE_ACADEMIA', 'ROLE_INSTITUTION', 'ROLE_ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. STAKEHOLDER PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id BIGINT,
    roll_number VARCHAR(50),
    college_name VARCHAR(200) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    cgpa NUMERIC(3, 2),
    location VARCHAR(120),
    target_role VARCHAR(100) DEFAULT 'Full Stack Developer',
    target_industry VARCHAR(100) DEFAULT 'Software Industry',
    bio TEXT,
    github_username VARCHAR(100),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    placement_readiness_score NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    industry_type VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    location VARCHAR(120),
    company_size VARCHAR(50),
    description TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE academicians (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id BIGINT,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(200),
    experience_years INT DEFAULT 0,
    research_interests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_name VARCHAR(250) NOT NULL,
    institution_code VARCHAR(50) UNIQUE NOT NULL,
    accreditation VARCHAR(50) DEFAULT 'NAAC A++',
    state VARCHAR(100),
    city VARCHAR(100),
    website VARCHAR(255),
    contact_email VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE students ADD CONSTRAINT fk_student_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;
ALTER TABLE academicians ADD CONSTRAINT fk_academician_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. SKILLS MASTER & RESUME MANAGEMENT
-- ----------------------------------------------------------------------------
CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(60) NOT NULL CHECK (category IN ('Backend', 'Frontend', 'Database', 'Cloud & DevOps', 'AI & ML', 'Core CS', 'Soft Skills')),
    description TEXT,
    industry_demand_index NUMERIC(3, 2) DEFAULT 0.85
);

CREATE TABLE resumes (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    parsed_content_json JSONB,
    ai_summary TEXT,
    parsing_status VARCHAR(30) DEFAULT 'COMPLETED',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extracted_skills (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(60),
    years_experience NUMERIC(3, 1) DEFAULT 1.0,
    confidence_score NUMERIC(3, 2) DEFAULT 0.90
);

CREATE TABLE student_skills (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    self_claim_score NUMERIC(5, 2) DEFAULT 70.0,
    verified_score NUMERIC(5, 2) DEFAULT 0.0,
    verification_tier INT DEFAULT 1,
    is_verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMP,
    UNIQUE(student_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- 4. TIER 2: GITHUB REPOSITORIES & TECH EVIDENCE
-- ----------------------------------------------------------------------------
CREATE TABLE github_repositories (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    repo_name VARCHAR(150) NOT NULL,
    repo_url VARCHAR(500) NOT NULL,
    description TEXT,
    primary_language VARCHAR(50),
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    commit_count INT DEFAULT 0,
    evidence_score NUMERIC(5, 2) DEFAULT 75.0,
    analysis_json JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE repo_tech_evidence (
    id BIGSERIAL PRIMARY KEY,
    repo_id BIGINT NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    framework_detected VARCHAR(100),
    confidence VARCHAR(30) DEFAULT 'HIGH',
    evidence_snippet TEXT
);

-- ----------------------------------------------------------------------------
-- 5. TIER 3: SKILL ASSESSMENTS & QUIZZES
-- ----------------------------------------------------------------------------
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    total_questions INT DEFAULT 10,
    duration_minutes INT DEFAULT 20,
    passing_score NUMERIC(5, 2) DEFAULT 60.0
);

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    option_a VARCHAR(300) NOT NULL,
    option_b VARCHAR(300) NOT NULL,
    option_c VARCHAR(300) NOT NULL,
    option_d VARCHAR(300) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'INTERMEDIATE'
);

CREATE TABLE assessment_results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    score_percentage NUMERIC(5, 2) NOT NULL,
    correct_count INT NOT NULL,
    total_count INT NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. TIER 4: ADAPTIVE AI INTERVIEW SYSTEM
-- ----------------------------------------------------------------------------
CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role_targeted VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'COMPLETED',
    overall_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_turns (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    turn_number INT NOT NULL,
    ai_question TEXT NOT NULL,
    student_answer TEXT NOT NULL,
    ai_feedback TEXT,
    turn_score NUMERIC(5, 2)
);

CREATE TABLE interview_evaluations (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT UNIQUE NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    technical_knowledge_score NUMERIC(5, 2) NOT NULL,
    project_understanding_score NUMERIC(5, 2) NOT NULL,
    problem_solving_score NUMERIC(5, 2) NOT NULL,
    communication_score NUMERIC(5, 2) NOT NULL,
    strengths TEXT[],
    improvements TEXT[],
    summary_verdict TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. HERO FEATURE: VERIFIED SKILL PASSPORT
-- ----------------------------------------------------------------------------
CREATE TABLE skill_passports (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    passport_hash VARCHAR(120) UNIQUE NOT NULL,
    overall_readiness NUMERIC(5, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    verification_tier_summary VARCHAR(50) DEFAULT 'ALL_4_TIERS_VERIFIED',
    qr_code_url VARCHAR(500),
    shareable_link VARCHAR(500),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skill_scores (
    id BIGSERIAL PRIMARY KEY,
    passport_id BIGINT NOT NULL REFERENCES skill_passports(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(60) NOT NULL,
    final_score NUMERIC(5, 2) NOT NULL,
    resume_claim_score NUMERIC(5, 2) NOT NULL,
    github_evidence_score NUMERIC(5, 2) NOT NULL,
    assessment_score NUMERIC(5, 2) NOT NULL,
    interview_score NUMERIC(5, 2) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    verified_badge VARCHAR(50) DEFAULT 'GOLD'
);

-- ----------------------------------------------------------------------------
-- 8. SKILL GAP & PERSONALIZED AI ROADMAP
-- ----------------------------------------------------------------------------
CREATE TABLE skill_gaps (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    target_role VARCHAR(100) NOT NULL,
    present_skills TEXT[],
    missing_critical_skills TEXT[],
    gap_percentage NUMERIC(5, 2) NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roadmaps (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    duration_weeks INT DEFAULT 6,
    progress_percentage NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roadmap_milestones (
    id BIGSERIAL PRIMARY KEY,
    roadmap_id BIGINT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    skills_covered TEXT[],
    action_items TEXT[],
    is_completed BOOLEAN DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 9. JOBS, INTERNSHIPS & EXPLAINABLE MATCHING
-- ----------------------------------------------------------------------------
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    job_type VARCHAR(40) CHECK (job_type IN ('FULL_TIME', 'INTERNSHIP', 'REMOTE', 'CONTRACT')),
    location VARCHAR(120) NOT NULL,
    stipend_or_salary VARCHAR(100),
    experience_required VARCHAR(50) DEFAULT 'Fresher / 0-1 Years',
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    min_readiness_score NUMERIC(5, 2) DEFAULT 70.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_required_skills (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    weight NUMERIC(3, 2) DEFAULT 1.0,
    is_mandatory BOOLEAN DEFAULT TRUE
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    match_percentage NUMERIC(5, 2) NOT NULL,
    matching_explanation JSONB,
    status VARCHAR(30) DEFAULT 'APPLIED',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 10. ACADEMIA & COLLABORATIONS (SIH 26044 REQUIREMENTS)
-- ----------------------------------------------------------------------------
CREATE TABLE collaborative_projects (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    institution_id BIGINT REFERENCES institutions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(100),
    stipend VARCHAR(80),
    student_capacity INT DEFAULT 5,
    status VARCHAR(40) DEFAULT 'OPEN_FOR_STUDENTS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty_programs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('FACULTY_INTERNSHIP', 'INDUSTRIAL_TRAINING', 'FDP', 'CONSULTANCY', 'JOINT_RESEARCH')),
    domain VARCHAR(100) NOT NULL,
    duration VARCHAR(50),
    mode VARCHAR(30) DEFAULT 'HYBRID',
    description TEXT,
    status VARCHAR(30) DEFAULT 'ACCEPTING_NOMINATIONS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- INITIAL SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, phone, role) VALUES
(1, 'anuj_student', 'anuj@skillproof.edu', '$2a$10$wN3q9.X8bZ3y9xY8Z3y9x.dummyhash', 'Anuj Sharma', '+91 9876543210', 'ROLE_STUDENT'),
(2, 'techcorp_hr', 'recruiter@techcorp.com', '$2a$10$wN3q9.X8bZ3y9xY8Z3y9x.dummyhash', 'Priya Mehta', '+91 9876543211', 'ROLE_INDUSTRY'),
(3, 'dr_verma', 'sverma@iitdelhi.ac.in', '$2a$10$wN3q9.X8bZ3y9xY8Z3y9x.dummyhash', 'Dr. S. K. Verma', '+91 9876543212', 'ROLE_ACADEMIA'),
(4, 'institution_dean', 'dean@abes.ac.in', '$2a$10$wN3q9.X8bZ3y9xY8Z3y9x.dummyhash', 'Prof. Rajesh K. Bansal', '+91 9876543213', 'ROLE_INSTITUTION');

INSERT INTO institutions (id, user_id, institution_name, institution_code, accreditation, state, city, website, contact_email) VALUES
(1, 4, 'ABES Engineering College', 'ABES-032', 'NAAC A++', 'Uttar Pradesh', 'Ghaziabad', 'https://abes.ac.in', 'dean@abes.ac.in');

INSERT INTO students (id, user_id, institution_id, roll_number, college_name, degree, branch, graduation_year, cgpa, location, target_role, placement_readiness_score, github_username) VALUES
(1, 1, 1, '2100320100045', 'ABES Engineering College', 'B.Tech', 'Computer Science & Engineering', 2027, 8.72, 'Noida / NCR', 'Backend Developer', 82.50, 'anuj-dev-2027');

INSERT INTO companies (id, user_id, company_name, industry_type, website, location, company_size, description) VALUES
(1, 2, 'NovaTech Solutions', 'Software & Cloud Services', 'https://novatech.io', 'Bengaluru / Hybrid', '500-1000', 'Pioneering cloud-native enterprise platforms and scalable microservices.');

INSERT INTO academicians (id, user_id, institution_id, department, designation, specialization, experience_years) VALUES
(1, 3, 1, 'Computer Science & Engineering', 'Professor & Head of Dept', 'Distributed Systems & Cloud Computing', 16);

INSERT INTO skills (id, name, category, industry_demand_index) VALUES
(1, 'Java', 'Backend', 0.94),
(2, 'Spring Boot', 'Backend', 0.91),
(3, 'React', 'Frontend', 0.93),
(4, 'SQL / PostgreSQL', 'Database', 0.89),
(5, 'Docker', 'Cloud & DevOps', 0.88),
(6, 'AWS', 'Cloud & DevOps', 0.92),
(7, 'System Design', 'Core CS', 0.95),
(8, 'Python', 'AI & ML', 0.96);

INSERT INTO skill_passports (id, student_id, passport_hash, overall_readiness, status, verification_tier_summary, qr_code_url, shareable_link) VALUES
(1, 1, 'SKP-2027-ANUJ-8294', 82.50, 'ACTIVE', 'ALL_4_TIERS_VERIFIED', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://skillproof.edu/verify/SKP-2027-ANUJ-8294', 'https://skillproof.edu/verify/SKP-2027-ANUJ-8294');

INSERT INTO skill_scores (passport_id, skill_name, category, final_score, resume_claim_score, github_evidence_score, assessment_score, interview_score, is_verified, verified_badge) VALUES
(1, 'Java', 'Backend', 84.50, 90.0, 80.0, 85.0, 83.0, TRUE, 'GOLD'),
(1, 'Spring Boot', 'Backend', 81.00, 85.0, 82.0, 80.0, 77.0, TRUE, 'GOLD'),
(1, 'SQL / PostgreSQL', 'Database', 83.00, 85.0, 78.0, 88.0, 81.0, TRUE, 'GOLD'),
(1, 'React', 'Frontend', 68.00, 70.0, 75.0, 65.0, 62.0, TRUE, 'SILVER');
