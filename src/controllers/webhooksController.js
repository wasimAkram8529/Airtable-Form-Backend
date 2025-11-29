const axios = require("axios");
const Response = require("../models/Response");
const Form = require("../models/Form");
const User = require("../models/User");

const createAirtableSyncDB = async (req, res) => {
  if (req.headers["x-airtable-hook-check"]) {
    return res.status(200).send({ success: true });
  }

  res.status(200).send({ success: true });

  const webhookPayload = req.body;
  if (!webhookPayload?.base?.id || !webhookPayload?.webhook?.id) return;

  const baseId = webhookPayload.base.id;
  const webhookId = webhookPayload.webhook.id;

  try {
    const form = await Form.findOne({ webhookId });

    if (!form) {
      console.log(`No form found for webhook ID: ${webhookId}`);
      return;
    }

    const user = await User.findById(form.owner);
    if (!user) return;

    let currentCursor = form.lastWebhookCursor || 1;
    console.log(
      `Processing Webhook ${webhookId} starting at cursor ${currentCursor}`
    );

    const payloadUrl = `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads?cursor=${currentCursor}`;

    const airtablePayloadResponse = await axios.get(payloadUrl, {
      headers: { Authorization: `Bearer ${user.airtableTokens.accessToken}` },
    });

    const { payloads: airtablePayloadEvents, cursor: nextCursor } =
      airtablePayloadResponse.data;

    for (const webhookEvent of airtablePayloadEvents) {
      if (!webhookEvent.changedTablesById) continue;

      for (const affectedTableId in webhookEvent.changedTablesById) {
        const recordChanges = webhookEvent.changedTablesById[affectedTableId];

        if (recordChanges.destroyedRecordIds?.length) {
          for (const deletedRecordId of recordChanges.destroyedRecordIds) {
            await Response.findOneAndUpdate(
              { airtableRecordId: deletedRecordId },
              { status: "deletedInAirtable", deletedInAirtable: true },
              { new: true }
            );

            console.log(
              `Deleted in Airtable :-> Synced Mongo record: ${deletedRecordId}`
            );
          }
        }

        if (recordChanges.changedRecordsById) {
          for (const updatedRecordId in recordChanges.changedRecordsById) {
            console.log(`Updating record:-> ${updatedRecordId}`);

            const updatedRecordResponse = await axios.get(
              `https://api.airtable.com/v0/${baseId}/${form.airtableTableId}/${updatedRecordId}`,
              {
                headers: {
                  Authorization: `Bearer ${user.airtableTokens.accessToken}`,
                },
              }
            );

            const updatedAnswers = updatedRecordResponse.data.fields || {};

            const updatedResponseDocument = await Response.findOneAndUpdate(
              { airtableRecordId: updatedRecordId },
              {
                status: "updated",
                answers: updatedAnswers,
                updatedAt: new Date(),
              },
              { new: true }
            );

            console.log(
              updatedResponseDocument
                ? `Synced update :-> ${updatedRecordId}`
                : `Record ${updatedRecordId} exists in Airtable but not in MongoDB`
            );
          }
        }
      }
    }

    if (nextCursor && nextCursor > currentCursor) {
      form.lastWebhookCursor = nextCursor;
      await form.save();
      console.log(`Cursor updated :-> ${nextCursor}`);
    }
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error.response?.data || error.message
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
