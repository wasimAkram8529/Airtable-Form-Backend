const express = require("express");
const { authUser } = require("../middleware/auth");
const { BACKEND_URL } = require("../config");
const Form = require("../models/Form");

const router = express.Router();

router.post("/register", authUser, async (req, res) => {
  const { baseId, tableId } = req.body;

  if (!baseId || !tableId) {
    return res.status(400).json({ error: "baseId and tableId are required" });
  }

  try {
    const user = req.user;

    const response = await fetch(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.airtableTokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationUrl: `${BACKEND_URL}/webhooks/airtable`,
          specification: {
            options: {
              filters: {
                dataTypes: ["tableData"],
                recordChangeScope: tableId,
              },
            },
          },
        }),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.log("Webhook Error:", text);
      return res.status(response.status).send(text);
    }

    const result = JSON.parse(text);

    const updatedForm = await Form.findOneAndUpdate(
      { airtableBaseId: baseId, airtableTableId: tableId },
      {
        webhookId: result.id,
        lastWebhookCursor: result.cursorForNextPayload,
      },
      { new: true }
    );

    if (!updatedForm) {
      console.warn(
        "Warning: Webhook created but Form not found in DB to update."
      );
    }

    res.json({ webhook: result });
  } catch (error) {
    console.error("Webhook Setup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
