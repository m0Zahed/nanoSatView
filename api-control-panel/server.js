const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { spawn } = require('child_process');
const net = require('net');
const { WebSocketServer, OPEN } = require('ws');
const { Kafka, logLevel } = require('kafkajs');

const PORT = parseInt(process.env.PORT || '7070', 10);
const RAW_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';
const KAFKA_BROKERS = RAW_BROKERS.split(',').map((broker) => broker.trim()).filter(Boolean);
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'nanoSatView-api-control-panel';
const KAFKA_LOG_LEVEL_NAME = (process.env.KAFKA_LOG_LEVEL || 'NOTHING').toUpperCase();
const KAFKA_LOG_LEVEL = logLevel[KAFKA_LOG_LEVEL_NAME] ?? logLevel.NOTHING;
const PROJECT_MANAGEMENT_ADMIN_URL = process.env.PROJECT_MANAGEMENT_ADMIN_URL || 'http://127.0.0.1:5001';

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: KAFKA_LOG_LEVEL,
});
const admin = kafka.admin();

const kafkaDist = path.resolve(__dirname, '..', 'nanoSatAPI', 'documentProcessor', 'tools', 'kafka_2.13-3.7.1');
const kafkaConfigPath = path.join(__dirname, 'runtime', 'kafka-server.properties');
const kafkaStartScript = path.join(
  kafkaDist,
  'bin',
  process.platform === 'win32' ? 'windows/kafka-server-start.bat' : 'kafka-server-start.sh'
);
const kafkaStartScriptAvailable = fs.existsSync(kafkaStartScript);

let kafkaConnected = false;
let connectPromise = null;
let reconnectTimer = null;
let wss;
let lastKafkaStatus;
let kafkaProcess = null;
let kafkaProcessStartTime = null;
const kafkaProcessLogs = [];
const kafkaLogsLimit = 40;

const appendKafkaProcessLog = (source, chunk) => {
  const text = String(chunk || '').trim();
  if (!text) {
    return;
  }
  const lines = text.split(/\r?\n/).filter(Boolean);
  lines.forEach((line) => {
    kafkaProcessLogs.push({
      source,
      text: line,
      timestamp: new Date().toISOString(),
    });
    if (kafkaProcessLogs.length > kafkaLogsLimit) {
      kafkaProcessLogs.shift();
    }
  });
};

const kafkaProcessSnapshot = () => ({
  running: Boolean(kafkaProcess),
  pid: kafkaProcess?.pid ?? null,
  startTime: kafkaProcessStartTime ? kafkaProcessStartTime.toISOString() : null,
  scriptAvailable: kafkaStartScriptAvailable,
  logs: [...kafkaProcessLogs],
});

const broadcast = (payload) => {
  if (!wss) {
    return;
  }
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === OPEN) {
      client.send(message);
    }
  });
};

const kafkaStatusSnapshot = (error = null) => ({
  kafkaConnected,
  kafkaBrokers: KAFKA_BROKERS,
  error: error || null,
  timestamp: new Date().toISOString(),
});

const broadcastKafkaStatus = (error = null) => {
  const snapshot = kafkaStatusSnapshot(error);
  const signature = `${snapshot.kafkaConnected}:${snapshot.error || ''}`;
  if (signature === lastKafkaStatus) {
    return;
  }
  lastKafkaStatus = signature;
  broadcast({
    type: 'kafka-status',
    ...snapshot,
    process: kafkaProcessSnapshot(),
  });
};

const ensureKafkaAvailable = async () => {
  if (kafkaConnected) {
    return;
  }
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      await admin.connect();
      kafkaConnected = true;
      broadcastKafkaStatus();
    } catch (error) {
      kafkaConnected = false;
      broadcastKafkaStatus(error.message);
      scheduleReconnect();
      throw error;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
};

const serviceLogsLimit = 80;
const componentComposerDir = path.join(__dirname, '..', 'nanoSatAPI', 'componentComposer');
const componentComposerVenvDir = path.join(componentComposerDir, '.venv');
const componentComposerVenvPython = process.platform === 'win32'
  ? path.join(componentComposerVenvDir, 'Scripts', 'python.exe')
  : path.join(componentComposerVenvDir, 'bin', 'python');
const documentProcessorDir = path.join(__dirname, '..', 'nanoSatAPI', 'documentProcessor');
const userManagementDir = path.join(__dirname, '..', 'nanoSatAPI', 'UserManagement');
const nanoSatSystemsDir = path.join(__dirname, '..', 'nanoSatSystems');

