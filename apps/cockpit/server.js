import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRootDir = path.resolve(__dirname, '../..');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Registered Projects Catalog
const projectsRegistry = [
  {
    id: 'totem-pdv-central',
    name: 'Totem PDV Central',
    icon: '🏪',
    path: 'F:\\totem-pdv-central',
    description: 'Totem de Autoatendimento (Flutter), PDV Central (Node/Express), Motor Fiscal NFC-e e Driver TEF.',
    stack: ['Flutter', 'Node.js', 'Express', 'TypeScript', 'SEFAZ NFC-e', 'TEF/Pinpad'],
    status: 'active',
    agents: ['antigravity', 'claude', 'codex', 'fiscal', 'tef'],
    modules: [
      { id: 'central-web', name: 'Central Web & KDS API', path: 'apps/central-web', port: 4000, status: 'online' },
      { id: 'totem_app', name: 'Totem Kiosk Flutter', path: 'apps/totem_app', status: 'ready' },
      { id: 'fiscal-engine', name: 'Motor Fiscal NFC-e', path: 'packages/fiscal-engine', status: 'ready' },
      { id: 'tef-client', name: 'Driver TEF Pinpad', path: 'packages/tef-client', status: 'ready' },
      { id: 'cockpit', name: 'Cockpit da Mesa Redonda', path: 'apps/cockpit', port: 5050, status: 'online' }
    ]
  },
  {
    id: 'agent-project-kit',
    name: 'Agent Project Kit',
    icon: '🧰',
    path: 'F:\\agent-project-kit',
    description: 'Kit de governança de agentes, comandos universais (/frontend, /backend, /database) e sincronização de skills.',
    stack: ['PowerShell', 'Markdown', 'Antigravity Skills', 'Claude Commands'],
    status: 'active',
    agents: ['antigravity', 'claude'],
    modules: [
      { id: 'commands', name: 'Claude & Codex Commands', path: 'commands', status: 'ready' },
      { id: 'skills', name: 'Sincronizador de Skills', path: 'skills', status: 'ready' },
      { id: 'scripts', name: 'Scripts de Automação', path: 'scripts', status: 'ready' }
    ]
  },
  {
    id: 'FinanceHub',
    name: 'FinanceHub',
    icon: '💰',
    path: 'F:\\FinanceHub',
    description: 'Sistema de gestão financeira, contas a pagar/receber e conciliação bancária.',
    stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'REST API'],
    status: 'active',
    agents: ['antigravity', 'claude'],
    modules: [
      { id: 'finance-api', name: 'API de Conciliação', path: 'src', status: 'ready' }
    ]
  },
  {
    id: 'Cloudlane',
    name: 'Cloudlane Homelab',
    icon: '☁️',
    path: 'F:\\Cloudlane',
    description: 'Infraestrutura de homelab, automação com Proxmox VE, cluster K3s e stacks de mídia.',
    stack: ['Kubernetes / K3s', 'Proxmox VE', 'Ansible', 'Docker', 'Linux'],
    status: 'active',
    agents: ['antigravity'],
    modules: [
      { id: 'manifests', name: 'Manifestos K3s', path: 'k3s', status: 'ready' },
      { id: 'runbooks', name: 'Runbooks Operacionais', path: 'docs', status: 'ready' }
    ]
  }
];

