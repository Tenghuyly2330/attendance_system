const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSeed() {
  const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
  const attendanceDir = path.join(__dirname, '..', 'uploads', 'attendance');

  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  if (!fs.existsSync(attendanceDir)) {
    fs.mkdirSync(attendanceDir, { recursive: true });
  }

  const avatars = [
    { id: 'stu-1001', name: 'JA', color1: '#2563eb', color2: '#1d4ed8', bg: '#dbeafe' },
    { id: 'stu-1002', name: 'EW', color1: '#db2777', color2: '#be185d', bg: '#fce7f3' },
    { id: 'stu-1003', name: 'MC', color1: '#059669', color2: '#047857', bg: '#d1fae5' },
    { id: 'stu-1004', name: 'SR', color1: '#7c3aed', color2: '#6d28d9', bg: '#ede9fe' },
    { id: 'stu-1005', name: 'DK', color1: '#d97706', color2: '#b45309', bg: '#fef3c7' }
  ];

  for (const av of avatars) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="grad-${av.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${av.color1}" />
      <stop offset="100%" stop-color="${av.color2}" />
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="${av.bg}" />
  <circle cx="80" cy="65" r="32" fill="url(#grad-${av.id})" opacity="0.9" />
  <path d="M 30 140 C 30 105, 55 95, 80 95 C 105 95, 130 105, 130 140 Z" fill="url(#grad-${av.id})" opacity="0.9" />
  <text x="80" y="72" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${av.name}</text>
</svg>`;
    fs.writeFileSync(path.join(profilesDir, `${av.id}.svg`), svg);
  }
  console.log('Sample avatars generated successfully.');

  const sqlPath = path.join(__dirname, '..', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Database initialized and seeded successfully.');
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };

