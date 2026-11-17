// Cockpit Multi-Projeto da Mesa Redonda
let globalState = null;
let currentThoughtFilter = 'all';
let currentTaskFilter = 'all';

const agentStyles = {
  antigravity: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-950/60 text-blue-300' },
  claude: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-950/60 text-purple-300' },
  codex: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-950/60 text-emerald-300' },
  fiscal: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-950/60 text-amber-300' },
  tef: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-950/60 text-cyan-300' }
};

async function fetchState() {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Falha ao obter estado');
    globalState = await res.json();
    renderAll();
  } catch (e) {
    console.error('Erro ao buscar estado:', e);
  }
}

function initSSE() {
  const evtSource = new EventSource('/api/events');

  evtSource.addEventListener('thought', (e) => {
    try {
      const newThought = JSON.parse(e.data);
      if (globalState && globalState.thoughts) {
        globalState.thoughts.unshift(newThought);
        renderThoughts();
      }
    } catch (err) {
      console.error(err);
    }
  });

  evtSource.addEventListener('state', (e) => {
    try {
      globalState = JSON.parse(e.data);
      renderAll();
    } catch (err) {
      console.error(err);
    }
  });

  evtSource.onerror = (err) => {
    console.warn('SSE Reconectando...', err);
  };
}

function renderAll() {
  if (!globalState) return;
  renderProjectSelector();
  renderMindMap();
  renderThoughts();
  renderTasks();
  renderProjectsCards();
  renderGitLogs();
}

// Render Dropdown of Projects
function renderProjectSelector() {
  const select = document.getElementById('project-selector');
  if (!select || !globalState.projects) return;

  const activeId = globalState.activeProjectId || 'all';
  select.innerHTML = `<option value="all" ${activeId === 'all' ? 'selected' : ''}>🌐 Todos os Projetos (Visão Global)</option>`;

  globalState.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.innerText = `${p.icon} ${p.name}`;
    if (p.id === activeId) opt.selected = true;
    select.appendChild(opt);
  });
}

