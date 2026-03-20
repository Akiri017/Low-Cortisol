// StardewIDE Application Logic
let currentView = 'ide';
let compileResults = null;
const MOTION_CONFIG = {
  staggerDelayMs: 45,
  maxAnimatedElements: 12,
  refreshClass: 'motion-refresh',
  staggerClass: 'motion-stagger',
  stageDelayMs: 170
};
const STATUS_BADGE_BASE = 'ui-status-badge font-label text-xs font-bold uppercase tracking-widest';
const LIFECYCLE_CLASSES = ['lifecycle-compiling', 'lifecycle-success', 'lifecycle-warning', 'lifecycle-error'];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyPanelRefresh(element) {
  if (!element || prefersReducedMotion()) return;
  element.classList.remove(MOTION_CONFIG.refreshClass);
  // Force reflow so repeated updates retrigger refresh animation.
  void element.offsetWidth;
  element.classList.add(MOTION_CONFIG.refreshClass);
}

function applyStaggeredReveal(elements) {
  if (!elements || elements.length === 0 || prefersReducedMotion()) return;

  const boundedElements = Array.from(elements).slice(0, MOTION_CONFIG.maxAnimatedElements);
  boundedElements.forEach((element, index) => {
    element.classList.remove(MOTION_CONFIG.staggerClass);
    element.style.animationDelay = `${index * MOTION_CONFIG.staggerDelayMs}ms`;
    element.classList.add(MOTION_CONFIG.staggerClass);
  });
}

function transitionIntoView(selectedView) {
  if (!selectedView || prefersReducedMotion()) return;
  selectedView.classList.add('motion-view-enter');
  requestAnimationFrame(() => {
    selectedView.classList.add('motion-view-enter-active');
    selectedView.classList.remove('motion-view-enter');
  });
  setTimeout(() => {
    selectedView.classList.remove('motion-view-enter-active');
  }, 260);
}

function updateCompileButtonState(isCompiling) {
  const compileBtn = document.getElementById('compileBtn');
  if (!compileBtn) return;

  if (isCompiling) {
    compileBtn.classList.add('compiling', 'is-compiling');
    compileBtn.textContent = 'Compiling...';
    return;
  }

  compileBtn.classList.remove('compiling', 'is-compiling');
  compileBtn.textContent = 'Compile Code';
}

function setCompileVisualState(status) {
  const diagnosticCard = document.getElementById('diagnosticCard');
  const resultsBanner = document.getElementById('resultsBanner');
  if (!diagnosticCard || !resultsBanner) return;

  diagnosticCard.classList.remove('state-compiling', 'state-success', 'state-error');
  resultsBanner.classList.remove('state-success', 'state-error');

  if (status === 'compiling') {
    diagnosticCard.classList.add('state-compiling');
  } else if (status === 'success') {
    diagnosticCard.classList.add('state-success');
    resultsBanner.classList.add('state-success');
  } else if (status === 'error') {
    diagnosticCard.classList.add('state-error');
    resultsBanner.classList.add('state-error');
  }
}

function animateSemanticProgress(percent) {
  const fill = document.getElementById('semanticProgressFill');
  if (!fill) return;
  if (prefersReducedMotion()) {
    fill.style.width = `${percent}%`;
    return;
  }
  fill.style.width = '0%';
  requestAnimationFrame(() => {
    fill.style.width = `${percent}%`;
  });
}

function applyRowUpdateHighlights(container) {
  if (!container || prefersReducedMotion()) return;
  const rows = container.querySelectorAll('.ui-table-row');
  rows.forEach((row, idx) => {
    row.classList.remove('row-update-flash');
    row.style.animationDelay = `${Math.min(idx, 10) * 35}ms`;
    row.classList.add('row-update-flash');
  });
}

function delayForMotion(ms) {
  if (prefersReducedMotion()) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

function applyLifecycleState(state) {
  const body = document.body;
  if (!body) return;
  body.classList.remove(...LIFECYCLE_CLASSES);
  const stateClass = `lifecycle-${state}`;
  if (LIFECYCLE_CLASSES.includes(stateClass)) {
    body.classList.add(stateClass);
  }
}

function applyViewStateClasses(activeViewName) {
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.remove('view-active');
    if (view.id === `view-${activeViewName}`) {
      view.classList.add('view-active');
    }
  });
}

