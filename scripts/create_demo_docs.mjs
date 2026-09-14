import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('frontend/public/documents');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const documents = [
  {
    fileName: 'smartprep_project_report.pdf',
    title: 'SmartPrep — AI-Powered Interview Preparation Platform',
    badge: 'Verified Capstone Project • Tier 1 & 2 Evidence',
    badgeColor: '#2563EB',
    date: 'August 10, 2026',
    author: 'Anuj Bhalothia (Candidate ID: SP-2026-9041)',
    institution: 'SkillProof Autonomous Engineering Institute',
    sections: [
      {
        heading: '1. Executive Summary & Problem Statement',
        content: 'SmartPrep is an enterprise-grade AI technical interview simulation and coding evaluation system. Designed to eliminate interview preparation bias, it conducts real-time adaptive questioning, tracks speech confidence, and executes candidate code inside sandboxed ephemeral containers.'
      },
      {
        heading: '2. System Architecture & Tech Stack',
        content: '• Frontend: React 18, Vite, TailwindCSS, WebRTC Audio/Video Compositing Engine\n• Backend: Spring Boot 3.2, Java 21, Spring Security (JWT Auth), Hibernate JPA\n• Database: PostgreSQL with JSONB schema for rubric evaluations, Redis caching layer\n• LLM Orchestration: Google Gemini 1.5 Pro via Vertex AI SDK for context-aware defense questioning'
      },
      {
        heading: '3. Quantitative Verification Metrics',
        content: '• Unit & Integration Test Coverage: 94.2% across 86 test suites\n• Sandboxed Code Execution Latency: p99 < 320ms\n• Tab-Switch Anti-Cheat Detection Accuracy: 100% in automated E2E suites\n• GitHub Repository: github.com/anuj-bhalothia/smartprep-ai (420+ commits, 38 PRs reviewed)'
      },
      {
        heading: '4. Cryptographic Proof of Authorship',
        content: 'Audit Signature: SHA-256: 7f8a91c0e3b24d6589fa12b84732c5690dfa43817456bb2010cfa82390415a77\nStatus: VERIFIED & SEALED BY SKILLPROOF ATTESTATION ENGINE'
      }
    ]
  },
  {
    fileName: 'system_design_certificate.pdf',
    title: 'Certificate of Excellence — Advanced Distributed Systems',
    badge: 'Accredited Professional Certification • Tier 3 Evidence',
    badgeColor: '#059669',
    date: 'August 5, 2026',
    author: 'Awarded to: Anuj Bhalothia',
    institution: 'SkillProof Industry Technical Standards Council',
    sections: [
      {
        heading: 'Certification Credentials & Curriculum',
        content: 'This certifies that Anuj Bhalothia has successfully demonstrated mastery in Distributed Systems Design, High-Throughput Event Streaming, Fault-Tolerant Consensus, and Microservice Observability.'
      },
      {
        heading: 'Assessed Core Competencies',
        content: '• Distributed Consensus (Raft, Paxos protocols and quorum replication)\n• Partitioning & Sharding strategies for multi-terabyte transactional datastores\n• Cache Invalidation, Write-Through / Write-Behind patterns with Redis Cluster\n• Event-Driven Microservice choreography using Apache Kafka and RabbitMQ\n• API Gateway rate limiting, circuit breaker resilience, and tracing with OpenTelemetry'
      },
      {
        heading: 'Examination Score & Verification',
        content: 'Examination Score: 98.4 / 100 (Top 1% Percentile)\nCredential ID: CERT-DIST-SYS-2026-88319\nVerification URL: https://verify.skillproof.edu/cert/CERT-DIST-SYS-2026-88319'
      }
    ]
  },
  {
    fileName: 'hackathon_winner_certificate.pdf',
    title: '1st Place Winner — National FinTech & AI Innovation Hackathon 2026',
    badge: 'Gold Medal Achievement • Competitive Evidence',
    badgeColor: '#4F46E5',
    date: 'July 30, 2026',
    author: 'Team Lead: Anuj Bhalothia',
    institution: 'National Financial Technology Consortium & Global Developers Forum',
    sections: [
      {
        heading: 'Achievement Recognition',
        content: 'Awarded 1st Place out of 240+ collegiate engineering teams for building SentinelStream — a sub-millisecond AI fraud transaction interceptor for high-frequency banking gateways.'
      },
      {
        heading: 'Project Deliverable & Innovation',
        content: '• Real-Time Vector Embeddings: Embedded incoming transaction metadata into 128-dimensional vectors in < 12ms\n• Anomaly Scoring: Deployed lightweight ONNX inference model inside Java edge proxy\n• Zero False Positives: Maintained 99.98% precision on historical benchmark datasets\n• Sponsor Award: Recognized by AWS and Stripe engineering panels for superior architecture'
      },
      {
        heading: 'Verification Record',
        content: 'Award Reference: HACK-FINTECH-2026-1ST-0042\nIssued on July 30, 2026 by General Hackathon Committee'
      }
    ]
  },
  {
    fileName: 'opensource_contribution_audit.pdf',
    title: 'Open Source Contribution Audit — Apache EventMesh',
    badge: 'Code Review & Audit Report • Tier 2 Evidence',
    badgeColor: '#D97706',
    date: 'July 10, 2026',
    author: 'Contributor: Anuj Bhalothia (@anuj-bhalothia)',
    institution: 'Open Source Verification & Attribution Audit',
    sections: [
      {
        heading: 'Pull Request Details',
        content: 'Pull Request #1428: "Optimize Distributed Partition Consumer Rebalancing under Heavy Network Partitioning"\nRepository: apache/incubator-eventmesh (GitHub)\nMerged Commit: 4a2b91c8340d21e89f9218903e1a742e8820c78b'
      },
      {
        heading: 'Technical Contribution Overview',
        content: '• Identified lock contention in consumer group rebalance listener during TCP socket timeout events\n• Refactored synchronized coordinator blocks into lock-free atomic CAS rings, boosting reconnect throughput by 42%\n• Added 14 unit test scenarios covering split-brain cluster partitions and consumer reconnect storms\n• 2,420 lines of Java code audited and approved by 3 core PMC committers'
      },
      {
        heading: 'Verification Status',
        content: 'Audit Status: PENDING FINAL ARTIFACT ATTESTATION\nAutomated CI Checks: PASSED (All 42 build jobs green)\nSkillProof Evidence Classification: Tier 2 Validated Open Source Work'
      }
    ]
  },
  {
    fileName: 'anuj_bhalothia_resume.pdf',
    title: 'Anuj Bhalothia — Full-Stack & Distributed Systems Engineer',
    badge: 'Verified Technical Resume • SkillProof Tier 1 Base',
    badgeColor: '#2563EB',
    date: 'August 15, 2026',
    author: 'Contact: anuj.bhalothia@example.com • Bengaluru, India • github.com/anuj-bhalothia',
    institution: 'Bachelor of Technology in Computer Science (CGPA: 9.1 / 10)',
    sections: [
      {
        heading: 'Professional Summary',
        content: 'Software Engineer specializing in scalable web systems, distributed computing, and AI-assisted developer tooling. Strong foundations in data structures, algorithms, concurrency models, and cloud-native architecture.'
      },
      {
        heading: 'Technical Skills Taxonomy',
        content: '• Programming Languages: Java 21, JavaScript (ES6+), TypeScript, SQL, Python, Go\n• Frameworks & Libraries: Spring Boot 3, React 18, Vite, Node.js, TailwindCSS\n• Distributed Systems: Kafka, Redis, PostgreSQL, Docker, Kubernetes, Nginx\n• Testing & Tooling: JUnit 5, Mockito, Puppeteer, Git, Linux, GitHub Actions'
      },
      {
        heading: 'Key Engineered Projects',
        content: '1. SmartPrep AI Interview Arena: Real-time dual-tier assessment platform with sandboxed execution.\n2. SentinelStream Fraud Interceptor: 1st Place National Hackathon winner with sub-millisecond inference.\n3. Apache EventMesh Contributor: Lock-free partition rebalance coordinator optimization.'
      },
      {
        heading: 'Certifications & Accreditations',
        content: '• SkillProof Verified Distributed Systems Architect (Score: 98.4/100)\n• AWS Certified Developer Associate\n• 1st Place Hackathon Winner — FinTech & AI 2026'
      }
    ]
  }
];