const serviceDefinitions = [
  {
    id: 'user-management',
    name: 'User Management API',
    port: 5000,
    lanUrl: 'http://0.0.0.0:5000',
    cwd: userManagementDir,
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['start'],
    env: { PORT: '5000', CORS_ALLOW_ALL: 'true', CLIENT_ORIGIN: '*' },
    ensureDeps: true,
  },
  {
    id: 'requirements-api',
    name: 'Project Management API',
    port: 5001,
    lanUrl: 'http://0.0.0.0:5001',
    cwd: path.join(__dirname, '..', 'nanoSatAPI', 'ProjectManagement'),
    command: 'dotnet',
    args: ['run', '--urls', 'http://0.0.0.0:5001'],
  },
  {
    id: 'document-processor',
    name: 'Diagram Event Processor',
    port: 8080,
    lanUrl: 'http://0.0.0.0:8080',
    cwd: documentProcessorDir,
    command: 'mvn',
    args: ['spring-boot:run'],
  },
  {
    id: 'component-composer',
    name: 'Component Composer API',
    port: 8090,
    lanUrl: 'http://0.0.0.0:8090',
    cwd: componentComposerDir,
    command: 'python',
    args: ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8090'],
    ensureDeps: 'python',
  },
  {
    id: 'nanosat-systems',
    name: 'Nanosat Systems Frontend',
    port: 5173,
    lanUrl: 'http://0.0.0.0:5173',
    cwd: nanoSatSystemsDir,
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    env: { HOST: '0.0.0.0', PORT: '5173' },
    ensureDeps: true,
  },
];

const serviceStates = serviceDefinitions.reduce((acc, definition) => {
  acc[definition.id] = { process: null, startPending: false, stopPending: false, logs: [], startTime: null };
  return acc;
}, {});

const appendServiceLog = (serviceId, source, chunk) => {
  const state = serviceStates[serviceId];
  if (!state) {
    return;
  }
  const text = String(chunk || '').trim();
  if (!text) {
    return;
  }
  const lines = text.split(/\r?\n/).filter(Boolean);
  lines.forEach((line) => {
    state.logs.push({
      source,
      text: line,
      timestamp: new Date().toISOString(),
    });
    if (state.logs.length > serviceLogsLimit) {
      state.logs.shift();
    }
  });
  broadcastServiceUpdate();
};

const serviceSnapshot = (serviceId) => {
  const definition = serviceDefinitions.find((svc) => svc.id === serviceId);
  const state = serviceStates[serviceId];
  return {
    id: definition.id,
    name: definition.name,
    port: definition.port,
    lanUrl: definition.lanUrl,
    running: Boolean(state.process),
    pid: state.process?.pid ?? null,
    startTime: state.startTime ? state.startTime.toISOString() : null,
    startPending: state.startPending,
    stopPending: state.stopPending,
    logs: [...state.logs],
    command: `${definition.command} ${definition.args.join(' ')}`,
  };
};

const broadcastServiceUpdate = () => {
  broadcast({
    type: 'services',
    services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    timestamp: new Date().toISOString(),
  });
};

const runCommandWithLogs = (serviceId, command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const cmd = spawn(command, args, { shell: true, ...options });
    cmd.stdout.on('data', (chunk) => appendServiceLog(serviceId, 'stdout', chunk));
    cmd.stderr.on('data', (chunk) => appendServiceLog(serviceId, 'stderr', chunk));
    cmd.on('error', (error) => {
      appendServiceLog(serviceId, 'stderr', `preflight error: ${error.message}`);
      reject(error);
    });
    cmd.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`preflight exited with code ${code}`));
      }
    });
  });

const stopChildProcess = (child) =>
  new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    child.once('exit', finish);

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: true });
      killer.on('error', () => {
        try {
          child.kill('SIGTERM');
        } catch (_) {}
      });
      killer.on('exit', finish);
      setTimeout(finish, 2_000);
      return;
    }

    try {
      child.kill('SIGTERM');
    } catch (_) {}
    setTimeout(() => {
      if (child.exitCode === null) {
        try {
          child.kill('SIGKILL');
        } catch (_) {}
      }
      finish();
    }, 1_500);
  });

const runCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk || '');
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });

const isPortListening = (port, host = '127.0.0.1', timeoutMs = 600) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });

