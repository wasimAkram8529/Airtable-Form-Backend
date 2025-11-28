const mongoose = require("mongoose");

const ResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    airtableRecordId: {
      type: String,
    },
    answers: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "updated", "deletedInAirtable"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
  }
);

const Response = mongoose.model("Response", ResponseSchema);

module.exports = Response;
