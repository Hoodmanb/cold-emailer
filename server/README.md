````markdown
# 📧 Cold Email API

An Express.js REST API for managing recipients, categories, and sending cold emails.  
This documentation provides details on CRUD routes, request/response formats, and error handling.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/cold-email-api.git
cd server
````

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the root:

```env
Reference to .env.example
```

### 4. Run the server

```bash
npm run dev
```

Server runs on:

```
http://localhost:9000
```

---

## 📂 Project Structure

```

├── controllers         # Handle incoming requests, call services, return responses
├── lib                 # External libraries, configs, or helpers (DB connection, API clients, etc.)
├── middleware          # Express middlewares (auth, logging, validation, etc.)
├── models              # Database models (Mongoose schemas, ORM models, etc.)
├── routes              # Route definitions, maps endpoints to controllers
├── services            # Business logic, interacts with models (separation from controllers)
├── utils               # Utility/helper functions (formatters, constants, error handlers)
├── .env                # Environment variables (not committed to git)
├── .env.example        # Example env file with placeholders for setup
├── .gitignore          # Git ignored files and folders
├── server.js           # Main entry point for the Express app
├── worker.js           # Background jobs / queue workers
├── package.json        # Project metadata, dependencies, and scripts
└── README.md           # Project documentation

```

---

## 📡 API Documentation

### Base URL

```
http://localhost:9000/api
```

---

## 📑 API Overview (CRUD)

| Method | Endpoint                 | Description                     |
| ------ | ------------------------ | ------------------------------- |
| POST   | `/recipient`             | Create a recipient              |
| GET    | `/recipient`             | Get all recipients              |
| GET    | `/recipient/:email`      | Get single recipient by email   |
| PATCH  | `/recipient/:email`      | Update recipient                |
| DELETE | `/recipient/:email`      | Delete recipient                |
| POST   | `/category`              | Create a category               |
| GET    | `/category`              | Get all categories              |
| GET    | `/category/:id`          | Get single category             |
| PATCH  | `/category/:id`          | Update category                 |
| DELETE | `/category/:id`          | Delete category                 |
| POST   | `/email/send`            | Send single email               |
| POST   | `/email/send/bulk`       | Send email to bulk recipients   |
| POST   | `/user`                  | Get single user                 |
| PATCH  | `/user`                  | Update user                     |
| POST   | `/template`              | Create a template               |
| GET    | `/template`              | Get all template                |
| GET    | `/template/:id`          | Get single template by id       |
| PATCH  | `/template/:id`          | Update template                 |
| DELETE | `/template/:id`          | Delete template                 |
| POST   | `/attachment`            | Create a attachment             |
| GET    | `/attachment`            | Get all attachments             |
| GET    | `/attachment/:id`        | Get single attachment           |
| PATCH  | `/attachment/:id`        | Update attachment               |
| DELETE | `/attachment/:id`        | Delete attachment               |
| POST   | `/schedule`              | Create a schedule               |
| POST   |`/schedule/:id/recipients`| Add a recipient to a schedule   |
| GET    | `/schedule`              | Get all schedules               |
| PATCH  | `/schedule/:id`          | Update schedule                 |
| DELETE | `/schedule/:id`          | Delete schedule                 |
| GET    | `/schedule/run`          | Webhook to run schedule         |
| GET    | `/api/ping`              | Used to keep server alive       |

---

## 📑 Standard Response Format

All responses follow this structure:

```json
{
  "message": "string",
  "data": {},
  "errors": {},
  "error":"Error Object"
}
```

* `message`: A short description of the response
* `data`: The response payload (if successful)
* `errors`: Validation or conflict errors

Common response structure based on code 

**Not Found (404):**

```json
{
  "message": "not found"
}
```

**Server Error (500):**

```json
{
  "message": "Error deleting recipient",
  "error":"Error Object"
}
```

**Error (400 - Validation):**

```json
{
  "message": "validation error",
  "errors": [
    { "email": "invalid email format" },
    { "name": "name is required" },
    ...
  ]
}
```