// In-memory state
const state = {
  activeProjectId: 'all', // 'all' or project id
  projects: projectsRegistry,
  agents: {
    antigravity: {
      id: 'antigravity',
      name: 'Antigravity',
      role: 'Orquestrador Geral & Maestro',
      model: 'Gemini Ecosystem',
      status: 'active',
      avatar: '🪐',
      color: '#3b82f6',
      badge: 'Líder da Mesa'
    },
    claude: {
      id: 'claude',
      name: 'Claude Code',
      role: 'Arquiteto de Backend & API',
      model: 'Claude 3.7 / Opus 5.5',
      status: 'active',
      avatar: '🟣',
      color: '#a855f7',
      badge: 'Backend & Arquitetura'
    },
    codex: {
      id: 'codex',
      name: 'Codex',
      role: 'Engenheiro Kiosk & Flutter UI',
      model: 'ChatGPT Plus (GPT-6 Astra)',
      status: 'active',
      avatar: '🟢',
      color: '#10b981',
      badge: 'Totem & Mobile'
    },
    fiscal: {
      id: 'fiscal',
      name: 'Subagente Fiscal',
      role: 'Especialista SEFAZ & NFC-e',
      model: 'SEFAZ MOC 7.0 Engine',
      status: 'active',
      avatar: '📜',
      color: '#f59e0b',
      badge: 'Fiscal & Compliance'
    },
    tef: {
      id: 'tef',
      name: 'Subagente TEF',
      role: 'Protocolo Pinpad & 2PC',
      model: 'State Machine Driver',
      status: 'active',
      avatar: '💳',
      color: '#06b6d4',
      badge: 'Pagamentos & Pinpad'
    }
  },
  thoughts: [
    {
      id: 'th-101',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      agentId: 'antigravity',
      category: 'Orquestração',
      thought: 'Expandindo o Cockpit da Mesa Redonda para suportar múltiplos projetos em F:\\. Criando navegação cruzada entre Totem PDV, Agent Project Kit, FinanceHub e Cloudlane com links diretos aos arquivos.',
      fileLink: 'F:\\totem-pdv-central\\apps\\cockpit\\server.js',
      commitHash: '211d4e8',
      timestamp: new Date().toISOString()
    },
    {
      id: 'th-102',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      agentId: 'claude',
      category: 'Backend',
      thought: 'Regras de conciliação de caixa e turno blindadas. Cada sangria precisa ter motivo auditável e cada fechamento deve permitir conferência cega (blind cash count) para evitar viés do operador.',
      fileLink: 'F:\\totem-pdv-central\\apps\\central-web\\src\\server.ts',
      commitHash: 'b4f12a6',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: 'th-103',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      agentId: 'codex',
      category: 'Frontend',
      thought: 'Para suportar contingência de internet no totem de autoatendimento, estruturando camada local com SQLite/Hive para persistir o catálogo de mangas temperadas e bufferizar pedidos offline.',
      fileLink: 'F:\\totem-pdv-central\\apps\\totem_app\\lib\\main.dart',
      commitHash: 'b4f12a6',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: 'th-104',
      projectId: 'agent-project-kit',
      projectName: 'Agent Project Kit',
      agentId: 'antigravity',
      category: 'Governança',
      thought: 'Comandos instalados em ~/.claude/commands (/frontend, /backend, /database, /review) vinculados com sucesso. Skills sincronizadas em ~/.gemini/config/skills para reuso transversal entre projetos.',
      fileLink: 'F:\\agent-project-kit\\scripts\\install-commands.ps1',
      commitHash: 'init',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      id: 'th-105',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      agentId: 'fiscal',
      category: 'Fiscal',
      thought: 'O cálculo do dígito verificador da Chave de 44 dígitos mod 11 e o QR Code v2 com hash SHA-1 do CSC garantem que o cupom impresso pelo totem seja validado imediatamente pelo smartphone do cliente.',
      fileLink: 'F:\\totem-pdv-central\\packages\\fiscal-engine\\src\\nfe-service.ts',
      commitHash: 'b4f12a6',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'th-106',
      projectId: 'FinanceHub',
      projectName: 'FinanceHub',
      agentId: 'claude',
      category: 'Arquitetura',
      thought: 'Planejando integração entre os relatórios Z de fechamento de caixa do Totem PDV e o razão contábil do FinanceHub via webhook agendado.',
      fileLink: 'F:\\FinanceHub',
      timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-1',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Estruturação da Arquitetura Monorepo e Shared Types',
      assignedTo: 'antigravity',
      module: 'packages/shared-types',
      status: 'done',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\packages\\shared-types\\src\\index.ts'
    },
    {
      id: 'task-2',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Motor Fiscal NFC-e (SEFAZ Mod 65, Módulo 11 e QR-Code v2)',
      assignedTo: 'fiscal',
      module: 'packages/fiscal-engine',
      status: 'done',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\packages\\fiscal-engine\\src\\nfe-service.ts'
    },
    {
      id: 'task-3',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Driver TEF Pinpad com Two-Phase Commit e Tratamento de Pendências',
      assignedTo: 'tef',
      module: 'packages/tef-client',
      status: 'done',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\packages\\tef-client\\src\\tef-driver.ts'
    },
    {
      id: 'task-4',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Servidor Central Web com Gestão de Turnos de Caixa e Fila KDS',
      assignedTo: 'claude',
      module: 'apps/central-web',
      status: 'done',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\apps\\central-web\\src\\server.ts'
    },
    {
      id: 'task-5',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'App Flutter Totem Kiosk com Cardápio, Modais e Inatividade 60s',
      assignedTo: 'codex',
      module: 'apps/totem_app',
      status: 'done',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\apps\\totem_app\\lib\\main.dart'
    },
    {
      id: 'task-6',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Cockpit Multi-Projeto com Links Reais aos Arquivos e Suporte Global',
      assignedTo: 'antigravity',
      module: 'apps/cockpit',
      status: 'in_progress',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\apps\\cockpit\\server.js'
    },
    {
      id: 'task-7',
      projectId: 'agent-project-kit',
      projectName: 'Agent Project Kit',
      title: 'Configuração e Instalação dos Comandos Universais (/frontend, /backend, /kit)',
      assignedTo: 'antigravity',
      module: 'commands',
      status: 'done',
      priority: 'medium',
      fileLink: 'F:\\agent-project-kit\\scripts\\install-commands.ps1'
    },
    {
      id: 'task-8',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Persistência Offline em SQLite no Totem com Sincronização em Background',
      assignedTo: 'codex',
      module: 'apps/totem_app',
      status: 'backlog',
      priority: 'high',
      fileLink: 'F:\\totem-pdv-central\\apps\\totem_app'
    },
    {
      id: 'task-9',
      projectId: 'totem-pdv-central',
      projectName: 'Totem PDV Central',
      title: 'Fluxo de Sangria, Suprimento e Fechamento Cego de Caixa no PDV',
      assignedTo: 'claude',
      module: 'apps/central-web',
      status: 'backlog',
      priority: 'medium',
      fileLink: 'F:\\totem-pdv-central\\apps\\central-web'
    },
    {
      id: 'task-10',
      projectId: 'FinanceHub',
      projectName: 'FinanceHub',
      title: 'Webhook para Conciliação Financeira com Fechamento de Caixa',
      assignedTo: 'claude',
      module: 'finance-api',
      status: 'backlog',
      priority: 'low',
      fileLink: 'F:\\FinanceHub'
    }
  ],
  gitLogsByProject: {}
};

