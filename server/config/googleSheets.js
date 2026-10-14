const { google } = require("googleapis");
const path = require("path");

/**
 * Returns an authenticated Google Sheets API client.
 * Uses a Service Account JSON key file whose path is set in .env as
 * GOOGLE_SERVICE_ACCOUNT_KEY_PATH (default: ./config/service-account.json)
 */
async function getSheetsClient() {
  const keyPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ||
    path.join(__dirname, "service-account.json");

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

module.exports = { getSheetsClient };
