# Airtable Form Builder

A full stack application that allows user to authenticate it self and create customize forms based on Airtable table fields, apply conditional logic, collect responses, export results, and sync Airtable with MongoDB database using webhook.

## Features

- Airtable OAuth login
- Fetch bases, tables and fields
- Form Builder UI with supported field types:
  - Short text
  - Long text
  - Single select
  - Multi-select
  - Attachments
- Conditional visibility rules with AND/OR logic
- Live preview & form rendering
- Save responses to Airtable + MongoDB
- Export responses as CSV and JSON
- Airtable -> App sync using Webhooks
- Logout and session handling

## Tech Stack

- Frontend -> React(Vite)
- Backend -> Node.js + Express
- Database -> MongoDB
- Authentication -> Airtable oAuth
- Synchronization -> Webhook (Airtable -> MongoDB)

## Project Structure

- backend
  - src
    - middleware
      - auth.js
    - models
      - Form.js
      - Response.js
      - User.js
    - routes
      - airtable.js
      - auth.js
      - form.js
      - registerWebhook.js
      - webhooks.js
    - utils
      - airtableClient.js
      - conditionalLogic.js
    - config.js
    - index.js
  - package.json
  - package-lock.json
  - README.md

## Clone Repository

```sh
git clone https://github.com/wasimAkram8529/Ansible-Form-Backend.git
```

## Backend Setup

```sh
cd Ansible-Form-Backend
npm install
```

## Create .env

```env
PORT=5000
MONGO_URI=mongodb+srv://<Username>:<Password>@learningsetup.lqlw9y7.mongodb.net/<Database name>?retryWrites=true&w=majority&appName=learningSetup

AIRTABLE_CLIENT_ID=<your_client_id>
AIRTABLE_CLIENT_SECRET=<your_client_secret>
AIRTABLE_REDIRECT_URI=http://localhost:5000/auth/airtable/callback
FRONTEND_URL=http://localhost:3000

```

## Airtable OAuth Setup

- Visit -> https://airtable.com/developers
- Go to your profile -> Account -> Got to developer hub
- Developers -> OAuth integrations
- create
- Copy client id and paste it to .env of backend
- click on generate secret -> copy secret to .env of backend
- Add redirect URL, It must be same as redirect URL of .env of backend

```sh
Redirect URL: http://localhost:5000/auth/airtable/callback
```

- Enable scopes

  - data.records:read
  - data.records:write
  - schema.bases:read
  - webhook:manage

- Save change

## Data Model

- User Document

```json
{
  "_id": "",
  "airtableUserId": "",
  "name": "",
  "email": "",
  "avatar": "",
  "lastLoginAt": Date
  "airtableTokens": {
    "accessToken": "",
    "refreshToken": "",
    "expireAt": ""
  }
}
```

- Form Document

```json
{
  {
  "_id": "",
  "owner": "User Id",
  "airtableBaseId": "",
  "airtableTableId": "",
  "title": "",
  "description": "",
  "questions": [
    {
      "questionKey": "",
      "airtableFieldId": "",
      "label": "",
      "type": "",
      "required": true,
      "options": [string],
      "conditionalRules": {
        "logic": "",
        "conditions":{
          "questionKey": "",
          "operator": "",
          "value": "Mixed Value"
        }
      }
    }
  ]
},
{
  "timestamps": true
}
}
```

- Response Document

```json
{ {
    "formId": "Form Id",
    "airtableRecordId": "",
    "answers": {},
    "status": ""
  },
  {
    "timestamps": true
  }
}
```

## Condition Logic

- Each question can include

```ts
interface ConditionalRules {
  logic: "AND" | "OR";
  conditions: {
    questionKey: string;
    operator: "equals" | "notEquals" | "contains";
    value: any;
  }[];
}
```

## How to Run

```sh
npm start
```
