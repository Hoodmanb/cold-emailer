Got you Joshua 😂 no more chopping it into bits — here’s the **entire README.md in one single content** with all the stuff joined properly:

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

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you’d like to change.

---

## 📜 License

[MIT](./LICENSE)

```

---

This is one clean `README.md` file, no chopping, just drop it in your repo 💯.  

Do you want me to also add a **“Send Email Route” example** (like `POST /api/email/send`) so it matches the “cold email” part of the app too?
```