**Error (409 - Conflict):**

```json
{
  "message": "field error",
  "errors": [
    { "email": "email already exist" },
    { "name": "name already exist" },
    ...
  ]
}
```
---

## 👤 Recipient Routes

### ➕ Create Recipient

**Endpoint:**

```http
POST /api/recipient
```

**Description:**
Creates a new recipient and assigns them to a category.

---

### 📥 Request

**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Body:**

| Field      | Type   | Required   | Description                |
| ---------- | ------ | ---------  | -------------------------- |
| `name`     | String |  Yes    | Name of the recipient      |
| `email`    | String |  Yes    | Recipient email address    |
| `category` | String |  No     | Category ID (MongoDB \_id) |

**Example:**

```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "category": "64fdd7c213abc90812345"
}
```

---

### 📤 Response

**Success (200):**

```json
{
  "message": "created successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a234567",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "category": "64fdd7c213abc90812345"
  }
}
```

## 📑 Other Recipient Routes

### 📋 Get All Recipients

```http
GET /api/recipient
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": [
    {
      "_id": "6501a1a9b3cfa5ff1a234567",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "category": "64fdd7c213abc90812345"
    }, {
      "_id": "6501a1a9b3cfa5ff1a234567",
      "name": "Jane Doe",
      "email": "janedoe@example.com",
      "category": "64fdd7c213abc90812345"
    },
    ...
  ]
}
```

---

### 👤 Get Single Recipient

```http
GET /api/recipient/:email
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a234567",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "category": "64fdd7c213abc90812345"
  }
}
```

---

### ✏️ Update Recipient

```http
PATCH /api/recipient/:email
```

**Body:**

```json
{
  "name": "Jane Doe",
  ...
}
```

**Success (200):**

```json
{
  "message": "recipient updated successfully"
}
```

---

### ❌ Delete Recipient

```http
DELETE /api/recipient/:email
```

**Success (204):**

```
"No response body"
```

---

## 🗂 Category Routes

### ➕ Create Category

```http
POST /api/category
```

**Body:**

```json
{
  "category": "Tech Startups"
}
```

**Success (201):**

```json
{
  "message": "category created successful",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a987654",
    "category": "Tech Startups"
  }
}
```

---

### 📋 Get All Category

```http
GET /api/category
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": [
    {
      "_id": "6501a1a9b3cfa5ff1a234567",
      "category": "Tech Startups",
    }, {
      "_id": "6501a1a9b3cfa5ff1a234567",
      "category": "SE",
    },
    ...
  ]
}
```

---

### 👤 Get Single Category

```http
GET /api/category/:id
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a234567",
    "category": "Backend",
  }
}
```

---

### ✏️ Update Category

```http
PATCH /api/category/:id
```

**Body:**

```json
{
  "category": "Jane Doe",
}
```

**Success (200):**

```json
{
  "message": "category updated successful"
}
```

---

### ❌ Delete Category

```http
DELETE /api/category/:id
```

**Success (204):**

```
"No response body"
```

---

## 🗂 Template Routes

### ➕ Create Template

```http
POST /api/template
```

**Body:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `name`     | String |  Yes       | Name of the template                 |
| `subject`  | String |  No        | Subject of the template              |
| `body`     | String |  Yes       | Body of the email                    |
| `isPublic` | Bool   |  No        | (private/public) Default to false    |

**Example:**

```json
{
  "name": "John Doe",
  "subject": "🔥 Test Email",
  "body": "Hello from Cold Email API! This is a test.",
  "isPublic": true
}
```

**Success (201):**

```json
{
  "message": "template created successfully",
}
```

---

### 📋 Get All Template

```http
GET /api/template
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": [
      {
        "userId":"6501a1a9b3cfa5ff1a234567",
        "_id": "6501a1a9b3cfa5ff1a234567",
        "name": "John Doe",
        "subject": "🔥 Test Email",
        "body": "Hello from Cold Email API! This is a test.",
        "isPublic": true
  }, {
        "userId":"6501a1a9b3cfa5ff1a234567",
        "_id": "6501a1a9b3cfa5ff1a234567",
        "name": "John Doe",
        "subject": "🔥 Test Email",
        "body": "Hello from Cold Email API! This is a test.",
        "isPublic": true
  },
    ...
  ]
}
```

