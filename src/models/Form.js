const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema(
  {
    questionKey: {
      type: String,
      require: true,
    },
    operator: {
      type: String,
      enum: ["equals", "notEquals", "contains"],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const ConditionalRulesSchema = new mongoose.Schema(
  {
    logic: {
      type: String,
      enum: ["AND", "OR"],
      required: true,
    },
    conditions: [conditionSchema],
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    questionKey: {
      type: String,
      required: true,
    },
    airtableFieldId: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "shortText",
        "longText",
        "singleSelect",
        "multiSelect",
        "attachment",
      ],
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [String],
    conditionalRules: {
      type: ConditionalRulesSchema,
      default: null,
    },
  },
  { _id: false }
);

const FormSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    airtableBaseId: {
      type: String,
      required: true,
    },
    airtableTableId: {
      type: String,
      required: true,
    },
    title: String,
    description: String,
    questions: [QuestionSchema],
    webhookId: {
      type: String,
    },
    lastWebhookCursor: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Form = mongoose.model("Form", FormSchema);

module.exports = Form;
