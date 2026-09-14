import fs from 'fs';

const content = fs.readFileSync('frontend/src/components/proctor/useAssessmentProctor.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('isMicActive') || l.includes('setIsMicActive')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