const stopWindowsProcessByPort = async (port) => {
  const script = `
    $pids = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique;
    foreach ($pid in $pids) {
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue;
    }
  `;
  await runCommand('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
};

let composerDepsInstalled = false;

const ensureComponentComposerDependencies = async () => {
  if (!fs.existsSync(componentComposerVenvPython)) {
    await runCommandWithLogs('component-composer', 'python', ['-m', 'venv', '.venv'], {
      cwd: componentComposerDir,
    });
  }
  if (!composerDepsInstalled) {
    await runCommandWithLogs('component-composer', componentComposerVenvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
      cwd: componentComposerDir,
    });
    await runCommandWithLogs('component-composer', componentComposerVenvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
      cwd: componentComposerDir,
    });
    composerDepsInstalled = true;
  }
};

const ensureNodeDependencies = async (service) => {
  const nodeModulesPath = path.join(service.cwd, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    await runCommandWithLogs(service.id, service.command, ['install'], {
      cwd: service.cwd,
    });
  }
};

const ensureJdkAvailable = async () => {
  try {
    await runCommand('javac', ['-version'], { shell: true });
  } catch (error) {
    throw new Error(`JDK not available (missing javac): ${error.message}`);
  }
};

const startServiceProcess = async (serviceId) => {
  const definition = serviceDefinitions.find((svc) => svc.id === serviceId);
  if (!definition) {
    throw new Error('unknown service');
  }
  const state = serviceStates[serviceId];
  if (state.process) {
    throw new Error(`${definition.name} is already running`);
  }
  if (state.startPending) {
    throw new Error(`start already in progress for ${definition.name}`);
  }
  if (state.stopPending) {
    throw new Error(`stop already in progress for ${definition.name}`);
  }
  state.startPending = true;
  appendServiceLog(serviceId, 'stdout', `Starting ${definition.name}...`);
  broadcastServiceUpdate();

  try {
    if (definition.id === 'component-composer') {
      await ensureComponentComposerDependencies();
    }
    if (definition.id === 'document-processor') {
      await ensureJdkAvailable();
    }
    if (definition.ensureDeps === true) {
      await ensureNodeDependencies(definition);
    }

    let launchCommand = definition.command;
    const launchArgs = [...definition.args];
    if (definition.id === 'component-composer') {
      launchCommand = componentComposerVenvPython;
    }

    const child = spawn(launchCommand, launchArgs, {
      cwd: definition.cwd,
      env: { ...process.env, ...(definition.env || {}) },
      shell: true,
    });
    state.process = child;
    state.startTime = new Date();
    appendServiceLog(serviceId, 'stdout', `Launched ${launchCommand} ${launchArgs.join(' ')}`);

    child.stdout.on('data', (chunk) => appendServiceLog(serviceId, 'stdout', chunk));
    child.stderr.on('data', (chunk) => appendServiceLog(serviceId, 'stderr', chunk));
    child.on('error', (error) => {
      appendServiceLog(serviceId, 'stderr', `Process error: ${error.message}`);
      state.process = null;
      state.startPending = false;
      state.stopPending = false;
      broadcastServiceUpdate();
    });
    child.on('exit', (code, signal) => {
      appendServiceLog(serviceId, 'stderr', `Exited code=${code || 0} signal=${signal || 'n/a'}`);
      state.process = null;
      state.startPending = false;
      state.stopPending = false;
      broadcastServiceUpdate();
    });

    state.startPending = false;
    broadcastServiceUpdate();
    return serviceSnapshot(serviceId);
  } catch (error) {
    state.startPending = false;
    appendServiceLog(serviceId, 'stderr', `Start failed: ${error.message}`);
    broadcastServiceUpdate();
    throw error;
  }
};

const stopServiceProcess = async (serviceId) => {
  const definition = serviceDefinitions.find((svc) => svc.id === serviceId);
  if (!definition) {
    throw new Error('unknown service');
  }

  const state = serviceStates[serviceId];
  if (state.startPending) {
    throw new Error(`start in progress for ${definition.name}`);
  }
  if (state.stopPending) {
    throw new Error(`stop already in progress for ${definition.name}`);
  }
  if (!state.process) {
    throw new Error(`${definition.name} is not running`);
  }

  state.stopPending = true;
  appendServiceLog(serviceId, 'stdout', `Stopping ${definition.name}...`);
  broadcastServiceUpdate();
  const processRef = state.process;

  try {
    await stopChildProcess(processRef);
    if (process.platform === 'win32' && definition.port) {
      const stillListening = await isPortListening(definition.port);
      if (stillListening) {
        await stopWindowsProcessByPort(definition.port).catch((error) => {
          appendServiceLog(serviceId, 'stderr', `Port fallback stop failed: ${error.message}`);
        });
      }
    }
    state.process = null;
    state.startTime = null;
    appendServiceLog(serviceId, 'stdout', `${definition.name} stopped.`);
  } catch (error) {
    appendServiceLog(serviceId, 'stderr', `Stop failed: ${error.message}`);
    throw error;
  } finally {
    state.stopPending = false;
    broadcastServiceUpdate();
  }

  return serviceSnapshot(serviceId);
};

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureKafkaAvailable().catch(() => {});
  }, 5_000);
};

