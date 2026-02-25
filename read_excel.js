import xlsx from 'xlsx';

const filePath = 'E:\\Stivi\\001 TRABAJOS\\INGRESOS\\importante\\Agua Potable B 2026.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, raw: false });

console.log('Sheet Name:', sheetName);
console.log('Total Rows:', data.length);
console.log('--- HEADERS (Row 0) ---');
console.log(data[0]);
console.log('--- SAMPLE DATA (Rows 1-3) ---');
console.log(data[1]);
console.log(data[2]);
console.log(data[3]);