// When project is changed in dropdown
async function onProjectSelect(projectId) {
  try {
    await fetch('/api/projects/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    globalState.activeProjectId = projectId;
    currentThoughtFilter = projectId;
    currentTaskFilter = 'all';
    renderAll();
  } catch (err) {
    console.error(err);
  }
}

// Render Mind Map (SVG)
function renderMindMap() {
  const container = document.getElementById('mindmap-container');
  const titleEl = document.getElementById('topology-title');
  const subtitleEl = document.getElementById('topology-subtitle');
  const metaBadges = document.getElementById('project-meta-badges');
  if (!container || !globalState) return;

  const activeId = globalState.activeProjectId || 'all';

  if (activeId === 'all') {
    titleEl.innerText = 'Mapa Mental da Mesa Redonda (Visão Global)';
    subtitleEl.innerText = 'Orquestração central unificando todos os projetos de software no drive F:\\';
    metaBadges.innerHTML = `
      <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">${globalState.projects.length} Projetos Ativos</span>
      <span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">5 Agentes Especialistas</span>
    `;

    renderGlobalMindMap(container);
    inspectGlobal();
  } else {
    const proj = globalState.projects.find(p => p.id === activeId);
    if (!proj) return;

    titleEl.innerText = `${proj.icon} ${proj.name} (Topologia do Projeto)`;
    subtitleEl.innerText = `${proj.description} • ${proj.path}`;
    metaBadges.innerHTML = `
      <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">${proj.stack.join(' • ')}</span>
      <button onclick="openInExplorer('${proj.path.replace(/\\/g, '\\\\')}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 border border-slate-700">
        📁 Abrir Pasta
      </button>
      <button onclick="openInEditor('${proj.path.replace(/\\/g, '\\\\')}')" class="px-2 py-0.5 rounded bg-blue-600/80 hover:bg-blue-600 text-white font-mono text-[10px] flex items-center gap-1 shadow-sm">
        💻 Abrir no VS Code
      </button>
    `;

    renderProjectDetailMindMap(container, proj);
    inspectProject(proj.id);
  }
}

// Global SVG Topology
function renderGlobalMindMap(container) {
  const projects = globalState.projects;
  const count = projects.length;

  let svg = `
    <svg viewBox="0 0 1000 440" class="w-full min-w-[800px] h-auto select-none">
      <defs>
        <filter id="glow-core" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>

      <!-- Center Node: Antigravity Maestro -->
      <g onclick="inspectGlobal()" class="cursor-pointer">
        <circle cx="500" cy="220" r="60" fill="#1e3a8a" opacity="0.3" class="pulse-glow" />
        <circle cx="500" cy="220" r="48" fill="url(#core-grad)" stroke="#93c5fd" stroke-width="3" filter="url(#glow-core)" />
        <text x="500" y="210" font-size="24" text-anchor="middle" dominant-baseline="central">🪐</text>
        <text x="500" y="235" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">Antigravity</text>
        <text x="500" y="247" font-size="8" font-weight="600" fill="#dbeafe" text-anchor="middle font-mono">ORQUESTRADOR GERAL</text>
      </g>
  `;

  // Draw satellite project nodes in arc / layout
  const positions = [
    { x: 180, y: 110, color: '#38bdf8' },
    { x: 820, y: 110, color: '#a855f7' },
    { x: 180, y: 330, color: '#10b981' },
    { x: 820, y: 330, color: '#f59e0b' },
    { x: 500, y: 60, color: '#ec4899' },
    { x: 500, y: 380, color: '#06b6d4' }
  ];

  projects.forEach((p, idx) => {
    const pos = positions[idx % positions.length];
    const safePath = p.path.replace(/\\/g, '\\\\');

    svg += `
      <!-- Connector -->
      <path d="M 500,220 C ${pos.x},220 ${pos.x},${pos.y > 220 ? pos.y - 40 : pos.y + 40} ${pos.x},${pos.y}" 
            stroke="${pos.color}" stroke-width="2" fill="none" class="flow-dash" opacity="0.6" />

      <!-- Project Node -->
      <g onclick="onProjectSelect('${p.id}')" class="cursor-pointer group">
        <rect x="${pos.x - 90}" y="${pos.y - 36}" width="180" height="72" rx="14" fill="#0f172a" stroke="${pos.color}" stroke-width="2" class="transition-transform group-hover:scale-105 shadow-xl" />
        <text x="${pos.x - 70}" y="${pos.y - 12}" font-size="18">${p.icon}</text>
        <text x="${pos.x - 45}" y="${pos.y - 14}" font-size="12" font-weight="700" fill="#ffffff">${p.name.slice(0, 16)}</text>
        <text x="${pos.x - 45}" y="${pos.y + 2}" font-size="9" fill="#94a3b8" font-family="monospace">${p.path}</text>
        <text x="${pos.x - 45}" y="${pos.y + 18}" font-size="8" fill="${pos.color}" font-weight="600">● ${p.modules ? p.modules.length : 1} Módulos Conectados &rarr;</text>
      </g>
    `;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Project Detail SVG Topology (e.g. Totem PDV)
function renderProjectDetailMindMap(container, proj) {
  const safePath = proj.path.replace(/\\/g, '\\\\');
  let svg = `
    <svg viewBox="0 0 1000 420" class="w-full min-w-[800px] h-auto select-none">
      <defs>
        <filter id="glow-proj" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="proj-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#4338ca" />
        </linearGradient>
      </defs>

      <!-- Center Node: Project Hub -->
      <g onclick="inspectProject('${proj.id}')" class="cursor-pointer">
        <circle cx="500" cy="210" r="56" fill="#1e293b" opacity="0.4" class="pulse-glow" />
        <circle cx="500" cy="210" r="48" fill="url(#proj-grad)" stroke="#60a5fa" stroke-width="3" filter="url(#glow-proj)" />
        <text x="500" y="200" font-size="24" text-anchor="middle" dominant-baseline="central">${proj.icon}</text>
        <text x="500" y="224" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">${proj.name.slice(0, 16)}</text>
        <text x="500" y="238" font-size="8" font-weight="600" fill="#bfdbfe" text-anchor="middle font-mono">WORKSPACE ATIVO</text>
      </g>
  `;

  if (proj.modules && proj.modules.length > 0) {
    const modPositions = [
      { x: 180, y: 110, color: '#a855f7', label: 'Backend & KDS' },
      { x: 820, y: 110, color: '#10b981', label: 'Frontend Kiosk' },
      { x: 180, y: 310, color: '#f59e0b', label: 'SEFAZ NFC-e' },
      { x: 820, y: 310, color: '#06b6d4', label: 'TEF / Pinpad' },
      { x: 500, y: 60, color: '#3b82f6', label: 'Cockpit SSE' }
    ];

    proj.modules.forEach((mod, i) => {
      const pos = modPositions[i % modPositions.length];
      const isOnline = mod.status === 'online' || mod.status === 'ready';

      svg += `
        <!-- Connector -->
        <path d="M 500,210 C ${pos.x},210 ${pos.x},${pos.y > 210 ? pos.y - 30 : pos.y + 30} ${pos.x},${pos.y}" 
              stroke="${pos.color}" stroke-width="2" fill="none" class="flow-dash" opacity="0.65" />

        <!-- Module Card -->
        <g onclick="inspectModuleDetail('${proj.id}', '${mod.id}')" class="cursor-pointer group">
          <rect x="${pos.x - 90}" y="${pos.y - 32}" width="180" height="64" rx="12" fill="#0f172a" stroke="${pos.color}" stroke-width="2" class="transition-transform group-hover:scale-105" />
          <text x="${pos.x - 75}" y="${pos.y - 10}" font-size="11" font-weight="700" fill="#ffffff">${mod.name.slice(0, 20)}</text>
          <text x="${pos.x - 75}" y="${pos.y + 6}" font-size="9" fill="#94a3b8" font-family="monospace">${mod.path} ${mod.port ? `(:${mod.port})` : ''}</text>
          <text x="${pos.x - 75}" y="${pos.y + 20}" font-size="8" fill="${isOnline ? '#34d399' : '#f87171'}" font-weight="600">● ${mod.status.toUpperCase()}</text>
        </g>
      `;
    });
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Render Thoughts with Real Links
function renderThoughts() {
  const container = document.getElementById('thoughts-list');
  const countEl = document.getElementById('thoughts-count');
  if (!container || !globalState.thoughts) return;

  const activeProj = globalState.activeProjectId || 'all';

  let list = globalState.thoughts;
  if (currentThoughtFilter !== 'all') {
    list = list.filter(t => t.projectId === currentThoughtFilter);
  } else if (activeProj !== 'all') {
    list = list.filter(t => t.projectId === activeProj);
  }

  countEl.innerText = `${list.length} Pensamentos`;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 text-xs">
        Nenhum pensamento registrado para este filtro.
      </div>
    `;
    return;
  }

  list.forEach(item => {
    const agent = globalState.agents[item.agentId] || { name: item.agentId, avatar: '🤖' };
    const style = agentStyles[item.agentId] || agentStyles.antigravity;
    const timeAgo = formatTime(item.timestamp);
    const safePath = item.fileLink ? item.fileLink.replace(/\\/g, '\\\\') : '';

    const div = document.createElement('div');
    div.className = `p-3.5 rounded-xl bg-slate-950/70 border ${style.border} space-y-2 hover:bg-slate-900/80 transition-all`;

    div.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-1">
        <div class="flex items-center gap-2">
          <span>${agent.avatar}</span>
          <span class="font-bold ${style.text}">${agent.name}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded ${style.badge}">${item.category || 'Raciocínio'}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans cursor-pointer hover:bg-slate-700" onclick="onProjectSelect('${item.projectId}')">
            📁 ${item.projectName || item.projectId}
          </span>
        </div>
        <span class="text-[10px] text-slate-500 font-mono">${timeAgo}</span>
      </div>

      <p class="text-slate-200 text-xs leading-relaxed italic pl-3 border-l-2 ${style.border}">
        "${item.thought}"
      </p>

      ${item.fileLink ? `
        <div class="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div class="flex items-center gap-1.5 text-slate-400 truncate max-w-[70%]">
            <span class="text-slate-500">Arquivo:</span>
            <span class="text-slate-300 truncate" title="${item.fileLink}">${item.fileLink}</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="openInEditor('${safePath}')" class="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors">
              💻 VS Code
            </button>
            <button onclick="openInExplorer('${safePath}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors">
              📁 Explorer
            </button>
          </div>
        </div>
      ` : ''}
    `;

    container.appendChild(div);
  });

  // Update filter buttons style
  document.querySelectorAll('.filter-thought-btn').forEach(btn => {
    if (btn.dataset.filter === currentThoughtFilter) {
      btn.className = "filter-thought-btn px-2 py-0.5 rounded bg-blue-600 text-white font-medium";
    } else {
      btn.className = "filter-thought-btn px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white";
    }
  });
}

function filterThoughts(filter) {
  currentThoughtFilter = filter;
  renderThoughts();
}

// Render Tasks
function renderTasks() {
  const container = document.getElementById('tasks-list');
  const summaryBadges = document.getElementById('tasks-summary-badges');
  if (!container || !globalState.tasks) return;

  const activeProj = globalState.activeProjectId || 'all';

  let list = globalState.tasks;
  if (activeProj !== 'all') {
    list = list.filter(t => t.projectId === activeProj);
  }

  const doneCount = list.filter(t => t.status === 'done').length;
  const inProgCount = list.filter(t => t.status === 'in_progress').length;
  const backlogCount = list.filter(t => t.status === 'backlog').length;

  summaryBadges.innerHTML = `
    <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">${doneCount} Concluídas</span>
    <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">${inProgCount} Em Andamento</span>
  `;

  if (currentTaskFilter !== 'all') {
    list = list.filter(t => t.status === currentTaskFilter);
  }

  container.innerHTML = '';

  const statusIcons = {
    done: { icon: '✔', label: 'Concluído', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    in_progress: { icon: '⚡', label: 'Em Andamento', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    backlog: { icon: '⏳', label: 'Backlog', color: 'text-slate-400 bg-slate-800/80 border-slate-700' }
  };

  list.forEach(task => {
    const agent = globalState.agents[task.assignedTo] || { name: task.assignedTo, avatar: '🤖' };
    const st = statusIcons[task.status] || statusIcons.backlog;
    const safePath = task.fileLink ? task.fileLink.replace(/\\/g, '\\\\') : '';

    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors';

    div.innerHTML = `
      <div class="space-y-1 min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${st.color} flex items-center gap-1">
            <span>${st.icon}</span> ${st.label}
          </span>
          <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 truncate">
            ${task.projectName || task.projectId}
          </span>
          <span class="text-[10px] font-mono text-slate-500 truncate">${task.module}</span>
        </div>
        <div class="font-medium text-slate-200 text-xs truncate">${task.title}</div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        ${task.fileLink ? `
          <button onclick="openInEditor('${safePath}')" title="Abrir arquivo no VS Code" class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-400 border border-slate-800 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
        ` : ''}
        <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
          <span class="text-xs">${agent.avatar}</span>
          <span class="text-[11px] text-slate-300 font-medium">${agent.name.split(' ')[0]}</span>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  // Update task filter buttons style
  document.querySelectorAll('.filter-task-btn').forEach(btn => {
    if (btn.dataset.filter === currentTaskFilter) {
      btn.className = "filter-task-btn px-2 py-0.5 rounded bg-blue-600 text-white font-medium";
    } else {
      btn.className = "filter-task-btn px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white";
    }
  });
}

function filterTasks(stage) {
  currentTaskFilter = stage;
  renderTasks();
}

// Render Projects Cards
function renderProjectsCards() {
  const container = document.getElementById('projects-card-list');
  const countBadge = document.getElementById('projects-count-badge');
  if (!container || !globalState.projects) return;

  countBadge.innerText = `${globalState.projects.length} Conectados`;
  container.innerHTML = '';

  const activeId = globalState.activeProjectId || 'all';

  globalState.projects.forEach(p => {
    const isSelected = p.id === activeId;
    const safePath = p.path.replace(/\\/g, '\\\\');

    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border transition-all cursor-pointer ${
      isSelected 
        ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-500/10' 
        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
    }`;

    div.innerHTML = `
      <div class="flex items-center justify-between mb-1" onclick="onProjectSelect('${p.id}')">
        <div class="flex items-center gap-2">
          <span class="text-base">${p.icon}</span>
          <span class="font-bold text-slate-100 text-xs">${p.name}</span>
        </div>
        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ATIVO
        </span>
      </div>
      <p class="text-[11px] text-slate-400 line-clamp-1 mb-2" onclick="onProjectSelect('${p.id}')">${p.description}</p>
      <div class="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
        <span class="text-slate-500 truncate max-w-[65%]">${p.path}</span>
        <div class="flex items-center gap-1.5">
          <button onclick="event.stopPropagation(); openInEditor('${safePath}')" class="text-blue-400 hover:underline">VS Code</button>
          <span class="text-slate-600">&bull;</span>
          <button onclick="event.stopPropagation(); openInExplorer('${safePath}')" class="text-slate-400 hover:underline">Pasta</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

// Render Git Logs
function renderGitLogs() {
  const container = document.getElementById('git-log-list');
  const titleContext = document.getElementById('git-log-context');
  if (!container || !globalState.gitLogsByProject) return;

  const activeId = globalState.activeProjectId || 'all';

  container.innerHTML = '';

  let entries = [];
  if (activeId === 'all') {
    titleContext.innerText = 'Todos os Projetos Registrados';
    Object.keys(globalState.gitLogsByProject).forEach(projId => {
      const proj = globalState.projects.find(p => p.id === projId) || { name: projId, icon: '📁' };
      const commits = globalState.gitLogsByProject[projId] || [];
      commits.forEach(c => entries.push({ ...c, projName: proj.name, projIcon: proj.icon, projId }));
    });
  } else {
    const proj = globalState.projects.find(p => p.id === activeId);
    titleContext.innerText = proj ? `${proj.name} (${proj.path})` : activeId;
    const commits = globalState.gitLogsByProject[activeId] || [];
    commits.forEach(c => entries.push({ ...c, projName: proj.name, projIcon: proj.icon, projId: activeId }));
  }

  if (entries.length === 0) {
    container.innerHTML = '<div class="text-slate-500 text-xs py-2">Nenhum commit encontrado no repositório.</div>';
    return;
  }

  entries.slice(0, 8).forEach(c => {
    const div = document.createElement('div');
    div.className = 'p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-[11px]';

    div.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-sans shrink-0">
          ${c.projIcon} ${c.projName.slice(0, 12)}
        </span>
        <span class="text-blue-400 font-bold">${c.hash}</span>
        <span class="text-slate-200 truncate">${c.message}</span>
      </div>
      <span class="text-[10px] text-slate-500 shrink-0 font-sans">${c.time}</span>
    `;

    container.appendChild(div);
  });
}

// Open in VS Code
async function openInEditor(filePath) {
  try {
    const res = await fetch('/api/open-editor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const data = await res.json();
    if (!data.success) alert('Não foi possível abrir o arquivo no VS Code.');
  } catch (e) {
    console.error(e);
  }
}

// Open in Windows Explorer
async function openInExplorer(path) {
  try {
    const res = await fetch('/api/open-explorer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const data = await res.json();
    if (!data.success) alert('Não foi possível abrir a pasta no Explorer.');
  } catch (e) {
    console.error(e);
  }
}

// Inspectors
function inspectGlobal() {
  document.getElementById('inspect-icon').innerText = '🪐';
  document.getElementById('inspect-title').innerText = 'Antigravity (Orquestrador Geral & Maestro)';
  document.getElementById('inspect-tag').innerText = 'Coordenação Multi-Projeto';
  document.getElementById('inspect-desc').innerText = `Monitorando ${globalState.projects.length} projetos no drive F:\\. Toda mensagem que você envia no chat único do Antigravity é analisada e delegada para Claude Code ou Codex no projeto certo.`;
  document.getElementById('inspect-actions').innerHTML = `
    <button onclick="openDiscoverModal()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm">
      + Vincular Novo Projeto
    </button>
  `;
}

function inspectProject(projId) {
  const proj = globalState.projects.find(p => p.id === projId);
  if (!proj) return;
  const safePath = proj.path.replace(/\\/g, '\\\\');

  document.getElementById('inspect-icon').innerText = proj.icon;
  document.getElementById('inspect-title').innerText = `${proj.name} (${proj.path})`;
  document.getElementById('inspect-tag').innerText = `${proj.modules ? proj.modules.length : 1} Módulos`;
  document.getElementById('inspect-desc').innerText = `${proj.description} • Stack: ${proj.stack.join(', ')}`;

  document.getElementById('inspect-actions').innerHTML = `
    <button onclick="openInEditor('${safePath}')" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
      💻 Abrir no VS Code
    </button>
    <button onclick="openInExplorer('${safePath}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1">
      📁 Explorer
    </button>
  `;
}

function inspectModuleDetail(projId, modId) {
  const proj = globalState.projects.find(p => p.id === projId);
  if (!proj) return;
  const mod = proj.modules.find(m => m.id === modId);
  if (!mod) return;
  const fullPath = `${proj.path}\\${mod.path}`.replace(/\\/g, '\\\\');

  document.getElementById('inspect-icon').innerText = '📦';
  document.getElementById('inspect-title').innerText = `${mod.name} (${mod.path})`;
  document.getElementById('inspect-tag').innerText = mod.port ? `Porta Local :${mod.port}` : 'Módulo do Monorepo';
  document.getElementById('inspect-desc').innerText = `Módulo físico pertencente a ${proj.name}. Caminho completo: ${proj.path}\\${mod.path}`;

  document.getElementById('inspect-actions').innerHTML = `
    <button onclick="openInEditor('${fullPath}')" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
      💻 Abrir Arquivos no VS Code
    </button>
    <button onclick="openInExplorer('${fullPath}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1">
      📁 Explorer
    </button>
  `;
}

// Discover Modal
async function openDiscoverModal() {
  const modal = document.getElementById('discover-modal');
  const list = document.getElementById('discovered-projects-list');
  modal.classList.remove('hidden');
  list.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">Escaneando repositórios em F:\\...</div>';

  try {
    const res = await fetch('/api/discover-projects');
    const data = await res.json();

    list.innerHTML = '';
    data.forEach(d => {
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs';

      const safePath = d.path.replace(/\\/g, '\\\\');

      div.innerHTML = `
        <div class="min-w-0">
          <div class="font-bold text-slate-100 flex items-center gap-2">
            <span>📁 ${d.name}</span>
            ${d.hasGit ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-950/60 text-orange-400 border border-orange-500/30">git</span>' : ''}
            ${d.hasPackageJson ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">node</span>' : ''}
          </div>
          <div class="text-[10px] font-mono text-slate-500 truncate">${d.path}</div>
        </div>

        <div>
          ${d.registered ? `
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-medium text-[11px]">Já Vinculado</span>
          ` : `
            <button onclick="registerProject('${d.name}', '${safePath}')" class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm">
              + Vincular
            </button>
          `}
        </div>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    list.innerHTML = '<div class="text-red-400 text-xs py-4">Erro ao escanear diretórios.</div>';
  }
}

function closeDiscoverModal() {
  document.getElementById('discover-modal').classList.add('hidden');
}

async function registerProject(name, projectPath) {
  try {
    const res = await fetch('/api/projects/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, path: projectPath })
    });
    const data = await res.json();
    if (data.success) {
      closeDiscoverModal();
      fetchState();
    } else {
      alert(data.error || 'Erro ao registrar');
    }
  } catch (err) {
    console.error(err);
  }
}

function promptManualProject() {
  const name = prompt('Nome do projeto:');
  if (!name) return;
  const projectPath = prompt('Caminho no disco (ex: F:\\MeuProjeto):');
  if (!projectPath) return;
  registerProject(name, projectPath);
}

function formatTime(isoString) {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    return `Há ${Math.floor(diff / 3600)} h`;
  } catch (e) {
    return '';
  }
}

// Start
fetchState();
initSSE();
