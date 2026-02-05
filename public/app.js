const API_URL = '';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

function addMessage(text, isUser) {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendChatMessage(message) {
  addMessage(message, true);

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken() || ''}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    addMessage(data.message || 'Server error', false);
  } catch (error) {
    addMessage('Server error', false);
  }
}

async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    console.log('login response', response.status, data);

    if (response.ok) {
      setToken(data.token);
      const target = data.role === 'realtor' ? '/realtor-home.html' : '/client-home.html';
      window.location.href = target;
    } else {
      return data.error || 'Login failed';
    }
  } catch (error) {
    return 'Server error';
  }
}

async function signup(username, fullName, email, password, age, address, city) {
  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fullName, email, password, age, address, city })
    });

    const data = await response.json();
    console.log('signup response', response.status, data);

    if (response.ok) {
      setToken(data.token);
      const target = data.role === 'realtor' ? '/realtor-home.html' : '/client-home.html';
      window.location.href = target;
    } else {
      return data.error || 'Signup failed';
    }
  } catch (error) {
    return 'Server error';
  }
}

async function login_realtor(username, password) {
  try {
    const response = await fetch(`${API_URL}/api/realtor-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    console.log('login_realtor response', response.status, data);

    if (response.ok) {
      setToken(data.token);
      const target = data.role === 'realtor' ? '/realtor-home.html' : '/client-home.html';
      window.location.href = target;
    } else {
      return data.error || 'Login failed';
    }
  } catch (error) {
    return 'Server error';
  }
}


async function loadProspects() {
  const tableBody = document.getElementById('prospectsTable');
  if (!tableBody) return;

  try {
    const response = await fetch(`${API_URL}/api/prospects`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load prospects</td></tr>';
      return;
    }

    const prospects = await response.json();

    if (prospects.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No prospects found</td></tr>';
      return;
    }

    tableBody.innerHTML = prospects.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.email}</td>
        <td>${p.phone}</td>
        <td><span class="badge bg-${p.status === 'Active' ? 'success' : 'warning'}">${p.status}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading prospects</td></tr>';
  }
}

async function loadRealties() {
  const realtyGallery = document.getElementById('realtyGallery');
  if (!realtyGallery) return;

  try {
    const response = await fetch(`${API_URL}/api/realty`);

    if (!response.ok) {
      realtyGallery.innerHTML = '<div class="col-12 text-center text-danger"><p>Failed to load properties</p></div>';
      return;
    }

    const realties = await response.json();

    if (realties.length === 0) {
      realtyGallery.innerHTML = '<div class="col-12 text-center text-muted"><p>No properties available</p></div>';
      return;
    }

    realtyGallery.innerHTML = realties.map(r => `
      <div class="col-md-6 col-lg-4">
        <div class="realty-card">
          <div class="realty-card-header">
            <span class="realty-tag">${r.isrental ? 'Rental' : 'Sale'}</span>
          </div>
          <div class="realty-card-body">
            <h5 class="realty-title">${r.title}</h5>
            <p class="realty-address">📍 ${r.address}</p>
            <p class="realty-price">${r.price || 'Contact for price'}</p>
            <p class="realty-desc">${r.description}</p>
            ${r.amenities ? `<p class="realty-desc"><strong>Amenities:</strong> ${r.amenities}</p>` : ''}
            <button class="realty-bid mt-auto" onclick="viewRealtyDetails(${r.id})">View Details</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading realties:', error);
    realtyGallery.innerHTML = '<div class="col-12 text-center text-danger"><p>Error loading properties</p></div>';
  }
}

function viewRealtyDetails(realtyId) {
  alert(`Viewing details for property ID: ${realtyId}`);
  // Future: implement detailed view or modal
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMsg');

      const error = await login(username, password);
      if (error) {
        errorMsg.textContent = error;
        errorMsg.classList.remove('d-none');
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const fullName = document.getElementById('regFullName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const age = document.getElementById('regAge').value;
      const address = document.getElementById('regAddress').value;
      const city = document.getElementById('regCity').value;
      const errorMsg = document.getElementById('errorMsg');
      const successMsg = document.getElementById('successMsg');

      errorMsg.classList.add('d-none');
      successMsg.classList.add('d-none');

      const error = await signup(username, fullName, email, password, age, address, city);
      if (error) {
        errorMsg.textContent = error;
        errorMsg.classList.remove('d-none');
      } else {
        successMsg.textContent = 'Signup successful! Redirecting...';
        successMsg.classList.remove('d-none');
      }
    });
  }



  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');

  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message) {
        sendChatMessage(message);
        chatInput.value = '';
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      removeToken();
      window.location.href = '/';
    });
  }

  if (window.location.pathname === '/realtor-home.html') {
    loadProspects();
  }

  if (window.location.pathname === '/client-home.html') {
    loadRealties();
  }
});
