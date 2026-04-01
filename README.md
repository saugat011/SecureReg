# SecureReg - CET324 Advanced Cyber Security

**Secure • Evaluated • Human-Verified**

A highly secure user registration and authentication prototype built for the **CET324 Advanced Cyber Security** assignment. This system demonstrates secure system design principles by implementing algorithmic password strength evaluation, human verification (Cloudflare Turnstile Captcha), Two-Factor Authentication (2FA) via email, rate limiting, and advanced password policies (prevention of reuse, 90-day expiry, and context-aware complexity checks).

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Security:** Bcryptjs (Hashing), JSON Web Tokens (JWT), Helmet, Express Rate Limit
- **Mail:** Nodemailer (For OTP/2FA delivery)

---

## 🔐 Key Security Features
*   **Algorithmic Password Strength:** Real-time feedback preventing weak/common passwords and checking against user context (e.g., username inclusion).
*   **Human Verification:** Cloudflare Turnstile blocks automated bot registrations.
*   **Email Verification (2FA):** 6-digit OTP required to complete registration and password resets.
*   **Robust Password Policies:** Enforces a 90-day password expiration and checks against a `PasswordHistory` table to prevent reusing the last 3 passwords.
*   **Secure Sessions:** Implements HttpOnly, secure cookies for JWT storage to prevent XSS attacks.
*   **Brute-Force Protection:** API endpoints are protected using `express-rate-limit`.

---

## 🏗️ Project Structure

```text
PROJECT/
├── fe/                     # Frontend (Next.js Application)
├── be/                     # Backend (Express API + Prisma)
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- Node.js (v18 or higher recommended)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

### 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd securereg
```

### 2️⃣ Backend Setup (API & Database)

Navigate to the backend directory and install dependencies:

```bash
cd be
npm install
```

#### Environment Configuration (`be/.env`)
Create a `.env` file inside the `be/` directory with your database and email credentials:

```env
PORT=4001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ORIGIN=http://localhost:3000

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:your_db_password@localhost:5432/securereg?schema=public"

# Security & JWT
JWT_SECRET=your_super_secret_jwt_string_here
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12
APP_BASE_URL=http://localhost:3000

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="SecureReg <your_email@gmail.com>"
```
*(Note: To use Gmail, you must generate an "App Password" from your Google Account security settings).*

#### Database Setup
Run the following Prisma commands to push the schema to your PostgreSQL database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

#### Start the Backend Server
```bash
npm run dev
```
The backend API will run on **http://localhost:4001**

### 3️⃣ Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd fe
npm install
```

#### Environment Configuration (`fe/.env.local`)
Create a `.env.local` file inside the `fe/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001

# Cloudflare Turnstile Keys
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACk-lec6YmRcFm8Q
TURNSTILE_SECRET_KEY=0x4AAAAAACk-lTfzy3kwbm6NEX69Dh5FbrA
```

#### Start the Frontend Server
```bash
npm run dev
```
The frontend application will be available at **http://localhost:3000**

---

## 🛠️ Available Scripts

### Frontend (`fe/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build application for production |
| `npm start` | Start production server |
| `npm run lint` | Run code quality checks |

### Backend (`be/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express development server via ts-node |
| `npx prisma studio` | Open Prisma Studio (Database GUI) |
| `npx prisma db push`| Sync Prisma schema with database |

---

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure your PostgreSQL service is running globally.
- Double-check the `DATABASE_URL` credentials in your backend `.env` file.
- Check if the database exists using pgAdmin or DBeaver.

### Emails Not Sending (Registration/Reset)
- If using Gmail, ensure you are using an **App Password**, not your standard account password.
- Verify your `EMAIL_USER` and `EMAIL_PASS` variables match exactly.

### Captcha (Turnstile) Not Loading
- Ensure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is correctly set.
- If testing locally, ensure `localhost` is whitelisted in your Cloudflare Turnstile dashboard.

---

## 📄 License
This project was developed for academic purposes under the **University of Sunderland (CET324)** curriculum requirements.

---

## 👥 Contact & Author
**Saugat Timalsina**
- Assignment: CET324 Advanced Cyber Security
- University of Sunderland

---

<div align="center">

**[⬆ Back to Top](#securereg---cet324-advanced-cyber-security)**

</div>
