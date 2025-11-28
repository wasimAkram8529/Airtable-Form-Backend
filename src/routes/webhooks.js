const express = require("express");
const axios = require("axios");
const Response = require("../models/Response");

const router = express.Router();

let cursor = null;

router.post("/airtable", async (req, res) => {
  const signature = req.headers["x-airtable-signature"];

  if (req.headers["x-airtable-hook-check"]) {
    return res.status(200).send("OK");
  }

  try {
    const result = await axios.post(
      req.body.webhook_url,
      { cursor },
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_USER_TOKEN}` },
      }
    );

    cursor = result.data.cursor;

    const events = result.data?.events || [];

    for (const event of events) {
      const recordId = event.recordId;
      if (!recordId) continue;

      if (event.type === "record.deleted") {
        await Response.findOneAndUpdate(
          { airtableRecordId: recordId },
          { status: "deletedInAirtable" }
        );
      }

      if (event.type === "record.updated") {
        await Response.findOneAndUpdate(
          { airtableRecordId: recordId },
          { status: "updated" }
        );
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Webhook error");
  }
});

module.exports = router;
