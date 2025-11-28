const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const crypto = require("crypto");
const {
  AIRTABLE_CLIENT_ID,
  AIRTABLE_CLIENT_SECRET,
  AIRTABLE_REDIRECT_URI,
  FRONTEND_URL,
} = require("../config");
const createAirtableClient = require("../utils/airtableClient");

const router = express.Router();

const base64URLEncode = (str) => {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const generateCodeVerifier = () => {
  return base64URLEncode(crypto.randomBytes(32));
};

const generateCodeChallenge = (verifier) => {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
};

router.get("/airtable/login", (req, res) => {
  const state = crypto.randomUUID();

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax" });
  res.cookie("code_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    client_id: AIRTABLE_CLIENT_ID,
    redirect_uri: AIRTABLE_REDIRECT_URI,
    response_type: "code",
    scope:
      "data.records:read data.records:write schema.bases:read webhook:manage",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://airtable.com/oauth2/v1/authorize?${params.toString()}`);
});

router.get("/airtable/login-status", (req, res) => {
  if (req.cookies?.userId) {
    return res.json({ loggedIn: true });
  }
  res.json({ loggedIn: false });
});

router.post("/airtable/logout", (req, res) => {
  res.clearCookie("userId");
  res.clearCookie("oauth_state");
  res.clearCookie("code_verifier");

  if (req.session) {
    req.session.destroy(() => {});
  }

  return res.json({ success: true, message: "Logged out" });
});

router.get("/airtable/callback", async (req, res) => {
  const { code, state } = req.query;
  const codeVerifier = req.cookies?.code_verifier;

  if (!code) return res.status(400).send("Code is missing");

  if (!codeVerifier) return res.status(400).send("Code Verifier is Missing");

  try {
    const credentials = Buffer.from(
      `${AIRTABLE_CLIENT_ID}:${AIRTABLE_CLIENT_SECRET}`
    ).toString("base64");

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: AIRTABLE_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const tokenRes = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const client = createAirtableClient(access_token);
    const whoami = await client.whoAmI();

    const expireAt = new Date(Date.now() + expires_in * 1000);

    let user = await User.findOne({ airtableUserId: whoami.id });
    if (!user) {
      user = new User({
        airtableUserId: whoami.id,
        email: whoami.email,
        name: whoami.name,
        avatarUrl: whoami.picture || null,
        airtableTokens: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expireAt,
        },
        lastLoginAt: new Date(),
      });
    } else {
      user.airtableTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expireAt,
      };
      user.lastLoginAt = new Date();
    }

    await user.save();

    res.cookie("userId", user._id.toString(), {
      httpOnly: false,
      sameSite: "lax",
    });

    res.redirect(FRONTEND_URL);
  } catch (error) {
    res
      .status(500)
      .send(
        "OAuth error: " +
          (error.response?.data?.error_description || error.message)
      );
  }
});

module.exports = router;
