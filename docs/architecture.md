# SKILLPROOF System Architecture (SIH Problem 26044)

## Overview
SKILLPROOF is a decentralized-ready, multi-stakeholder ecosystem connecting:
1. **Students** (Skill Passport generation, verification, and learning roadmap)
2. **Industry** (Proof-backed talent discovery and explainable job matching)
3. **Academia** (Faculty internships, FDPs, and corporate research consultancies)
4. **Institutions** (Real-time Demand vs. Availability analytics for curriculum reform)

---

## 4-Tier Verification Engine Formulation

$$\text{Composite Score} = (0.15 \times \text{Resume}) + (0.25 \times \text{GitHub}) + (0.30 \times \text{Assessment}) + (0.30 \times \text{AI Interview})$$

### Verification Tiers:
- **Tier 1: AI Resume Ingestion**
  - Unstructured PDF/Docx parsed into structured ontology entities with confidence scoring.
- **Tier 2: GitHub Repository Proof**
  - Static AST analysis of public commits, library manifests (`pom.xml`, `package.json`), and code health.
- **Tier 3: Standardized Diagnostic Assessments**
  - Proctored scenario evaluations testing concurrency, database optimization, and core software engineering principles.
- **Tier 4: Adaptive AI Technical Defense**
  - Conversational LLM agent conducting Socratic cross-examination of claimed project architectural decisions.
