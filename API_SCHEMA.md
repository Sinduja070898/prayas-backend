# API Schema — REST APIs for Assessment Platform

MongoDB collections and REST endpoint contracts for building the backend.

---

## RESTful API Routes

All endpoints. Keep them clean and consistent.

### AUTH — `/api/auth`

| Method | Path      | Description           | Role   |
|--------|-----------|------------------------|--------|
| POST   | `/register` | Register new user   | Public |
| POST   | `/login`    | Login, return JWT   | Public |
| GET    | `/me`       | Get current user    | Auth   |

(Admin login: `POST /api/auth/login` with body `{ email, password, role: 'admin' }` — no separate admin register.)

### APPLICATIONS — `/api/applications`

| Method | Path        | Description                    | Role     |
|--------|-------------|--------------------------------|----------|
| POST   | `/`         | Submit application             | Candidate|
| GET    | `/me`       | My application + status       | Candidate|
| GET    | `/`         | All applications               | Admin    |
| GET    | `/:id`      | Single application             | Admin    |
| PUT    | `/:id/status` | Update status (shortlist/reject) | Admin |

### QUESTIONS — `/api/questions`

| Method | Path     | Description                     | Role     |
|--------|----------|---------------------------------|----------|
| POST   | `/`      | Create question                 | Admin    |
| GET    | `/`      | All questions **(no answers)**  | Candidate|
| GET    | `/admin` | All questions **(with answers)**| Admin    |
| PUT    | `/:id`   | Update question                 | Admin    |
| DELETE | `/:id`   | Delete question                 | Admin    |

**Security must-do:** The candidate `GET /api/questions` response must **strip `correctIndex`** from every question.

### ASSESSMENTS — `/api/assessments`

| Method | Path     | Description                      | Role     |
|--------|----------|----------------------------------|----------|
| POST   | `/start` | Start assessment (check eligibility) | Candidate|
| POST   | `/submit`| Submit answers + calc score     | Candidate|
| GET    | `/`      | All results + scores            | Admin    |
| GET    | `/export`| Download CSV                    | Admin    |
| GET    | `/me`    | My result (post submission)     | Candidate|

---

## 1. User

**Collection:** `users`

| Field       | Type     | Attributes   | Description                          |
|------------|----------|--------------|--------------------------------------|
| `_id`      | ObjectId | auto         | Unique identifier                    |
| `name`     | String   | required     | Full name                             |
| `email`    | String   | unique       | Email address                         |
| `password` | String   | hashed       | Password (bcrypt)                     |
| `role`     | String   | enum         | `'candidate'` \| `'admin'`           |
| `createdAt`| Date     | default: now | Creation timestamp                    |

### REST: Auth (candidate)

- **POST /api/auth/register**  
  Body: `{ name, email, password }`  
  Response: `{ token, user: { _id, name, email, role: 'candidate' } }`

- **POST /api/auth/login**  
  Body: `{ email, password }`  
  Query: `?role=candidate` (optional)  
  Response: `{ token, user: { _id, name, email, role } }`

- **GET /api/auth/me**  
  Headers: `Authorization: Bearer <token>`  
  Response: `{ user: { _id, name, email, role } }` (Auth = any authenticated user)

### REST: Auth (admin)

- **POST /api/auth/login** with body `{ email, password, role: 'admin' }`  
  Response: `{ token, user: { _id, name, email, role: 'admin' } }`  
  (No admin registration; admins created outside app.)

---

## 2. Application

**Collection:** `applications`

| Field                  | Type     | Attributes        | Description                              |
|------------------------|----------|-------------------|------------------------------------------|
| `userId`               | ObjectId | ref: User         | Applicant (candidate)                    |
| `fullName`             | String   |                   | Applicant full name                      |
| `email`                | String   |                   | Applicant email                          |
| `phone`                | String   |                   | Contact number                           |
| `homeState`            | String   |                   | Home state                               |
| `assemblyConstituency` | String   | (Punjab only)     | Assembly constituency if homeState Punjab|
| `currentState`         | String   |                   | Current state of residence               |
| `category`             | String   | enum              | General / OBC / SC / ST / Prefer not to say |
| `qualification`        | String   |                   | Highest educational qualification        |
| `discipline`           | String   |                   | Academic discipline / field of study     |
| `currentlyEnrolled`    | Boolean  |                   | If currently in college                  |
| `currentYear`         | String   |                   | Current year of study (if enrolled)      |
| `collegeName`         | String   |                   | College name (if enrolled)               |
| `resumeUrl`           | String   | (Cloudinary)      | Resume file URL                          |
| `status`              | String   | enum (6 states)   | See below                                |
| `commitHours`         | Boolean  |                   | Can commit 5 hrs/day                     |
| `hasLaptop`           | Boolean  |                   | Has laptop with video conferencing       |
| `openToField`         | Boolean  |                   | Open to on-field work                    |
| `willingINC`          | Boolean  |                   | Willing to work with INC                 |
| `punjabiProficiency`  | String   | enum              | Basic / Intermediate / Advance / Not proficient |
| `whyInterested`       | String   | max 100 words     | Interest statement                      |
| `submittedAt`         | Date     |                   | When application was submitted          |
| `createdAt`           | Date     | default: now      |                                          |
| `updatedAt`           | Date     |                   |                                          |

