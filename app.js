// Application State
let currentSearch = null;
let searchHistory = [];
let allResults = [];

// Mock Data
const mockData = {
  sample_errors: [
    {
      code: "ERR_CONNECTION_TIMEOUT",
      description: "Database connection timeout after 30 seconds",
      severity: "P2",
      app: "UserPortal",
      environment: "Prod"
    },
    {
      code: "NULL_POINTER_EXCEPTION",
      description: "NullPointerException in user authentication module",
      severity: "P1", 
      app: "AuthService",
      environment: "Prod"
    }
  ],
  mock_search_results: {
    confluence: [
      {
        title: "Database Connection Timeout Troubleshooting Guide",
        snippet: "Common causes and solutions for database timeout issues. Check connection pool settings, network latency, and database performance metrics.",
        relevance: 0.95,
        url: "https://confluence.company.com/db-timeout-guide",
        tags: ["database", "timeout", "performance"]
      },
      {
        title: "Production Database Configuration Best Practices",
        snippet: "Optimal configuration settings for production databases including connection pooling, timeout values, and monitoring setup.",
        relevance: 0.87,
        url: "https://confluence.company.com/db-config",
        tags: ["database", "configuration", "production"]
      },
      {
        title: "Application Performance Monitoring Setup",
        snippet: "How to set up comprehensive monitoring for application performance issues including database connections and response times.",
        relevance: 0.82,
        url: "https://confluence.company.com/apm-setup",
        tags: ["monitoring", "performance", "apm"]
      }
    ],
    teams: [
      {
        title: "Database timeout issue - RESOLVED",
        snippet: "We had similar timeout issues last month. Fixed by increasing connection pool size from 10 to 25 and optimizing slow queries. Also added connection retry logic.",
        relevance: 0.92,
        url: "https://teams.microsoft.com/channel/db-team",
        tags: ["timeout", "resolved", "connection-pool"]
      },
      {
        title: "Production incident post-mortem",
        snippet: "Analysis of the timeout issues we experienced during high load. Root cause was insufficient connection pooling and database lock contention.",
        relevance: 0.88,
        url: "https://teams.microsoft.com/channel/incidents",
        tags: ["incident", "postmortem", "database"]
      }
    ],
    outlook: [
      {
        title: "RE: Urgent - Database Performance Issues",
        snippet: "The DBA team implemented connection pooling improvements and optimized the most problematic queries. Performance improved by 40%.",
        relevance: 0.78,
        url: "mailto:dba-team@company.com",
        tags: ["database", "performance", "dba"]
      },
      {
        title: "Weekly Infrastructure Report",
        snippet: "Database connection metrics showing improved stability after recent configuration changes. Timeout incidents reduced by 85%.",
        relevance: 0.75,
        url: "mailto:infrastructure@company.com",
        tags: ["infrastructure", "metrics", "database"]
      }
    ],
    local: [
      {
        title: "db_troubleshooting_runbook.pdf",
        snippet: "Step-by-step database troubleshooting procedures including connection timeout diagnosis and resolution steps.",
        relevance: 0.85,
        url: "/docs/db_troubleshooting_runbook.pdf",
        tags: ["runbook", "database", "troubleshooting"]
      },
      {
        title: "production_incident_logs.txt",
        snippet: "Detailed logs from recent production incidents showing connection timeout patterns and resolution steps taken.",
        relevance: 0.80,
        url: "/logs/production_incident_logs.txt",
        tags: ["logs", "incident", "production"]
      }
    ]
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  loadSearchHistory();
});

function initializeEventListeners() {
  // Form submission
  document.getElementById('error-form').addEventListener('submit', handleFormSubmit);
  
  // Clear form
  document.getElementById('clear-form').addEventListener('click', clearForm);
  
  // Export functionality
  document.getElementById('export-pdf').addEventListener('click', exportToPDF);
  document.getElementById('save-search').addEventListener('click', saveSearch);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = getFormData();
  if (!validateForm(formData)) {
    return;
  }
  
  // Show loading state
  toggleLoadingState(true);
  
  try {
    // Step 1: Query Expansion
    await performQueryExpansion(formData);
    
    // Step 2: Show workflow graph
    await initializeWorkflowGraph();
    
    // Step 3: Perform searches
    await performSearches(formData);
    
    // Step 4: Display results
    displayResults();
    
    // Step 5: Show export options
    showExportSection();
    
    // Show success modal
    showModal('success-modal');
    
  } catch (error) {
    console.error('Search error:', error);
    alert('An error occurred during search. Please try again.');
  } finally {
    toggleLoadingState(false);
  }
}

