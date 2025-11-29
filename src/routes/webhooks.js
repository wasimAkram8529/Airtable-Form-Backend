const express = require("express");
const { createAirtableSyncDB } = require("../controllers/webhooksController");

const router = express.Router();

router.post("/airtable", createAirtableSyncDB);

module.exports = router;
