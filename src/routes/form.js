const express = require("express");
const Form = require("../models/Form.js");
const Response = require("../models/Response.js");
const { authUser } = require("../middleware/auth.js");
const createAirtableClient = require("../utils/airtableClient.js");
const { shouldShowQuestion } = require("../utils/conditionalLogic.js");

const router = express.Router();

router.post("/", authUser, async (req, res) => {
  try {
    const { airtableBaseId, airtableTableId, title, description, questions } =
      req.body;

    const form = new Form({
      owner: req.user._id,
      airtableBaseId,
      airtableTableId,
      title,
      description,
      questions,
    });

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  const forms = await Form.find({}).sort({ createdAt: -1 });
  res.json(forms);
});

router.get("/:formId", async (req, res) => {
  const form = await Form.findById(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(form);
});

router.post("/:formId/responses", async (req, res) => {
  const form = await Form.findById(req.params.formId).populate("owner");
  if (!form) return res.status(404).json({ error: "Form not found" });

  const answers = req.body.answers || {};
  const visibleQuestions = form.questions.filter((question) =>
    shouldShowQuestion(question.conditionalRules, answers)
  );

  const errors = [];

  for (const question of visibleQuestions) {
    const value = answers[question.questionKey];

    if (
      question.required &&
      (value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0))
    ) {
      errors.push(`${question.label} is required`);
      continue;
    }

    if (question.type === "singleSelect" && value != null) {
      if (!question.options.includes(value))
        errors.push(`${question.label} has invalid value`);
    }

    if (question.type === "multiSelect" && value != null) {
      if (
        !Array.isArray(value) ||
        value.some((v) => !question.options.includes(v))
      ) {
        errors.push(`${question.label} has invalid choices`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const client = createAirtableClient(form.owner.airtableTokens.accessToken);

  const airtableFields = {};
  for (const question of form.questions) {
    const value = answers[question.questionKey];
    if (value === undefined) continue;
    airtableFields[question.airtableFieldId] = value;
  }

  const createdRecord = await client.createRecord(
    form.airtableBaseId,
    form.airtableTableId,
    airtableFields
  );

  const response = new Response({
    formId: form._id,
    airtableRecordId: createdRecord.id,
    answers,
  });

  await response.save();

  res.json({ success: true, response });
});

router.get("/:formId/responses", async (req, res) => {
  const responses = await Response.find({ formId: req.params.formId }).sort({
    createdAt: -1,
  });

  const updatedResponse = responses.map((response) => ({
    id: response._id,
    createdAt: response.createdAt,
    status: response.status,
    answers: response.answers,
  }));

  res.json(updatedResponse);
});

router.get("/:formId/responses/export", async (req, res) => {
  const { formId } = req.params;
  const { format } = req.query;

  const responses = await Response.find({ formId });

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="responses-${formId}.json"`
    );
    return res.send(
      JSON.stringify(
        responses.map((r) => r.answers),
        null,
        2
      )
    );
  }

  if (format === "csv") {
    const { Parser } = require("json2csv");
    const parser = new Parser();
    const csv = parser.parse(responses.map((r) => r.answers));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="responses-${formId}.csv"`
    );
    return res.send(csv);
  }

  res.status(400).send({ error: "Invalid format" });
});

module.exports = router;
