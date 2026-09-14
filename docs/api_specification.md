# SKILLPROOF REST API Specification

Base URL: `http://localhost:8080/api`

## Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate and receive JWT Bearer token.
- `GET /api/auth/demo-users`: Retrieve pre-seeded actor personas.

### 2. Verified Skill Passports (`/api/passports`)
- `GET /api/passports/public/{passportHash}`: Public verification endpoint returning audited 4-tier score breakdown.

### 3. Opportunities & Matching (`/api/jobs`)
- `GET /api/jobs/matched`: Returns opportunities with explainable compatibility scores.

### 4. Institutional Analytics (`/api/analytics`)
- `GET /api/analytics/demand-vs-availability`: Returns comparative matrix of corporate skill demand vs campus student availability.