**Status enum (6 states):**  
`Registered` → `Submitted` → `Shortlisted` | `Not_Shortlisted` → `Assessment_Pending` → `Assessment_Submitted`

### REST: Applications (candidate)

- **GET /api/applications/me**  
  Headers: `Authorization: Bearer <token>`  
  Response: `Application` or 404

- **POST /api/applications**  
  Headers: `Authorization: Bearer <token>`  
  Body: application fields (fullName, email, phone, homeState, …)  
  Response: `Application` (status set to `Submitted`)

- **PATCH /api/applications/me**  
  Headers: `Authorization: Bearer <token>`  
  Body: partial application fields  
  Response: `Application`

### REST: Applications (admin)

- **GET /api/applications**  
  Headers: `Authorization: Bearer <token>` (admin)  
  Query: `?status=Submitted&search=...`  
  Response: `{ applications: Application[], total }`

- **GET /api/applications/:id**  
  Headers: `Authorization: Bearer <token>` (admin)  
  Response: `Application` (full detail)

- **PUT /api/applications/:id/status**  
  Headers: `Authorization: Bearer <token>` (admin)  
  Body: `{ status: 'Shortlisted' | 'Not_Shortlisted' | 'Assessment_Pending' | 'Assessment_Submitted' }`  
  Response: `Application`

---

## 3. Question

**Collection:** `questions`

| Field          | Type     | Attributes   | Description                    |
|----------------|----------|--------------|--------------------------------|
| `_id`          | ObjectId | auto         | Unique identifier              |
| `text`         | String   | required     | Question text                  |
| `options`      | [String] | length: 4    | Exactly 4 multiple-choice options |
| `correctIndex` | Number   | 0–3          | Index of correct option        |
| `createdBy`    | ObjectId | ref: User (admin) | Creator admin              |
| `isActive`     | Boolean  | default: true| Whether question is active     |
| `createdAt`    | Date     | default: now |                                |

### REST: Questions

- **GET /api/questions** (Candidate)  
  Headers: `Authorization: Bearer <token>` (candidate)  
  Response: `{ questions: { _id, text, options }[] }` — **must strip `correctIndex`** (security).

- **GET /api/questions/admin** (Admin)  
  Headers: `Authorization: Bearer <token>` (admin)  
  Response: `{ questions: Question[] }` (includes `correctIndex`).

- **POST /api/questions** (Admin)  
  Body: `{ text, options: [string×4], correctIndex: 0|1|2|3 }`  
  Response: `Question`

- **PUT /api/questions/:id** (Admin)  
  Body: `{ text?, options?, correctIndex?, isActive? }`  
  Response: `Question`

- **DELETE /api/questions/:id** (Admin)  
  Response: `204` or `{ deleted: true }`

---

## 4. Assessment

**Collection:** `assessments`

| Field            | Type     | Attributes     | Description                          |
|------------------|----------|----------------|--------------------------------------|
| `_id`            | ObjectId | auto           | Unique identifier                    |
| `candidateId`    | ObjectId | ref: User      | Candidate who took the assessment    |
| `applicationId`  | ObjectId | ref: Application | Linked application                |
| `answers`        | Array    |                | `[{ questionId: ObjectId, selectedIndex: 0-3 }]` |
| `score`          | Number   |                | Marks obtained                       |
| `totalQuestions` | Number   |                | Total questions in the assessment    |
| `startedAt`      | Date     |                | When candidate started               |
| `submittedAt`    | Date     |                | When submitted                       |
| `autoSubmitted`  | Boolean  | (timer?)       | True if submitted on timer expiry    |
| `attempted`      | Boolean  | default: false | Whether attempt was completed        |
| `createdAt`      | Date     | default: now   |                                      |

### REST: Assessments (candidate)

- **POST /api/assessments/start**  
  Headers: `Authorization: Bearer <token>` (candidate)  
  Description: Start assessment (check eligibility).  
  Response: `{ assessmentId?, questions: { _id, text, options }[], startedAt }` (no correctIndex).

- **POST /api/assessments/submit**  
  Headers: `Authorization: Bearer <token>` (candidate)  
  Body: `{ answers: [{ questionId, selectedIndex }], autoSubmitted?: boolean }`  
  Description: Submit answers + calc score.  
  Response: `{ score, totalQuestions, submittedAt }`

- **GET /api/assessments/me**  
  Headers: `Authorization: Bearer <token>` (candidate)  
  Description: My result (post submission).  
  Response: `Assessment` or 404

### REST: Assessments (admin)

- **GET /api/assessments**  
  Headers: `Authorization: Bearer <token>` (admin)  
  Description: All results + scores.  
  Response: `{ assessments: Assessment[] }` (with candidate name, score, total, submittedAt)

- **GET /api/assessments/export**  
  Headers: `Authorization: Bearer <token>` (admin)  
  Description: Download CSV.  
  Response: CSV file (`Content-Disposition: attachment`). Use json2csv on backend.

---

## Common

- **Auth header:** `Authorization: Bearer <jwt>` on protected routes.
- **JWT payload:** `{ userId: _id, email, role }`; validate role for admin-only routes.
- **Errors:** `{ error: string }` with appropriate HTTP status (400, 401, 403, 404, 500).
