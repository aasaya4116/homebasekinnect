// Seed the "Pantry Staples" tab in Google Sheets with default items
const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const DEFAULT_STAPLES = [
  "Salt",
  "Pepper",
  "Olive oil",
  "Butter",
  "Garlic",
  "Cooking spray",
  "Water",
  "Flour",
  "Sugar",
  "Baking soda",
  "Baking powder",
  "Vinegar",
  "Vegetable oil",
  "Canola oil",
  "Ketchup",
  "Mustard",
  "Mayonnaise",
  "Soy sauce",
  "Hot sauce",
  "Honey",
  "Rice (white)",
  "Pasta (pantry box)",
];

async function seed() {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1nNUA7bnqIpyVo6hDiGl9yk4X88NysvybQvng1MICRyw';
  const tabName = 'Pantry Staples';

  // Check if tab exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.find(s => s.properties.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    console.log('Created "Pantry Staples" tab.');
  }

  const values = [
    ['Ingredient', 'Notes'],
    ...DEFAULT_STAPLES.map(s => [s, 'Always have at home']),
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${tabName}'!A1:B100`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log(`Seeded ${DEFAULT_STAPLES.length} pantry staples to Google Sheets.`);
}

seed().catch(console.error);
