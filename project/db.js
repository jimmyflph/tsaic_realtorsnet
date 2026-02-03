const mockUsers = [
  { id: 1, username: 'user1', password: 'pass123', role: 'buyer' },
  { id: 2, username: 'user2', password: 'pass123', role: 'realtor' }
];

const mockProspects = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-0101', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', status: 'Pending' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0103', status: 'Active' }
];

async function getUserByUsername(username) {
  return mockUsers.find(u => u.username === username);
}

async function getProspects() {
  return mockProspects;
}

module.exports = {
  getUserByUsername,
  getProspects
};
