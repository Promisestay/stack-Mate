// CloudDrop Authentication System
// Add this script to your HTML files or use as a separate auth.js file

class CloudDropAuth {
  constructor() {
    this.storageKey = 'clouddrop_users';
    this.currentUserKey = 'clouddrop_current_user';
    this.sessionKey = 'clouddrop_session';
    this.init();
  }

  init() {
    // Initialize users storage if it doesn't exist
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Hash password (simple implementation - use bcrypt in production)
  hashPassword(password) {
    // Simple hash for demo - use proper hashing in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Check if email exists
  emailExists(email) {
    const users = this.getAllUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Get all users
  getAllUsers() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  // Get user by email
  getUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Register new user
  register(name, email, password) {
    // Validate inputs
    if (!name || !email || !password) {
      return {
        success: false,
        message: 'All fields are required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address'
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    // Check if user already exists
    if (this.emailExists(email)) {
      return {
        success: false,
        message: 'An account with this email already exists',
        existingUser: true
      };
    }

    // Create new user
    const users = this.getAllUsers();
    const newUser = {
      id: this.generateUserId(),
      name: name,
      email: email.toLowerCase(),
      password: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isNewUser: true,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB for free plan
      plan: 'free',
      files: [],
      folders: [],
      settings: {
        notifications: true,
        twoFactor: false,
        theme: 'light'
      }
    };

    users.push(newUser);
    localStorage.setItem(this.storageKey, JSON.stringify(users));

    // Create session
    this.createSession(newUser);

    return {
      success: true,
      message: 'Account created successfully!',
      user: this.sanitizeUser(newUser),
      isNewUser: true
    };
  }

  // Login user
  login(email, password) {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required'
      };
    }

    // Get user
    const user = this.getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Verify password
    const hashedPassword = this.hashPassword(password);
    if (user.password !== hashedPassword) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Update last login
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex].lastLogin = new Date().toISOString();
    
    // Mark as not new user after first login
    const isReturningUser = users[userIndex].isNewUser === false;
    users[userIndex].isNewUser = false;
    
    localStorage.setItem(this.storageKey, JSON.stringify(users));

    // Create session
    this.createSession(users[userIndex]);

    return {
      success: true,
      message: 'Login successful!',
      user: this.sanitizeUser(users[userIndex]),
      isNewUser: false,
      isReturningUser: isReturningUser
    };
  }

  // Create session
  createSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    localStorage.setItem(this.currentUserKey, JSON.stringify(this.sanitizeUser(user)));
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  // Get current session
  getCurrentSession() {
    const session = sessionStorage.getItem(this.sessionKey);
    if (!session) return null;

    const sessionData = JSON.parse(session);
    
    // Check if session expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      this.logout();
      return null;
    }

    return sessionData;
  }

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem(this.currentUserKey);
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getCurrentSession();
    return session !== null;
  }

  // Logout
  logout() {
    localStorage.removeItem(this.currentUserKey);
    sessionStorage.removeItem(this.sessionKey);
    window.location.href = 'index.html';
  }

  // Remove sensitive data from user object
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Update user profile
  updateProfile(userId, updates) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Update user data
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(users));
    localStorage.setItem(this.currentUserKey, JSON.stringify(this.sanitizeUser(users[userIndex])));

    return {
      success: true,
      message: 'Profile updated successfully',
      user: this.sanitizeUser(users[userIndex])
    };
  }

  // Change password
  changePassword(userId, currentPassword, newPassword) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Verify current password
    const hashedCurrentPassword = this.hashPassword(currentPassword);
    if (users[userIndex].password !== hashedCurrentPassword) {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters long'
      };
    }

    // Update password
    users[userIndex].password = this.hashPassword(newPassword);
    users[userIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem(this.storageKey, JSON.stringify(users));

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  // Delete account
  deleteAccount(userId, password) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Verify password
    const hashedPassword = this.hashPassword(password);
    if (users[userIndex].password !== hashedPassword) {
      return {
        success: false,
        message: 'Incorrect password'
      };
    }

    // Remove user
    users.splice(userIndex, 1);
    localStorage.setItem(this.storageKey, JSON.stringify(users));
    
    // Logout
    this.logout();

    return {
      success: true,
      message: 'Account deleted successfully'
    };
  }

  // Get user initials for avatar
  getUserInitials(name) {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Format storage size
  formatStorageSize(bytes) {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Calculate storage percentage
  getStoragePercentage(storageUsed, storageLimit) {
    return Math.round((storageUsed / storageLimit) * 100);
  }
}

// Initialize auth system
const auth = new CloudDropAuth();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudDropAuth;
}