import { writeFileSync } from 'node:fs';
const rows = [
  ['name', 'phone', 'nationalId', 'specialty', 'amount'],
  ['Dr. Sample One', '01012345678', '29901011234567', 'General Practitioner', 1800],
  ['Dr. Sample Two', '01112345678', '29902021234568', 'Surgery', 4200],
  ['Duplicate Example', '01012345678', '29901011234567', 'General Practitioner', 1800],
  ['Invalid ID', '01212345678', '123', 'Cardiology', 3000],
];
writeFileSync('sample-bank-sheet.csv', rows.map((r) => r.join(',')).join('\n') + '\n');
console.log('Created sample-bank-sheet.csv');