---

### 👤 Get Single Template

```http
GET /api/template/:id
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": {
        "userId":"6501a1a9b3cfa5ff1a234567",
        "_id": "6501a1a9b3cfa5ff1a234567",
        "name": "John Doe",
        "subject": "🔥 Test Email",
        "body": "Hello from Cold Email API! This is a test.",
        "isPublic": true
  },
}
```

---

### ✏️ Update Template

```http
PATCH /api/template/:id
```

**Body:**

All fields are optional, only provided fields would be updated

**Example:**

```json
{
  "name": "John Doe",
  "subject": "🔥 Test Email",
  ...
}
```

**Success (200):**

```json
{
  "message": "Template updated successfully"
}
```

---

### ❌ Delete Template

```http
DELETE /api/template/:id
```

**Success (204):**

```
"No response body"
```

---

## 🗂 User Routes

### ➕ Attach a gmail password to a user account for sending email

```http
POST /api/user
``` 

**Body:**

| Field        | Type   | Required   | Description                          |
| -------------| ------ | ---------  | -----------------------------------  |
| `appPassword`| String |  Yes       | Password used to authorize gmail     |

**Example:**

```json
{
  "appPassword": "jgey iwyv bjts yetf",
}
```

**Success (200):**

```json
{
  "message": "user created successfully",
}
```

**Success (500):**

```json
{
  "message": "Error saving password",
}
```

---

### ➕ Modify gmail app password

```http
PATCH /api/user
```

**Body:**

| Field                | Type   | Required   | Description                          |
| -------------------- | ------ | ---------  | -----------------------------------  |
| `updatedAppPassword` | String |  Yes       | password to change to                |

**Example:**

```json
{
  "updatedAppPassword": "hndg hute uyrt yret",
}
```

**Success (200):**

```json
{
  "message": "password updated successfully",
}
```

**Success (500):**

```json
{
  "error": "Error object",
  "message": "error updating password",
}
```

## 🗂 Email Routes

### ➕ Send Single email

```http
POST /api/email
```

**Body:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `to`       | String |  Yes       | Email of the reciever                |
| `subject`  | String |  Yes       | Subject of the email                 |
| `body`     | String |  Yes       | Body of the email                    |

**OR:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `to`       | String |  Yes       | Email of the reciever                |
|`templateId`| String |  Yes       | The id of the saved template to use  |

**Example:**

```json
{
  "to": "johndoe@gmail.com",
  "subject": "🔥 Test Email",
  "body": "Hello from Cold Email API! This is a test.",
}
```

**OR:**

```json
{
  "to": "jodedoe@gmail.com",
  "templateId": "ffacd0b85a93c074879859",
}
```

**Success (200):**

```json
{
  "success": true,
  "message": "Emails processed",
  "results":"gmail response object {...}"
}
```

**Success (500):**

```json
{
  "success": false,
  "message": "Error sending message",
}
```

---

### ➕ Send Bulk email

```http
POST /api/email/bulk
```

**Body:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `emails`   |[String]|  Yes       | List of email to send to             |
| `subject`  | String |  Yes       | Subject of the email                 |
| `body`     | String |  Yes       | Body of the email                    |

**OR:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `emails`   |[String]|  Yes       | List of email to send to             |
|`templateId`| String |  Yes       | The id of the saved template to use  |

**Example:**

```json
{
  "emails": ["johndoe@gmail.com", "janedoe@gmail.com", "jodedoe@gmail.com"],
  "subject": "🔥 Test Email",
  "body": "Hello from Cold Email API! This is a test.",
}
```

**OR:**

```json
{
  "emails": ["johndoe@gmail.com", "janedoe@gmail.com", "jodedoe@gmail.com"],
  "templateId": "ffacd0b85a93c074879859",
}
```

