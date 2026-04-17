const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'mini-project-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fake_internship_detection';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Schema & Model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty'], required: true }
  },
  { timestamps: true }
);

const internshipSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    website: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    stipendType: { type: String, enum: ['paid', 'unpaid', 'unknown'], default: 'unknown' },
    requiresUpfrontPayment: { type: Boolean, default: false },
    requiresSensitiveDocs: { type: Boolean, default: false },
    jobDescription: { type: String, default: '' },
    source: { type: String, default: '' },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: 'Unknown' },
    riskReasons: { type: [String], default: [] }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Internship = mongoose.model('Internship', internshipSchema);

// Auth middleware
function authRequired(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied for this role' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

// Simple rule-based detection logic
function evaluateInternship(data) {
  let score = 0;
  const reasons = [];

  const email = (data.contactEmail || '').toLowerCase();
  const website = (data.website || '').toLowerCase();
  const description = (data.jobDescription || '').toLowerCase();
  const source = (data.source || '').toLowerCase();

  // Rule 1: Free email domains and no company website
  const freeDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (domain && freeDomains.includes(domain) && !website) {
    score += 25;
    reasons.push('Uses free email domain and no official company website provided.');
  }

  // Rule 2: Upfront payment requested
  if (data.requiresUpfrontPayment) {
    score += 35;
    reasons.push('Asks for upfront payment or registration fee.');
  }

  // Rule 3: Sensitive documents before selection
  if (data.requiresSensitiveDocs) {
    score += 25;
    reasons.push('Requests sensitive personal documents before selection or joining.');
  }

  // Rule 4: Very high stipend with vague role
  const highStipendKeywords = ['very high stipend', 'unlimited earning', 'no work', 'easy money'];
  if (highStipendKeywords.some((k) => description.includes(k))) {
    score += 20;
    reasons.push('Unrealistic stipend / earning claims with vague job description.');
  }

  // Rule 5: Suspicious keywords
  const scamKeywords = ['registration fee', 'processing fee', 'training fee', 'investment required'];
  if (scamKeywords.some((k) => description.includes(k))) {
    score += 20;
    reasons.push('Mentions fees or investment in description.');
  }

  // Rule 6: Unknown / informal source
  const trustedSources = ['linkedin', 'naukri', 'indeed', 'internshala', 'official website'];
  if (source && !trustedSources.some((s) => source.includes(s))) {
    score += 10;
    reasons.push('Posted on an unverified or informal platform.');
  }

  if (!email && !website) {
    score += 10;
    reasons.push('No contact email or website provided.');
  }

  // Clamp score
  if (score > 100) score = 100;

  let level = 'Low';
  if (score >= 70) level = 'High';
  else if (score >= 40) level = 'Medium';

  return { riskScore: score, riskLevel: level, riskReasons: reasons };
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or faculty.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '2h'
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '2h'
    });

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// API routes (protected)
app.post('/api/internships/evaluate', authRequired(['student', 'faculty']), async (req, res) => {
  try {
    const {
      companyName,
      position,
      website,
      contactEmail,
      stipendType,
      requiresUpfrontPayment,
      requiresSensitiveDocs,
      jobDescription,
      source
    } = req.body;

    if (!companyName || !position) {
      return res.status(400).json({ message: 'Company name and position are required.' });
    }

    const evaluation = evaluateInternship({
      companyName,
      position,
      website,
      contactEmail,
      stipendType,
      requiresUpfrontPayment,
      requiresSensitiveDocs,
      jobDescription,
      source
    });

    const record = await Internship.create({
      companyName,
      position,
      website,
      contactEmail,
      stipendType: stipendType || 'unknown',
      requiresUpfrontPayment: !!requiresUpfrontPayment,
      requiresSensitiveDocs: !!requiresSensitiveDocs,
      jobDescription,
      source,
      createdBy: req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : null,
      ...evaluation
    });

    return res.status(201).json({ message: 'Evaluation completed', data: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Only faculty can see all evaluations
app.get('/api/internships', authRequired(['faculty']), async (req, res) => {
  try {
    const items = await Internship.find().sort({ createdAt: -1 }).limit(50);
    return res.json({ data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

