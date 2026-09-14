import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/student/AiInterviewArena.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('isCamActive') || l.includes('setIsCamActive')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
