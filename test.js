const { google } = require('googleapis');
const path = require('path');

async function test() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/calendar.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw',
      range: 'Sheet1!A1:Z10', // Guessing "Sheet1"
    });
    console.log("=== SHEET DATA ===");
    console.log(res.data.values);
  } catch(e) {
    console.log("Sheet Error:", e.message);
  }

  try {
    const timeMin = new Date();
    timeMin.setHours(0,0,0,0);
    const timeMax = new Date();
    timeMax.setHours(23,59,59,999);
    timeMax.setDate(timeMax.getDate() + 7);

    const calRes = await calendar.events.list({
      calendarId: 'aasay412@gmail.com',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    console.log("\n=== CALENDAR EVENTS ===");
    console.log(calRes.data.items?.map(i => ({ sum: i.summary, start: i.start })));
  } catch(e) {
    console.log("Calendar Error:", e.message);
  }
}

test();
