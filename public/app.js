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

    if (response.ok) {
      setToken(data.token);
      if (data.role === 'realtor') {
        window.location.href = '/realtor-home.html';
      } else if (data.role === 'buyer') {
        window.location.href = '/client-home.html';
      }
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
});