**Success (200):**

```json
{
  "success": true,
  "message": "Emails processed",
  "results":[{
      "to": "joshuadebravo@mail.com",
      "success": true,
      "messageId": "<c431a5db-b5db-de53-f214-1b0853b04874@gmail.com>",
      "response": "250 2.0.0 OK  1755538957 ffacd0b85a97d-3c074879859sm355549f8f.3 - gsmtp"
  },{
      "to": "joshuadebravo@mail.com",
      "success": true,
      "messageId": "<c431a5db-b5db-de53-f214-1b0853b04874@gmail.com>",
      "response": "250 2.0.0 OK  1755538957 ffacd0b85a97d-3c074879859sm355549f8f.3 - gsmtp"
  },{
      "to": "joshuadebravo@mail.com",
      "success": true,
      "messageId": "<c431a5db-b5db-de53-f214-1b0853b04874@gmail.com>",
      "response": "250 2.0.0 OK  1755538957 ffacd0b85a97d-3c074879859sm355549f8f.3 - gsmtp"
  },
  ...
  ]
}
```

**Success (500):**

```json
{
  "success": false,
  "message": "Error sending message",
}
```

## 🗂 Schedule Routes

### ➕ Create Schedule

```http
POST /api/schedule
```

**Body:**

| Field          | Type     | Required   | Description                                                           |
| -------------- | -------- | ---------  | --------------------------------------------------------------------  |
| `name`         | String   |  Yes       | Name of the schedule                                                  |
| `frequency`    | String   |  Yes       | how frequently the schedule would run. (weekly, monthly)              |
| `hour`         | Number   |  Yes       | the hour of the day the schedule should run. (0 - 23), 0 = 00:00am    |
| `day`          | Number   |  Yes       | the day of the week the schedule should run. (1 - 7) 1 = sunday       |
| `recipients`   | [String] |  Yes       | an array of emails, that this schedule would be sent to               |
| `template`     | [Object] |  Yes       | email template that is sent on the first run, this is required        |
| `templateOne`  | [Object] |  No        | ...the second run, optional                                           |
| `templateTwo`  | [Object] |  No        | ...the third run, you can only pass this if templateOne is provided   |
| `templateThree`| [Object] |  No        | ...the fourth run, you can only pass this if templateTwo is provided  |

**OR**

| Field          | Type     | Required   | Description                                                           |
| -------------- | -------- | ---------  | --------------------------------------------------------------------  |
| `name`         | String   |  Yes       | Name of the schedule                                                  |
| `frequency`    | String   |  Yes       | how frequently the schedule would run. (weekly, monthly)              |
| `hour`         | Number   |  Yes       | the hour of the day the schedule should run. (0 - 23), 0 = 00:00am    |
| `day`          | Number   |  Yes       | the day of the week the schedule should run. (1 - 7) 1 = sunday       |
| `recipients`   | [String] |  Yes       | an array of recipients id, that this schedule would be sent to        |
| `template`     | String   |  Yes       | template id that is sent on the first run, this is required           |
| `templateOne`  | String   |  No        | ...the second run, optional                                           |
| `templateTwo`  | String   |  No        | ...the third run, you can only pass this if templateOne is provided   |
| `templateThree`| String   |  No        | ...the fourth run, you can only pass this if templateTwo is provided  |

**Example:**

```json
{
  "name": "Weekly Product Update",
  "frequency": "weekly",
  "hour": "10",
  "day": "2",
  "recipients": [
    "jane.doe@example.com",
    "john.smith@example.com",
    "team@company.com"
  ],
  "template": {
    "subject": "🚀 Our Weekly Product Update",
    "body": "<p>Hi there,</p><p>Here’s what’s new this week...</p>",
  },
  "templateOne": {
    "subject": "Reminder: Last Week’s Highlights",
    "body": "<p>Hey! In case you missed it...</p>"
  },
  "templateTwo": {
    "subject": "Checking In 👋",
    "body": "<p>Still haven’t heard from you, just making sure...</p>"
  },
  "templateThree": {
    "subject": "Final Reminder",
    "body": "<p>This will be our last email regarding this update.</p>"
  }
}

```

