const XLSX = require('xlsx');
const path = require('path');

// No headers, just raw data rows
const data = [
  ['Priya Sharma', '987654321012', 'HDFC0001234', '15,000'],
  ['Rahul Mehta',  '554433221100', 'SBIN0005678', '8,500'],
  ['Sneha Iyer',   '112233445566', 'ICIC0009876', '12,200'],
  ['Arjun Nair',   '998877665544', 'KKBK0004321', '5,000'],
  ['Kavya Reddy',  '776655443322', 'BARB0VADODR', '25,000']
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Data');

const outPath = path.join(__dirname, '..', '..', 'test_headerless.xlsx');
XLSX.writeFile(wb, outPath);
console.log('✅ test_headerless.xlsx created at', outPath);