function getFormData() {
  return {
    severity: document.getElementById('severity').value,
    errorCode: document.getElementById('error-code').value,
    errorDescription: document.getElementById('error-description').value,
    appName: document.getElementById('app-name').value,
    environment: document.getElementById('environment').value,
    applicablePool: document.getElementById('applicable-pool').value,
    timestamp: new Date().toISOString()
  };
}

function validateForm(formData) {
  const required = ['severity', 'errorDescription', 'environment'];
  for (const field of required) {
    if (!formData[field] || formData[field].trim() === '') {
      alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
      return false;
    }
  }
  return true;
}

function toggleLoadingState(loading) {
  const submitBtn = document.querySelector('#error-form button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  
  if (loading) {
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    submitBtn.disabled = true;
    showModal('loading-modal');
  } else {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    submitBtn.disabled = false;
    closeModal('loading-modal');
  }
}

async function performQueryExpansion(formData) {
  // Simulate AI processing time
  await sleep(1500);
  
  const originalQuery = `${formData.severity} ${formData.errorCode} ${formData.errorDescription} ${formData.appName} ${formData.environment}`.trim();
  
  // Mock LLM expansion
  const expandedTerms = generateExpandedQuery(formData);
  const keywords = extractKeywords(formData);
  
  // Store in current search
  currentSearch = {
    ...formData,
    originalQuery,
    expandedQuery: expandedTerms,
    keywords: keywords,
    results: {},
    topRecommendations: []
  };
  
  // Show query expansion section
  displayQueryExpansion(originalQuery, expandedTerms, keywords);
}

function generateExpandedQuery(formData) {
  const baseTerms = [];
  
  // Add core terms
  if (formData.errorCode) baseTerms.push(formData.errorCode);
  if (formData.appName) baseTerms.push(formData.appName);
  if (formData.environment) baseTerms.push(formData.environment.toLowerCase());
  
  // Add severity-based terms
  const severityTerms = {
    'P1': ['critical', 'urgent', 'production down', 'outage'],
    'P2': ['high priority', 'performance issue', 'degraded service'],
    'P3': ['medium priority', 'minor issue', 'enhancement']
  };
  
  if (severityTerms[formData.severity]) {
    baseTerms.push(...severityTerms[formData.severity]);
  }
  
  // Add description-based terms
  const description = formData.errorDescription.toLowerCase();
  if (description.includes('timeout')) {
    baseTerms.push('connection timeout', 'network timeout', 'database timeout', 'response timeout');
  }
  if (description.includes('database')) {
    baseTerms.push('db connection', 'sql', 'query performance', 'connection pool');
  }
  if (description.includes('null')) {
    baseTerms.push('null pointer', 'NPE', 'object reference', 'initialization');
  }
  if (description.includes('authentication')) {
    baseTerms.push('auth', 'login', 'security', 'user session');
  }
  
  return baseTerms.join(' | ');
}

function extractKeywords(formData) {
  const keywords = new Set();
  
  // Add form fields as keywords
  if (formData.errorCode) keywords.add(formData.errorCode);
  if (formData.appName) keywords.add(formData.appName);
  keywords.add(formData.environment.toLowerCase());
  keywords.add(formData.severity);
  
  // Extract keywords from description
  const description = formData.errorDescription.toLowerCase();
  const commonKeywords = [
    'timeout', 'connection', 'database', 'error', 'exception', 
    'null', 'authentication', 'performance', 'response', 'query'
  ];
  
  commonKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  return Array.from(keywords);
}

function displayQueryExpansion(original, expanded, keywords) {
  document.getElementById('original-query').textContent = original;
  document.getElementById('expanded-query').textContent = expanded;
  
  const keywordsContainer = document.getElementById('generated-keywords');
  keywordsContainer.innerHTML = keywords.map(keyword => 
    `<span class="keyword-tag">${keyword}</span>`
  ).join('');
  
  document.getElementById('query-expansion-section').classList.remove('hidden');
  document.getElementById('query-expansion-section').classList.add('fade-in');
}

async function initializeWorkflowGraph() {
  await sleep(500);
  
  document.getElementById('graph-section').classList.remove('hidden');
  document.getElementById('graph-section').classList.add('fade-in');
  
  createWorkflowGraph();
}

function createWorkflowGraph() {
  const container = document.getElementById('workflow-graph');
  container.innerHTML = '';
  
  const width = container.clientWidth;
  const height = 400;
  
  const svg = d3.select('#workflow-graph')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Define nodes and links
  const nodes = [
    { id: 'input', name: 'User Input', type: 'input', x: width * 0.1, y: height * 0.5 },
    { id: 'llm', name: 'AI Expansion', type: 'processing', x: width * 0.3, y: height * 0.5 },
    { id: 'confluence', name: 'Confluence', type: 'confluence', x: width * 0.6, y: height * 0.2 },
    { id: 'teams', name: 'Teams', type: 'teams', x: width * 0.6, y: height * 0.4 },
    { id: 'outlook', name: 'Outlook', type: 'outlook', x: width * 0.6, y: height * 0.6 },
    { id: 'local', name: 'Local Disk', type: 'local', x: width * 0.6, y: height * 0.8 },
    { id: 'results', name: 'Results', type: 'results', x: width * 0.9, y: height * 0.5 }
  ];
  
  const links = [
    { source: 'input', target: 'llm' },
    { source: 'llm', target: 'confluence' },
    { source: 'llm', target: 'teams' },
    { source: 'llm', target: 'outlook' },
    { source: 'llm', target: 'local' },
    { source: 'confluence', target: 'results' },
    { source: 'teams', target: 'results' },
    { source: 'outlook', target: 'results' },
    { source: 'local', target: 'results' }
  ];
  
  // Draw links
  svg.selectAll('.link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('x1', d => nodes.find(n => n.id === d.source).x)
    .attr('y1', d => nodes.find(n => n.id === d.source).y)
    .attr('x2', d => nodes.find(n => n.id === d.target).x)
    .attr('y2', d => nodes.find(n => n.id === d.target).y);
  
  // Draw nodes
  const node = svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => `node ${d.type}`)
    .attr('transform', d => `translate(${d.x},${d.y})`);
  
  node.append('circle')
    .attr('r', 30);
  
  node.append('text')
    .attr('dy', 4)
    .text(d => d.name);
  
  // Add tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
  
  node.on('mouseover', function(event, d) {
    tooltip.transition().duration(200).style('opacity', .9);
    tooltip.html(getNodeTooltip(d))
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  })
  .on('mouseout', function() {
    tooltip.transition().duration(500).style('opacity', 0);
  });
}

function getNodeTooltip(node) {
  const tooltips = {
    'input': 'User provides error details and context',
    'llm': 'AI expands query with relevant terms and synonyms',
    'confluence': 'Search corporate documentation and wikis',
    'teams': 'Search team chat messages and discussions',
    'outlook': 'Search email communications and threads',
    'local': 'Search local documents and files',
    'results': 'Aggregate and rank all search results'
  };
  return tooltips[node.id] || node.name;
}

async function performSearches(formData) {
  const sources = ['confluence', 'teams', 'outlook', 'local'];
  const progressBar = document.querySelector('.progress-fill');
  const totalSteps = sources.length;
  
  currentSearch.results = {};
  
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    
    // Update progress
    const progress = ((i + 1) / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update node status in graph
    updateNodeStatus(source, 'processing');
    
    // Simulate search time
    await sleep(800 + Math.random() * 400);
    
    // Perform mock search
    const results = await searchSource(source, formData);
    currentSearch.results[source] = results;
    
    // Update node status
    updateNodeStatus(source, 'completed');
  }
  
  // Generate top recommendations
  currentSearch.topRecommendations = generateTopRecommendations();
  allResults = getAllResultsFlattened();
}

function updateNodeStatus(sourceId, status) {
  const node = d3.select(`#workflow-graph .node.${sourceId}`);
  node.classed('processing', status === 'processing');
  node.classed('completed', status === 'completed');
}

async function searchSource(source, formData) {
  // Return mock results based on the source
  const sourceResults = mockData.mock_search_results[source] || [];
  
  // Add some randomization to make it feel more realistic
  return sourceResults.map(result => ({
    ...result,
    relevance: Math.max(0.5, result.relevance + (Math.random() - 0.5) * 0.1),
    searchTermsMatched: generateMatchedTerms(result, formData)
  }));
}

function generateMatchedTerms(result, formData) {
  const terms = [];
  const description = formData.errorDescription.toLowerCase();
  
  if (description.includes('timeout') && result.tags.includes('timeout')) {
    terms.push('timeout');
  }
  if (description.includes('database') && result.tags.includes('database')) {
    terms.push('database');
  }
  if (formData.errorCode && result.title.toLowerCase().includes(formData.errorCode.toLowerCase())) {
    terms.push(formData.errorCode);
  }
  
  return terms;
}

function generateTopRecommendations() {
  const allResults = [];
  
  // Collect all results from all sources
  Object.keys(currentSearch.results).forEach(source => {
    currentSearch.results[source].forEach(result => {
      allResults.push({
        ...result,
        source: source
      });
    });
  });
  
  // Sort by relevance and return top 3
  return allResults
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

function getAllResultsFlattened() {
  const allResults = [];
  
  Object.keys(currentSearch.results).forEach(source => {
    currentSearch.results[source].forEach(result => {
      allResults.push({
        ...result,
        source: source
      });
    });
  });
  
  return allResults.sort((a, b) => b.relevance - a.relevance);
}

function displayResults() {
  // Show results section
  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('results-section').classList.add('fade-in');
  
  // Update results count
  document.getElementById('results-count').textContent = `${allResults.length} results found`;
  
  // Display top recommendations
  displayTopRecommendations();
  
  // Display results by source
  displayResultsBySource();
}

function displayTopRecommendations() {
  const container = document.getElementById('top-recommendations');
  container.innerHTML = '';
  
  currentSearch.topRecommendations.forEach((result, index) => {
    const card = createRecommendationCard(result, index + 1);
    container.appendChild(card);
  });
}

function createRecommendationCard(result, rank) {
  const card = document.createElement('div');
  card.className = 'recommendation-card fade-in';
  
  card.innerHTML = `
    <div class="recommendation-header">
      <div>
        <div class="recommendation-title">${result.title}</div>
        <div class="recommendation-source">${capitalizeFirst(result.source)}</div>
      </div>
      <div class="relevance-score">${Math.round(result.relevance * 100)}% match</div>
    </div>
    <div class="recommendation-snippet">${result.snippet}</div>
    <div class="recommendation-footer">
      <div class="result-tags">
        ${result.tags.map(tag => `<span class="result-tag">${tag}</span>`).join('')}
      </div>
      <a href="${result.url}" class="view-link" target="_blank">View Source →</a>
    </div>
  `;
  
  return card;
}

function displayResultsBySource() {
  const container = document.getElementById('results-by-source');
  container.innerHTML = '';
  
  Object.keys(currentSearch.results).forEach(source => {
    const sourceResults = currentSearch.results[source];
    if (sourceResults.length === 0) return;
    
    const sourceSection = createSourceSection(source, sourceResults);
    container.appendChild(sourceSection);
  });
}

function createSourceSection(source, results) {
  const section = document.createElement('div');
  section.className = 'source-results fade-in';
  
  const sourceIcons = {
    confluence: '📚',
    teams: '💬',
    outlook: '📧',
    local: '📄'
  };
  
  section.innerHTML = `
    <div class="source-header">
      <span class="source-icon">${sourceIcons[source]}</span>
      <span class="source-name">${capitalizeFirst(source)} Search</span>
      <span class="source-count">${results.length} result${results.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="result-list">
      ${results.map(result => createResultItem(result)).join('')}
    </div>
  `;
  
  return section;
}

function createResultItem(result) {
  return `
    <div class="result-item">
      <div class="result-header">
        <a href="${result.url}" class="result-title" target="_blank">${result.title}</a>
        <div class="result-relevance">${Math.round(result.relevance * 100)}%</div>
      </div>
      <div class="result-snippet">${result.snippet}</div>
      <div class="result-tags">
        ${result.tags.map(tag => `<span class="result-tag">${tag}</span>`).join('')}
      </div>
    </div>
  `;
}

function showExportSection() {
  document.getElementById('export-section').classList.remove('hidden');
  document.getElementById('export-section').classList.add('fade-in');
}

function exportToPDF() {
  if (!currentSearch) {
    alert('No search data to export');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Error Resolution Search Report', 20, 30);
  
  // Timestamp
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
  
  // Original Query
  doc.setFontSize(14);
  doc.text('Original Query:', 20, 60);
  doc.setFontSize(10);
  const originalLines = doc.splitTextToSize(currentSearch.originalQuery, 170);
  doc.text(originalLines, 20, 70);
  
  // Expanded Query
  let yPos = 70 + (originalLines.length * 5) + 10;
  doc.setFontSize(14);
  doc.text('Expanded Search Terms:', 20, yPos);
  doc.setFontSize(10);
  yPos += 10;
  const expandedLines = doc.splitTextToSize(currentSearch.expandedQuery, 170);
  doc.text(expandedLines, 20, yPos);
  
  // Top Recommendations
  yPos += (expandedLines.length * 5) + 20;
  doc.setFontSize(16);
  doc.text('Top 3 Recommendations:', 20, yPos);
  yPos += 10;
  
  currentSearch.topRecommendations.forEach((result, index) => {
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${result.title}`, 25, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.text(`Source: ${capitalizeFirst(result.source)} | Relevance: ${Math.round(result.relevance * 100)}%`, 30, yPos);
    yPos += 5;
    
    const snippetLines = doc.splitTextToSize(result.snippet, 160);
    doc.text(snippetLines, 30, yPos);
    yPos += (snippetLines.length * 4) + 10;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
  });
  
  // Save the PDF
  doc.save(`error-resolution-report-${Date.now()}.pdf`);
}

function saveSearch() {
  if (!currentSearch) {
    alert('No search data to save');
    return;
  }
  
  // Add to search history
  const historyItem = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    query: currentSearch.originalQuery,
    severity: currentSearch.severity,
    resultsCount: allResults.length
  };
  
  searchHistory.unshift(historyItem);
  if (searchHistory.length > 10) {
    searchHistory = searchHistory.slice(0, 10);
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  updateSearchHistoryDisplay();
  
  alert('Search saved successfully!');
}

function loadSearchHistory() {
  const stored = localStorage.getItem('searchHistory');
  if (stored) {
    searchHistory = JSON.parse(stored);
    updateSearchHistoryDisplay();
  }
}

function updateSearchHistoryDisplay() {
  const container = document.getElementById('search-history');
  
  if (searchHistory.length === 0) {
    container.innerHTML = '<p class="text-secondary">No previous searches</p>';
    return;
  }
  
  container.innerHTML = searchHistory.map(item => `
    <div class="search-history-item" onclick="loadHistoryItem(${item.id})">
      <div style="font-weight: 500; margin-bottom: 2px;">${item.severity} - ${item.resultsCount} results</div>
      <div style="font-size: 11px; color: var(--color-text-secondary);">${new Date(item.timestamp).toLocaleDateString()}</div>
      <div style="font-size: 11px; margin-top: 2px;">${item.query.substring(0, 50)}...</div>
    </div>
  `).join('');
}

function clearForm() {
  document.getElementById('error-form').reset();
  
  // Hide all sections
  ['query-expansion-section', 'graph-section', 'results-section', 'export-section'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  
  // Reset state
  currentSearch = null;
  allResults = [];
}

// Modal Functions
function showModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Utility Functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Global click handler for modal closing
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.add('hidden');
  }
});

// Make closeModal globally available
window.closeModal = closeModal;