**OR**

```json
{
  "name": "Weekly Marketing Campaign",
  "frequency": "weekly",
  "hour": 9,
  "day": 2,
  "recipients": [
    "64f0c0a2b9d1c7f0e9a12345",
    "64f0c0a2b9d1c7f0e9a67890",
    "64f0c0a2b9d1c7f0e9a54321"
  ],
  "template": "750fbc9e6a2f44a1c1234567",
  "templateOne": "750fbc9e6a2f44a1c7654321",
  "templateTwo": "750fbc9e6a2f44a1c9876543",
  "templateThree": "750fbc9e6a2f44a1c4567890"
}

```

**Success (201):**

```json
{
  "message": "Schedule created",
  "schedule": {
  "_id": "66c1b7c0e36c4f1f8e3b1234",
  "name": "Weekly Newsletter",
  "userId": "64f0c0a2b9d1c7f0e9a12345",
  "frequency": "weekly",
  "sender": "marketing@company.com",
  "day": 2,
  "hour": 9,
  "recipients": [
    {
      "email": "john.doe@example.com",
      "statuses": {
        "scheduleOne": "sent",
        "scheduleTwo": "pending",
        "scheduleThree": "void",
        "scheduleFour": "void"
      },
      "disabled": false
    },
    {
      "email": "jane.smith@example.com",
      "statuses": {
        "scheduleOne": "failed",
        "scheduleTwo": "pending",
        "scheduleThree": "pending",
        "scheduleFour": "void"
      },
      "disabled": false
    }
  ],
  "disabled": false,
  "template": {
    "subject": "Welcome to our Newsletter 🎉",
    "body": "Hi there, thanks for subscribing! Here's your weekly digest.",
    "attachment": "https://files.company.com/welcome.pdf"
  },
  "templateOne": {
    "subject": "Follow-up: Did you see this?",
    "body": "Hey, just checking if you caught our last update.",
    "attachment": null
  },
  "templateTwo": {
    "subject": "Final Reminder ⚡",
    "body": "This is your last chance to check it out!",
    "attachment": null
  },
  "templateThree": {
    "subject": "Exclusive Offer Inside 🚀",
    "body": "Since you didn’t respond, here’s a special deal just for you.",
    "attachment": "https://files.company.com/offer.pdf"
  },
  "__v": 0
}
}

```

---

### 📋 Get All Schedule

```http
GET /api/schedule
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": [{
  "_id": "66c1b7c0e36c4f1f8e3b1234",
  "name": "Weekly Newsletter",
  "userId": "64f0c0a2b9d1c7f0e9a12345",
  "frequency": "weekly",
  "sender": "marketing@company.com",
  "day": 2,
  "hour": 9,
  "recipients": [
    {
      "email": "john.doe@example.com",
      "statuses": {
        "scheduleOne": "sent",
        "scheduleTwo": "pending",
        "scheduleThree": "void",
        "scheduleFour": "void"
      },
      "disabled": false
    },
    {
      "email": "jane.smith@example.com",
      "statuses": {
        "scheduleOne": "failed",
        "scheduleTwo": "pending",
        "scheduleThree": "pending",
        "scheduleFour": "void"
      },
      "disabled": false
    }
  ],
  "disabled": false,
  "template": {
    "subject": "Welcome to our Newsletter 🎉",
    "body": "Hi there, thanks for subscribing! Here's your weekly digest.",
    "attachment": "https://files.company.com/welcome.pdf"
  },
  "templateOne": {
    "subject": "Follow-up: Did you see this?",
    "body": "Hey, just checking if you caught our last update.",
    "attachment": null
  },
  "templateTwo": {
    "subject": "Final Reminder ⚡",
    "body": "This is your last chance to check it out!",
    "attachment": null
  },
  "templateThree": {
    "subject": "Exclusive Offer Inside 🚀",
    "body": "Since you didn’t respond, here’s a special deal just for you.",
    "attachment": "https://files.company.com/offer.pdf"
  },
  "__v": 0
}
  ...
  ]
}
```

