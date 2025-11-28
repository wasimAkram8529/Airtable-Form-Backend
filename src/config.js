const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  AIRTABLE_CLIENT_ID: process.env.AIRTABLE_CLIENT_ID,
  AIRTABLE_CLIENT_SECRET: process.env.AIRTABLE_CLIENT_SECRET,
  AIRTABLE_REDIRECT_URI: process.env.AIRTABLE_REDIRECT_URI,
  FRONTEND_URL: process.env.FRONTEND_URL,
};