const startKafkaProcess = () => {
  if (!kafkaStartScriptAvailable) {
    throw new Error('Kafka start script is missing from the repository.');
  }
  if (kafkaProcess) {
    throw new Error('Kafka process is already running.');
  }

  const child = spawn(kafkaStartScript, [kafkaConfigPath], {
    cwd: path.dirname(kafkaStartScript),
    shell: true,
    env: process.env,
  });
  kafkaProcess = child;
  kafkaProcessStartTime = new Date();
  kafkaProcessLogs.length = 0;

  child.stdout.on('data', (chunk) => {
    appendKafkaProcessLog('stdout', chunk);
    sendKafkaProcessUpdate();
  });
  child.stderr.on('data', (chunk) => {
    appendKafkaProcessLog('stderr', chunk);
    sendKafkaProcessUpdate();
  });
  child.on('error', (error) => {
    console.error('Kafka process error', error);
    appendKafkaProcessLog('stderr', `Kafka process error: ${error.message}`);
    kafkaProcess = null;
    sendKafkaProcessUpdate();
  });
  child.on('exit', (code, signal) => {
    appendKafkaProcessLog('stderr', `Kafka process exited with code=${code} signal=${signal}`);
    kafkaProcess = null;
    sendKafkaProcessUpdate();
  });

  setTimeout(() => {
    ensureKafkaAvailable().catch(() => {});
  }, 4_000);
  sendKafkaProcessUpdate();
  return child;
};

const stopKafkaProcess = async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (kafkaProcess) {
    const processRef = kafkaProcess;
    await stopChildProcess(processRef);
    kafkaProcess = null;
    kafkaProcessStartTime = null;
    appendKafkaProcessLog('stdout', 'Kafka process stop requested.');
  }

  if (kafkaConnected) {
    await admin.disconnect().catch((error) => {
      appendKafkaProcessLog('stderr', `Kafka disconnect failed: ${error.message}`);
    });
  }

  kafkaConnected = false;
  connectPromise = null;
  broadcastKafkaStatus('Kafka disconnected');
  sendKafkaProcessUpdate();
  return kafkaProcessSnapshot();
};

const fetchJsonWithTimeout = async (url, timeoutMs = 5_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const sendKafkaProcessUpdate = () => {
  broadcast({
    type: 'kafka-process',
    process: kafkaProcessSnapshot(),
    services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    timestamp: new Date().toISOString(),
  });
};

const publicDir = path.join(__dirname, 'public');
const app = express();
app.use(cors());
app.use(express.static(publicDir));

app.get('/api/status', (_req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    kafkaConnected,
    kafkaBrokers: KAFKA_BROKERS,
    port: PORT,
    kafkaProcess: kafkaProcessSnapshot(),
    services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
  });
});

app.get('/api/topics', async (_req, res) => {
  try {
    await ensureKafkaAvailable();
    const metadata = await admin.fetchTopicMetadata({ topics: [] });
    const topics = metadata.topics.map((topic) => ({
      name: topic.name,
      partitions: topic.partitions.map((partition) => ({
        partitionId: partition.partitionId,
        leader: partition.leader,
        replicas: partition.replicas,
        isr: partition.isr,
      })),
    }));
    res.json({ topics });
  } catch (error) {
    res.status(503).json({ error: 'Kafka unavailable', detail: error.message });
  }
});

app.get('/api/consumer-groups', async (_req, res) => {
  try {
    await ensureKafkaAvailable();
    const groupList = await admin.listGroups();
    const groupIds = groupList.groups.map((group) => group.groupId).slice(0, 20);
    let descriptions = [];
    if (groupIds.length) {
      const described = await admin.describeGroups(groupIds);
      descriptions = described.groups.map((group) => ({
        groupId: group.groupId,
        state: group.state,
        protocol: group.protocol,
        members: group.members.length,
      }));
    }
    res.json({ groups: descriptions, totalDiscovered: groupList.groups.length });
  } catch (error) {
    res.status(503).json({ error: 'Kafka unavailable', detail: error.message });
  }
});

app.get('/api/tools/topics', async (_req, res) => {
  try {
    await ensureKafkaAvailable();
    const metadata = await admin.fetchTopicMetadata({ topics: [] });
    const topics = metadata.topics.map((topic) => ({
      name: topic.name,
      partitions: topic.partitions.length,
    }));
    res.json({ topics, total: topics.length });
  } catch (error) {
    res.status(503).json({ error: 'Kafka unavailable', detail: error.message });
  }
});

