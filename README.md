# Fake Internship Detection System

Mini project using **HTML, CSS, AngularJS** on the frontend and **Node.js + Express + MongoDB** on the backend.

## Tech Stack

- **Frontend**: HTML, CSS, AngularJS (1.8.3)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Features

- ✅ Student and Faculty role-based authentication
- ✅ Internship risk analysis with rule-based detection
- ✅ Real-time risk scoring (0-100) and risk level classification
- ✅ History tracking for faculty members
- ✅ Modern, responsive UI/UX design
- ✅ Secure API endpoints with JWT authentication

## Prerequisites

- **Node.js** (v14 or higher) and **npm** installed
- **MongoDB** running locally (default URL: `mongodb://127.0.0.1:27017`)

## Installation

1. **Clone or navigate to the project folder:**

```bash
cd "C:\Users\LENOVO\Documents\AAFRIN\MINI PROJECT"
```

2. **Install dependencies:**

```bash
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

## Configuration

### MongoDB Connection

By default, the app connects to:

```
mongodb://127.0.0.1:27017/fake_internship_detection
```

To use a custom MongoDB URI, create a `.env` file in the project root:

```env
MONGO_URI=your_mongo_connection_string_here
JWT_SECRET=your_secret_key_here
PORT=4000
```

## Running the Application

1. **Start MongoDB** (if not already running)

2. **Start the Node.js server:**

```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:4000
```

3. **Open your browser:**

Navigate to:
```
http://localhost:4000
```

## Usage Guide

### 1. Registration

- Click the **Register** tab
- Enter:
  - **Full Name**
  - **Email**
  - **Password**
  - **Role** (Student or Faculty)
- Click **Register**
- You will be automatically logged in

### 2. Login

- Click the **Login** tab
- Enter your **email** and **password**
- Select your **role** (must match the role you registered with)
- Click **Login**

### 3. Analyzing an Internship

1. Fill in the internship details:
   - Company Name * (required)
   - Position / Role * (required)
   - Company Website
   - Contact Email
   - Stipend Type
   - Checkboxes for suspicious indicators
   - Source (where you found it)
   - Job Description (full text)

2. Click **"Analyze Internship"**

3. View the results:
   - **Risk Level**: Low / Medium / High
   - **Risk Score**: 0-100
   - **Risk Reasons**: List of detected issues

### 4. Role-Based Features

#### Student Role
- Can analyze internships
- Cannot view full evaluation history
- Sees an informational message instead

#### Faculty Role
- Can analyze internships
- Can view **Recent Evaluations** (last 50 evaluations from all users)
- Can see who created each evaluation
- Can refresh the history list

## How Detection Works

The system uses **rule-based detection** to analyze internships:

### Detection Rules

1. **Free Email Domain + No Website** (+25 points)
   - Uses Gmail/Yahoo/Outlook and no official website

2. **Upfront Payment Requested** (+35 points)
   - Asks for registration/training fee

3. **Sensitive Documents Early** (+25 points)
   - Requests personal documents before selection

4. **Unrealistic Claims** (+20 points)
   - Keywords like "very high stipend", "easy money", "no work"

5. **Suspicious Keywords** (+20 points)
   - "registration fee", "processing fee", "investment required"

6. **Informal Source** (+10 points)
   - Posted on unverified platforms (not LinkedIn, Internshala, etc.)

7. **Missing Contact Info** (+10 points)
   - No email and no website provided

### Risk Level Classification

- **Low Risk**: Score < 40
- **Medium Risk**: Score 40-69
- **High Risk**: Score ≥ 70

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Internships

- `POST /api/internships/evaluate` - Analyze internship (requires auth)
- `GET /api/internships` - Get evaluation history (faculty only)

All protected endpoints require `Authorization: Bearer <token>` header.

## Project Structure

```
MINI PROJECT/
├── server.js              # Node.js + Express backend
├── package.json           # Dependencies and scripts
├── README.md              # This file
├── public/
│   ├── index.html        # AngularJS HTML template
│   ├── app.js            # AngularJS application code
│   └── styles.css        # Modern CSS styling
└── .env                  # Environment variables (optional)
```

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

(Requires `nodemon` to be installed globally or as dev dependency)

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE: address already in use :::4000`:

1. Find the process using port 4000:
   ```bash
   netstat -ano | findstr :4000
   ```

2. Kill the process (replace PID with the number from step 1):
   ```bash
   taskkill /PID <PID> /F
   ```

3. Run `npm start` again

### MongoDB Connection Error

- Ensure MongoDB is running
- Check if MongoDB is accessible at `mongodb://127.0.0.1:27017`
- Verify the database name in the connection string

### AngularJS Not Loading

- Check browser console for errors
- Ensure you have internet connection (AngularJS is loaded from CDN)
- Verify the AngularJS CDN link in `index.html`

## Future Enhancements

- [ ] AI/ML-based detection model
- [ ] Company verification API integration
- [ ] Browser extension
- [ ] Mobile app
- [ ] Email notifications
- [ ] Advanced reporting dashboard

## License

This project is for academic/educational purposes only.

## Author

Mini Project - Fake Internship Detection System

---

**Note**: This is a rule-based helper tool, not a final legal decision. Always cross-check company details, talk to seniors, and use official platforms when applying for internships.
