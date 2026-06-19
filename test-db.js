const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function run() {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
  
  // First, clear the existing schedule so Option B doesn't preserve old data without Cook column
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'Scheduled Meals'!A1:F100`
    });
    console.log('Cleared existing schedule (no Cook column data).');
  } catch (e) {
    console.log('No existing schedule to clear.');
  }

  // Now check current state
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Scheduled Meals'!A1:F5`,
    });
    console.log('Current Scheduled Meals:', JSON.stringify(res.data.values, null, 2));
  } catch (e) {
    console.log('Scheduled Meals tab is now empty, ready for regeneration.');
  }
}

run();
