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
  document.getElementById('contactsCount').textContent = contactsCount.toLocaleString();
  document.getElementById('companiesCount').textContent = companiesCount.toLocaleString();
  document.getElementById('dealsCount').textContent = dealsCount.toLocaleString();
  
  // Add card classes for styling
  document.getElementById('contactsCard').classList.add('contacts-card');
  document.getElementById('companiesCard').classList.add('companies-card');
  document.getElementById('dealsCard').classList.add('deals-card');
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
          <button class="btn-edit" data-contact-id="${contactId}" data-contact-data='${JSON.stringify({id: contactId, ...props})}' title="Edit Contact">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      contactsTable.appendChild(row);
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
          <button class="btn-edit" data-company-id="${companyId}" data-company-data='${JSON.stringify({id: companyId, ...props})}' title="Edit Company">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      companiesTable.appendChild(row);
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
          <button class="btn-edit" data-deal-id="${dealId}" data-deal-data='${JSON.stringify({id: dealId, ...props})}' title="Edit Deal">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      dealsTable.appendChild(row);
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
  
  if (!after) {
    // Update stat card only on initial load
    const currentCount = document.getElementById('contactsCount').textContent;
    if (currentCount === '-' || currentCount === '0') {
      updateStats(contactsCount, 
        parseInt(document.getElementById('companiesCount').textContent) || 0,
        parseInt(document.getElementById('dealsCount').textContent) || 0);
    }
  }
  
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
  
  if (!after) {
    // Update stat card only on initial load
    const currentCount = document.getElementById('companiesCount').textContent;
    if (currentCount === '-' || currentCount === '0') {
      updateStats(parseInt(document.getElementById('contactsCount').textContent) || 0,
        companiesCount,
        parseInt(document.getElementById('dealsCount').textContent) || 0);
    }
  }
  
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
  
  if (!after) {
    // Update stat card only on initial load
    const currentCount = document.getElementById('dealsCount').textContent;
    if (currentCount === '-' || currentCount === '0') {
      updateStats(parseInt(document.getElementById('contactsCount').textContent) || 0,
        parseInt(document.getElementById('companiesCount').textContent) || 0,
        dealsCount);
    }
  }
  
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

// Load and render dashboard data
async function loadDashboard() {
  updateStatus('Loading data...', 'info');

  try {
    // Reset pagination state
    paginationState.contacts = { cursor: null, hasMore: false, page: 1 };
    paginationState.companies = { cursor: null, hasMore: false, page: 1 };
    paginationState.deals = { cursor: null, hasMore: false, page: 1 };
    
    // Fetch all data in parallel
    const [contactsData, companiesData, dealsData] = await Promise.all([
      loadContacts(),
      loadCompanies(),
      loadDeals(),
    ]);

    // Update stat cards with initial counts
    updateStats(
      contactsData.results?.length || 0,
      companiesData.results?.length || 0,
      dealsData.results?.length || 0
    );

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
    if (companyId) {
      try {
        await postJSON(`/api/contacts/${contactId}/associations/company/${companyId}`, {});
      } catch (assocError) {
        console.error('Error associating company:', assocError);
      }
    }
    
    // Associate with deal if selected
    if (dealId) {
      try {
        await postJSON(`/api/contacts/${contactId}/associations/deal/${dealId}`, {});
      } catch (assocError) {
        console.error('Error associating deal:', assocError);
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
