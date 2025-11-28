const mongoose = require("mongoose");

const AirtableTokenSchema = new mongoose.Schema({
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
  },
});

const UserSchema = new mongoose.Schema(
  {
    airtableUserId: {
      type: String,
      required: true,
      unique: true,
    },
    email: String,
    name: String,
    avatarURL: String,
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },

    airtableTokens: AirtableTokenSchema,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
