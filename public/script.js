const form = document.getElementById('internship-form');
const resultContainer = document.getElementById('result-container');
const historyContainer = document.getElementById('history-container');
const analyzeBtn = document.getElementById('analyze-btn');

// Auth elements
const authCard = document.getElementById('auth-card');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const userInfo = document.getElementById('user-info');
const userLabel = document.getElementById('user-label');
const logoutBtn = document.getElementById('logout-btn');

document.getElementById('year').textContent = new Date().getFullYear();

let authToken = null;
let currentUser = null;

function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  if (token && user) {
    localStorage.setItem('fi_token', token);
    localStorage.setItem('fi_user', JSON.stringify(user));
    userLabel.textContent = `${user.name} (${user.role.toUpperCase()})`;
    userInfo.classList.remove('hidden');
    authCard.classList.add('hidden');
    if (user.role === 'faculty') {
      // Faculty can see history of all evaluations
      loadHistory();
    } else {
      // Student: clear history section text
      historyContainer.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'Only faculty can see the full history of all students.';
      historyContainer.appendChild(p);
    }
  } else {
    localStorage.removeItem('fi_token');
    localStorage.removeItem('fi_user');
    userInfo.classList.add('hidden');
    authCard.classList.remove('hidden');
    historyContainer.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Login as faculty to see recent evaluations.';
    historyContainer.appendChild(p);
  }
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

function createRiskBadge(level, score) {
  const div = document.createElement('div');
  div.classList.add('risk-badge');
  const levelClass = level.toLowerCase();
  if (levelClass === 'high') div.classList.add('risk-high');
  else if (levelClass === 'medium') div.classList.add('risk-medium');
  else div.classList.add('risk-low');

  div.innerHTML = `<span>${level.toUpperCase()} RISK</span><span class="score">${score}/100</span>`;
  return div;
}

function renderResult(data) {
  resultContainer.innerHTML = '';

  const badge = createRiskBadge(data.riskLevel || 'Unknown', data.riskScore ?? 0);
  const title = document.createElement('p');
  title.innerHTML = `<strong>${data.companyName}</strong> — ${data.position}`;

  const riskDetails = document.createElement('div');
  riskDetails.className = 'risk-details';

  const subtitle = document.createElement('h3');
  subtitle.textContent = 'Why this rating?';
  riskDetails.appendChild(subtitle);

  const list = document.createElement('ul');
  if (data.riskReasons && data.riskReasons.length) {
    data.riskReasons.forEach((reason) => {
      const li = document.createElement('li');
      li.textContent = reason;
      list.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No strong risk signals detected based on the current rules.';
    list.appendChild(li);
  }

  riskDetails.appendChild(list);

  const info = document.createElement('p');
  info.className = 'muted';
  info.textContent =
    'This is an educational, rule-based estimation. Always cross-check company details, talk to seniors, and use official platforms.';

  resultContainer.appendChild(badge);
  resultContainer.appendChild(title);
  resultContainer.appendChild(riskDetails);
  resultContainer.appendChild(info);
}

function renderHistory(items) {
  historyContainer.innerHTML = '';

  if (!items || !items.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No evaluations yet.';
    historyContainer.appendChild(p);
    return;
  }

  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';

    const header = document.createElement('div');
    header.className = 'history-header';

    const title = document.createElement('span');
    title.className = 'history-title';
    title.textContent = `${item.companyName} — ${item.position}`;

    const badge = createRiskBadge(item.riskLevel || 'Unknown', item.riskScore ?? 0);

    header.appendChild(title);
    header.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'history-meta';
    const dateText = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
    meta.textContent = dateText;

    div.appendChild(header);
    div.appendChild(meta);

    historyContainer.appendChild(div);
  });
}

async function loadHistory() {
  try {
    const res = await fetch('/api/internships', {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;
    const json = await res.json();
    renderHistory(json.data || []);
  } catch (err) {
    console.error('Error loading history', err);
  }
}

// Auth handlers
showLoginBtn.addEventListener('click', () => {
  showLoginBtn.classList.add('active');
  showRegisterBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

showRegisterBtn.addEventListener('click', () => {
  showRegisterBtn.classList.add('active');
  showLoginBtn.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.message || 'Login failed');
      return;
    }
    if (json.user.role !== role) {
      alert(`This account is registered as ${json.user.role}, not ${role}.`);
      return;
    }
    setAuth(json.token, json.user);
  } catch (err) {
    console.error(err);
    alert('Login error. Check server.');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.message || 'Registration failed');
      return;
    }
    setAuth(json.token, json.user);
    alert('Registered and logged in successfully.');
  } catch (err) {
    console.error(err);
    alert('Registration error. Check server.');
  }
});

logoutBtn.addEventListener('click', () => {
  setAuth(null, null);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';

  const formData = new FormData(form);
  const payload = {
    companyName: formData.get('companyName'),
    position: formData.get('position'),
    website: formData.get('website'),
    contactEmail: formData.get('contactEmail'),
    stipendType: formData.get('stipendType'),
    requiresUpfrontPayment: !!formData.get('requiresUpfrontPayment'),
    requiresSensitiveDocs: !!formData.get('requiresSensitiveDocs'),
    jobDescription: formData.get('jobDescription'),
    source: formData.get('source')
  };

  try {
    const res = await fetch('/api/internships/evaluate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.message || 'Error while evaluating internship.');
    } else if (json.data) {
      renderResult(json.data);
      await loadHistory();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to connect to server. Make sure backend is running.');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Internship';
  }
});

// Initialize auth from localStorage
const savedToken = localStorage.getItem('fi_token');
const savedUser = localStorage.getItem('fi_user');
if (savedToken && savedUser) {
  try {
    setAuth(savedToken, JSON.parse(savedUser));
  } catch {
    setAuth(null, null);
  }
} else {
  setAuth(null, null);
}

