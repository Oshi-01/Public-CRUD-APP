// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to get API URL (uses config if available)
function getApiUrl(path) {
  if (window.API_CONFIG && window.API_CONFIG.getApiUrl) {
    return window.API_CONFIG.getApiUrl(path);
  }
  return path; // Fallback to relative path
}

// Helper function to fetch JSON data
async function fetchJSON(url) {
  const apiUrl = getApiUrl(url);
  const res = await fetch(apiUrl, {
    credentials: 'include', // Include cookies for authentication
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Helper function to send PUT data
async function putJSON(url, data) {
  const apiUrl = getApiUrl(url);
  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Helper function to send POST data
async function postJSON(url, data) {
  const apiUrl = getApiUrl(url);
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Update status bar
function updateStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.className = `status-bar ${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'spinner fa-spin';
  
  statusDiv.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
}

// Update stat cards
function updateStats(contactsCount, companiesCount, dealsCount) {
  // Ensure counts are numbers
  const contacts = Number(contactsCount) || 0;
  const companies = Number(companiesCount) || 0;
  const deals = Number(dealsCount) || 0;
  
  const contactsEl = document.getElementById('contactsCount');
  const companiesEl = document.getElementById('companiesCount');
  const dealsEl = document.getElementById('dealsCount');
  
  if (contactsEl) contactsEl.textContent = contacts.toLocaleString();
  if (companiesEl) companiesEl.textContent = companies.toLocaleString();
  if (dealsEl) dealsEl.textContent = deals.toLocaleString();
  
  // Add card classes for styling
  const contactsCard = document.getElementById('contactsCard');
  const companiesCard = document.getElementById('companiesCard');
  const dealsCard = document.getElementById('dealsCard');
  
  if (contactsCard) contactsCard.classList.add('contacts-card');
  if (companiesCard) companiesCard.classList.add('companies-card');
  if (dealsCard) dealsCard.classList.add('deals-card');
}

// Render contacts table
function renderContacts(data) {
  const contactsTable = document.querySelector('#contactsTable tbody');
  contactsTable.innerHTML = '';
  
  if (data.results && data.results.length > 0) {
    data.results.forEach(contact => {
      const props = contact.properties;
      const contactId = contact.id;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${props.firstname || '-'}</td>
        <td>${props.lastname || '-'}</td>
        <td><a href="mailto:${props.email || ''}" style="color: var(--primary-color); text-decoration: none;">${props.email || '-'}</a></td>
        <td>
          <button class="btn-preview" data-type="contact" data-id="${contactId}" title="Preview Contact">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-edit" data-contact-id="${contactId}" data-contact-data='${JSON.stringify({id: contactId, ...props})}' title="Edit Contact">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      contactsTable.appendChild(row);
    });
    
    // Add event listeners to preview buttons
    document.querySelectorAll('.btn-preview[data-type="contact"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const contactId = btn.getAttribute('data-id');
        openPreview('contact', contactId);
      });
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit[data-contact-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.btn-edit');
        const contactData = JSON.parse(button.getAttribute('data-contact-data'));
        openEditContactModal(contactData);
      });
    });
    
    // Show pagination if there are results
    const paginationDiv = document.getElementById('contactsPagination');
    if (paginationDiv && (data.hasMore || paginationState.contacts.page > 1)) {
      paginationDiv.style.display = 'flex';
    }
  } else {
    contactsTable.innerHTML = `
      <tr>
        <td colspan="4" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>No contacts found.</span>
        </td>
      </tr>
    `;
    // Hide pagination if no results
    const paginationDiv = document.getElementById('contactsPagination');
    if (paginationDiv) paginationDiv.style.display = 'none';
  }
  
  return data.results?.length || 0;
}

// Render companies table
function renderCompanies(data) {
  const companiesTable = document.querySelector('#companiesTable tbody');
  companiesTable.innerHTML = '';
  
  if (data.results && data.results.length > 0) {
    data.results.forEach(company => {
      const props = company.properties;
      const companyId = company.id;
      const domain = props.domain ? 
        `<a href="https://${props.domain}" target="_blank" style="color: var(--primary-color); text-decoration: none;">${props.domain}</a>` : 
        '-';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${props.name || '-'}</td>
        <td>${domain}</td>
        <td>
          <button class="btn-preview" data-type="company" data-id="${companyId}" title="Preview Company">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-edit" data-company-id="${companyId}" data-company-data='${JSON.stringify({id: companyId, ...props})}' title="Edit Company">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      companiesTable.appendChild(row);
    });
    
    // Add event listeners to preview buttons
    document.querySelectorAll('.btn-preview[data-type="company"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const companyId = btn.getAttribute('data-id');
        openPreview('company', companyId);
      });
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit[data-company-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.btn-edit');
        const companyData = JSON.parse(button.getAttribute('data-company-data'));
        openEditCompanyModal(companyData);
      });
    });
    
    // Show pagination if there are results
    const paginationDiv = document.getElementById('companiesPagination');
    if (paginationDiv && (data.hasMore || paginationState.companies.page > 1)) {
      paginationDiv.style.display = 'flex';
    }
  } else {
    companiesTable.innerHTML = `
      <tr>
        <td colspan="3" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>No companies found.</span>
        </td>
      </tr>
    `;
    // Hide pagination if no results
    const paginationDiv = document.getElementById('companiesPagination');
    if (paginationDiv) paginationDiv.style.display = 'none';
  }
  
  return data.results?.length || 0;
}

// Render deals table
function renderDeals(data) {
  const dealsTable = document.querySelector('#dealsTable tbody');
  dealsTable.innerHTML = '';
  
  if (data.results && data.results.length > 0) {
    let totalAmount = 0;
    
    data.results.forEach(deal => {
      const props = deal.properties;
      const dealId = deal.id;
      const amount = props.amount ? parseFloat(props.amount) : 0;
      totalAmount += amount;
      
      const formattedAmount = props.amount ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      const stage = props.dealstage || '-';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${props.dealname || '-'}</td>
        <td style="font-weight: 600; color: var(--success-color);">${formattedAmount}</td>
        <td><span style="background: #e0f2fe; color: var(--companies-color); padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${stage}</span></td>
        <td>
          <button class="btn-preview" data-type="deal" data-id="${dealId}" title="Preview Deal">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-edit" data-deal-id="${dealId}" data-deal-data='${JSON.stringify({id: dealId, ...props})}' title="Edit Deal">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      dealsTable.appendChild(row);
    });
    
    // Add event listeners to preview buttons
    document.querySelectorAll('.btn-preview[data-type="deal"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dealId = btn.getAttribute('data-id');
        openPreview('deal', dealId);
      });
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit[data-deal-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.btn-edit');
        const dealData = JSON.parse(button.getAttribute('data-deal-data'));
        openEditDealModal(dealData);
      });
    });
    
    // Show pagination if there are results
    const paginationDiv = document.getElementById('dealsPagination');
    if (paginationDiv && (data.hasMore || paginationState.deals.page > 1)) {
      paginationDiv.style.display = 'flex';
    }
  } else {
    dealsTable.innerHTML = `
      <tr>
        <td colspan="4" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>No deals found.</span>
        </td>
      </tr>
    `;
    // Hide pagination if no results
    const paginationDiv = document.getElementById('dealsPagination');
    if (paginationDiv) paginationDiv.style.display = 'none';
  }
  
  return data.results?.length || 0;
}

// Check authentication and redirect to login if not authenticated
async function checkAuth() {
  try {
    const accountData = await fetchJSON('/api/account');
    if (!accountData || !accountData.accountName) {
      // Not authenticated, redirect to login
      window.location.href = '/login.html';
      return false;
    }
    return true;
  } catch (error) {
    // Not authenticated, redirect to login
    console.log('Not authenticated, redirecting to login');
    window.location.href = '/login.html';
    return false;
  }
}

// Load account information
async function loadAccountInfo() {
  try {
    const accountData = await fetchJSON('/api/account');
    const accountInfo = document.getElementById('accountInfo');
    const accountName = document.getElementById('accountName');
    
    if (accountData && accountData.accountName) {
      accountName.textContent = accountData.accountName;
      accountInfo.style.display = 'flex';
      console.log('Account info loaded:', accountData.accountName);
    } else {
      accountInfo.style.display = 'none';
      // Redirect to login if not authenticated
      window.location.href = '/login.html';
    }
  } catch (error) {
    // Not connected or error fetching account info
    console.log('Account info not available:', error.message);
    const accountInfo = document.getElementById('accountInfo');
    if (accountInfo) {
      accountInfo.style.display = 'none';
    }
    // Redirect to login if not authenticated
    window.location.href = '/login.html';
  }
}

// Pagination state
const paginationState = {
  contacts: { cursor: null, hasMore: false, page: 1 },
  companies: { cursor: null, hasMore: false, page: 1 },
  deals: { cursor: null, hasMore: false, page: 1 }
};

// Load contacts with pagination
async function loadContacts(after = null) {
  const url = after ? `/api/contacts?after=${after}&limit=20` : '/api/contacts?limit=20';
  const data = await fetchJSON(url);
  
  const contactsCount = renderContacts(data);
  
  // Update pagination state and controls
  if (data.paging) {
    paginationState.contacts.cursor = data.paging.next;
    paginationState.contacts.hasMore = data.hasMore || false;
    updatePaginationControls('contacts', data.paging, data.hasMore);
  }
  
  // Stats are now updated separately via loadTotalCounts()
  
  return data;
}

// Load companies with pagination
async function loadCompanies(after = null) {
  const url = after ? `/api/companies?after=${after}&limit=20` : '/api/companies?limit=20';
  const data = await fetchJSON(url);
  
  const companiesCount = renderCompanies(data);
  
  // Update pagination state and controls
  if (data.paging) {
    paginationState.companies.cursor = data.paging.next;
    paginationState.companies.hasMore = data.hasMore || false;
    updatePaginationControls('companies', data.paging, data.hasMore);
  }
  
  // Stats are now updated separately via loadTotalCounts()
  
  return data;
}

// Load deals with pagination
async function loadDeals(after = null) {
  const url = after ? `/api/deals?after=${after}&limit=20` : '/api/deals?limit=20';
  const data = await fetchJSON(url);
  
  const dealsCount = renderDeals(data);
  
  // Update pagination state and controls
  if (data.paging) {
    paginationState.deals.cursor = data.paging.next;
    paginationState.deals.hasMore = data.hasMore || false;
    updatePaginationControls('deals', data.paging, data.hasMore);
  }
  
  // Stats are now updated separately via loadTotalCounts()
  
  return data;
}

// Update pagination controls
function updatePaginationControls(type, paging, hasMore) {
  const paginationDiv = document.getElementById(`${type}Pagination`);
  const prevBtn = document.getElementById(`${type}PrevBtn`);
  const nextBtn = document.getElementById(`${type}NextBtn`);
  const pageInfo = document.getElementById(`${type}PageInfo`);
  
  if (!paginationDiv || !prevBtn || !nextBtn || !pageInfo) return;
  
  // Show pagination if there are results
  if (hasMore || paginationState[type].page > 1) {
    paginationDiv.style.display = 'flex';
  }
  
  // Update state
  paginationState[type].cursor = paging.next;
  paginationState[type].hasMore = hasMore;
  
  // Update buttons
  prevBtn.disabled = paginationState[type].page === 1;
  nextBtn.disabled = !hasMore;
  
  // Update page info
  pageInfo.textContent = `Page ${paginationState[type].page}`;
}

// Load total counts for stats cards
async function loadTotalCounts() {
  try {
    console.log('=== Loading total counts ===');
    
    const contactsPromise = fetchJSON('/api/contacts/count')
      .then(res => {
        console.log('✅ Contacts count response:', res);
        return res;
      })
      .catch(err => {
        console.error('❌ Contacts count error:', err);
        return { total: 0 };
      });
    
    const companiesPromise = fetchJSON('/api/companies/count')
      .then(res => {
        console.log('✅ Companies count response:', res);
        return res;
      })
      .catch(err => {
        console.error('❌ Companies count error:', err);
        return { total: 0 };
      });
    
    const dealsPromise = fetchJSON('/api/deals/count')
      .then(res => {
        console.log('✅ Deals count response:', res);
        return res;
      })
      .catch(err => {
        console.error('❌ Deals count error:', err);
        return { total: 0 };
      });

    const [contactsCountRes, companiesCountRes, dealsCountRes] = await Promise.all([
      contactsPromise,
      companiesPromise,
      dealsPromise,
    ]);

    console.log('Raw responses:', {
      contacts: contactsCountRes,
      companies: companiesCountRes,
      deals: dealsCountRes
    });

    // Extract total from response - backend returns { total: number }
    const counts = {
      contacts: Number(contactsCountRes?.total || 0),
      companies: Number(companiesCountRes?.total || 0),
      deals: Number(dealsCountRes?.total || 0),
    };

    console.log('=== Final parsed counts ===', counts);
    return counts;
  } catch (error) {
    console.error('Error loading total counts:', error);
    return { contacts: 0, companies: 0, deals: 0 };
  }
}

// Load and render dashboard data
async function loadDashboard() {
  updateStatus('Loading data...', 'info');

  try {
    // Reset pagination state
    paginationState.contacts = { cursor: null, hasMore: false, page: 1 };
    paginationState.companies = { cursor: null, hasMore: false, page: 1 };
    paginationState.deals = { cursor: null, hasMore: false, page: 1 };
    
    // Fetch all data and counts in parallel
    const [contactsData, companiesData, dealsData, counts] = await Promise.all([
      loadContacts(),
      loadCompanies(),
      loadDeals(),
      loadTotalCounts(),
    ]);

    // Update stat cards with total counts from HubSpot
    if (counts) {
      updateStats(
        counts.contacts || 0,
        counts.companies || 0,
        counts.deals || 0
      );
    } else {
      console.warn('Counts object is undefined or null');
      updateStats(0, 0, 0);
    }

    // Update status
    updateStatus('Dashboard loaded successfully!', 'success');
    
    // Load account info on successful connection
    await loadAccountInfo();

  } catch (error) {
    console.error('Error loading dashboard:', error);
    updateStatus('Not authorized or error loading data. Click "Connect HubSpot" to connect your account.', 'error');
    
    // Clear tables
    document.querySelector('#contactsTable tbody').innerHTML = `
      <tr>
        <td colspan="3" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>Not loaded.</span>
        </td>
      </tr>
    `;
    document.querySelector('#companiesTable tbody').innerHTML = `
      <tr>
        <td colspan="2" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>Not loaded.</span>
        </td>
      </tr>
    `;
    document.querySelector('#dealsTable tbody').innerHTML = `
      <tr>
        <td colspan="3" class="empty-message">
          <i class="fas fa-inbox"></i>
          <span>Not loaded.</span>
        </td>
      </tr>
    `;
    
    // Reset stats
    updateStats(0, 0, 0);
    
    // Hide account info if not connected
    await loadAccountInfo();
  }
}

// Tab navigation handler
function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.dashboard-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetSection = tab.getAttribute('data-section');

      // Remove active class from all tabs and sections
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked tab and corresponding section
      tab.classList.add('active');
      document.getElementById(`${targetSection}Section`).classList.add('active');
    });
  });
}

// No login button on dashboard anymore - it's on login page

// Logout button click handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      // Use API base URL so this works both locally and in production (Vercel + Render)
      const logoutUrl = (window.API_CONFIG && window.API_CONFIG.getApiUrl)
        ? window.API_CONFIG.getApiUrl('/logout')
        : '/logout';
      window.location.href = logoutUrl;
    }
  });
}

// Modal management functions
function openModal(modalId) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById(modalId);
  if (overlay && modal) {
    // Hide all modals first
    overlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    // Show the requested modal
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById(modalId);
  if (overlay && modal) {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Initialize modal close handlers
function initModals() {
  const overlay = document.getElementById('modalOverlay');
  const closeButtons = document.querySelectorAll('.modal-close, .btn-cancel');
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      const activeModal = overlay.querySelector('.modal.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });

  // Close on close/cancel button click
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.getAttribute('data-modal');
      if (modalId) {
        closeModal(modalId);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      const activeModal = overlay.querySelector('.modal.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
}

// Create button click handlers
function initCreateButtons() {
  const createButtons = document.querySelectorAll('.btn-create');
  createButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const type = e.target.closest('.btn-create').getAttribute('data-type');
      const modalId = `${type}Modal`;
      openModal(modalId);
    });
  });
}

// Form submission handlers
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const formData = new FormData(form);
    const data = {
      properties: {
        firstname: formData.get('firstname'),
        lastname: formData.get('lastname'),
        email: formData.get('email'),
      }
    };

    await postJSON('/api/contacts', data);
    updateStatus('Contact created successfully!', 'success');
    closeModal('contactModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error creating contact:', error);
    updateStatus(`Failed to create contact: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function handleCompanySubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const formData = new FormData(form);
    const data = {
      properties: {
        name: formData.get('name'),
        domain: formData.get('domain') || undefined,
      }
    };

    await postJSON('/api/companies', data);
    updateStatus('Company created successfully!', 'success');
    closeModal('companyModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error creating company:', error);
    updateStatus(`Failed to create company: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function handleDealSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const formData = new FormData(form);
    const data = {
      properties: {
        dealname: formData.get('dealname'),
        amount: formData.get('amount'),
        dealstage: formData.get('dealstage') || undefined,
      }
    };

    await postJSON('/api/deals', data);
    updateStatus('Deal created successfully!', 'success');
    closeModal('dealModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error creating deal:', error);
    updateStatus(`Failed to create deal: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Open edit contact modal
async function openEditContactModal(contactData) {
  // Populate form fields
  document.getElementById('editContactId').value = contactData.id;
  document.getElementById('editContactFirstName').value = contactData.firstname || '';
  document.getElementById('editContactLastName').value = contactData.lastname || '';
  document.getElementById('editContactEmail').value = contactData.email || '';
  
  // Clear association fields
  document.getElementById('editContactCompanySearch').value = '';
  document.getElementById('editContactDealSearch').value = '';
  document.getElementById('editContactCompany').value = '';
  document.getElementById('editContactDeal').value = '';
  
  // Load companies and deals for associations
  await loadCompaniesForAssociation();
  await loadDealsForAssociation();
  
  // Open modal
  openModal('editContactModal');
}

// Store companies and deals data for search
let companiesDataStore = [];
let dealsDataStore = [];

// Load companies for association dropdown
async function loadCompaniesForAssociation() {
  try {
    const companiesData = await fetchJSON('/api/companies');
    companiesDataStore = companiesData.results || [];
    
    const companySelect = document.getElementById('editContactCompany');
    const companySearch = document.getElementById('editContactCompanySearch');
    const companyDropdown = document.getElementById('editContactCompanyDropdown');
    
    // Clear previous options
    companySelect.innerHTML = '<option value="">Select a company...</option>';
    companySearch.value = '';
    
    // Populate hidden select and store data
    if (companiesDataStore.length > 0) {
      companiesDataStore.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.properties.name || `Company ${company.id}`;
        companySelect.appendChild(option);
      });
    }
    
    // Initialize searchable dropdown
    initSearchableDropdown('company', companySearch, companyDropdown, companySelect, companiesDataStore);
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

// Load deals for association dropdown
async function loadDealsForAssociation() {
  try {
    const dealsData = await fetchJSON('/api/deals');
    dealsDataStore = dealsData.results || [];
    
    const dealSelect = document.getElementById('editContactDeal');
    const dealSearch = document.getElementById('editContactDealSearch');
    const dealDropdown = document.getElementById('editContactDealDropdown');
    
    // Clear previous options
    dealSelect.innerHTML = '<option value="">Select a deal...</option>';
    dealSearch.value = '';
    
    // Populate hidden select and store data
    if (dealsDataStore.length > 0) {
      dealsDataStore.forEach(deal => {
        const option = document.createElement('option');
        option.value = deal.id;
        option.textContent = deal.properties.dealname || `Deal ${deal.id}`;
        dealSelect.appendChild(option);
      });
    }
    
    // Initialize searchable dropdown
    initSearchableDropdown('deal', dealSearch, dealDropdown, dealSelect, dealsDataStore);
  } catch (error) {
    console.error('Error loading deals:', error);
  }
}

// Initialize searchable dropdown functionality
function initSearchableDropdown(type, searchInput, dropdown, select, dataStore) {
  let selectedId = null;
  let selectedName = '';
  let searchTimeout = null;
  
  // Filter function with debounce and API search
  async function filterItems(searchTerm) {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search - wait 300ms after user stops typing
    searchTimeout = setTimeout(async () => {
      if (searchTerm.length < 2) {
        // If search term is too short, filter from local data
        const filtered = dataStore.filter(item => {
          const name = type === 'company' 
            ? (item.properties.name || `Company ${item.id}`)
            : (item.properties.dealname || `Deal ${item.id}`);
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
        renderDropdown(filtered);
        return;
      }
      
      // Search via API for better results
      try {
        const searchUrl = type === 'company' 
          ? `/api/companies/search?q=${encodeURIComponent(searchTerm)}&limit=50`
          : `/api/deals/search?q=${encodeURIComponent(searchTerm)}&limit=50`;
        
        const searchData = await fetchJSON(searchUrl);
        renderDropdown(searchData.results || []);
      } catch (error) {
        console.error('Error searching:', error);
        // Fallback to local filtering
        const filtered = dataStore.filter(item => {
          const name = type === 'company' 
            ? (item.properties.name || `Company ${item.id}`)
            : (item.properties.dealname || `Deal ${item.id}`);
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
        renderDropdown(filtered);
      }
    }, 300);
  }
  
  // Render dropdown items
  function renderDropdown(items) {
    dropdown.innerHTML = '';
    
    if (items.length === 0) {
      dropdown.innerHTML = '<div class="searchable-dropdown-empty">No results found</div>';
      dropdown.classList.add('show');
      return;
    }
    
    items.forEach(item => {
      const name = type === 'company' 
        ? (item.properties.name || `Company ${item.id}`)
        : (item.properties.dealname || `Deal ${item.id}`);
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'searchable-dropdown-item';
      if (selectedId === item.id) {
        itemDiv.classList.add('selected');
      }
      itemDiv.textContent = name;
      itemDiv.dataset.id = item.id;
      itemDiv.dataset.name = name;
      
      itemDiv.addEventListener('click', () => {
        selectedId = item.id;
        selectedName = name;
        searchInput.value = name;
        select.value = item.id;
        dropdown.classList.remove('show');
        
        // Update selected state
        dropdown.querySelectorAll('.searchable-dropdown-item').forEach(el => {
          el.classList.remove('selected');
        });
        itemDiv.classList.add('selected');
      });
      
      dropdown.appendChild(itemDiv);
    });
    
    dropdown.classList.add('show');
  }
  
  // Search input handler
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length === 0) {
      dropdown.classList.remove('show');
      select.value = '';
      selectedId = null;
      selectedName = '';
      return;
    }
    
    // Show dropdown immediately for local filtering, API search will update it
    if (searchTerm.length < 2) {
      const filtered = dataStore.filter(item => {
        const name = type === 'company' 
          ? (item.properties.name || `Company ${item.id}`)
          : (item.properties.dealname || `Deal ${item.id}`);
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      renderDropdown(filtered);
    } else {
      filterItems(searchTerm);
    }
  });
  
  // Focus handler
  searchInput.addEventListener('focus', () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm.length > 0) {
      if (searchTerm.length < 2) {
        const filtered = dataStore.filter(item => {
          const name = type === 'company' 
            ? (item.properties.name || `Company ${item.id}`)
            : (item.properties.dealname || `Deal ${item.id}`);
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
        renderDropdown(filtered);
      } else {
        filterItems(searchTerm);
      }
    }
  });
  
  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  // Clear selection handler
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('show');
    }
  });
}

// Handle edit contact form submission
async function handleEditContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const formData = new FormData(form);
    const contactId = formData.get('contactId');
    const companyId = formData.get('company');
    const dealId = formData.get('deal');
    
    const data = {
      properties: {
        firstname: formData.get('firstname'),
        lastname: formData.get('lastname'),
        email: formData.get('email'),
      }
    };

    // Update contact properties
    await putJSON(`/api/contacts/${contactId}`, data);
    
    // Associate with company if selected
    if (companyId && companyId.trim() !== '') {
      try {
        const apiUrl = getApiUrl(`/api/contacts/${contactId}/associations/company/${companyId}`);
        console.log('Creating company association:', { contactId, companyId, apiUrl });
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const responseData = await response.json().catch(() => ({}));
        console.log('Association response:', { status: response.status, data: responseData });
        if (!response.ok) {
          throw new Error(responseData.error || responseData.message || 'Failed to associate company');
        }
        console.log('Company association created successfully');
      } catch (assocError) {
        console.error('Error associating company:', assocError);
        updateStatus(`Warning: Could not associate company: ${assocError.message}`, 'warning');
        // Don't fail the whole update if association fails
      }
    }
    
    // Associate with deal if selected
    if (dealId && dealId.trim() !== '') {
      try {
        const apiUrl = getApiUrl(`/api/contacts/${contactId}/associations/deal/${dealId}`);
        console.log('Creating deal association:', { contactId, dealId, apiUrl });
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const responseData = await response.json().catch(() => ({}));
        console.log('Association response:', { status: response.status, data: responseData });
        if (!response.ok) {
          throw new Error(responseData.error || responseData.message || 'Failed to associate deal');
        }
        console.log('Deal association created successfully');
      } catch (assocError) {
        console.error('Error associating deal:', assocError);
        updateStatus(`Warning: Could not associate deal: ${assocError.message}`, 'warning');
        // Don't fail the whole update if association fails
      }
    }

    updateStatus('Contact updated successfully!', 'success');
    closeModal('editContactModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error updating contact:', error);
    updateStatus(`Failed to update contact: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Open edit company modal
function openEditCompanyModal(companyData) {
  // Populate form fields
  document.getElementById('editCompanyId').value = companyData.id;
  document.getElementById('editCompanyName').value = companyData.name || '';
  document.getElementById('editCompanyDomain').value = companyData.domain || '';
  document.getElementById('editCompanyPhone').value = companyData.phone || '';
  document.getElementById('editCompanyWebsite').value = companyData.website || '';
  document.getElementById('editCompanyIndustry').value = companyData.industry || '';
  document.getElementById('editCompanyCity').value = companyData.city || '';
  document.getElementById('editCompanyState').value = companyData.state || '';
  document.getElementById('editCompanyCountry').value = companyData.country || '';
  document.getElementById('editCompanyZip').value = companyData.zip || '';
  
  // Open modal
  openModal('editCompanyModal');
}

// Open edit deal modal
function openEditDealModal(dealData) {
  console.log('Opening edit deal modal with data:', dealData);
  
  // Populate form fields
  const dealIdEl = document.getElementById('editDealId');
  const dealNameEl = document.getElementById('editDealName');
  const dealAmountEl = document.getElementById('editDealAmount');
  const dealStageEl = document.getElementById('editDealStage');
  
  if (!dealIdEl || !dealNameEl || !dealAmountEl || !dealStageEl) {
    console.error('Edit deal modal elements not found!');
    return;
  }
  
  dealIdEl.value = dealData.id || '';
  dealNameEl.value = dealData.dealname || '';
  dealAmountEl.value = dealData.amount || '';
  dealStageEl.value = dealData.dealstage || '';
  
  // Open modal
  openModal('editDealModal');
}

// Handle edit company form submission
async function handleEditCompanySubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const formData = new FormData(form);
    const companyId = formData.get('companyId');
    
    const data = {
      properties: {
        name: formData.get('name'),
        domain: formData.get('domain') || undefined,
        phone: formData.get('phone') || undefined,
        website: formData.get('website') || undefined,
        industry: formData.get('industry') || undefined,
        city: formData.get('city') || undefined,
        state: formData.get('state') || undefined,
        country: formData.get('country') || undefined,
        zip: formData.get('zip') || undefined,
      }
    };

    await putJSON(`/api/companies/${companyId}`, data);
    updateStatus('Company updated successfully!', 'success');
    closeModal('editCompanyModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error updating company:', error);
    updateStatus(`Failed to update company: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Handle edit deal form submission
async function handleEditDealSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const formData = new FormData(form);
    const dealId = formData.get('dealId');
    
    const data = {
      properties: {
        dealname: formData.get('dealname'),
        amount: formData.get('amount'),
        dealstage: formData.get('dealstage') || undefined,
      }
    };

    await putJSON(`/api/deals/${dealId}`, data);
    updateStatus('Deal updated successfully!', 'success');
    closeModal('editDealModal');
    await loadDashboard();
  } catch (error) {
    console.error('Error updating deal:', error);
    updateStatus(`Failed to update deal: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Initialize form handlers
function initForms() {
  const contactForm = document.getElementById('contactForm');
  const companyForm = document.getElementById('companyForm');
  const dealForm = document.getElementById('dealForm');
  const editContactForm = document.getElementById('editContactForm');
  const editCompanyForm = document.getElementById('editCompanyForm');
  const editDealForm = document.getElementById('editDealForm');

  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
  if (companyForm) {
    companyForm.addEventListener('submit', handleCompanySubmit);
  }
  if (dealForm) {
    dealForm.addEventListener('submit', handleDealSubmit);
  }
  if (editContactForm) {
    editContactForm.addEventListener('submit', handleEditContactSubmit);
  }
  if (editCompanyForm) {
    editCompanyForm.addEventListener('submit', handleEditCompanySubmit);
  }
  if (editDealForm) {
    editDealForm.addEventListener('submit', handleEditDealSubmit);
  }
}

// Initialize tab navigation
initTabNavigation();

// Initialize modals
initModals();

// Initialize create buttons
initCreateButtons();

// Initialize form handlers
initForms();

// Initialize pagination handlers
function initPagination() {
  // Contacts pagination
  document.getElementById('contactsNextBtn')?.addEventListener('click', async () => {
    if (paginationState.contacts.cursor) {
      paginationState.contacts.page++;
      await loadContacts(paginationState.contacts.cursor);
    }
  });
  
  document.getElementById('contactsPrevBtn')?.addEventListener('click', async () => {
    if (paginationState.contacts.page > 1) {
      paginationState.contacts.page--;
      // HubSpot doesn't provide previous cursor, so reset to first page
      paginationState.contacts.page = 1;
      await loadContacts(null);
    }
  });
  
  // Companies pagination
  document.getElementById('companiesNextBtn')?.addEventListener('click', async () => {
    if (paginationState.companies.cursor) {
      paginationState.companies.page++;
      await loadCompanies(paginationState.companies.cursor);
    }
  });
  
  document.getElementById('companiesPrevBtn')?.addEventListener('click', async () => {
    if (paginationState.companies.page > 1) {
      paginationState.companies.page--;
      paginationState.companies.page = 1;
      await loadCompanies(null);
    }
  });
  
  // Deals pagination
  document.getElementById('dealsNextBtn')?.addEventListener('click', async () => {
    if (paginationState.deals.cursor) {
      paginationState.deals.page++;
      await loadDeals(paginationState.deals.cursor);
    }
  });
  
  document.getElementById('dealsPrevBtn')?.addEventListener('click', async () => {
    if (paginationState.deals.page > 1) {
      paginationState.deals.page--;
      paginationState.deals.page = 1;
      await loadDeals(null);
    }
  });
}

// Initialize pagination
initPagination();

// Check authentication first, then load dashboard
async function initDashboard() {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    await loadAccountInfo();
    await loadDashboard();
  }
}

// Initialize dashboard
initDashboard();

// ========== PREVIEW FUNCTIONALITY ==========

// Open preview modal and load data
async function openPreview(type, id) {
  const modal = document.getElementById('previewModal');
  const titleEl = document.getElementById('previewTitle');
  const contentEl = document.getElementById('previewContent');
  
  // Set title based on type
  const titles = {
    contact: 'Contact Preview',
    company: 'Company Preview',
    deal: 'Deal Preview'
  };
  titleEl.textContent = titles[type] || 'Record Preview';
  
  // Show loading state
  contentEl.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--text-secondary);"></i>
      <p style="margin-top: 16px; color: var(--text-secondary);">Loading preview...</p>
    </div>
  `;
  
  // Open modal
  openModal('previewModal');
  
  try {
    // Fetch full record details and associations (only for contacts)
    const [data, associations] = await Promise.all([
      fetchJSON(`/api/${type}s/${id}`),
      type === 'contact' ? fetchJSON(`/api/${type}s/${id}/associations`).catch(() => ({ companies: [], deals: [] })) : Promise.resolve({ companies: [], deals: [] })
    ]);
    renderPreview(type, data, associations, id);
  } catch (error) {
    console.error('Error loading preview:', error);
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-circle" style="font-size: 32px; color: var(--error-color);"></i>
        <p style="margin-top: 16px; color: var(--error-color);">Failed to load preview</p>
        <p style="margin-top: 8px; color: var(--text-secondary); font-size: 14px;">${error.message}</p>
      </div>
    `;
  }
}

// Render preview content
function renderPreview(type, data, associations = { companies: [], deals: [] }, recordId = null) {
  const contentEl = document.getElementById('previewContent');
  const props = data.properties || {};
  const id = recordId || data.id;
  
  let html = '<div class="preview-container">';
  
  if (type === 'contact') {
    html += `
      <div class="preview-section">
        <h3><i class="fas fa-user"></i> Contact Information</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <label>First Name</label>
            <div>${props.firstname || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Last Name</label>
            <div>${props.lastname || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Email</label>
            <div><a href="mailto:${props.email || ''}">${props.email || '-'}</a></div>
          </div>
          <div class="preview-item">
            <label>Phone</label>
            <div>${props.phone || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Mobile Phone</label>
            <div>${props.mobilephone || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Company</label>
            <div>${props.company || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Website</label>
            <div>${props.website ? `<a href="${props.website}" target="_blank">${props.website}</a>` : '-'}</div>
          </div>
          <div class="preview-item">
            <label>Lifecycle Stage</label>
            <div>${props.lifecyclestage || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Lead Status</label>
            <div>${props.lead_status || props.hs_lead_status || '-'}</div>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'company') {
    html += `
      <div class="preview-section">
        <h3><i class="fas fa-building"></i> Company Information</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <label>Company Name</label>
            <div>${props.name || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Domain</label>
            <div>${props.domain ? `<a href="https://${props.domain}" target="_blank">${props.domain}</a>` : '-'}</div>
          </div>
          <div class="preview-item">
            <label>Phone</label>
            <div>${props.phone || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Website</label>
            <div>${props.website ? `<a href="${props.website}" target="_blank">${props.website}</a>` : '-'}</div>
          </div>
          <div class="preview-item">
            <label>Industry</label>
            <div>${props.industry || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Number of Employees</label>
            <div>${props.numberofemployees ? props.numberofemployees.toLocaleString() : '-'}</div>
          </div>
          <div class="preview-item">
            <label>Annual Revenue</label>
            <div>${props.annualrevenue ? `$${parseFloat(props.annualrevenue).toLocaleString()}` : '-'}</div>
          </div>
          <div class="preview-item">
            <label>City</label>
            <div>${props.city || '-'}</div>
          </div>
          <div class="preview-item">
            <label>State/Province</label>
            <div>${props.state || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Country</label>
            <div>${props.country || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Zip/Postal Code</label>
            <div>${props.zip || '-'}</div>
          </div>
          ${props.description ? `
          <div class="preview-item full-width">
            <label>Description</label>
            <div>${props.description}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (type === 'deal') {
    const amount = props.amount ? parseFloat(props.amount) : 0;
    const formattedAmount = amount > 0 ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
    
    html += `
      <div class="preview-section">
        <h3><i class="fas fa-handshake"></i> Deal Information</h3>
        <div class="preview-grid">
          <div class="preview-item">
            <label>Deal Name</label>
            <div>${props.dealname || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Amount</label>
            <div style="font-weight: 600; color: var(--success-color); font-size: 18px;">${formattedAmount}</div>
          </div>
          <div class="preview-item">
            <label>Deal Stage</label>
            <div><span style="background: #e0f2fe; color: var(--companies-color); padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">${props.dealstage || '-'}</span></div>
          </div>
          <div class="preview-item">
            <label>Pipeline</label>
            <div>${props.pipeline || '-'}</div>
          </div>
          <div class="preview-item">
            <label>Close Date</label>
            <div>${props.closedate ? new Date(props.closedate).toLocaleDateString() : '-'}</div>
          </div>
          ${props.description ? `
          <div class="preview-item full-width">
            <label>Description</label>
            <div>${props.description}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Add associations section (only for contacts)
  if (type === 'contact') {
    const companiesCount = associations.companies?.length || 0;
    const dealsCount = associations.deals?.length || 0;
    
    html += `
      <div class="preview-section">
        <h3>
          <i class="fas fa-link"></i> Associations
          <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary); margin-left: 8px;">
            (${companiesCount} companies, ${dealsCount} deals)
          </span>
        </h3>
        <div class="associations-container">
          <div class="association-group">
            <h4><i class="fas fa-building"></i> Companies (${companiesCount})</h4>
            <div class="association-list" id="companiesList">
              ${companiesCount > 0 ? associations.companies.map(company => `
                <div class="association-item">
                  <div class="association-info">
                    <div class="association-name">${escapeHtml(company.name)}</div>
                    ${company.domain ? `<div class="association-meta">${escapeHtml(company.domain)}</div>` : ''}
                    <div class="association-id">ID: ${company.id}</div>
                  </div>
                  <button class="btn-remove-association" data-type="company" data-id="${company.id}" data-contact-id="${id}" title="Remove Association">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `).join('') : '<p style="color: var(--text-secondary); font-size: 14px; padding: 12px;">No companies associated</p>'}
            </div>
            <button class="btn-add-association" data-type="company" data-contact-id="${id}" style="margin-top: 12px;">
              <i class="fas fa-plus"></i> Add Company
            </button>
          </div>
          <div class="association-group">
            <h4><i class="fas fa-handshake"></i> Deals (${dealsCount})</h4>
            <div class="association-list" id="dealsList">
              ${dealsCount > 0 ? associations.deals.map(deal => {
                const amount = deal.amount ? parseFloat(deal.amount) : 0;
                const formattedAmount = amount > 0 ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
                return `
                <div class="association-item">
                  <div class="association-info">
                    <div class="association-name">${escapeHtml(deal.name)}</div>
                    <div class="association-meta">
                      ${formattedAmount ? `<span style="color: var(--success-color); font-weight: 600;">${formattedAmount}</span>` : ''}
                      ${deal.stage ? `<span style="background: #e0f2fe; color: var(--companies-color); padding: 2px 8px; border-radius: 8px; font-size: 12px; margin-left: 8px;">${escapeHtml(deal.stage)}</span>` : ''}
                    </div>
                    <div class="association-id">ID: ${deal.id}</div>
                  </div>
                  <button class="btn-remove-association" data-type="deal" data-id="${deal.id}" data-contact-id="${id}" title="Remove Association">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `;
              }).join('') : '<p style="color: var(--text-secondary); font-size: 14px; padding: 12px;">No deals associated</p>'}
            </div>
            <button class="btn-add-association" data-type="deal" data-contact-id="${id}" style="margin-top: 12px;">
              <i class="fas fa-plus"></i> Add Deal
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Add metadata section
  const createdDate = data.createdAt ? new Date(data.createdAt).toLocaleString() : (props.createdate ? new Date(props.createdate).toLocaleString() : '-');
  const modifiedDate = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : (props.lastmodifieddate ? new Date(props.lastmodifieddate).toLocaleString() : '-');
  
  html += `
    <div class="preview-section">
      <h3><i class="fas fa-info-circle"></i> Metadata</h3>
      <div class="preview-grid">
        <div class="preview-item">
          <label>Record ID</label>
          <div><code>${id}</code></div>
        </div>
        <div class="preview-item">
          <label>Created Date</label>
          <div>${createdDate}</div>
        </div>
        <div class="preview-item">
          <label>Last Modified</label>
          <div>${modifiedDate}</div>
        </div>
      </div>
    </div>
  `;
  
  html += '</div>';
  contentEl.innerHTML = html;
  
  // Add event listeners for association management
  if (type === 'contact') {
    setupAssociationHandlers(id);
  }
}

// Setup association management handlers
function setupAssociationHandlers(contactId) {
  // Remove association buttons
  document.querySelectorAll('.btn-remove-association').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = btn.getAttribute('data-type');
      const associatedId = btn.getAttribute('data-id');
      const contactId = btn.getAttribute('data-contact-id');
      
      if (!confirm(`Are you sure you want to remove this ${type} association?`)) {
        return;
      }
      
      try {
        await fetch(`/api/contacts/${contactId}/associations/${type}/${associatedId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        updateStatus('Association removed successfully', 'success');
        // Reload preview
        openPreview('contact', contactId);
      } catch (error) {
        console.error('Error removing association:', error);
        updateStatus('Failed to remove association', 'error');
      }
    });
  });
  
  // Add association buttons
  document.querySelectorAll('.btn-add-association').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = btn.getAttribute('data-type');
      const contactId = btn.getAttribute('data-contact-id');
      
      await openAddAssociationModal(type, contactId);
    });
  });
}

// Open modal to add association with search
async function openAddAssociationModal(type, contactId) {
  // Get or create modal overlay
  let overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  
  // Remove existing add association modal if it exists
  const existingModal = document.getElementById('addAssociationModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal for searching and selecting a company/deal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'addAssociationModal';
  modal.innerHTML = `
    <div class="modal-header">
      <h2><i class="fas fa-plus"></i> Add ${type === 'company' ? 'Company' : 'Deal'} Association</h2>
      <button class="modal-close" data-modal="addAssociationModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group" style="position: relative;">
        <label for="associationSearch">Search ${type === 'company' ? 'Companies' : 'Deals'} *</label>
        <input type="text" id="associationSearch" placeholder="Type to search ${type === 'company' ? 'companies' : 'deals'}..." autocomplete="off">
        <div id="associationDropdown" class="search-dropdown" style="display: none;"></div>
        <small style="color: var(--text-secondary); margin-top: 4px; display: block;">
          Start typing to search for ${type === 'company' ? 'a company' : 'a deal'} to associate
        </small>
      </div>
      <div id="selectedAssociation" style="display: none; margin-top: 16px; padding: 12px; background: var(--background); border-radius: 8px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div id="selectedName" style="font-weight: 600; color: var(--text-primary);"></div>
            <div id="selectedMeta" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;"></div>
          </div>
          <button type="button" id="clearSelection" class="btn-remove-association" style="margin: 0;">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" data-modal="addAssociationModal">Cancel</button>
        <button type="button" class="btn-submit" id="submitAssociation" disabled>
          <i class="fas fa-check"></i> Add Association
        </button>
      </div>
    </div>
  `;
  
  overlay.appendChild(modal);
  openModal('addAssociationModal');
  
  const searchInput = document.getElementById('associationSearch');
  const dropdown = document.getElementById('associationDropdown');
  const selectedDiv = document.getElementById('selectedAssociation');
  const selectedName = document.getElementById('selectedName');
  const selectedMeta = document.getElementById('selectedMeta');
  const clearBtn = document.getElementById('clearSelection');
  const submitBtn = document.getElementById('submitAssociation');
  let selectedItem = null;
  let searchTimeout = null;
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        const searchUrl = type === 'company' 
          ? `/api/companies/search?q=${encodeURIComponent(query)}&limit=10`
          : `/api/deals/search?q=${encodeURIComponent(query)}&limit=10`;
        
        console.log('Searching:', searchUrl);
        const data = await fetchJSON(searchUrl);
        console.log('Search results:', data);
        const results = data.results || [];
        
        if (results.length === 0) {
          dropdown.innerHTML = '<div class="dropdown-item" style="padding: 12px; color: var(--text-secondary);">No results found</div>';
          dropdown.style.display = 'block';
          return;
        }
        
        dropdown.innerHTML = results.map(item => {
          const props = item.properties || {};
          if (type === 'company') {
            const name = props.name || `Company ${item.id}`;
            const domain = props.domain || '';
            return `
              <div class="dropdown-item association-option" data-id="${item.id}" data-name="${escapeHtml(name)}" data-meta="${escapeHtml(domain)}">
                <div style="font-weight: 600;">${escapeHtml(name)}</div>
                ${domain ? `<div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(domain)}</div>` : ''}
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">ID: ${item.id}</div>
              </div>
            `;
          } else {
            const name = props.dealname || `Deal ${item.id}`;
            const amount = props.amount ? parseFloat(props.amount) : 0;
            const formattedAmount = amount > 0 ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
            return `
              <div class="dropdown-item association-option" data-id="${item.id}" data-name="${escapeHtml(name)}" data-meta="${escapeHtml(formattedAmount || props.dealstage || '')}">
                <div style="font-weight: 600;">${escapeHtml(name)}</div>
                ${formattedAmount ? `<div style="font-size: 12px; color: var(--success-color); font-weight: 600;">${escapeHtml(formattedAmount)}</div>` : ''}
                ${props.dealstage ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(props.dealstage)}</div>` : ''}
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">ID: ${item.id}</div>
              </div>
            `;
          }
        }).join('');
        
        dropdown.style.display = 'block';
        
        // Add click handlers
        dropdown.querySelectorAll('.association-option').forEach(option => {
          option.addEventListener('click', () => {
            selectedItem = {
              id: option.getAttribute('data-id'),
              name: option.getAttribute('data-name'),
              meta: option.getAttribute('data-meta')
            };
            
            selectedName.textContent = selectedItem.name;
            selectedMeta.textContent = selectedItem.meta || `ID: ${selectedItem.id}`;
            selectedDiv.style.display = 'block';
            searchInput.value = '';
            dropdown.style.display = 'none';
            submitBtn.disabled = false;
          });
        });
      } catch (error) {
        console.error('Error searching:', error);
        dropdown.innerHTML = `<div class="dropdown-item" style="padding: 12px; color: var(--error-color);">Error searching: ${error.message || 'Please try again'}</div>`;
        dropdown.style.display = 'block';
      }
    }, 300);
  });
  
  // Clear selection
  clearBtn.addEventListener('click', () => {
    selectedItem = null;
    selectedDiv.style.display = 'none';
    submitBtn.disabled = true;
    searchInput.value = '';
    searchInput.focus();
  });
  
  // Handle submit
  submitBtn.addEventListener('click', async () => {
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    try {
      const response = await fetch(`/api/contacts/${contactId}/associations/${type}/${selectedItem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add association');
      }
      
      updateStatus('Association added successfully', 'success');
      closeModal('addAssociationModal');
      modal.remove();
      
      // Reload preview
      openPreview('contact', contactId);
    } catch (error) {
      console.error('Error adding association:', error);
      alert(`Failed to add association: ${error.message}`);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Add Association';
    }
  });
  
  // Handle modal close
  modal.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('addAssociationModal');
      modal.remove();
    });
  });
  
  // Close dropdown when clicking outside
  const closeDropdownHandler = (e) => {
    if (!modal.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  };
  document.addEventListener('click', closeDropdownHandler);
  
  // Clean up event listener when modal closes
  modal.addEventListener('remove', () => {
    document.removeEventListener('click', closeDropdownHandler);
  });
  
  // Focus search input
  setTimeout(() => searchInput.focus(), 100);
}

