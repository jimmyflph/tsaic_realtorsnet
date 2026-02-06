const API_URL = '';

// Default property image URL - global constant
window.DEFAULT_PROPERTY_IMAGE = 'https://thevanrealty.com/wp-content/uploads/2017/04/2-1.jpg';

// Hardcoded realtor images used as fallbacks across pages (can be updated centrally)
window.REALTOR_IMAGES = window.REALTOR_IMAGES || [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1545996124-1f2a0d4f2f4a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop'
];
const REALTOR_IMAGES = window.REALTOR_IMAGES;

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
      const target = data.role === 'realtor' ? '/realtor-home' : '/client-home';
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
      const target = data.role === 'realtor' ? '/realtor-home' : '/client-home';
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
      const target = data.role === 'realtor' ? '/realtor-home' : '/client-home';
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
    const response = await fetch(`${API_URL}/api/view-prospects?page=1&maxItems=5`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load prospects</td></tr>';
      return;
    }

    const data = await response.json();
    const prospects = data.prospects || data;

    if (!prospects || prospects.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No prospects found</td></tr>';
      return;
    }

    tableBody.innerHTML = prospects.map(p => `
      <tr>
        <td>${p.fullname || p.name || '-'}</td>
        <td>${p.email || '-'}</td>
        <td>${p.phone || '-'}</td>
        <td><span class="badge bg-${p.status === 'Active' ? 'success' : 'warning'}">${p.status || 'Active'}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading prospects:', error);
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading prospects</td></tr>';
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

    realtyGallery.innerHTML = realties.map((r, i) => {
      return `
      <div class="col-md-4 col-lg-3">
        <div class="realty-card">
          <div class="realty-card-header">
            <span class="realty-tag">${r.isrental ? 'Rental' : 'Sale'}</span>
          </div>
          <div class="realty-card-body">
            <h5 class="realty-title">${r.title}</h5>
            <p class="realty-address">📍 ${r.address}</p>
            <p class="realty-price">${r.price || 'Contact for price'}</p>
            <p class="realty-desc">${r.description}</p>
            <button class="realty-bid mt-auto" onclick="viewRealtyDetails(${r.id})">View Details</button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  } catch (error) {
    console.error('Error loading realties:', error);
    realtyGallery.innerHTML = '<div class="col-12 text-center text-danger"><p>Error loading properties</p></div>';
  }
}

