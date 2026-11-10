const fs = require('fs');
const path = require('path');

const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

const avatars = [
  { id: 'stu-1001', name: 'JA', color: '#000000', bg: '#f4f4f5' },
  { id: 'stu-1002', name: 'EW', color: '#18181b', bg: '#e4e4e7' },
  { id: 'stu-1003', name: 'MC', color: '#27272a', bg: '#f4f4f5' },
  { id: 'stu-1004', name: 'SR', color: '#09090b', bg: '#e4e4e7' },
  { id: 'stu-1005', name: 'DK', color: '#18181b', bg: '#f4f4f5' },
  { id: 'stu-1006', name: 'LV', color: '#000000', bg: '#e4e4e7' }
];

avatars.forEach((av) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <rect width="160" height="160" rx="24" fill="${av.bg}" stroke="#000000" stroke-width="4" />
  <circle cx="80" cy="62" r="30" fill="${av.color}" />
  <path d="M 32 142 C 32 105, 54 94, 80 94 C 106 94, 128 105, 128 142 Z" fill="${av.color}" />
  <text x="80" y="69" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">${av.name}</text>
</svg>`;
  fs.writeFileSync(path.join(profilesDir, `${av.id}.svg`), svg);
});

// Monochrome default avatar
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <rect width="160" height="160" rx="24" fill="#f4f4f5" stroke="#000000" stroke-width="4" />
  <circle cx="80" cy="62" r="30" fill="#000000" />
  <path d="M 32 142 C 32 105, 54 94, 80 94 C 106 94, 128 105, 128 142 Z" fill="#000000" />
</svg>`;
fs.writeFileSync(path.join(profilesDir, 'default.svg'), defaultSvg);

console.log('Monochrome student avatars generated.');

