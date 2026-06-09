const { google } = require('googleapis');
const path = require('path');

async function test() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheetName = meta.data.sheets[0].properties.title;
    
    console.log(`Sheet Name: ${firstSheetName}`);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheetName}!A1:Z5`,
    });
    
    console.log("=== ROW DATA ===");
    console.dir(res.data.values, { depth: null });
  } catch(e) {
    console.log("Error:", e.message);
  }
}

test();