app.get('/api/tools/consumer-groups', async (_req, res) => {
  try {
    await ensureKafkaAvailable();
    const groupList = await admin.listGroups();
    res.json({ totalDiscovered: groupList.groups.length, groups: groupList.groups });
  } catch (error) {
    res.status(503).json({ error: 'Kafka unavailable', detail: error.message });
  }
});

app.get('/api/tools/project-management/schema-check', async (_req, res) => {
  try {
    const [connection, data] = await Promise.all([
      fetchJsonWithTimeout(`${PROJECT_MANAGEMENT_ADMIN_URL}/admin/connection`),
      fetchJsonWithTimeout(`${PROJECT_MANAGEMENT_ADMIN_URL}/admin/data`),
    ]);
    const tables = Array.isArray(data.tables) ? data.tables : [];
    const rowCount = tables.reduce((sum, table) => sum + (Array.isArray(table.rows) ? table.rows.length : 0), 0);
    res.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      adminUrl: PROJECT_MANAGEMENT_ADMIN_URL,
      generatedAtUtc: data.generatedAtUtc || null,
      tableCount: tables.length,
      rowCount,
      connection,
      tables: tables.map((table) => ({
        schema: table.schema,
        name: table.name,
        rows: Array.isArray(table.rows) ? table.rows.length : 0,
      })),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      checkedAt: new Date().toISOString(),
      adminUrl: PROJECT_MANAGEMENT_ADMIN_URL,
      error: error.message,
    });
  }
});

app.get('/api/kafka/process', (_req, res) => {
  res.json({ process: kafkaProcessSnapshot(), services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)) });
});

app.post('/api/kafka/start', (_req, res) => {
  try {
    if (!kafkaProcess) {
      startKafkaProcess();
    }
    res.status(202).json({
      message: 'Kafka start sequence triggered.',
      process: kafkaProcessSnapshot(),
      services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    });
  } catch (error) {
    const statusCode = error.message.includes('missing') ? 503 : 409;
    res.status(statusCode).json({
      error: error.message,
      process: kafkaProcessSnapshot(),
      services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    });
  }
});

app.post('/api/kafka/stop', async (_req, res) => {
  try {
    const process = await stopKafkaProcess();
    res.status(202).json({
      message: 'Kafka stop sequence triggered.',
      process,
      services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    });
  } catch (error) {
    res.status(409).json({
      error: error.message,
      process: kafkaProcessSnapshot(),
      services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
    });
  }
});

app.get('/api/services', (_req, res) => {
  res.json({ services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)) });
});

app.post('/api/services/:id/start', async (req, res) => {
  try {
    const snapshot = await startServiceProcess(req.params.id);
    res.status(202).json({
      message: `${snapshot.name} start triggered.`,
      service: snapshot,
    });
  } catch (error) {
    res.status(409).json({ error: error.message, service: serviceStates[req.params.id] ? serviceSnapshot(req.params.id) : null });
  }
});

app.post('/api/services/:id/stop', async (req, res) => {
  try {
    const snapshot = await stopServiceProcess(req.params.id);
    res.status(202).json({
      message: `${snapshot.name} stop triggered.`,
      service: snapshot,
    });
  } catch (error) {
    res.status(409).json({ error: error.message, service: serviceStates[req.params.id] ? serviceSnapshot(req.params.id) : null });
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log('api-control-panel listening on port', PORT);
});

wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({
    type: 'welcome',
    timestamp: new Date().toISOString(),
    kafkaConnected,
    process: kafkaProcessSnapshot(),
    services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
  }));
});

const heartbeatTimer = setInterval(() => {
  broadcast({
    type: 'heartbeat',
    timestamp: new Date().toISOString(),
    kafkaConnected,
    process: kafkaProcessSnapshot(),
    services: serviceDefinitions.map((svc) => serviceSnapshot(svc.id)),
  });
}, 5_000);

const shutdown = async (code = 0) => {
  clearInterval(heartbeatTimer);
  if (wss) {
    wss.close();
  }
  await new Promise((resolve) => server.close(resolve));
  if (kafkaConnected) {
    await admin.disconnect().catch((error) => console.error('Kafka disconnect failed:', error.message));
  }
  Object.values(serviceStates).forEach((state) => {
    if (state.process) {
      state.process.kill();
    }
  });
  if (kafkaProcess) {
    kafkaProcess.kill();
  }
  process.exit(code);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
