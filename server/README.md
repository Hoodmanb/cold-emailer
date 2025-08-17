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
| POST   | `/recipient`             | Create a recipient              |  # recipient
| GET    | `/recipient`             | Get all recipients              |
| GET    | `/recipient/:email`      | Get single recipient by email   |
| PATCH  | `/recipient/:email`      | Update recipient                |
| DELETE | `/recipient/:email`      | Delete recipient                |
| POST   | `/category`              | Create a category               |  # category
| GET    | `/category`              | Get all categories              |
| GET    | `/category/:id`          | Get single category             |
| PATCH  | `/category/:id`          | Update category                 |
| DELETE | `/category/:id`          | Delete category                 |
| POST   | `/email/send`            | Send single email               |  # email
| POST   | `/email/send/bulk`       | Send email to bulk recipients   |
| POST   | `/user`                  | Get single user                 |  # user
| PATCH  | `/user`                  | Update user                     |
| POST   | `/template`              | Create a template               |  # template
| GET    | `/template`              | Get all template                |
| GET    | `/template/:id`          | Get single template by id       |
| PATCH  | `/template/:id`          | Update template                 |
| DELETE | `/template/:id`          | Delete template                 |
| POST   | `/attachment`            | Create a attachment             |  # attachments
| GET    | `/attachment`            | Get all attachments             |
| GET    | `/attachment/:id`        | Get single attachment           |
| PATCH  | `/attachment/:id`        | Update attachment               |
| DELETE | `/attachment/:id`        | Delete attachment               |
| POST   | `/schedule`              | Create a schedule               |  # schedule
| POST   |`/schedule/:id/recipients`| Add a recipient to a schedule   |
| GET    | `/schedule`              | Get all schedules               |
| PATCH  | `/schedule/:id`          | Update schedule                 |
| DELETE | `/schedule/:id`          | Delete schedule                 |
| GET    | `/schedule/run`          | Webhook to run schedule         |
| GET    | `/api/ping`              | Used to keep server alive       |  ## called by cron job to stop render server from sleeping

---

## 📑 Standard Response Format

All responses follow this structure:

```json
{
  "message": "string",
  "data": {},
  "errors": {}
}
```

* `message`: A short description of the response
* `data`: The response payload (if successful)
* `errors`: Validation or conflict errors

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

| Field      | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| `name`     | String | ✅ Yes    | Full name of the recipient |
| `email`    | String | ✅ Yes    | Recipient email address    |
| `category` | String | ✅ Yes    | Category ID (MongoDB \_id) |

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

**Success (201):**

```json
{
  "message": "Recipient created successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a234567",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "category": "64fdd7c213abc90812345"
  }
}
```

**Error (400 - Validation):**

```json
{
  "message": "validation error",
  "errors": [
    { "field": "email", "message": "invalid email format" }
  ]
}
```

**Error (409 - Conflict):**

```json
{
  "message": "field error",
  "errors": {
    "email": "email already exists"
  }
}
```

---

### 🔢 Status Codes

* `201 Created` → Recipient successfully created
* `400 Bad Request` → Validation error
* `404 Not Found` → Category not found
* `409 Conflict` → Duplicate email or name
* `500 Internal Server Error` → Something went wrong

---

## 📑 Other Recipient Routes

### 📋 Get All Recipients

```http
GET /api/recipient
```

**Success (200):**

```json
{
  "message": "Recipients fetched successfully",
  "data": [
    {
      "_id": "6501a1a9b3cfa5ff1a234567",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "category": "64fdd7c213abc90812345"
    }
  ]
}
```

---

### 👤 Get Single Recipient

```http
GET /api/recipient/:id
```

**Success (200):**

```json
{
  "message": "Recipient fetched successfully",
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
PUT /api/recipient/:id
```

**Body:**

```json
{
  "name": "Jane Doe"
}
```

**Success (200):**

```json
{
  "message": "Recipient updated successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a234567",
    "name": "Jane Doe",
    "email": "johndoe@example.com",
    "category": "64fdd7c213abc90812345"
  }
}
```

---

### ❌ Delete Recipient

```http
DELETE /api/recipient/:id
```

**Success (200):**

```json
{
  "message": "Recipient deleted successfully"
}
```

---

## 🗂 Category Routes (Template)

### ➕ Create Category

```http
POST /api/category
```

**Body:**

```json
{
  "name": "Tech Startups"
}
```

**Success (201):**

```json
{
  "message": "Category created successfully",
  "data": {
    "_id": "6501a1a9b3cfa5ff1a987654",
    "name": "Tech Startups"
  }
}
```

*(Follow the same pattern as recipients for Get, Update, Delete.)*

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
