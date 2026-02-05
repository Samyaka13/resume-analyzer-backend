---

# AI-Powered Resume Analyzer Backend

A robust backend service for an AI-powered resume analysis application. This system allows users to upload resumes, extracts text from them asynchronously, and uses Google's Gemini AI to compare the resume against a specific job description to provide a fit score, keyword analysis, and skill gap feedback.

## 🚀 Features

* **User Authentication**: Secure JWT-based authentication (Access & Refresh tokens) with registration, login, logout, and password management.
* **Resume Management**: Upload, store (via Cloudinary), and manage multiple resumes.
* **Asynchronous Processing**: Uses **BullMQ** and **Redis** to handle heavy tasks (parsing and analysis) in the background without blocking the main thread.
* **File Parsing**: Automatically extracts text from PDF and DOCX files using a dedicated parsing worker.
* **AI Analysis**: Integrates with **Google Gemini (gemini-2.5-pro)** to generate intelligent insights, including:
* Fit Score (0-100)
* Matched & Missing Keywords
* Actionable Skill Gap Analysis


* **Scalable Architecture**: Separation of concerns with dedicated controllers, routes, models, and worker services.

## 🛠️ Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/)
* **Framework**: [Express.js](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
* **Queue/Messaging**: [BullMQ](https://docs.bullmq.io/) & [Redis](https://redis.io/)
* **File Storage**: [Cloudinary](https://cloudinary.com/)
* **AI Model**: [Google Gemini API](https://ai.google.dev/)
* **File Parsing**: `pdf-parse` (PDF) & `mammoth` (DOCX)

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

1. **Node.js** (v18+ recommended)
2. **MongoDB** (Local or Atlas)
3. **Redis** (Required for the job queues)
4. **Cloudinary Account** (For file storage)
5. **Google Cloud Project** (With Gemini API enabled)

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=*
MONGODB_URI=mongodb://localhost:27017 # or your Atlas URI

# Security (JWT)
ACCESS_TOKEN_SECRET=your_super_secret_access_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Job Queues)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# AI Configuration
GOOGLE_API_KEY=your_google_gemini_api_key

```

## 🚀 Installation & Setup

1. **Clone the repository**
```bash
git clone <repository_url>
cd resume-analyzer-backend

```


2. **Install dependencies**
```bash
npm install

```


3. **Start Redis Server**
Make sure your local Redis instance is running (usually on port 6379).
```bash
redis-server

```



## 🏃‍♂️ Running the Application

This architecture requires running the **API Server** and the **Background Workers** simultaneously. You will need three separate terminal windows.

**1. Start the API Server**
This handles HTTP requests from the frontend.

```bash
npm run dev

```

**2. Start the Parsing Worker**
This listens for new file uploads and extracts text from PDFs/DOCXs.

```bash
npm run worker:parsing

```

**3. Start the Analysis Worker**
This listens for analysis requests and calls the Google Gemini API.

```bash
npm run worker:analysis

```

## 🔌 API Endpoints

### **User Routes** (`/api/v1/users`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register` | Register a new user (requires `avatar` file) |
| `POST` | `/login` | Login user and receive tokens |
| `POST` | `/logout` | Logout user (clears cookies) |
| `POST` | `/refresh-token` | Refresh access token |
| `GET` | `/current-user` | Get current logged-in user details |
| `PATCH` | `/update-account` | Update name or email |
| `PATCH` | `/avatar` | Update profile picture |
| `POST` | `/change-password` | Change user password |

### **Resume Routes** (`/api/v1/resumes`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Upload a resume file (PDF/DOCX) |
| `GET` | `/` | Get all resumes uploaded by the user |
| `GET` | `/:resumeId` | Get a specific resume details |
| `DELETE` | `/:resumeId` | Delete a resume |

### **Analysis Routes** (`/api/v1/analysis`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Request a new analysis (requires `resumeId` & `jobDescriptionText`) |
| `GET` | `/` | Get analysis history |
| `GET` | `/:analysisId` | Get specific analysis results |
| `DELETE` | `/:analysisId` | Delete an analysis record |

## 📂 Project Structure

```
src/
├── controllers/      # Request handlers (Auth, Resume, Analysis)
├── db/              # Database connection logic
├── middlewares/     # Auth verification, Multer upload config
├── models/          # Mongoose schemas (User, Resume, Analysis)
├── queues/          # BullMQ queue definitions
├── routes/          # API Route definitions
├── utils/           # Helper functions (AsyncHandler, ApiError, Cloudinary)
├── workers/         # Background processors (Parsing & AI Analysis)
├── app.js           # Express app setup
└── index.js         # Entry point

```

## ⚠️ Common Issues

* **Redis Connection Error**: Ensure your Redis server is running locally or the `REDIS_HOST` in `.env` is correct.
* **Multer Errors**: Ensure the `Server/public/temp` directory exists (it is usually created automatically, but check permissions).
* **Google API Errors**: Ensure your `GOOGLE_API_KEY` is valid and has access to the `gemini-2.5-pro` model.
