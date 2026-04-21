// Admin auction management - Loaded conditionally

let auctions = []; // Mock DB
let subscribers = new Set(); // Mock subscribers

async function loadAdminPanel() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  // Add admin controls
  const container = document.querySelector('.container');
  container.insertAdjacentHTML('afterbegin', `
    <div class="admin-panel">
      <h2><i class="fas fa-crown"></i> Admin Controls</h2>
      <button onclick="openCreateAuctionModal()">➕ Create Auction</button>
      <button onclick="pushNotifications()">📢 Notify Subscribers</button>
    </div>
  `);

  loadAuctionsList();
}

async function checkAdmin() {
  try {
    const response = await fetch('/api/user', { credentials: 'include' });
    const data = await response.json();
    // Mock admin check - replace with Discord roles or user IDs
    const adminIds = ['1496112888224415804']; // Your Discord ID as admin
    return data.user && adminIds.includes(data.user.id);
  } catch {
    return false;
  }
}

function openCreateAuctionModal() {
  const modal = `
    <div class="admin-modal-overlay" onclick="closeModal()">
      <div class="admin-modal" onclick="event.stopPropagation()">
        <h3>Create New Auction</h3>
        <form id="create-auction-form">
          <input type="text" placeholder="Auction Name" id="auction-name" required>
          <input type="text" placeholder="Prize (e.g. Netflix Premium)" id="auction-prize" required>
          <input type="url" placeholder="Thumbnail URL" id="auction-thumb" required>
          <input type="number" placeholder="Minimum Bid (coins)" id="auction-minbid" min="1" required>
          <input type="number" placeholder="Starting Bid (coins)" id="auction-startbid" min="1" required>
          <input type="number" placeholder="Total Quantity" id="auction-quantity" min="1" required>
          <button type="submit">Create Auction</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function closeModal() {
  document.querySelector('.admin-modal-overlay')?.remove();
}

document.addEventListener('submit', async (e) => {
  if (e.target.id === 'create-auction-form') {
    e.preventDefault();
    const formData = {
      name: document.getElementById('auction-name').value,
      prize: document.getElementById('auction-prize').value,
      thumb: document.getElementById('auction-thumb').value,
      minBid: parseInt(document.getElementById('auction-minbid').value),
      startBid: parseInt(document.getElementById('auction-startbid').value),
      quantity: parseInt(document.getElementById('auction-quantity').value),
      id: Date.now().toString()
    };
    
    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        closeModal();
        loadAuctionsList();
        alert('Auction created successfully!');
      }
    } catch (error) {
      alert('Error creating auction');
    }
  }
});

async function loadAuctionsList() {
  try {
    const response = await fetch('/api/auctions');
    auctions = await response.json();
    
    const container = document.getElementById('auctions-container');
    container.innerHTML = auctions.map(auction => `
      <div class="auction-admin-card">
        <div class="auction-preview">
          <img src="${auction.thumb}" alt="${auction.prize}" class="auction-thumb">
          <div>
            <h4>${auction.name}</h4>
            <p>${auction.prize}</p>
          </div>
        </div>
        <div class="auction-admin-actions">
          <button onclick="editAuction('${auction.id}')">Edit</button>
          <button onclick="deleteAuction('${auction.id}')" class="delete-btn">Delete</button>
          <button onclick="toggleActive('${auction.id}')" class="toggle-btn">${auction.active ? 'Pause' : 'Activate'}</button>
        </div>
      </div>
    `).join('') || '<p>No auctions created yet.</p>';
  } catch (error) {
    console.error(error);
  }
}

async function pushNotifications() {
  try {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('Notifications sent to all subscribers!');
    }
  } catch (error) {
    alert('Error sending notifications');
  }
}

async function deleteAuction(id) {
  if (confirm('Delete this auction?')) {
    await fetch(`/api/auctions/${id}`, { method: 'DELETE', credentials: 'include' });
    loadAuctionsList();
  }
}

async function toggleActive(id) {
  await fetch(`/api/auctions/${id}/toggle`, { 
    method: 'PATCH', 
    credentials: 'include' 
  });
  loadAuctionsList();
}

// Init for auctions page
if (document.querySelector('.auctions-page')) {
  loadAdminPanel();
}

