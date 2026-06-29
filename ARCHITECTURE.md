# Majestic School Web Portal — Architecture & Integrity Standards

Welcome to the Majestic School Web Portal documentation. This document serves as a guide for the system architecture, file layout, dynamic script loading, and strict integrity practices to prevent code truncation or silent failures.

---

## 1. Directory Structure & File Layout

Below is the structured layout of the project, with front-end files positioned at the workspace root and back-end logic partitioned into specialized modules:

```
├── backend/
│   ├── config/
│   │   ├── db.js             # Dual-engine database driver (PostgreSQL & JSON fallback)
│   │   └── school_schedule.js # School timing structures & static configurations
│   ├── data/
│   │   └── database.json     # Local persistent JSON database for developer environment
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication and user role authorizers
│   │   └── upload.js         # Multer configurations for file uploads
│   ├── routes/
│   │   └── api.js            # Unified Express REST API routes & SSE endpoints
│   └── services/
│       └── email.js          # NodeMailer/Mailing helper service
│
├── js/                       # Centralized client-side javascript scripts
│   ├── load-scripts.js       # Dynamic centralized script loader & DOM partial injector
│   ├── error-handler.js      # Global error listeners & runtime integrity self-test
│   └── dashboard.js          # Core panel, session verification & sidebar controller
│
├── partials/                 # Reusable HTML snippets and shared layout views
│   └── reauth-modal.html     # Reusable 10-minute Sudo-mode password verification modal
│
├── admin-dashboard.html      # Main Super Admin central panel
├── admin-login.html          # Administrative portal login interface
├── index.html                # Main public landing page
├── admissions.html           # Online admissions application form
├── contact.html              # Contact us and inquiry submission form
├── server.js                 # Unified Express.js app startup & API proxy layer
└── ARCHITECTURE.md           # This architecture & integrity guide
```

---

## 2. Integrity Safeguards

To maintain stability and prevent previous truncation issues, all developers MUST strictly adhere to the following file-editing and validation policies.

### 2.1 File Truncation Prevention (Task 6)
Large files (such as `admin-dashboard.html`) are susceptible to network or editor truncation. Always verify the completeness of files:
1. **End-of-File Markers**: Every HTML file must end with a clean closing tag structure (`</html>`) as the absolute last line.
2. **HTML End Comments**: Use a standard `<!-- END OF FILE MARKER -->` comment immediately after `</html>` to visually guarantee file completeness.
3. **Automated Verification**: Run `tail -n 5 <file>` to verify that files end with `</html>`.
4. **Targeted Edits**: When editing large files, NEVER overwrite the entire file. Use precise surgical substitutions (e.g. replacing a single contiguous block of code) to preserve the rest of the structure.

### 2.2 Centralized Script Loading (Task 2)
HTML files MUST NOT directly import long chains of external scripts or define redundant inline logic.
All scripts must be routed through the dynamic script loader:
```html
<script src="/js/load-scripts.js" defer></script>
```
`load-scripts.js` reads the current page's path and dynamically injects the correct script dependencies, standard CSS links, and shared structural UI parts (like the re-authentication security modal).

### 2.3 Runtime DOM Integrity Checks (Task 4)
The front-end includes an active self-test inside `/js/error-handler.js`. Upon loading any page, it automatically scans for:
- Missing essential DOM wrapper blocks (like `#main-sidebar`, `.workspace-content`).
- Mismatched or truncated closing tags that would break parsing.
- Missing required dependencies or partial-injected styles.
If a critical error is detected, the handler halts Execution and displays an overlay fallback warning instead of failing silently.

---

## 3. Core Features & Administrative Security

### 3.1 Security Re-Authentication Modal (Task 3)
Accessing sensitive management tabs (`Audit Center`, `School Settings`, `Contact Inbox`) requires a 10-minute Sudo-mode re-authentication token.
- The **Reauth Security Modal** is dynamically fetched from `/partials/reauth-modal.html` and injected into the DOM by `load-scripts.js`.
- Upon successful password verification against `/api/auth/reauth`, the server returns a temporary Sudo Token.
- The client stores this token in session and appends it to subsequent request headers (`X-Reauth-Token`).

### 3.2 System Health Check Endpoint (Task 7)
A non-authenticated `GET /api/health` endpoint is available to monitor overall portal stability:
- **Database Status**: Runs a test query to confirm connection health.
- **SSE Status**: Confirms that Server-Sent Events subscription mechanisms are active.
- **Cache Status**: Tests reading and writing to the in-memory cache system.
- **AI Proxy Status**: Checks the availability of LLM provider integrations based on environment configurations.

<!-- END OF FILE MARKER -->
</html>
