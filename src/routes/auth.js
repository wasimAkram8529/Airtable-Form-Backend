const express = require("express");
const {
  login,
  getLoginStatus,
  logout,
  airtableCallback,
} = require("../controllers/authController");

const router = express.Router();

router.get("/airtable/login", login);

router.get("/airtable/login-status", getLoginStatus);

router.post("/airtable/logout", logout);

router.get("/airtable/callback", airtableCallback);

module.exports = router;
