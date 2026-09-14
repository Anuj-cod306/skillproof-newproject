# 🛡️ SKILLPROOF (SIH Problem 26044)
### *Verified Skill Passport & Multi-Stakeholder Ecosystem*

> **"A resume is the starting point, not the proof."**  
> *Collect → Understand → Verify → Score → Improve → Connect*

---

## 🏛️ System Architecture

```
                             ┌───────────────────────────────┐
                             │          SKILLPROOF           │
                             │   Verified Skill Ecosystem    │
                             └───────────────┬───────────────┘
                                             │
             ┌───────────────────────┬───────┴───────────────┬───────────────────────┐
             │                       │                       │                       │
      ┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐
      │   STUDENT   │         │  INDUSTRY   │         │  ACADEMIA   │         │ INSTITUTION │
      │   PORTAL    │         │   PORTAL    │         │   PORTAL    │         │ ADMIN & BI  │
      └─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
```

---

## 🚀 Key Innovations for SIH 26044

### 1. 4-Tier Multi-Modal Verification Engine
Rather than trusting unverified claims on PDF resumes, SKILLPROOF validates every skill across 4 progressive tiers:
$$\text{Verified Score} = (0.15 \times \text{Resume}) + (0.25 \times \text{GitHub}) + (0.30 \times \text{Assessment}) + (0.30 \times \text{AI Interview})$$

- **Tier 1 (Claim):** AI Resume Parser ingests PDFs into a structured skill graph.
- **Tier 2 (Code Proof):** GitHub Scanner inspects commits, AST frameworks, and repositories.
- **Tier 3 (Diagnostic):** Standardized timed assessments evaluate concurrency, indexing, and architecture.
- **Tier 4 (AI Defense):** Adaptive AI Agent conducts Socratic cross-examination of claimed project decisions with rubric scoring.

### 2. 🪪 Verified Skill Passport (Hero Feature)
A tamper-proof digital credential with a cryptographic hash, QR code, verified badges (**Gold 80%+**, **Silver 65%+**, **Bronze 50%+**), and a public verification link (`/#/verify/{passportId}`).

### 3. 🤖 Explainable AI Job Matching
Shows recruiters and candidates exactly **WHY** they matched (e.g. *89% Match: Java Verified ✓, Spring Boot Verified ✓, SQL Verified ✓, AWS Deficit ⚠*).

### 4. 📊 Industry Demand vs Student Availability Matrix
Directly solves the SIH 26044 institutional analytics requirement by graphing employer hiring requirements against real campus competencies to guide curriculum reforms.

### 5. 🤝 Industry-Academia Synergy
Enables corporate live project sponsorships, faculty internships, FDP programs, and corporate research consultancies.

---

## 📂 Project Directory Structure

```
SkillProof/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Badge.jsx, Footer.jsx
│   │   │   ├── navbar/         # Navbar.jsx, NotificationDropdown.jsx
│   │   │   ├── dashboard/      # StatCard.jsx, SkillRadarWidget.jsx
│   │   │   └── forms/          # FormField.jsx
│   │   ├── pages/
│   │   │   ├── public/         # HomePage, AboutPage, HowItWorksPage, FeaturesPage, OpportunitiesPage, ContactPage, PublicPassportView
│   │   │   ├── auth/           # LoginPage, RegisterPage
│   │   │   ├── student/        # Dashboard, Profile, ResumeUpload, SkillMap, Assessments, GitHub, AIInterview, Passport, Roadmap, Jobs
│   │   │   ├── industry/       # Dashboard, PostJob, Candidates, Collaborations
│   │   │   ├── academician/    # AcademiaDashboard, FacultyOpportunitiesPage, StudentMentorshipPage
│   │   │   └── institution/    # Dashboard, DemandVsAvailability
│   │   ├── context/            # AuthContext, SkillProofContext
│   │   ├── hooks/              # useAuth, useSkillProof
│   │   ├── services/           # api.js
│   │   ├── routes/             # AppRoutes.jsx
│   │   ├── utils/              # scoreCalculator, formatters
│   │   ├── assets/             # index.js
│   │   └── layouts/            # PublicLayout, DashboardLayout
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── backend/                    # Spring Boot 3 + Spring Security + JWT + JPA + PostgreSQL
├── database/                   # schema.sql (PostgreSQL DDL & Seeds)
├── docs/                       # architecture.md, sih_problem_statement.md, api_specification.md
└── README.md
```

---

## 💻 Running the Platform

### Frontend (React + Vite)
```bash
cd skillproof/frontend
npm install
npm run dev
```
Access at: `http://localhost:3000`

### Backend (Spring Boot 3)
```bash
cd skillproof/backend
mvn clean spring-boot:run
```
Access REST API at: `http://localhost:8080`

### Database (PostgreSQL)
Run `database/schema.sql` in PostgreSQL (or `psql -U postgres -d skillproof_db -f database/schema.sql`).

---

## 🎯 1-Click Demo Personas for SIH Hackathon Jury

The top navigation bar contains an **Instant Actor Switcher** allowing seamless demonstration across all 4 stakeholders:

1. **👨‍🎓 Student:** Anuj Sharma (`anuj@skillproof.edu`) — Passport `#SKP-2027-ANUJ-8294`
2. **🏢 Industry Recruiter:** Priya Mehta (`priya.mehta@novatech.io`) — NovaTech Solutions
3. **🎓 Academician:** Dr. S. K. Verma (`sverma@iitdelhi.ac.in`) — Professor, CSE Dept
4. **🏫 Institution Admin:** Prof. Rajesh K. Bansal (`dean@abes.ac.in`) — Dean & Leadership
