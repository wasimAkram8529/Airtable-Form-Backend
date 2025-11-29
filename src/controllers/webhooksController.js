const axios = require("axios");
const Response = require("../models/Response");
const Form = require("../models/Form");
const User = require("../models/User");

let cursor = null;

const createAirtableSyncDB = async (req, res) => {
  if (req.headers["x-airtable-hook-check"]) {
    return res.status(200).send({ success: true });
  }
  res.status(200).send({ success: true });

  const payload = req.body;
  if (!payload.base || !payload.webhook) return;

  const baseId = payload.base.id;
  const webhookId = payload.webhook.id;

  try {
    const form = await Form.findOne({ airtableBaseId: baseId });
    if (!form) return;

    const user = await User.findById(form.formOwner);
    if (!user) return;

    let cursor = form.lastWebhookCursor || 1;

    const url = `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads?cursor=${cursor}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${user.airtableTokens.accessToken}` },
    });

    const { payloads, cursor: nextCursor } = response.data;

    for (const payload of payloads) {
      if (payload.changedTablesById) {
        for (const tableId in payload.changedTablesById) {
          const changes = payload.changedTablesById[tableId];

          if (changes.destroyedRecordIds) {
            for (const recordId of changes.destroyedRecordIds) {
              await Response.findOneAndUpdate(
                { airtableRecordId: recordId },
                { status: "deletedInAirtable", deletedInAirtable: true }
              );
              console.log(`Marked record ${recordId} as deleted.`);
            }
          }

          if (changes.changedRecordsById) {
            for (const recordId in changes.changedRecordsById) {
              await Response.findOneAndUpdate(
                { airtableRecordId: recordId },
                { status: "updated" }
              );
              console.log(`Marked record ${recordId} as updated.`);
            }
          }
        }
      }
    }

    if (nextCursor > cursor) {
      form.lastWebhookCursor = nextCursor;
      await form.save();
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }
};

module.exports = {
  createAirtableSyncDB,
};