// SSE Subscribers
const sseClients = new Set();

function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Fetch git log for a given project directory
function fetchGitLog(projectPath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(projectPath)) return resolve([]);
    exec('git log -n 5 --pretty=format:"%h|%an|%s|%cr"', { cwd: projectPath }, (err, stdout) => {
      if (!err && stdout) {
        const commits = stdout.split('\n').filter(Boolean).map(line => {
          const [hash, author, message, time] = line.split('|');
          return { hash, author, message, time };
        });
        resolve(commits);
      } else {
        resolve([]);
      }
    });
  });
}

// Update all project git logs
async function updateAllGitLogs() {
  for (const proj of state.projects) {
    const commits = await fetchGitLog(proj.path);
    state.gitLogsByProject[proj.id] = commits;
  }
}

// Check central API status
async function checkCentralApiStatus() {
  try {
    const res = await fetch('http://localhost:4000/api/products');
    const totemProj = state.projects.find(p => p.id === 'totem-pdv-central');
    if (totemProj) {
      const centralMod = totemProj.modules.find(m => m.id === 'central-web');
      if (centralMod) centralMod.status = res.ok ? 'online' : 'offline';
    }
  } catch (e) {
    const totemProj = state.projects.find(p => p.id === 'totem-pdv-central');
    if (totemProj) {
      const centralMod = totemProj.modules.find(m => m.id === 'central-web');
      if (centralMod) centralMod.status = 'offline';
    }
  }
}

