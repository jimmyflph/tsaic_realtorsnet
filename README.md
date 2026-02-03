# AI Realty App

A simple real estate chatbot application with separate interfaces for clients and realtors.

## Features

- **Landing Page**: Public chat interface for non-authenticated users
- **Client Portal**: Home buyers can ask real estate questions
- **Realtor Dashboard**: View prospect home buyers in a table
- **JWT Authentication**: Sessionless token-based auth
- **Chat Interface**: ChatGPT-like interface (currently returns "Server error")

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS, Bootstrap 5
- **Backend**: Plain Node.js (no frameworks)
- **Auth**: JWT tokens (no sessions)
- **Database**: PostgreSQL (credentials to be configured)

## Project Structure

```
├── server.js           # Main HTTP server
├── auth.js             # JWT authentication logic
├── db.js               # Database connections (mock data for now)
├── public/
│   ├── index.html      # Landing page with chat
│   ├── login.html      # Login page
│   ├── client-home.html # Client dashboard with chat
│   ├── realtor-home.html # Realtor dashboard with prospects table
│   ├── app.js          # Client-side JavaScript
│   └── styles.css      # Custom styles
```

## Running the App

1. Start the server:
```bash
npm start
```

2. Open browser to `http://localhost:3000`

## Demo Credentials

- **Buyer**: `user1` / `pass123`
- **Realtor**: `user2` / `pass123`

## Notes

- Chat responses currently return "Server error" (waiting for API integration)
- Database uses mock data (PostgreSQL credentials needed for production)
- Prospects table is read-only for realtors
