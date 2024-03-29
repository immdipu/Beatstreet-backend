# Beatstreet Backend

This is the backend for the Beatstreet project. It is a RESTful API built with Node.js, Express, and MongoDB. It is used to manage users, their favorite music, their playlists. It also sends emails to users when they create an account, reset their password.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed the latest version of Node.js and npm.
- You have a Windows machine.

## Installing Project

To install the project, follow these steps:

```
npm install
```

## Using Project

To use the project, follow these steps:

Before runnning add the following environment variables to your .env file:
NODE_ENV=development  
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=<jwt_expiration_in_days>d
JWT_COOKIE_EXPIRES_IN=<jwt_cookie_expiration_in_days>
DB=<your_mongodb_connection_string>
GMAIL=<your_gmail_address>
GMAIL_PWD=<your_gmail_password>
PORT=3000

```
npm run dev
```

## Contributing to Project

To contribute to Project, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.
