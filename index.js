const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { PORT, MONGO_URI, FRONTEND_URL } = require("./src/config");

const authRoutesHandler = require("./src/routes/auth");
const airtableRoutesHandler = require("./src/routes/airtable");
const formsRoutesHandler = require("./src/routes/form");
const webhooksRoutesHandler = require("./src/routes/webhooks");
const registerRoutesHandler = require("./src/routes/registerWebhook");

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

app.use("/auth", authRoutesHandler);
app.use("/airtable", airtableRoutesHandler);
app.use("/forms", formsRoutesHandler);
app.use("/webhooks", webhooksRoutesHandler);
app.use("/webhook-setup", registerRoutesHandler);

app.get("/", (req, res) => {
  res.send("Airtable Forms Backend");
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Mongo connected");
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

start();