// Load public realtor list for index (and other pages)
async function loadRealtorsList(limit) {
  const container = document.getElementById('realtorsList');
  if (!container) return;

  try {
    const resp = await fetch(`${API_URL}/api/realtors`);
    if (!resp.ok) {
      container.innerHTML = '<div class="col-12 text-center text-danger"><p>Failed to load realtors</p></div>';
      return;
    }
    let realtors = await resp.json();
    if (!realtors || realtors.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-muted"><p>No realtors found</p></div>';
      return;
    }
    if (limit && Number(limit) > 0) realtors = realtors.slice(0, Number(limit));

    container.innerHTML = realtors.map((r, i) => {
      const fallback = REALTOR_IMAGES && REALTOR_IMAGES.length ? REALTOR_IMAGES[(r.id || i) % REALTOR_IMAGES.length] : 'https://via.placeholder.com/120?text=Agent';
      const img = r.image || r.photo || fallback;
      const title = r.fullname || r.username || 'Realtor';
      const subtitle = r.title || r.specialty || '';
      return `
        <div class="col-md-3 text-center">
          <img src="${img}" class="realtor-img mb-3" alt="${title}">
          <h6 class="fw-semibold">${title}</h6>
          <small class="text-muted">${subtitle}</small>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading realtors list:', err);
    container.innerHTML = '<div class="col-12 text-center text-danger"><p>Error loading realtors</p></div>';
  }
}


function viewRealtyDetails(realtyId) {
  window.location.href = `/property-view/${realtyId}`;
}

async function loadPropertyDetails(propertyId) {
  try {
    const response = await fetch(`${API_URL}/api/realty/${propertyId}`);
    
    if (!response.ok) {
      console.error('Failed to load property details');
      return;
    }

    const property = await response.json();
    
    // Update property details
    const titleEl = document.querySelector('.property-title');
    const addressEl = document.querySelector('.property-address');
    const priceEl = document.querySelector('.property-price');
    const descEl = document.querySelector('.property-description');
    const realtorEl = document.getElementById('realtorInfo');
    
    if (titleEl) titleEl.textContent = property.title || 'Property Details';
    if (addressEl) addressEl.textContent = `📍 ${property.address || 'Address not available'}`;
    if (priceEl) priceEl.textContent = property.price ? `$${property.price}` : 'Contact for price';
    if (descEl) descEl.textContent = property.description || 'No description available';
    
    // Update realtor info (use white card, circular profile image, and themed buttons)
    if (realtorEl) {
      if (property.realtor_fullname) {
        const fallbackImg = (REALTOR_IMAGES && REALTOR_IMAGES.length) ? REALTOR_IMAGES[(property.realtor || 0) % REALTOR_IMAGES.length] : 'https://via.placeholder.com/120?text=Agent';
        const realtorImg = property.realtor_image || property.realtor_photo || fallbackImg;
        realtorEl.innerHTML = `
          <div class="card bg-white p-3" style="border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,0.06);">
            <div style="display:flex;gap:12px;align-items:center">
              <img src="${realtorImg}" alt="agent" style="width:80px;height:80px;border-radius:50%;object-fit:cover;box-shadow:0 8px 20px rgba(0,0,0,0.08);">
              <div style="flex:1;text-align:left">
                <div class="fw-bold">${property.realtor_fullname}</div>
                <div class="text-muted"><a href=\"mailto:${property.realtor_email}\">${property.realtor_email}</a></div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <a class="btn btn-secondary-action" href="/realtor-view/${property.realtor}">View Realtor</a>
              <a class="btn btn-secondary-action" href="mailto:${property.realtor_email}">Message</a>
            </div>
          </div>
        `;
      } else {
        realtorEl.innerHTML = '<p class="text-muted">Agent information not available</p>';
      }
    }

    // Images: main banner and gallery
    try {
      const mainImgEl = document.getElementById('propertyMainImage');
      const galleryEl = document.getElementById('propertyGallery');
      const modalImg = document.getElementById('modalImage');

      let images = [];
      if (property.images) {
        if (Array.isArray(property.images)) images = property.images;
        else if (typeof property.images === 'string') {
          // CSV or newline separated
          images = property.images.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        }
      }

      if (mainImgEl) {
        mainImgEl.src = images.length > 0 ? images[0] : (property.image || mainImgEl.src || 'https://via.placeholder.com/900x400?text=No+Image');
      }

      if (galleryEl) {
        if (!images || images.length === 0) {
          galleryEl.innerHTML = '';
        } else {
          galleryEl.innerHTML = images.map((url, idx) => `
            <div class="gallery-thumb" style="width:120px;height:80px;overflow:hidden;border:1px solid #eee;border-radius:8px;display:inline-block;cursor:pointer;" data-url="${url.replace(/"/g, '&quot;')}">
              <img src="${url}" alt="img-${idx}" style="width:100%;height:100%;object-fit:cover;">
            </div>
          `).join('');
          // Add event listeners to thumbnails
          document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => openImageModal(thumb.getAttribute('data-url')));
          });
        }
      }
    } catch (err) {
      console.error('Error rendering images:', err);
    }
  } catch (error) {
    console.error('Error loading property details:', error);
  }
}

// Open image modal (uses Bootstrap's modal)
function openImageModal(url) {
  const modalImg = document.getElementById('modalImage');
  const modalEl = document.getElementById('imageModal');
  if (!modalImg || !modalEl) return;
  modalImg.src = url;
  try {
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  } catch (err) {
    console.error('Failed to open image modal', err);
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

  if (window.location.pathname === '/realtor-home' || window.location.pathname.includes('realtor-home')) {
    loadProspects();
    // load realtor's own properties and show max 5 rows on dashboard
    loadMyRealties(5);
    // Add button is a link to the create page; no JS handler required
    loadMyReviews(5);
  }

  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadRealties();
    loadRealtorsList(5);
  }

  if (window.location.pathname === '/login.html' || window.location.pathname === '/login') {
    loadRealties();
    loadRealtorsList(5);
  }

  if (window.location.pathname === '/client-home') {
    loadRealties();
    loadRealtorsList(5);
  }

  if (window.location.pathname === '/realtor-realty' || window.location.pathname.includes('realtor-realty')) {
    // View-all properties page should load full list and show Add Property there
    loadMyRealties();
  }

  if (window.location.pathname === '/realtor-messages') {
    // Load messages for realtor messages page
    loadMessages();
  }

  // Utility function to process amenities (adds default tag if < 5)
  function processAmenities(amenitiesString) {
    if (!amenitiesString) return ['Free Consultation'];
    
    let amenities = amenitiesString.split(',').map(a => a.trim()).filter(a => a.length > 0);
    // Filter out property info (bedroom, bathroom, size) - these are handled separately
    amenities = amenities.filter(a => !a.match(/^\d+\s*(Bedroom|Bathroom|Square Meter)/i));
    
    // Add default tag if less than 5 amenities
    if (amenities.length < 5) {
      amenities.push('Free Consultation');
    }
    
    return amenities;
  }

  // Realtor CRUD functions
  async function loadMyRealties(limit) {
    const tableBody = document.getElementById('realtiesTable');
    if (!tableBody) return;

    try {
      const response = await fetch(`${API_URL}/api/realty?mine=true`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (!response.ok) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load properties</td></tr>';
        return;
      }

      let realties = await response.json();
      if (!realties || realties.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No properties found</td></tr>';
        return;
      }

      // If a limit is provided, only show that many rows (used on realtor home)
      if (limit && Number(limit) > 0) {
        realties = realties.slice(0, Number(limit));
      }

      tableBody.innerHTML = realties.map(r => `
        <tr>
          <td>${r.title}</td>
          <td>${r.address || '-'}</td>
          <td>${r.price || '-'}</td>
          <td>${r.isrental ? 'Rental' : 'Sale'}</td>
          <td>
            <a class="btn btn-sm btn-black me-2" style="color:black!important; background: #f2f2f2!important;" href="/property-view/${r.id}">View</a>
            <a class="btn btn-sm btn-black me-2" style="color:black!important; background: #f2f2f2!important;" href="/realtor-realty-form/${r.id}">Edit</a>
            <a class="btn btn-sm btn-black" style="color:black!important; background: #f2f2f2!important;" href="/realtor-realty-delete/${r.id}">Delete</a>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading realties:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading properties</td></tr>';
    }
  }

  function createRealtyPrompt() {
    // navigate to create form page
    window.location.href = '/realtor-realty-form';
  }

  function editRealtyPrompt(id) {
    // navigate to edit form page
    window.location.href = `/realtor-realty-form/${id}`;
  }

    async function loadMyReviews(limit) {
      const tableBody = document.getElementById('myReviewsTable');
      if (!tableBody) return;

      try {
        const response = await fetch(`${API_URL}/api/my-reviews`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) {
          tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load reviews</td></tr>';
          return;
        }

        let reviews = await response.json();
        if (!reviews || reviews.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No reviews yet</td></tr>';
          return;
        }

        // If a limit is provided, only show that many rows (used on realtor home)
        if (limit && Number(limit) > 0) {
          reviews = reviews.slice(0, Number(limit));
        }

        tableBody.innerHTML = reviews.map(r => {
          const stars = '⭐'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
          const createdAt = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          const reviewText = (r.review || '').substring(0, 50);
          const ellipsis = (r.review && r.review.length > 50) ? '...' : '';
          return `
            <tr>
              <td>${r.buyer_name || 'Anonymous'}</td>
              <td><span class="badge bg-primary">${r.rating}/5</span></td>
              <td>${reviewText}${ellipsis}</td>
              <td>${createdAt}</td>
            </tr>
          `;
        }).join('');
      } catch (error) {
        console.error('Error loading reviews:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading reviews</td></tr>';
      }
    }

  // delete action is handled on a separate page

  

  
  if (window.location.pathname.startsWith('/property-view/')) {
    // Extract property ID from URL
    const propertyId = window.location.pathname.split('/')[2];
    if (propertyId) {
      loadPropertyDetails(propertyId);
      }
      loadRealties();
      loadRealtorsList(5);
  }
});

    async function loadMessages(limit) {
      const tableBody = document.getElementById('messagesTable');
      if (!tableBody) return;

      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) {
          tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load messages</td></tr>';
          return;
        }

        let messages = await response.json();
        if (!messages || messages.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No messages yet</td></tr>';
          return;
        }

        // If a limit is provided, only show that many rows
        if (limit && Number(limit) > 0) {
          messages = messages.slice(0, Number(limit));
        }

        tableBody.innerHTML = messages.map(m => {
          const createdAt = new Date(m.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const escapedContent = (m.content || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
          return `
            <tr>
              <td>${m.sender_fullname || 'Unknown'}</td>
              <td>${m.title}</td>
              <td>${m.content.substring(0, 60)}...</td>
              <td>${createdAt}</td>
              <td>
                <button class="btn-action" onclick="viewMessage('${m.title}', '${escapedContent}')">View</button>
                <button class="btn-action" onclick="deleteMessage(${m.message_id})">Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      } catch (error) {
        console.error('Error loading messages:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading messages</td></tr>';
      }
    }

    async function deleteMessage(messageId) {
      if (!confirm('Are you sure you want to delete this message?')) return;

      try {
        const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
          loadMessages();
        } else {
          alert('Failed to delete message');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
      }
    }

    function viewMessage(title, content) {
      // Check if modal already exists, if so remove it
      const existingModal = document.getElementById('messageModal');
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal HTML
      const modalHTML = `
        <div class="modal fade" id="messageModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="messageModalLabel">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>${content}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Append modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('messageModal'));
      modal.show();
    }

