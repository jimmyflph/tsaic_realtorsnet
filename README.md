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



## Realty Theme 

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - AI Realty</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand" href="/">AI Realty</a>
    </div>
  </nav>

  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-dark text-white">
            <h3 class="mb-0">Login</h3>
          </div>
          <div class="card-body">
            <div id="errorMsg" class="alert alert-danger d-none" role="alert"></div>

            <form id="loginForm">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input type="text" class="form-control" id="username" required>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" required>
              </div>

              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>

            <hr>

            <div class="alert alert-info" role="alert">
              <strong>Demo Credentials:</strong><br>
              <strong>Buyer:</strong> user1 / pass123<br>
              <strong>Realtor:</strong> user2 / pass123
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/app.js"></script>
</body>
</html>
