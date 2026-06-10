const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function run() {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw',
    range: 'A1:Z100',
  });

  const rows = res.data.values || [];
  const header = rows[1];
  console.log('HEADER ROW:', header);
  const dataRows = rows.slice(2);
  const dinners = dataRows.filter(r => r[0] && r[0].toLowerCase() === 'dinner');
  console.log('\nTOTAL DINNER RECIPES:', dinners.length);
  dinners.forEach((r, i) => console.log('  ' + (i + 1) + '. ' + (r[1] || '(unnamed)')));
}

run();
