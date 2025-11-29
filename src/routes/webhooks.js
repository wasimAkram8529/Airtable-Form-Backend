const express = require("express");
const {
  createAirtableSyncDB,
  createCleanUp,
} = require("../controllers/webhooksController");
const { authUser } = require("../middleware/auth.js");

const router = express.Router();

router.post("/airtable", createAirtableSyncDB);
router.get("/cleanup/:baseId", authUser, createCleanUp);

module.exports = router;
