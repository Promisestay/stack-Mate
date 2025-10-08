// dashboard-init.js - Add this to the top of dashboard.html and newdashfor.html

(function() {
  // Initialize auth
  const auth = new CloudDropAuth();

  // Check authentication
  if (!auth.isAuthenticated()) {
    // Not logged in, redirect to home page
    window.location.href = 'index.html';
    return;
  }

  // Get current user
  const currentUser = auth.getCurrentUser();

  // Update UI with user information
  function updateUserInterface() {
    // Update user avatar
    const userAvatars = document.querySelectorAll('.user-avatar');
    const initials = auth.getUserInitials(currentUser.name);
    
    userAvatars.forEach(avatar => {
      avatar.textContent = initials;
      avatar.title = currentUser.name;
    });

    // Update storage information
    const storageUsed = document.querySelector('.storage-text strong');
    const storageFill = document.querySelector('.storage-fill');
    const storagePercentage = auth.getStoragePercentage(currentUser.storageUsed, currentUser.storageLimit);
    
    if (storageUsed) {
      storageUsed.textContent = auth.formatStorageSize(currentUser.storageUsed);
    }
    
    if (storageFill) {
      storageFill.style.width = `${storagePercentage}%`;
    }

    // Update storage text
    const storageTexts = document.querySelectorAll('.storage-info .storage-text');
    if (storageTexts.length > 0) {
      storageTexts[0].innerHTML = `<strong>${auth.formatStorageSize(currentUser.storageUsed)}</strong> of ${auth.formatStorageSize(currentUser.storageLimit)} used`;
      if (storageTexts[1]) {
        storageTexts[1].textContent = `${storagePercentage}% full`;
      }
    }

    // Update welcome messages
    const welcomeTitles = document.querySelectorAll('.welcome-title, .content-title');
    welcomeTitles.forEach(title => {
      if (title.classList.contains('welcome-title')) {
        title.textContent = `Welcome, ${currentUser.name.split(' ')[0]}!`;
      }
    });

    // Add user name to header if element exists
    const userName = document.querySelector('.user-name');
    if (userName) {
      userName.textContent = currentUser.name;
    }
  }

  // Setup user menu
  function setupUserMenu() {
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userAvatar && !userAvatar.hasUserMenu) {
      userAvatar.hasUserMenu = true;
      
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove existing menu
        const existingMenu = document.querySelector('.user-dropdown-menu');
        if (existingMenu) {
          existingMenu.remove();
          return;
        }

        // Create user menu
        const menu = document.createElement('div');
        menu.className = 'user-dropdown-menu';
        menu.style.cssText = `
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          min-width: 250px;
          z-index: 1000;
          overflow: hidden;
        `;

        menu.innerHTML = `
          <div style="padding: 1rem; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 0.25rem;">${currentUser.name}</div>
            <div style="font-size: 0.875rem; color: #64748b;">${currentUser.email}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
              ${currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1)} Plan
            </div>
          </div>
          <div class="menu-item" data-action="profile" style="padding: 0.75rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.3s ease;">
            <i class="fas fa-user" style="width: 20px; color: #64748b;"></i>
            <span style="color: #64748b;">Profile Settings</span>
          </div>
          <div class="menu-item" data-action="storage" style="padding: 0.75rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.3s ease;">
            <i class="fas fa-database" style="width: 20px; color: #64748b;"></i>
            <span style="color: #64748b;">Storage Management</span>
          </div>
          <div class="menu-item" data-action="settings" style="padding: 0.75rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.3s ease;">
            <i class="fas fa-cog" style="width: 20px; color: #64748b;"></i>
            <span style="color: #64748b;">Settings</span>
          </div>
          <div style="border-top: 1px solid #e2e8f0;">
            <div class="menu-item" data-action="logout" style="padding: 0.75rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.3s ease; color: #ef4444;">
              <i class="fas fa-sign-out-alt" style="width: 20px;"></i>
              <span>Logout</span>
            </div>
          </div>
        `;

        // Add hover effects
        const menuItems = menu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
          item.addEventListener('mouseenter', () => {
            item.style.background = '#f8fafc';
          });
          item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
          });
          
          item.addEventListener('click', () => {
            const action = item.dataset.action;
            handleMenuAction(action);
            menu.remove();
          });
        });

        // Position menu
        const rect = userAvatar.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;

        document.body.appendChild(menu);

        // Close menu on outside click
        setTimeout(() => {
          document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          });
        }, 0);
      });
    }
  }

  // Handle menu actions
  function handleMenuAction(action) {
    switch (action) {
      case 'profile':
        showProfileModal();
        break;
      case 'storage':
        showStorageModal();
        break;
      case 'settings':
        showSettingsModal();
        break;
      case 'logout':
        if (confirm('Are you sure you want to logout?')) {
          showNotification('Logging out...');
          setTimeout(() => {
            auth.logout();
          }, 500);
        }
        break;
    }
  }

  // Show profile modal
  function showProfileModal() {
    const modal = createModal('Your Profile', `
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b;">Full Name</label>
        <input type="text" id="profileName" value="${currentUser.name}" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b;">Email</label>
        <input type="email" value="${currentUser.email}" disabled style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; background: #f8fafc; color: #64748b;">
        <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">Email cannot be changed</div>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b;">Member Since</label>
        <div style="color: #64748b;">${new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button onclick="updateProfile()" class="btn btn-primary" style="flex: 1;">Save Changes</button>
        <button onclick="closeModal()" class="btn btn-outline" style="flex: 1;">Cancel</button>
      </div>
    `);

    window.updateProfile = () => {
      const newName = document.getElementById('profileName').value;
      if (newName && newName !== currentUser.name) {
        const result = auth.updateProfile(currentUser.id, { name: newName });
        if (result.success) {
          currentUser.name = newName;
          updateUserInterface();
          showNotification('Profile updated successfully!');
          closeModal();
        }
      } else {
        closeModal();
      }
    };
  }

  // Show storage modal
  function showStorageModal() {
    const percentage = auth.getStoragePercentage(currentUser.storageUsed, currentUser.storageLimit);
    const modal = createModal('Storage Management', `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="font-size: 3rem; font-weight: 700; color: #2563eb; margin-bottom: 0.5rem;">
          ${percentage}%
        </div>
        <div style="color: #64748b; margin-bottom: 1rem;">of your storage is used</div>
        <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 1rem;">
          <div style="height: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8); width: ${percentage}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #64748b;">
          <span>${auth.formatStorageSize(currentUser.storageUsed)} used</span>
          <span>${auth.formatStorageSize(currentUser.storageLimit)} total</span>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 1rem; color: #1e293b;">Need more space?</h4>
        <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.9rem;">Upgrade to Pro plan for 1TB of storage and advanced features.</p>
        <button class="btn btn-primary" style="width: 100%;">
          <i class="fas fa-arrow-up"></i> Upgrade Plan
        </button>
      </div>
      <button onclick="closeModal()" class="btn btn-outline" style="width: 100%;">Close</button>
    `);
  }

  // Show settings modal
  function showSettingsModal() {
    const modal = createModal('Settings', `
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 1rem; color: #1e293b;">Notifications</h4>
        <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border-radius: 8px; cursor: pointer;">
          <span style="color: #64748b;">Email notifications</span>
          <input type="checkbox" ${currentUser.settings.notifications ? 'checked' : ''} style="width: 20px; height: 20px;">
        </label>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 1rem; color: #1e293b;">Security</h4>
        <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer;">
          <span style="color: #64748b;">Two-factor authentication</span>
          <input type="checkbox" ${currentUser.settings.twoFactor ? 'checked' : ''} style="width: 20px; height: 20px;">
        </label>
        <button class="btn btn-outline" style="width: 100%; margin-top: 0.5rem;">
          <i class="fas fa-key"></i> Change Password
        </button>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 1.5rem;">
        <button class="btn btn-outline" style="width: 100%; color: #ef4444; border-color: #ef4444;">
          <i class="fas fa-trash"></i> Delete Account
        </button>
      </div>
    `);
  }

  // Create modal helper
  function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 16px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="color: #1e293b; font-size: 1.5rem;">${title}</h2>
          <button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; padding: 0.25rem;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ${content}
      </div>
    `;

    document.body.appendChild(modal);

    window.closeModal = () => {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => modal.remove(), 300);
    };

    // Add animations
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    return modal;
  }

  // Show notification
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 3000;
      animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateUserInterface();
      setupUserMenu();
    });
  } else {
    updateUserInterface();
    setupUserMenu();
  }

  // Make functions available globally
  window.cloudDropDashboard = {
    updateUserInterface,
    currentUser,
    auth
  };
})();