function runViewSwitchTransition(selectedView, viewName) {
  applyViewStateClasses(viewName);
  if (!selectedView) return;
  transitionIntoView(selectedView);
}

async function renderCompilationStages(results) {
  updateLexerView(results.lexResult, results.lexExplanation);
  await delayForMotion(MOTION_CONFIG.stageDelayMs);

  updateParserView(results.parseResults, results.parseExplanations);
  await delayForMotion(MOTION_CONFIG.stageDelayMs);

  updateResultsView(results);
}

// Navigation
function switchView(viewName) {
  currentView = viewName;

  // Hide all views
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.add('hidden');
  });

  // Show selected view
  const selectedView = document.getElementById(`view-${viewName}`);
  if (selectedView) {
    selectedView.classList.remove('hidden');
    runViewSwitchTransition(selectedView, viewName);
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.remove('text-[#7d5231]', 'hover:bg-[#ece2c1]');
      item.classList.add('bg-[#91f78e]', 'text-[#332f1d]', 'font-bold');
      item.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
    } else {
      item.classList.add('text-[#7d5231]', 'hover:bg-[#ece2c1]');
      item.classList.remove('bg-[#91f78e]', 'text-[#332f1d]', 'font-bold');
      item.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 0";
    }
  });
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
    });
  });

  // Optional sidebar compile button (if present in future layouts)
  const sidebarCompileBtn = document.getElementById('compileBtn');
  if (sidebarCompileBtn) {
    sidebarCompileBtn.addEventListener('click', compile);
  }

  applyViewStateClasses(currentView);
  applyLifecycleState('ready');
});

// Code editor functions
function loadExample() {
  const examples = [
    `int age : 20.`,
    `int count : 15.
letters season : "Spring".`,
    `decimal price : 99.99.
int quantity : 5.
letters message : "Hello Farmer!".`,
    `bool isRaining : true.
  bool sprinklerOn : 0.
letter grade : 'A'.`,
    `doubleDecimal pi : 3.14159265359.`
  ];
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  document.getElementById('codeInput').value = randomExample;
}

function clearCode() {
  document.getElementById('codeInput').value = '';
  updateStatus('ready', 'Ready to compile', 100);
}

