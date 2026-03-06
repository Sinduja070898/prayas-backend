# Assessment Platform – Backend

Node.js + Express API for the Assessment Platform (MERN). The **frontend is a separate project/repo**. Set `FRONTEND_URL` in `.env` to your frontend origin for CORS.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and set:

   - `PORT` – server port (default 5001).
   - `JWT_SECRET` – secret for JWT signing (use a strong value in production).
   - `FRONTEND_URL` – frontend origin for CORS (e.g. `http://localhost:3000` or your deployed frontend URL).
   - `MONGODB_URI` – optional; unset uses in-memory store (data lost on restart).

3. **Run**

   ```bash
   npm start
   ```

   Or with auto-reload:

   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:5001` (or the port in `.env`).

4. **Port already in use (EADDRINUSE)**

   ```bash
   lsof -ti :5001 | xargs kill -9
   ```
   Or set a different `PORT` in `.env`.

## API schema & REST contracts

See **`API_SCHEMA.md`** in this folder. It defines:

- **User** – name, email (unique), password (hashed), role (candidate | admin), createdAt
- **Application** – userId, fullName, email, phone, homeState, assemblyConstituency (Punjab only), category, qualification, discipline, resumeUrl, **status** (6 states: Registered → Submitted → Shortlisted | Not_Shortlisted → Assessment_Pending → Assessment_Submitted), commitHours, hasLaptop, openToField, willingINC, punjabiProficiency, whyInterested (max 100 words), etc.
- **Question** – text, options [×4], correctIndex (0–3), createdBy (ref User admin), isActive
- **Assessment** – candidateId, applicationId, answers [{ questionId, selectedIndex }], score, totalQuestions, startedAt, submittedAt, autoSubmitted, attempted

REST endpoints (auth, applications, questions, assessments) and request/response shapes are described there for implementing the APIs.

## Models (Mongoose)

MongoDB models matching the schema above:

- `src/models/User.js`
- `src/models/Application.js`
- `src/models/Question.js`
- `src/models/Assessment.js`
- `src/models/index.js` – exports all models

Use these in your routes; connect MongoDB in `server.js` via `config/db.js` when ready.

## Structure

```
├── API_SCHEMA.md
├── src/
│   ├── server.js
│   ├── config/db.js
│   ├── models/
│   ├── middleware/auth.js
│   └── routes/
├── package.json
├── env.example
└── README.md
```
