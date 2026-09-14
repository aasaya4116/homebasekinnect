/**
 * Homebase School email bridge.
 *
 * This runs inside the family's Google account. Gmail filters apply one of the
 * labels below, then this script forwards each unseen message to Homebase's
 * secret-protected importer. Email bodies and attachments remain source data;
 * Homebase creates a draft that still needs parent approval.
 */
const SCHOOL_LABELS = {
  khalil: "Homebase/School/Khalil",
  mekhi: "Homebase/School/Mekhi",
};

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

function setupSchoolEmailImport() {
  Object.values(SCHOOL_LABELS).forEach(function (name) {
    if (!GmailApp.getUserLabelByName(name)) GmailApp.createLabel(name);
  });

  ScriptApp.getProjectTriggers()
    .filter(function (trigger) { return trigger.getHandlerFunction() === "importLabeledSchoolEmails"; })
    .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });

  ScriptApp.newTrigger("importLabeledSchoolEmails").timeBased().everyHours(1).create();
}

function importLabeledSchoolEmails() {
  const props = PropertiesService.getScriptProperties();
  const importUrl = props.getProperty("HOMEBASE_SCHOOL_IMPORT_URL");
  const importSecret = props.getProperty("HOMEBASE_SCHOOL_IMPORT_SECRET");
  if (!importUrl || !importSecret) throw new Error("Set the Homebase import URL and secret in Script properties.");

  Object.keys(SCHOOL_LABELS).forEach(function (child) {
    const label = GmailApp.getUserLabelByName(SCHOOL_LABELS[child]);
    if (!label) return;

    label.getThreads(0, 20).forEach(function (thread) {
      thread.getMessages().forEach(function (message) {
        const messageId = message.getId();
        if (props.getProperty("processed_" + messageId)) return;

        const attachments = message.getAttachments({ includeInlineImages: true, includeAttachments: true })
          .filter(function (attachment) { return SUPPORTED_TYPES.has(attachment.getContentType()); })
          .slice(0, 6)
          .map(function (attachment) {
            return {
              filename: attachment.getName() || "attachment",
              mimeType: attachment.getContentType(),
              dataBase64: Utilities.base64Encode(attachment.getBytes()),
            };
          });

        const response = UrlFetchApp.fetch(importUrl, {
          method: "post",
          contentType: "application/json",
          headers: { Authorization: "Bearer " + importSecret },
          muteHttpExceptions: true,
          payload: JSON.stringify({
            messageId: messageId,
            child: child,
            subject: message.getSubject(),
            sender: message.getFrom(),
            receivedAt: message.getDate().toISOString(),
            sourceUrl: "https://mail.google.com/mail/u/0/#all/" + thread.getId(),
            body: message.getPlainBody(),
            attachments: attachments,
          }),
        });

        const status = response.getResponseCode();
        if (status < 200 || status >= 300) {
          throw new Error("Homebase rejected school message " + messageId + " (HTTP " + status + ")");
        }
        props.setProperty("processed_" + messageId, new Date().toISOString());
      });
    });
  });
}