// Compile function
async function compile() {
  const source = document.getElementById('codeInput').value.trim();

  if (!source) {
    showNotification('Please enter some code to compile!', 'error');
    return;
  }

  updateCompileButtonState(true);
  updateStatus('compiling', 'The Junimos are working their magic...', 50);

  try {
    // Import and use the compiler
    const { compileSource } = await import('./compiler.js');
    compileResults = compileSource(source);

    // Update all views with results
    await renderCompilationStages(compileResults);
    showProcessBreakdownPrompt();

    // Show success or errors
    if (compileResults.hasErrors) {
      updateStatus('error', 'Compilation completed with errors', 60);
      applyLifecycleState('warning');
      showNotification('Compilation completed with errors. Check the Semantics tab.', 'warning');
    } else {
      updateStatus('success', 'Compilation completed successfully!', 100);
      applyLifecycleState('success');
      showNotification('Compilation successful! The Junimos are dancing!', 'success');
    }

  } catch (error) {
    console.error('Compilation error:', error);
    updateStatus('error', `Error: ${error.message}`, 0);
    applyLifecycleState('error');
    showNotification(`Compilation failed: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      updateCompileButtonState(false);
    }, 500);
  }
}

function showProcessBreakdownPrompt() {
  const promptCard = document.getElementById('processBreakdownPrompt');
  if (!promptCard) return;

  promptCard.classList.remove('hidden');
}

// Update status display
function updateStatus(status, message, efficiency) {
  const statusBadge = document.getElementById('statusBadge');
  const diagnosticText = document.getElementById('diagnosticText');
  const efficiencyText = document.getElementById('efficiencyText');
  const efficiencyBar = document.getElementById('efficiencyBar');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  diagnosticText.textContent = message;
  efficiencyText.textContent = `${efficiency}%`;
  efficiencyBar.style.width = `${efficiency}%`;
  statusBadge.classList.add('status-pulse');
  statusDot.classList.add('status-pulse');
  setTimeout(() => {
    statusBadge.classList.remove('status-pulse');
    statusDot.classList.remove('status-pulse');
  }, 420);
  setCompileVisualState(status);
  if (status === 'compiling') {
    applyLifecycleState('compiling');
  } else if (status === 'success') {
    applyLifecycleState('success');
  } else if (status === 'error') {
    applyLifecycleState('error');
  }

  // Update colors based on status
  if (status === 'success') {
    statusBadge.textContent = 'Success';
    statusBadge.className = `${STATUS_BADGE_BASE} text-secondary bg-secondary-container`;
    efficiencyBar.className = 'bg-secondary h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,107,27,0.3)]';
    statusText.textContent = 'SUCCESS';
  } else if (status === 'error') {
    statusBadge.textContent = 'Error';
    statusBadge.className = `${STATUS_BADGE_BASE} text-error bg-error-container`;
    efficiencyBar.className = 'bg-error h-2 rounded-full transition-all duration-300';
    statusText.textContent = 'ERROR';
  } else if (status === 'compiling') {
    statusBadge.textContent = 'Compiling';
    statusBadge.className = `${STATUS_BADGE_BASE} text-tertiary bg-tertiary-container`;
    efficiencyBar.className = 'bg-tertiary h-2 rounded-full transition-all duration-300';
    statusText.textContent = 'COMPILING';
  } else {
    statusBadge.textContent = 'Ready';
    statusBadge.className = `${STATUS_BADGE_BASE} text-secondary bg-secondary-container`;
    efficiencyBar.className = 'bg-secondary h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,107,27,0.3)]';
    statusText.textContent = 'READY';
  }

  efficiencyBar.style.width = `${efficiency}%`;
}

// Update Lexer View
function updateLexerView(lexResult, lexExplanation) {
  const source = document.getElementById('codeInput').value;
  const visibleTokens = lexResult.tokens.filter(token => token.type !== 'EOF');
  document.getElementById('lexerSource').textContent = source;
  document.getElementById('lexTime').textContent = '< 0.01s';
  document.getElementById('tokenCount').textContent = `${visibleTokens.length} Items`;

  // Show detailed status including unknowns
  const hasUnknowns = lexResult.unknownCount > 0;
  const hasErrors = lexResult.diagnostics.some(d => d.severity === 'Error');

  if (hasErrors || hasUnknowns) {
    document.getElementById('lexStatus').textContent = `Issues Found (${lexResult.unknownCount} unknown)`;
    document.getElementById('lexStatus').className = 'text-error font-bold';
  } else {
    document.getElementById('lexStatus').textContent = 'Healthy';
    document.getElementById('lexStatus').className = 'text-secondary font-bold';
  }

  const tokenGrid = document.getElementById('tokenGrid');
  tokenGrid.innerHTML = '';
  applyPanelRefresh(tokenGrid);

  // Token type to icon mapping
  const iconMap = {
    'DATATYPE': 'terminal',
    'IDENTIFIER': 'label',
    'ASSIGN_OPERATOR': 'equalizer',
    'NUMERIC_LITERAL': 'filter_2',
    'STRING_LITERAL': 'text_fields',
    'CHAR_LITERAL': 'format_quote',
    'DELIMITER': 'stop_circle',
    'OUTPUT_KEYWORD': 'output',
    'UNKNOWN': 'help',
    'LBRACE': 'code_blocks',
    'RBRACE': 'code_blocks',
    'LESS': 'chevron_left',
    'GREATER': 'chevron_right',
    'PLUS': 'add',
    'MINUS': 'remove',
    'STAR': 'close',
    'SLASH': 'horizontal_rule'
  };

  visibleTokens.forEach((token, index) => {

    const isUnknown = token.type === 'UNKNOWN';
    const tokenCard = document.createElement('div');
    tokenCard.className = `token-health ${isUnknown ? 'token-health-warning' : 'token-health-good'} group relative ui-card-shell-soft p-1 transition-all hover:scale-[1.02] hover:shadow-xl ${isUnknown ? 'ring-2 ring-error' : ''}`;
    tokenCard.innerHTML = `
      <div class="bg-surface-container-lowest h-full rounded-lg p-4 border-2 ${isUnknown ? 'border-error' : 'border-transparent'} group-hover:border-secondary-fixed">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 ${isUnknown ? 'bg-error-container' : 'bg-secondary-fixed'} flex items-center justify-center rounded shadow-sm">
            <span class="material-symbols-outlined ${isUnknown ? 'text-error' : 'text-on-secondary-fixed'} text-3xl">${iconMap[token.type] || 'token'}</span>
          </div>
        </div>
        <div class="text-center">
          <span class="font-label text-[10px] uppercase tracking-widest ${isUnknown ? 'text-error' : 'text-outline'}">${token.type.replace(/_/g, ' ')}</span>
          <h4 class="font-headline font-extrabold ${isUnknown ? 'text-error' : 'text-primary'} text-xl mt-1">${escapeHtml(token.lexeme)}</h4>
        </div>
        <div class="mt-4 pt-4 border-t border-outline-variant/10">
          <div class="${isUnknown ? 'bg-error-container/20' : 'bg-primary-container/20'} p-2 rounded text-[11px] ${isUnknown ? 'text-error' : 'text-on-primary-container'} leading-tight">
            <span class="font-bold block mb-1">${isUnknown ? '⚠️ UNKNOWN:' : 'SHOP NOTE:'}</span>
            Token at position ${token.span.start}-${token.span.end}
          </div>
        </div>
      </div>
    `;
    tokenGrid.appendChild(tokenCard);
  });

  applyStaggeredReveal(tokenGrid.children);

}

// Update Parser View
function updateParserView(parseResults, parseExplanations) {
  const parseResultsDiv = document.getElementById('parseResults');
  const semanticStatus = document.getElementById('semanticStatus');
  const semanticInfo = document.getElementById('semanticInfo');

  parseResultsDiv.innerHTML = '';
  applyPanelRefresh(parseResultsDiv);

  parseResults.forEach((result, index) => {
    const resultCard = document.createElement('div');
    resultCard.className = 'parse-card p-6 ui-card-shell-soft border-l-8 rounded-r-lg space-y-4';
    resultCard.classList.add(result.ok ? 'parse-card-valid' : 'parse-card-invalid');
    resultCard.classList.add(result.ok ? 'border-secondary' : 'border-error');

    const explanation = parseExplanations && parseExplanations[index] ? parseExplanations[index] : [];
    const recoveryCount = result.recoveries ? result.recoveries.length : 0;
    const recoverySummary =
      recoveryCount > 0
        ? `Syntax analysis finished with ${recoveryCount} warning${recoveryCount === 1 ? '' : 's'}. Auto-recovery was applied.`
        : '';
    const structureSummary =
      explanation.find(line => line.includes('Actual structure matches expected rule'))
        ? 'Structure check passed and matched the expected grammar rule.'
        : 'Structure check passed after parser recovery and now matches the expected grammar rule.';

    resultCard.innerHTML = `
      <h3 class="font-headline text-xl ${result.ok ? 'text-secondary' : 'text-error'} font-bold">
        Statement ${index + 1}: ${result.ok ? 'Valid' : 'Invalid'}
      </h3>
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 text-xs font-label uppercase tracking-widest">
          <span class="px-2 py-1 rounded-full bg-primary-container text-on-primary-container">Expected Pattern</span>
          <span class="px-3 py-1 rounded-md bg-surface-container-high font-mono normal-case tracking-normal text-on-surface">${escapeHtml(result.expectedRule)}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-label uppercase tracking-widest">
          <span class="px-2 py-1 rounded-full bg-tertiary-container text-on-tertiary-container">Pattern Received</span>
          <span class="px-3 py-1 rounded-md bg-surface-container-high font-mono normal-case tracking-normal text-on-surface">${escapeHtml(result.actualPattern)}</span>
        </div>
        ${result.recoveries && result.recoveries.length > 0 ? `
          <div class="mt-4 p-3 bg-tertiary-container/20 rounded text-sm">
            <p class="font-bold mb-2">Recovery Actions:</p>
            <ul class="space-y-1">
              ${result.recoveries.map(r => `
                <li>• ${r.strategy}: ${r.message}</li>
              `).join('')}
            </ul>
            <div class="mt-3 p-3 bg-surface-container-lowest rounded border border-tertiary/25">
              <p class="font-headline text-xs uppercase tracking-wider text-tertiary mb-2">Recovery Summary</p>
              <p class="text-xs font-mono text-on-surface-variant">${escapeHtml(structureSummary)}</p>
              <p class="text-xs font-mono text-on-surface-variant">${escapeHtml(recoverySummary)}</p>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    parseResultsDiv.appendChild(resultCard);
  });

  applyStaggeredReveal(parseResultsDiv.children);

  // Update semantic status
  const hasErrors = parseResults.some(r => !r.ok);
  if (hasErrors) {
    semanticStatus.textContent = 'Analysis Complete';
    semanticInfo.innerHTML = `
      <div class="text-center">
        <p class="text-error text-sm font-bold">Syntax warnings found with recovery applied.</p>
        <p class="text-error-dim text-xs mt-2">Review parser cards and adjust statement patterns.</p>
        <div class="semantic-progress-wrap w-full h-2 bg-surface-container-high rounded-full mt-4">
          <div id="semanticProgressFill" class="semantic-progress-fill h-full bg-error rounded-full"></div>
        </div>
      </div>
    `;
    animateSemanticProgress(62);
  } else {
    semanticStatus.textContent = 'Analysis Complete';
    semanticInfo.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-secondary-fixed font-headline font-bold">Analysis Complete</span>
        <span class="text-secondary-fixed font-label text-xs">100% VALIDATED</span>
      </div>
      <div class="semantic-progress-wrap w-full h-2 bg-on-background rounded-full overflow-hidden border border-secondary-fixed/30">
        <div id="semanticProgressFill" class="semantic-progress-fill h-full bg-secondary-fixed shadow-[0_0_10px_#91f78e]"></div>
      </div>
    `;
    animateSemanticProgress(100);
  }

  applyPanelRefresh(semanticInfo);
}

// Update Results View
function updateResultsView(results) {
  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resultsTokenCount = document.getElementById('resultsTokenCount');
  const resultsDiagCount = document.getElementById('resultsDiagCount');
  const diagnosticsPanel = document.getElementById('diagnosticsPanel');
  const symbolTableContent = document.getElementById('symbolTableContent');
  const classTableContent = document.getElementById('classTableContent');
  const semanticActions = document.getElementById('semanticActions');

  // Update header
  if (results.hasErrors) {
    resultIcon.className = 'w-16 h-16 bg-error-container rounded-full flex items-center justify-center border-4 border-white';
    resultIcon.innerHTML = '<span class="material-symbols-outlined text-error text-4xl" style="font-variation-settings: \'FILL\' 1;">error</span>';
    resultTitle.textContent = 'Compilation Completed With Errors';
    resultSubtitle.textContent = 'Review the diagnostics below to fix issues.';
  } else {
    resultIcon.className = 'w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center border-4 border-white animate-pulse';
    resultIcon.innerHTML = '<span class="material-symbols-outlined text-on-secondary-fixed text-4xl" style="font-variation-settings: \'FILL\' 1;">verified</span>';
    resultTitle.textContent = 'Bundle Compiled Successfully!';
    resultSubtitle.textContent = 'The Junimos are dancing in the Crafts Room.';
  }

  // Update stats
  const visibleTokens = results.lexResult.tokens.filter(token => token.type !== 'EOF');
  resultsTokenCount.textContent = visibleTokens.length;

  const allDiagnostics = [
    ...results.lexResult.diagnostics,
    ...results.parseResults.flatMap(r => r.diagnostics),
    ...results.semanticResults.flatMap(r => r.diagnostics)
  ];
  resultsDiagCount.textContent = allDiagnostics.length;

  // Update diagnostics panel
  if (allDiagnostics.length === 0) {
    diagnosticsPanel.innerHTML = `
      <div class="text-center py-8">
        <span class="material-symbols-outlined text-secondary text-6xl mb-4">check_circle</span>
        <h4 class="font-headline font-bold text-secondary text-xl">No Issues Found!</h4>
        <p class="text-on-surface-variant text-sm mt-2">Your code compiled without any warnings or errors.</p>
      </div>
    `;
  } else {
    diagnosticsPanel.innerHTML = `
      <h4 class="font-headline font-bold text-primary mb-4">Diagnostics</h4>
      <div class="space-y-3">
        ${allDiagnostics.map(diag => {
          const severityColor = {
            'Error': 'error',
            'Warning': 'tertiary',
            'Info': 'secondary'
          }[diag.severity] || 'secondary';

          return `
            <div class="diag-row p-4 bg-surface-container-lowest rounded-lg border-l-4 border-${severityColor}">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-${severityColor}">
                  ${diag.severity === 'Error' ? 'error' : diag.severity === 'Warning' ? 'warning' : 'info'}
                </span>
                <div class="flex-1">
                  <p class="font-bold text-sm">${diag.severity}</p>
                  <p class="text-sm text-on-surface-variant">${escapeHtml(diag.message)}</p>
                  ${diag.span ? `<p class="text-xs text-outline mt-1">Position: ${diag.span.start}-${diag.span.end}</p>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  applyPanelRefresh(diagnosticsPanel);

  // Update symbol table
  if (results.symbolTables.length === 0 || results.symbolTables.every(st => st.entries.length === 0)) {
    symbolTableContent.innerHTML = '<p class="text-center text-on-surface-variant italic py-8">No symbols declared in this program.</p>';
  } else {
    symbolTableContent.innerHTML = `
      <div class="space-y-6">
        ${results.symbolTables.flatMap((st, tableIndex) =>
          st.entries.map(entry => `
            <div class="bg-surface-container-lowest rounded-lg p-6 border-2 border-primary/20">
              <div class="ui-panel-header">
                <div class="w-10 h-10 bg-primary rounded flex items-center justify-center">
                  <span class="material-symbols-outlined text-on-primary">class</span>
                </div>
                <h4 class="font-headline text-xl font-bold text-primary">${escapeHtml(entry.name)}</h4>
              </div>
              <div class="space-y-2">
                <p class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Symbol Details:</p>
                <div class="ui-table-row">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-primary">class</span>
                    <span class="font-headline font-bold text-sm">${escapeHtml(entry.name)}</span>
                  </div>
                  <div class="flex gap-4 text-xs font-mono text-on-surface-variant">
                    <span>type: ${escapeHtml(entry.type)}</span>
                    <span>value: ${escapeHtml(String(entry.value ?? 'uninitialized'))}</span>
                    <span>width: ${entry.width}</span>
                    <span>level: ${entry.level}</span>
                    <span>offset: ${entry.offset}</span>
                  </div>
                </div>
              </div>
            </div>
          `)
        ).join('')}
      </div>
    `;
  }
  applyPanelRefresh(symbolTableContent);
  applyStaggeredReveal(symbolTableContent.children);
  applyRowUpdateHighlights(symbolTableContent);

  // Update class table
  if (results.classTables && results.classTables.length > 0 && results.classTables.some(ct => ct.entries.length > 0)) {
    classTableContent.innerHTML = `
      <div class="space-y-6">
        ${results.classTables.flatMap((ct, tableIndex) =>
          ct.entries.map(classEntry => `
            <div class="bg-surface-container-lowest rounded-lg p-6 border-2 border-primary/20">
              <div class="ui-panel-header">
                <div class="w-10 h-10 bg-primary rounded flex items-center justify-center">
                  <span class="material-symbols-outlined text-on-primary">class</span>
                </div>
                <h4 class="font-headline text-xl font-bold text-primary">${escapeHtml(classEntry.name)}</h4>
              </div>
              ${classEntry.fields && classEntry.fields.length > 0 ? `
                <div class="space-y-2">
                  <p class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Fields:</p>
                  ${classEntry.fields.map(field => `
                    <div class="ui-table-row">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-primary">label</span>
                        <span class="font-headline font-bold text-sm">${escapeHtml(field.name)}</span>
                      </div>
                      <div class="flex gap-4 text-xs font-mono text-on-surface-variant">
                        <span>type: ${escapeHtml(field.type)}</span>
                        <span>level: ${field.level ?? 1}</span>
                        <span>width: ${field.width}</span>
                        <span>offset: ${field.offset}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-sm text-on-surface-variant italic">No fields declared</p>'}
            </div>
          `)
        ).join('')}
      </div>
    `;
  } else {
    classTableContent.innerHTML = '<p class="text-center text-on-surface-variant italic py-8">No classes declared in this program.</p>';
  }
  applyPanelRefresh(classTableContent);
  applyStaggeredReveal(classTableContent.children);
  applyRowUpdateHighlights(classTableContent);

  // Update semantic actions
  const allActions = results.semanticResults.flatMap(r => r.actions || []);
  if (allActions.length === 0) {
    semanticActions.innerHTML = '<p class="text-center text-on-surface-variant italic py-4">No semantic actions to display.</p>';
  } else {
    semanticActions.innerHTML = allActions.map((action, idx) => {
      let icon = 'info';
      let color = 'tertiary';
      let actionText = '';

      if (action.kind === 'typeCheck') {
        icon = 'check_circle';
        color = 'secondary';
        actionText = action.message;
      } else if (action.kind === 'bind') {
        icon = 'add_circle';
        color = 'primary';
        actionText = `${action.action === 'declare' ? 'Declared' : 'Updated'} variable '${action.entry.name}' (type: ${action.entry.type})`;
      } else if (action.kind === 'bindClass') {
        icon = 'class';
        color = 'primary';
        actionText = `Declared class '${action.entry.name}'`;
      } else if (action.kind === 'bindField') {
        icon = 'label';
        color = 'tertiary';
        actionText = `Declared field '${action.entry.name}' in class '${action.className}' (type: ${action.entry.type})`;
      }

      return `
        <div class="ui-table-row text-sm">
          <span class="material-symbols-outlined text-${color} text-lg">${icon}</span>
          <span class="flex-1 text-on-surface-variant">${escapeHtml(actionText)}</span>
        </div>
      `;
    }).join('');
  }
  applyPanelRefresh(semanticActions);
  applyStaggeredReveal(semanticActions.children);
  applyRowUpdateHighlights(semanticActions);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type) {
  // Simple console notification for now
  console.log(`[${type.toUpperCase()}] ${message}`);

  // You could add a toast notification system here
  const statusText = document.getElementById('statusText');
  const originalText = statusText.textContent;
  statusText.textContent = message.substring(0, 20) + '...';
  setTimeout(() => {
    statusText.textContent = originalText;
  }, 3000);
}

function showHelp() {
  alert(`StardewIDE - Low Cortisol Compiler

Welcome to your friendly compiler interface!

HOW TO USE:
1. Write your code in the IDE (Farmhouse Terminal)
2. Click "Compile" to process your code
3. Navigate through the tabs to see:
   - Lexer: Token analysis
  - Parser: Syntax validation
  - Semantics: Final output and symbol table

LANGUAGE SYNTAX:
- Data types: int, decimal, doubleDecimal, letters, letter, bool
- Bool values: true, false, 0, or 1
- Assignment: variableName : value.
- Strings: "text"
- Numbers: 123 or 123.45
- End statements with a period (.)

TIPS:
- Use the "Load Example" button for sample code
- Check the Semantics tab for detailed diagnostics
- Symbol table shows all declared variables

Happy farming! 🌾`);
}

// Initialize
updateStatus('ready', 'Ready to compile. The terminal awaits your code.', 100);
