const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function run() {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Scheduled Meals'!A2:E15`,
    });

    console.log("SHEET DATA:", res.data.values);
  } catch (error) {
    console.log("ERROR:", error.message);
  }
}

run();
