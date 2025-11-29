const axios = require("axios");
const Response = require("../models/Response");
const Form = require("../models/Form");
const User = require("../models/User");

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
    const form = await Form.findOne({ webhookId: webhookId });

    if (!form) {
      console.log(`No form found for webhook ID: ${webhookId}`);
      return;
    }

    const user = await User.findById(form.formOwner);
    if (!user) return;

    let cursor = form.lastWebhookCursor || 1;

    console.log(`Processing Webhook ${webhookId} starting at cursor ${cursor}`);

    const url = `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads?cursor=${cursor}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${user.airtableTokens.accessToken}` },
    });

    const { payloads, cursor: nextCursor } = response.data;

    for (const p of payloads) {
      if (p.changedTablesById) {
        for (const tableId in p.changedTablesById) {
          const changes = p.changedTablesById[tableId];

          if (changes.destroyedRecordIds) {
            for (const recordId of changes.destroyedRecordIds) {
              await Response.findOneAndUpdate(
                { airtableRecordId: recordId },
                { status: "deletedInAirtable", deletedInAirtable: true }
              );
              console.log(`Synced Delete: ${recordId}`);
            }
          }

          if (changes.changedRecordsById) {
            for (const recordId in changes.changedRecordsById) {
              await Response.findOneAndUpdate(
                { airtableRecordId: recordId },
                { status: "updated" }
              );
              console.log(`Synced Update: ${recordId}`);
            }
          }
        }
      }
    }

    if (nextCursor && nextCursor > cursor) {
      form.lastWebhookCursor = nextCursor;
      await form.save();
      console.log(`Cursor updated to ${nextCursor}`);
    }
  } catch (err) {
    console.error(
      "Webhook processing error:",
      err.response?.data || err.message
    );
  }
};

const createCleanUp = async (req, res) => {
  const { baseId } = req.params;
  const token = req.user.airtableTokens.accessToken;

  try {
    console.log(`Scanning for ghost webhooks in base: ${baseId}...`);

    const listRes = await fetch(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await listRes.json();

    const hooks = data.webhooks || [];
    console.log(`Found ${hooks.length} active webhooks.`);

    if (hooks.length === 0) {
      return res.json({ message: "No webhooks found. You are clean!" });
    }

    const results = [];
    for (const hook of hooks) {
      console.log(`Deleting webhook: ${hook.id}`);
      await fetch(
        `https://api.airtable.com/v0/bases/${baseId}/webhooks/${hook.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      results.push(hook.id);
    }

    res.json({
      success: true,
      message: `Deleted ${results.length} ghost webhooks.`,
      deletedIds: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createAirtableSyncDB,
  createCleanUp,
};
