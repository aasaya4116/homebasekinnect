/**
 * Homebase weekly meal-insights email bridge.
 *
 * Required Apps Script properties:
 *   HOMEBASE_BASE_URL         e.g. https://homebasekinnect.vercel.app
 *   MEAL_REPORT_SECRET       same value as Vercel's MEAL_REPORT_SECRET
 *   MEAL_REPORT_RECIPIENTS   comma-separated recipient email addresses
 *
 * Run setupWeeklyMealInsights once. It creates a Monday-morning trigger.
 */

function setupWeeklyMealInsights() {
  const props = PropertiesService.getScriptProperties();
  const required = ["HOMEBASE_BASE_URL", "MEAL_REPORT_SECRET", "MEAL_REPORT_RECIPIENTS"];
  const missing = required.filter(function (key) { return !props.getProperty(key); });
  if (missing.length) throw new Error("Missing Script Properties: " + missing.join(", "));

  ScriptApp.getProjectTriggers()
    .filter(function (trigger) { return trigger.getHandlerFunction() === "sendWeeklyMealInsights"; })
    .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });

  ScriptApp.newTrigger("sendWeeklyMealInsights")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();
}

function sendWeeklyMealInsights() {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = String(props.getProperty("HOMEBASE_BASE_URL") || "").replace(/\/$/, "");
  const secret = props.getProperty("MEAL_REPORT_SECRET") || "";
  const recipients = props.getProperty("MEAL_REPORT_RECIPIENTS") || "";
  if (!baseUrl || !secret || !recipients) throw new Error("Meal insights email is not configured.");

  const firstReport = props.getProperty("MEAL_REPORT_BASELINE_SENT") !== "true";
  const response = UrlFetchApp.fetch(
    baseUrl + "/api/meal/report?includeBaseline=" + (firstReport ? "true" : "false"),
    {
      method: "get",
      headers: { Authorization: "Bearer " + secret },
      muteHttpExceptions: true,
    }
  );

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error("Homebase meal report failed (HTTP " + status + "): " + response.getContentText().slice(0, 300));
  }

  const report = JSON.parse(response.getContentText());
  if (!report.ok || !report.subject || !report.plainBody) throw new Error("Homebase returned an invalid meal report.");

  GmailApp.sendEmail(recipients, report.subject, report.plainBody, {
    htmlBody: report.htmlBody || undefined,
    name: "Homebase Kinnect",
  });

  if (firstReport) props.setProperty("MEAL_REPORT_BASELINE_SENT", "true");
  props.setProperty("MEAL_REPORT_LAST_SENT_AT", new Date().toISOString());
}