function generateHtml(doc) {
  const sectionsHtml = doc.sections.map(s => `
    <div style="margin-bottom: 24px; padding: 18px 22px; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
      <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -0.2px;">${s.heading}</h3>
      <div style="font-size: 13px; line-height: 1.65; color: #334155; white-space: pre-line;">${s.content}</div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${doc.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 40px;
          background: #F8FAFC;
          color: #0F172A;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-top: 4px solid ${doc.badgeColor};
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 28px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: ${doc.badgeColor}15;
          color: ${doc.badgeColor};
          border: 1px solid ${doc.badgeColor}30;
          margin-bottom: 14px;
        }
        .title {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 10px 0;
          letter-spacing: -0.5px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #64748B;
          border-top: 1px solid #F1F5F9;
          padding-top: 14px;
          margin-top: 16px;
        }
        .footer {
          margin-top: 36px;
          padding-top: 18px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #94A3B8;
        }
        .seal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #2563EB;
        }
      </style>
    </head>
    <body>
      <div class="header-card">
        <div class="badge">${doc.badge}</div>
        <h1 class="title">${doc.title}</h1>
        <div style="font-size: 14px; color: #475569; font-weight: 500;">${doc.author}</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">${doc.institution}</div>
        <div class="meta-row">
          <div>Verified Date: <strong>${doc.date}</strong></div>
          <div class="seal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            SkillProof Cryptographic Attestation
          </div>
        </div>
      </div>

      <div class="content-body">
        ${sectionsHtml}
      </div>

      <div class="footer">
        <div>SkillProof Digital Credential Network • Document ID: ${doc.fileName}</div>
        <div>Page 1 of 1 • Tamper Evident Electronic Record</div>
      </div>
    </body>
    </html>
  `;
}

async function main() {
  console.log('[1/2] Launching Chrome Headless to render authentic PDFs...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const doc of documents) {
    const html = generateHtml(doc);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const dest = path.join(OUTPUT_DIR, doc.fileName);
    await page.pdf({
      path: dest,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });
    console.log(`Generated: ${dest} (${fs.statSync(dest).size} bytes)`);
  }

  await browser.close();
  console.log('[2/2] All 5 documents successfully compiled into frontend/public/documents/!');
}

main().catch(err => {
  console.error('Error generating documents:', err);
  process.exit(1);
});