---

### 👤 Get Single Schedule

```http
GET /api/schedule/:id
```

**Success (200):**

```json
{
  "message": "retrieved successfully",
  "data": {
  "_id": "66c1b7c0e36c4f1f8e3b1234",
  "name": "Weekly Newsletter",
  "userId": "64f0c0a2b9d1c7f0e9a12345",
  "frequency": "weekly",
  "sender": "marketing@company.com",
  "day": 2,
  "hour": 9,
  "recipients": [
    {
      "email": "john.doe@example.com",
      "statuses": {
        "scheduleOne": "sent",
        "scheduleTwo": "pending",
        "scheduleThree": "void",
        "scheduleFour": "void"
      },
      "disabled": false
    },
    {
      "email": "jane.smith@example.com",
      "statuses": {
        "scheduleOne": "failed",
        "scheduleTwo": "pending",
        "scheduleThree": "pending",
        "scheduleFour": "void"
      },
      "disabled": false
    }
  ],
  "disabled": false,
  "template": {
    "subject": "Welcome to our Newsletter 🎉",
    "body": "Hi there, thanks for subscribing! Here's your weekly digest.",
    "attachment": "https://files.company.com/welcome.pdf"
  },
  "templateOne": {
    "subject": "Follow-up: Did you see this?",
    "body": "Hey, just checking if you caught our last update.",
    "attachment": null
  },
  "templateTwo": {
    "subject": "Final Reminder ⚡",
    "body": "This is your last chance to check it out!",
    "attachment": null
  },
  "templateThree": {
    "subject": "Exclusive Offer Inside 🚀",
    "body": "Since you didn’t respond, here’s a special deal just for you.",
    "attachment": "https://files.company.com/offer.pdf"
  },
  "__v": 0
},
}
```

---

### ✏️ Update Schedule

```http
PATCH /api/schedule/:id
```

**Body:**

All fields are optional, only provided fields would be updated

**Example:**

```json
{
  "name": "Weekly Newsletter",
  "frequency": "weekly",
  "day": 2,
  "hour": 9,
  "recipients": [
    {
      "email": "john.doe@example.com",
      "disabled": true
    },
    {
      "email": "jane.smith@example.com",
      "disabled": true
    }
  ],
  "disabled": true,
  "template": {
    "subject": "Welcome to our Newsletter 🎉",
    "body": "Hi there, thanks for subscribing! Here's your weekly digest.",
    "attachment": "https://files.company.com/welcome.pdf"
  },
  "templateOne": {
    "subject": "Follow-up: Did you see this?",
    "body": "Hey, just checking if you caught our last update.",
    "attachment": null
  },
  "templateTwo": {
    "subject": "Final Reminder ⚡",
    "body": "This is your last chance to check it out!",
    "attachment": null
  },
  "templateThree": {
    "subject": "Exclusive Offer Inside 🚀",
    "body": "Since you didn’t respond, here’s a special deal just for you.",
    "attachment": "https://files.company.com/offer.pdf"
  },
  "__v": 0
},

```

**Success (200):**

```json
{
  "message": "updated successfully",
  "data":"schedule object"
}
```

---

### ❌ Delete Schedule

```http
DELETE /api/template/:id
```

**Success (204):**

```
"No response body"
```

---

### ➕ Add Recipient to a schedule

```http
POST /api/schedule/:id/recipients
```

**Body:**

| Field      | Type   | Required   | Description                          |
| ---------- | ------ | ---------  | -----------------------------------  |
| `email`    | String |  Yes       | email of the recipient to add        |

**Example:**

```json
{
  "email": "johndoe@gmail.com",
}
```

**Success (201):**

```json
{
  "message": "Recipient added successfully",
}
```

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you’d like to change.

---

## 📜 License

[MIT](./LICENSE)

```

---