// SSE Route
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Full state endpoint
app.get('/api/state', async (req, res) => {
  await updateAllGitLogs();
  await checkCentralApiStatus();
  res.json(state);
});

// Switch active project
app.post('/api/projects/select', (req, res) => {
  const { projectId } = req.body;
  if (projectId) {
    state.activeProjectId = projectId;
    broadcastSSE('state', state);
    return res.json({ success: true, activeProjectId: projectId });
  }
  res.status(400).json({ error: 'projectId é obrigatório' });
});

// Discover Git repositories in F:\
app.get('/api/discover-projects', (req, res) => {
  try {
    const baseDir = 'F:\\';
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const discovered = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(baseDir, entry.name);
        const hasGit = fs.existsSync(path.join(fullPath, '.git'));
        const hasPackageJson = fs.existsSync(path.join(fullPath, 'package.json'));
        const alreadyRegistered = state.projects.some(p => p.path.toLowerCase() === fullPath.toLowerCase());

        if (hasGit || hasPackageJson) {
          discovered.push({
            name: entry.name,
            path: fullPath,
            hasGit,
            hasPackageJson,
            registered: alreadyRegistered
          });
        }
      }
    }

    res.json(discovered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new project
app.post('/api/projects/register', async (req, res) => {
  const { name, path: projectPath, description, icon } = req.body;
  if (!name || !projectPath) {
    return res.status(400).json({ error: 'name e path são obrigatórios' });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const existing = state.projects.find(p => p.id === id || p.path.toLowerCase() === projectPath.toLowerCase());
  
  if (existing) {
    return res.status(400).json({ error: 'Projeto já registrado' });
  }

  const newProj = {
    id,
    name,
    icon: icon || '📁',
    path: projectPath,
    description: description || `Projeto em ${projectPath}`,
    stack: ['Git'],
    status: 'active',
    agents: ['antigravity'],
    modules: [{ id: 'root', name: name, path: '.', status: 'ready' }]
  };

  state.projects.push(newProj);
  state.activeProjectId = id;

  const commits = await fetchGitLog(projectPath);
  state.gitLogsByProject[id] = commits;

  broadcastSSE('project_added', newProj);
  broadcastSSE('state', state);

  res.json({ success: true, project: newProj });
});

// Open file or directory in VS Code
app.post('/api/open-editor', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath obrigatório' });

  exec(`code "${filePath}"`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Open path in Windows Explorer
app.post('/api/open-explorer', (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'path obrigatório' });

  exec(`explorer.exe "${dirPath}"`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Post a thought with fileLink and project
app.post('/api/thoughts', (req, res) => {
  const { projectId, agentId, thought, category, fileLink, commitHash } = req.body;
  if (!agentId || !thought) {
    return res.status(400).json({ error: 'agentId e thought são obrigatórios' });
  }

  const proj = state.projects.find(p => p.id === projectId) || state.projects[0];

  const newThought = {
    id: 'th-' + Date.now(),
    projectId: proj.id,
    projectName: proj.name,
    agentId,
    thought,
    category: category || 'Raciocínio',
    fileLink: fileLink || proj.path,
    commitHash: commitHash || null,
    timestamp: new Date().toISOString()
  };

  state.thoughts.unshift(newThought);
  if (state.thoughts.length > 80) state.thoughts.pop();

  broadcastSSE('thought', newThought);
  broadcastSSE('state', state);

  res.json({ success: true, thought: newThought });
});

// Boot initial checks
updateAllGitLogs();
checkCentralApiStatus();

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🪐 COCKPIT MULTI-PROJETO DA MESA REDONDA INICIADO!`);
  console.log(`👉 Acesse no navegador: http://localhost:${PORT}`);
  console.log(`🌐 Projetos Registrados: ${state.projects.map(p => p.name).join(', ')}`);
  console.log(`=======================================================`);
});
