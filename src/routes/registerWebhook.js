const express = require("express");
const { authUser } = require("../middleware/auth");
const { registerWebhook } = require("../controllers/registerWebhookController");

const router = express.Router();

router.post("/register", authUser, registerWebhook);

module.exports = router;
