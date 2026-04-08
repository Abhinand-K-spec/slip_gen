const XLSX = require('xlsx');
const path = require('path');

const data = [
  { Name: 'Priya Sharma',  ID: 'EMP001', Department: 'Engineering',  Email: 'priya@example.com',  Phone: '+91-9876543210' },
  { Name: 'Rahul Mehta',   ID: 'EMP002', Department: 'Marketing',    Email: 'rahul@example.com',  Phone: '+91-9876543211' },
  { Name: 'Sneha Iyer',    ID: 'EMP003', Department: 'Design',       Email: 'sneha@example.com',  Phone: '+91-9876543212' },
  { Name: 'Arjun Nair',    ID: 'EMP004', Department: 'Operations',   Email: 'arjun@example.com',  Phone: '+91-9876543213' },
  { Name: 'Kavya Reddy',   ID: 'EMP005', Department: 'HR',           Email: 'kavya@example.com',  Phone: '+91-9876543214' },
  { Name: '',              ID: '',       Department: '',              Email: '',                   Phone: '' }, // malformed row
  { Name: 'Dev Patel',     ID: 'EMP007', Department: 'Finance',      Email: 'dev@example.com',    Phone: '+91-9876543215' },
  { Name: 'Ananya Singh',  ID: 'EMP008', Department: 'Engineering',  Email: 'ananya@example.com', Phone: '+91-9876543216' },
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Employees');

const outPath = path.join(__dirname, '..', 'test_data.xlsx');
XLSX.writeFile(wb, outPath);
console.log('✅ test_data.xlsx created at', outPath);
