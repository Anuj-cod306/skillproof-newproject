import os
import sys

def create_pdf(file_path, title, badge, author, institution, date, sections, primary_color=(37, 99, 235)):
    # Convert rgb 0-255 to 0.0-1.0
    r, g, b = [c / 255.0 for c in primary_color]
    
    # We will build PDF objects
    objects = []
    
    def add_object(content):
        objects.append(content)
        return len(objects)

    # 1: Catalog
    add_object("<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    add_object("<< /Type /Pages /Kids [5 0 R] /Count 1 >>")
    # 3: Font Helvetica-Bold
    add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    # 4: Font Helvetica
    add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    # Content stream commands
    # A4: 595 x 842 points
    stream_cmds = []
    
    # Background subtle wash
    stream_cmds.append("0.97 0.98 0.99 rg 0 0 595 842 re f")
    
    # Header container box (white with top colored border)
    stream_cmds.append("1.0 1.0 1.0 rg 36 670 523 135 re f")
    stream_cmds.append("0.88 0.91 0.94 RG 1 w 36 670 523 135 re S")
    # Top accent bar
    stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg 36 801 523 4 re f")
    
    # Badge pill
    stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg 52 774 240 18 re f")
    stream_cmds.append("1.0 1.0 1.0 rg")
    stream_cmds.append("BT /F1 9 Tf 58 779 Td (" + badge.replace("(", "\\(").replace(")", "\\)") + ") Tj ET")
    
    # Title
    stream_cmds.append("0.06 0.09 0.16 rg")
    clean_title = title.replace("(", "\\(").replace(")", "\\)").replace("—", "-")
    stream_cmds.append("BT /F1 16 Tf 52 750 Td (" + clean_title + ") Tj ET")
    
    # Author & Institution
    stream_cmds.append("0.28 0.33 0.41 rg")
    clean_author = author.replace("(", "\\(").replace(")", "\\)")
    stream_cmds.append("BT /F2 10 Tf 52 732 Td (" + clean_author + ") Tj ET")
    clean_inst = institution.replace("(", "\\(").replace(")", "\\)")
    stream_cmds.append("BT /F2 9 Tf 52 718 Td (" + clean_inst + ") Tj ET")
    
    # Divider line
    stream_cmds.append("0.92 0.94 0.96 RG 1 w 52 702 m 543 702 l S")
    
    # Verified Date & Attestation
    stream_cmds.append("0.40 0.45 0.53 rg")
    stream_cmds.append("BT /F1 9 Tf 52 688 Td (Verified Date: " + date + ") Tj ET")
    stream_cmds.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
    stream_cmds.append("BT /F1 9 Tf 360 688 Td ([VERIFIED] SkillProof Digital Attestation) Tj ET")
    
    # Section cards
    curr_y = 645
    for heading, text_lines in sections:
        card_h = 24 + len(text_lines) * 15
        box_y = curr_y - card_h
        
        # Section Box
        stream_cmds.append(f"1.0 1.0 1.0 rg 36 {box_y} 523 {card_h} re f")
        stream_cmds.append(f"0.88 0.91 0.94 RG 1 w 36 {box_y} 523 {card_h} re S")
        
        # Heading
        stream_cmds.append("0.06 0.09 0.16 rg")
        clean_heading = heading.replace("(", "\\(").replace(")", "\\)")
        stream_cmds.append(f"BT /F1 11 Tf 52 {box_y + card_h - 18} Td ({clean_heading}) Tj ET")
        
        # Lines
        line_y = box_y + card_h - 34
        for line in text_lines:
            clean_line = line.replace("(", "\\(").replace(")", "\\)").replace("•", "-")
            stream_cmds.append("0.25 0.30 0.38 rg")
            stream_cmds.append(f"BT /F2 9.5 Tf 52 {line_y} Td ({clean_line}) Tj ET")
            line_y -= 15
            
        curr_y = box_y - 14
        
    # Footer
    stream_cmds.append("0.58 0.64 0.72 rg")
    stream_cmds.append("BT /F2 8.5 Tf 36 32 Td (SkillProof Verified Evidence Network - Cryptographic Hash: SHA-256:7f8a91c0e3b24d6589fa12b847) Tj ET")
    stream_cmds.append("BT /F2 8.5 Tf 450 32 Td (Page 1 of 1 - Tamper-Evident) Tj ET")
    stream_cmds.append("0.88 0.91 0.94 RG 1 w 36 46 m 559 46 l S")
    
    stream_body = "\n".join(stream_cmds)
    stream_len = len(stream_body.encode('latin1'))
    
    # 5: Page
    # Resources dictionary and contents link
    # 6: Stream contents
    # Let's add 5 & 6
    page_obj = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>"
    add_object(page_obj)
    
    contents_obj = f"<< /Length {stream_len} >>\nstream\n{stream_body}\nendstream"
    add_object(contents_obj)
    
    # Assemble PDF with cross-reference table
    output = []
    output.append("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    
    offsets = []
    cur_pos = len("".join(output).encode('latin1'))
    
    for i, obj in enumerate(objects, 1):
        offsets.append(cur_pos)
        obj_str = f"{i} 0 obj\n{obj}\nendobj\n"
        output.append(obj_str)
        cur_pos += len(obj_str.encode('latin1'))
        
    xref_pos = cur_pos
    output.append(f"xref\n0 {len(objects) + 1}\n")
    output.append("0000000000 65535 f \n")
    for off in offsets:
        output.append(f"{off:010d} 00000 n \n")
        
    output.append(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n")
    output.append(f"startxref\n{xref_pos}\n%%EOF\n")
    
    full_pdf_bytes = "".join(output).encode('latin1')
    
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(full_pdf_bytes)
    print(f"Created: {file_path} ({len(full_pdf_bytes)} bytes)")

if __name__ == "__main__":
    docs_dir = os.path.abspath("frontend/public/documents")
    
    # 1. SmartPrep Project Report
    create_pdf(
        os.path.join(docs_dir, "smartprep_project_report.pdf"),
        title="SmartPrep - AI-Powered Interview Preparation Platform",
        badge="VERIFIED CAPSTONE PROJECT - TIER 1 & 2 EVIDENCE",
        author="Anuj Bhalothia (Candidate ID: SP-2026-9041)",
        institution="SkillProof Autonomous Engineering Institute",
        date="August 10, 2026",
        sections=[
            ("1. Executive Summary & Problem Statement", [
                "SmartPrep is an enterprise-grade AI technical interview simulation and coding evaluation system.",
                "Designed to eliminate interview preparation bias, it conducts real-time adaptive defense questioning,",
                "tracks speech confidence, and executes candidate code inside sandboxed ephemeral containers."
            ]),
            ("2. System Architecture & Tech Stack", [
                "- Frontend: React 18, Vite, TailwindCSS, WebRTC Audio/Video Compositing Engine",
                "- Backend: Spring Boot 3.2, Java 21, Spring Security (JWT Auth), Hibernate JPA",
                "- Database: PostgreSQL with JSONB schema for rubric evaluations, Redis caching layer",
                "- LLM Orchestration: Google Gemini 1.5 Pro via Vertex AI SDK for context-aware defense questioning"
            ]),
            ("3. Quantitative Verification Metrics", [
                "- Unit & Integration Test Coverage: 94.2% across 86 test suites",
                "- Sandboxed Code Execution Latency: p99 < 320ms",
                "- Tab-Switch Anti-Cheat Detection Accuracy: 100% in automated E2E suites",
                "- GitHub Repository: github.com/anuj-bhalothia/smartprep-ai (420+ commits, 38 PRs reviewed)"
            ]),
            ("4. Cryptographic Proof of Authorship", [
                "Audit Signature: SHA-256: 7f8a91c0e3b24d6589fa12b84732c5690dfa43817456bb2010cfa82390415a77",
                "Status: VERIFIED & SEALED BY SKILLPROOF ATTESTATION ENGINE"
            ])
        ],
        primary_color=(37, 99, 235)
    )

    # 2. System Design Certificate
    create_pdf(
        os.path.join(docs_dir, "system_design_certificate.pdf"),
        title="Certificate of Excellence - Advanced Distributed Systems",
        badge="ACCREDITED PROFESSIONAL CERTIFICATION - TIER 3 EVIDENCE",
        author="Awarded to: Anuj Bhalothia",
        institution="SkillProof Industry Technical Standards Council",
        date="August 5, 2026",
        sections=[
            ("Certification Credentials & Curriculum", [
                "This certifies that Anuj Bhalothia has successfully demonstrated mastery in Distributed Systems Design,",
                "High-Throughput Event Streaming, Fault-Tolerant Consensus, and Microservice Observability."
            ]),
            ("Assessed Core Competencies", [
                "- Distributed Consensus (Raft, Paxos protocols and quorum replication)",
                "- Partitioning & Sharding strategies for multi-terabyte transactional datastores",
                "- Cache Invalidation, Write-Through / Write-Behind patterns with Redis Cluster",
                "- Event-Driven Microservice choreography using Apache Kafka and RabbitMQ",
                "- API Gateway rate limiting, circuit breaker resilience, and tracing with OpenTelemetry"
            ]),
            ("Examination Score & Verification Record", [
                "Examination Score: 98.4 / 100 (Top 1% Percentile)",
                "Credential ID: CERT-DIST-SYS-2026-88319",
                "Verification URL: https://verify.skillproof.edu/cert/CERT-DIST-SYS-2026-88319"
            ])
        ],
        primary_color=(5, 150, 105)
    )

    # 3. Hackathon Winner Certificate
    create_pdf(
        os.path.join(docs_dir, "hackathon_winner_certificate.pdf"),
        title="1st Place Winner - National FinTech & AI Innovation Hackathon 2026",
        badge="GOLD MEDAL ACHIEVEMENT - COMPETITIVE EVIDENCE",
        author="Team Lead: Anuj Bhalothia",
        institution="National Financial Technology Consortium & Global Developers Forum",
        date="July 30, 2026",
        sections=[
            ("Achievement Recognition", [
                "Awarded 1st Place out of 240+ collegiate engineering teams for building SentinelStream -",
                "a sub-millisecond AI fraud transaction interceptor for high-frequency banking gateways."
            ]),
            ("Project Deliverable & Innovation", [
                "- Real-Time Vector Embeddings: Embedded incoming transaction metadata into 128-d vectors in < 12ms",
                "- Anomaly Scoring: Deployed lightweight ONNX inference model inside Java edge proxy",
                "- Zero False Positives: Maintained 99.98% precision on historical benchmark datasets",
                "- Sponsor Award: Recognized by AWS and Stripe engineering panels for superior architecture"
            ]),
            ("Verification Record", [
                "Award Reference: HACK-FINTECH-2026-1ST-0042",
                "Issued on July 30, 2026 by General Hackathon Committee"
            ])
        ],
        primary_color=(79, 70, 229)
    )

    # 4. Open Source Contribution Audit
    create_pdf(
        os.path.join(docs_dir, "opensource_contribution_audit.pdf"),
        title="Open Source Contribution Audit - Apache EventMesh",
        badge="CODE REVIEW & AUDIT REPORT - TIER 2 EVIDENCE",
        author="Contributor: Anuj Bhalothia (@anuj-bhalothia)",
        institution="Open Source Verification & Attribution Audit",
        date="July 10, 2026",
        sections=[
            ("Pull Request Details", [
                "Pull Request #1428: 'Optimize Distributed Partition Consumer Rebalancing under Heavy Network Partitioning'",
                "Repository: apache/incubator-eventmesh (GitHub)",
                "Merged Commit: 4a2b91c8340d21e89f9218903e1a742e8820c78b"
            ]),
            ("Technical Contribution Overview", [
                "- Identified lock contention in consumer group rebalance listener during TCP socket timeout events",
                "- Refactored synchronized coordinator blocks into lock-free atomic CAS rings, boosting reconnect throughput by 42%",
                "- Added 14 unit test scenarios covering split-brain cluster partitions and consumer reconnect storms",
                "- 2,420 lines of Java code audited and approved by 3 core PMC committers"
            ]),
            ("Verification Status", [
                "Audit Status: PENDING FINAL ARTIFACT ATTESTATION",
                "Automated CI Checks: PASSED (All 42 build jobs green)",
                "SkillProof Evidence Classification: Tier 2 Validated Open Source Work"
            ])
        ],
        primary_color=(217, 119, 6)
    )

    # 5. Anuj Bhalothia Resume
    create_pdf(
        os.path.join(docs_dir, "anuj_bhalothia_resume.pdf"),
        title="Anuj Bhalothia - Full-Stack & Distributed Systems Engineer",
        badge="VERIFIED TECHNICAL RESUME - SKILLPROOF TIER 1 BASE",
        author="Contact: anuj.bhalothia@example.com | Bengaluru, India | github.com/anuj-bhalothia",
        institution="Bachelor of Technology in Computer Science (CGPA: 9.1 / 10)",
        date="August 15, 2026",
        sections=[
            ("Professional Summary", [
                "Software Engineer specializing in scalable web systems, distributed computing, and AI-assisted developer tooling.",
                "Strong foundations in data structures, algorithms, concurrency models, and cloud-native architecture."
            ]),
            ("Technical Skills Taxonomy", [
                "- Programming Languages: Java 21, JavaScript (ES6+), TypeScript, SQL, Python, Go",
                "- Frameworks & Libraries: Spring Boot 3, React 18, Vite, Node.js, TailwindCSS",
                "- Distributed Systems: Kafka, Redis, PostgreSQL, Docker, Kubernetes, Nginx",
                "- Testing & Tooling: JUnit 5, Mockito, Puppeteer, Git, Linux, GitHub Actions"
            ]),
            ("Key Engineered Projects", [
                "1. SmartPrep AI Interview Arena: Real-time dual-tier assessment platform with sandboxed execution.",
                "2. SentinelStream Fraud Interceptor: 1st Place National Hackathon winner with sub-millisecond inference.",
                "3. Apache EventMesh Contributor: Lock-free partition rebalance coordinator optimization."
            ]),
            ("Certifications & Accreditations", [
                "- SkillProof Verified Distributed Systems Architect (Score: 98.4/100)",
                "- AWS Certified Developer Associate",
                "- 1st Place Hackathon Winner - FinTech & AI 2026"
            ])
        ],
        primary_color=(37, 99, 235)
    )
