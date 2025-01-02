Cold Emailer App

Overview

The Cold Emailer App allows you to manage email recipients and categories for sending personalized cold emails. The app uses MongoDB to store the recipient's information (email address, name, and category) and categories that include content and category names.

The application allows you to:

Add, update, and delete recipients.

Add, update, and delete categories.

Schedule emails for multiple recipients or a single recipient.

Send a single email to one or more recipients.


Technologies Used

Backend: Node.js, Express

Database: MongoDB

Email Sending: NodeMailer or another email service provider (you can integrate with any email provider like SendGrid, SES, etc.)

Scheduling Emails: Using node-cron for scheduling email sends.


Features

Manage recipients (Add, Update, Delete).

Manage categories (Add, Update, Delete).

Send single emails to one or more recipients.

Schedule emails to be sent at a later time.

Email content can be linked to specific categories.

Each recipient can be associated with a category for better targeting.


API Routes

1. Recipients API

Create a New Recipient

Endpoint: POST /api/recipient/create

Request Body:


{
  "email": "example@example.com",
  "name": "Recipient Name",
  "category": "Marketing"
}

Response:


{
  "message": "Recipient created successfully",
  "recipient": {
    "email": "example@example.com",
    "name": "Recipient Name",
    "category": "Marketing"
  }
}

Fetch All Recipients

Endpoint: GET /api/recipients

Response:


{
  "recipients": [
    {
      "email": "example@example.com",
      "name": "Recipient Name",
      "category": "Marketing"
    }
  ]
}

Update Recipient by Email

Endpoint: PUT /api/recipients/update

Request Body:


{
  "email":"example.com"
  "name": "Updated Name",
  "category": "Updated Category"
}

Response:


{
  "message": "Recipient updated",
  "recipient": {
    "email": "example@example.com",
    "name": "Updated Name",
    "category": "Updated Category"
  }
}

Delete Recipient by Email

Endpoint: DELETE /api/recipients/delete

Request Body:


{
  "email":"example.com"
}


Response:


{
  "message": "Recipient deleted successfully"
}

2. Categories API

Create a New Category

Endpoint: POST /api/categories/create

Request Body:


{
  "category": "Marketing",
  "subject":"welcome"
  "content": "Welcome to our email campaign"
}

Response:


{
  "message": "Category created successfully",
  "category": {
    "category": "Marketing",
    "subject":"welcome"
    "content": "Welcome to our email campaign"
  }
}

Fetch All Categories

Endpoint: GET /api/categories

Response:


{
  "categories": [
    {
      "category": "Marketing",
      "content": "Welcome to our email campaign"
    }
  ]
}

Update Category

Endpoint: PUT /api/categories/update

Request Body:


{
  "content": "Updated email content"
}

Response:


{
  "message": "Category updated",
  "category": {
    "category": "Marketing",
    "content": "Updated email content"
  }
}

Delete Category

Endpoint: DELETE /api/categories/delete

Request Body:


{
  "id": "category._id"
}

Response:


{
  "message": "Category deleted successfully"
}

3. Email Sending API

Send Single Email

Endpoint: POST /api/email/send

Request Body:


{
  "to": "recipient@example.com",
  "subject": "Cold Email Subject",
  "content": "Hello, this is a cold email body"
}

Response:


{
  "message": "Email sent successfully"
}

Send Multiple Email

Endpoint: POST /api/email/sendMany

Request Body:


[{
  "to": "recipient@example.com",
  "subject": "Scheduled Email Subject",
  "content": "This is a scheduled email",
  "sendAt": "2024-01-01T10:00:00Z"
  },
  {
  "to": "recipient@example.com",
  "subject": "Scheduled Email Subject",
  "content": "This is a scheduled email",
  "sendAt": "2024-01-01T10:00:00Z"
}
]

Response:


{
  "message": "Emails sent successfully"
}

Schedule Email

Endpoint: POST /api/email/schedule-email

Request Body:


[{
  "to": "recipient@example.com",
  "subject": "Scheduled Email Subject",
  "content": "This is a scheduled email",
  "sendAt": "2024-01-01T10:00:00Z"
  },
  {
  "to": "recipient@example.com",
  "subject": "Scheduled Email Subject",
  "content": "This is a scheduled email",
  "sendAt": "2024-01-01T10:00:00Z"
}
]

Response:


{
  "message": "Email scheduled successfully"
}





---

How to Run Locally

1. Clone the repository:

git clone <repository-url>
cd <app-directory>


2. Install dependencies:

npm install


3. Set up MongoDB and configure the connection in the backend (e.g., via .env).


4. Run the app:

npm start




---

Conclusion

This Cold Emailer App is designed to streamline sending cold emails to recipients. By offering flexible API routes and a simple UI, you can manage recipients, categories, and emails effectively.

