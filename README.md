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





## Theme - White Realty Market


<html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Silica Estates | AI-Driven Property Discovery</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f4f4f4;
            --accent: #111111;
            --glass-border: rgba(0, 0, 0, 0.06);
            --silica-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
            --stratified-layer: rgba(255, 255, 255, 0.85);
            --mono-font: 'JetBrains Mono', monospace;
            --sans-font: 'Inter', sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
        }

        body {
            background-color: var(--bg-primary);
            font-family: var(--sans-font);
            color: var(--accent);
            overflow-x: hidden;
        }

        /* Frosted Silica Utility */
        .silica-frost {
            background: var(--stratified-layer);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid var(--glass-border);
            border-radius: 2px;
        }

        /* Navigation */
        nav {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 4rem;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid var(--glass-border);
        }

        .logo {
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -1px;
            font-size: 1.2rem;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--accent);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 500;
        }

        /* Hero Section - Frosted Stratification */
        .hero {
            height: 90vh;
            margin-top: 70px;
            padding: 1.5rem;
            display: flex;
            gap: 1.5rem;
            background-color: #fcfcfc;
        }

        /* 3/4 Insightful AI Chat */
        .ai-chat-container {
            flex: 3;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: var(--silica-shadow);
        }

        .hero-image-underlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: grayscale(100%) brightness(1.1);
            z-index: 1;
        }

        .chat-interface {
            position: relative;
            z-index: 2;
            height: 100%;
            padding: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%);
            border: 1px solid rgba(255,255,255,0.8);
        }

        .chat-tag {
            font-family: var(--mono-font);
            font-size: 0.7rem;
            text-transform: uppercase;
            background: var(--accent);
            color: white;
            padding: 4px 8px;
            width: fit-content;
            margin-bottom: 1rem;
        }

        .chat-heading {
            font-size: 4.5rem;
            font-weight: 800;
            line-height: 0.9;
            margin-bottom: 2rem;
            letter-spacing: -3px;
        }

        .chat-bubble {
            max-width: 500px;
            padding: 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid var(--accent);
            font-size: 1.2rem;
            color: #444;
            line-height: 1.4;
        }

        .chat-input-wrapper {
            width: 100%;
            display: flex;
            gap: 1rem;
            align-items: center;
            background: white;
            padding: 1.5rem;
            border: 1px solid var(--glass-border);
            box-shadow: 0 20px 40px rgba(0,0,0,0.03);
            transition: transform 0.3s ease;
        }

        .chat-input-wrapper:focus-within {
            transform: translateY(-5px);
        }

        .chat-input-wrapper input {
            flex: 1;
            border: none;
            outline: none;
            font-family: var(--sans-font);
            font-size: 1rem;
        }

        .chat-input-wrapper button {
            background: var(--accent);
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            font-family: var(--mono-font);
            cursor: pointer;
            transition: background 0.3s;
        }

        .chat-input-wrapper button:hover {
            background: #333;
        }

        /* 1/4 Hero Sidebar */
        .hero-sidebar {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .sidebar-box {
            flex: 1;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .sidebar-box.dark {
            background: var(--accent);
            color: white;
        }

        .sidebar-box h3 {
            font-family: var(--mono-font);
            font-size: 0.8rem;
            margin-bottom: 1rem;
            opacity: 0.6;
        }

        .sidebar-box .stat {
            font-size: 3rem;
            font-weight: 800;
        }

        /* Realtors Section */
        .section-padding {
            padding: 8rem 4rem;
        }

        .realtors-container {
            display: flex;
            gap: 4rem;
            justify-content: center;
            overflow-x: auto;
            padding: 2rem 0;
        }

        .realtor-profile {
            text-align: center;
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            cursor: pointer;
        }

        .realtor-profile:hover {
            transform: translateY(-10px);
        }

        .avatar-frame {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            padding: 10px;
            border: 1px solid var(--glass-border);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #eee;
            object-fit: cover;
        }

        .realtor-name {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 0.25rem;
        }

        .realtor-role {
            font-family: var(--mono-font);
            font-size: 0.7rem;
            color: #888;
            text-transform: uppercase;
        }

        /* Services Section */
        .services {
            background: #f9f9f9;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            border-top: 1px solid var(--glass-border);
            border-bottom: 1px solid var(--glass-border);
        }

        .service-card {
            background: white;
            padding: 4rem 2rem;
            transition: background 0.3s;
        }

        .service-card:hover {
            background: #fafafa;
        }

        .service-icon {
            width: 40px;
            height: 40px;
            background: var(--accent);
            margin-bottom: 2rem;
        }

        .service-card h4 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            letter-spacing: -0.5px;
        }

        .service-card p {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.6;
        }

        /* Gallery Grid */
        .gallery-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 4rem;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-auto-rows: 250px;
            gap: 1.5rem;
        }

        .gallery-item {
            position: relative;
            background: #eee;
            overflow: hidden;
            border-radius: 2px;
        }

        .gallery-item.large { grid-column: span 8; grid-row: span 2; }
        .gallery-item.medium { grid-column: span 4; grid-row: span 2; }
        .gallery-item.small { grid-column: span 4; grid-row: span 1; }

        .gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .gallery-item:hover .gallery-img {
            transform: scale(1.05);
        }

        .gallery-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 2rem;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            color: white;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .gallery-item:hover .gallery-overlay {
            opacity: 1;
        }

        .gallery-overlay h5 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .gallery-overlay span {
            font-family: var(--mono-font);
            font-size: 0.8rem;
        }

        /* Stratification Animation */
        @keyframes reveal {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-reveal {
            animation: reveal 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        /* Mobile Responsive */
        @media (max-width: 1024px) {
            .hero { flex-direction: column; height: auto; }
            .ai-chat-container { height: 600px; }
            .services { grid-template-columns: repeat(2, 1fr); }
            .gallery-grid { grid-template-columns: repeat(4, 1fr); }
            .gallery-item.large { grid-column: span 4; }
        }
    </style>
</head>
<body>

    <nav>
        <div class="logo">SilicaStratum</div>
        <div class="nav-links">
            <a href="#">Portfolio</a>
            <a href="#">Analysis</a>
            <a href="#">Partners</a>
            <a href="#">Vault</a>
        </div>
    </nav>

    <section class="hero">
        <div class="ai-chat-container silica-frost">
            <img src="https://images.unsplash.com/photo-1600585154340-be6199f7e009?auto=format&amp;fit=crop&amp;q=80&amp;w=2000" class="hero-image-underlay" alt="Architecture">
            <div class="chat-interface">
                <div class="chat-tag">System: Insightful AI</div>
                <h1 class="chat-heading">Finding space<br>for your future.</h1>
                <div class="chat-bubble silica-frost animate-reveal">
                    "I've analyzed 4,000 off-market listings in the Chelsea district. Are you looking for high-ceiling industrial lofts or stratified modern glass penthouses?"
                </div>
                <div class="chat-input-wrapper animate-reveal" style="animation-delay: 0.2s;">
                    <input type="text" placeholder="Explain your dream property in natural language...">
                    <button>INITIATE SEARCH</button>
                </div>
            </div>
        </div>

        <div class="hero-sidebar">
            <div class="sidebar-box silica-frost animate-reveal" style="animation-delay: 0.4s;">
                <h3>MARKET VOLATILITY</h3>
                <div class="stat">-1.4%</div>
                <p style="font-size: 0.8rem; margin-top: 10px;">Quarterly correction in luxury sector.</p>
            </div>
            <div class="sidebar-box dark animate-reveal" style="animation-delay: 0.5s;">
                <h3>ACTIVE LISTINGS</h3>
                <div class="stat">842</div>
                <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.7;">Verified silica-grade properties.</p>
            </div>
            <div class="sidebar-box silica-frost animate-reveal" style="animation-delay: 0.6s;">
                <h3>AI PRECISION</h3>
                <div class="stat">99.8</div>
                <p style="font-size: 0.8rem; margin-top: 10px;">Preference matching accuracy.</p>
            </div>
        </div>
    </section>

    <section class="section-padding">
        <h2 style="text-align: center; font-size: 0.8rem; font-family: var(--mono-font); text-transform: uppercase; letter-spacing: 4px; margin-bottom: 4rem;">Elite Curators</h2>
        <div class="realtors-container">
            <div class="realtor-profile">
                <div class="avatar-frame"><img src="https://i.pravatar.cc/150?u=1" class="avatar" alt="Realtor"></div>
                <div class="realtor-name">Marcus Thorne</div>
                <div class="realtor-role">Principal Consultant</div>
            </div>
            <div class="realtor-profile">
                <div class="avatar-frame"><img src="https://i.pravatar.cc/150?u=2" class="avatar" alt="Realtor"></div>
                <div class="realtor-name">Elena Glass</div>
                <div class="realtor-role">Acquisition Lead</div>
            </div>
            <div class="realtor-profile">
                <div class="avatar-frame"><img src="https://i.pravatar.cc/150?u=3" class="avatar" alt="Realtor"></div>
                <div class="realtor-name">Julian Vane</div>
                <div class="realtor-role">Stratum Analyst</div>
            </div>
            <div class="realtor-profile">
                <div class="avatar-frame"><img src="https://i.pravatar.cc/150?u=4" class="avatar" alt="Realtor"></div>
                <div class="realtor-name">Sasha Kross</div>
                <div class="realtor-role">Luxury Specialist</div>
            </div>
            <div class="realtor-profile">
                <div class="avatar-frame"><img src="https://i.pravatar.cc/150?u=5" class="avatar" alt="Realtor"></div>
                <div class="realtor-name">Arthur Pen</div>
                <div class="realtor-role">Portfolio Architect</div>
            </div>
        </div>
    </section>

    <section class="services">
        <div class="service-card">
            <div class="service-icon"></div>
            <h4>Predictive Yield</h4>
            <p>Our AI models forecast property value stratification over 10-year cycles with 94% historical accuracy.</p>
        </div>
        <div class="service-card">
            <div class="service-icon"></div>
            <h4>Silent Market</h4>
            <p>Access the silica-layer: high-value properties that never reach public MLS databases.</p>
        </div>
        <div class="service-card">
            <div class="service-icon"></div>
            <h4>Legal Synthesis</h4>
            <p>Automated contract auditing and multi-jurisdictional compliance checks in seconds.</p>
        </div>
        <div class="service-card">
            <div class="service-icon"></div>
            <h4>Design Curation</h4>
            <p>Virtual architectural modification previews using generative diffusion models.</p>
        </div>
    </section>

    <section class="section-padding">
        <div class="gallery-header">
            <div>
                <h2 style="font-size: 3rem; font-weight: 800; letter-spacing: -2px;">Curated Portfolio</h2>
                <p style="font-family: var(--mono-font); font-size: 0.8rem; color: #888; margin-top: 10px;">BATCH 04 // Q3 2024</p>
            </div>
            <div style="font-family: var(--mono-font); text-transform: uppercase; font-size: 0.7rem; border-bottom: 1px solid var(--accent); cursor: pointer; padding-bottom: 5px;">View Full Archive</div>
        </div>

        <div class="gallery-grid">
            <div class="gallery-item large animate-reveal">
                <img src="https://images.unsplash.com/photo-1600607687940-4e524cb35a36?auto=format&amp;fit=crop&amp;q=80&amp;w=1200" class="gallery-img" alt="Real Estate">
                <div class="gallery-overlay">
                    <h5>Monolith Pavilion</h5>
                    <span>$12,400,000 / Zurich</span>
                </div>
            </div>
            <div class="gallery-item medium animate-reveal" style="animation-delay: 0.1s;">
                <img src="https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&amp;fit=crop&amp;q=80&amp;w=800" class="gallery-img" alt="Real Estate">
                <div class="gallery-overlay">
                    <h5>Glass Atrium</h5>
                    <span>$8,200,000 / Tokyo</span>
                </div>
            </div>
            <div class="gallery-item small animate-reveal" style="animation-delay: 0.2s;">
                <img src="https://images.unsplash.com/photo-1600585154526-990dcea4db0d?auto=format&amp;fit=crop&amp;q=80&amp;w=800" class="gallery-img" alt="Real Estate">
                <div class="gallery-overlay">
                    <h5>Quartz Loft</h5>
                    <span>$3,500,000 / NYC</span>
                </div>
            </div>
            <div class="gallery-item small animate-reveal" style="animation-delay: 0.3s;">
                <img src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&amp;fit=crop&amp;q=80&amp;w=800" class="gallery-img" alt="Real Estate">
                <div class="gallery-overlay">
                    <h5>Ivory Villa</h5>
                    <span>$15,000,000 / Bali</span>
                </div>
            </div>
        </div>
    </section>

    <footer style="padding: 4rem; border-top: 1px solid var(--glass-border); text-align: center;">
        <div class="logo" style="margin-bottom: 2rem;">SilicaStratum</div>
        <div style="font-family: var(--mono-font); font-size: 0.7rem; opacity: 0.4;">
            © 2024 SILICA STRATUM REAL ESTATE. ALL ASSETS ARTIFICIALLY SYNTHESIZED.
        </div>
    </footer>

    <script>
        // Simple scroll reveal for the stratification effect
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-reveal');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.service-card, .realtor-profile, .gallery-item').forEach(el => {
            observer.observe(el);
        });
    </script>



Frosted Monolith Transparency


Anodized Structural Lattice

Cast Gypsum Volumetrics


Debossed Vellum Monolith

Archival Vellum Overlays


Polished Terrazzo Inlay

Bleached Architectural Topography

</body></html>
