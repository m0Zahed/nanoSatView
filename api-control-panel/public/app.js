import { initTools } from './tools/tools.js';

const servicesEl = document.getElementById('services');
const serviceLogsEl = document.getElementById('service-logs');
const refreshServicesButton = document.getElementById('refresh-services');

const startKafkaButton = document.getElementById('start-kafka');
const stopKafkaButton = document.getElementById('stop-kafka');
const kafkaDetailsToggleButton = document.getElementById('kafka-details-toggle');
const kafkaSummaryEl = document.getElementById('kafka-summary');
const kafkaDetailsEl = document.getElementById('kafka-details');

const navBackButton = document.getElementById('nav-back');
const navForwardButton = document.getElementById('nav-forward');
const openProjectAdminButton = document.getElementById('open-project-admin');
const openClientAppButton = document.getElementById('open-client-app');

let state = {
  services: [],
  kafkaProcess: null,
  kafkaConnected: false,
  serverTime: null,
};
let selectedServiceId = null;

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.detail || `HTTP ${response.status}`);
  }
  return payload;
};

const statusClass = (service) => {
  if (service.startPending) return 'status-starting';
  if (service.stopPending) return 'status-stopping';
  return service.running ? 'status-running' : 'status-stopped';
};

const statusText = (service) => {
  if (service.startPending) return 'starting';
  if (service.stopPending) return 'stopping';
  return service.running ? 'running' : 'stopped';
};

const formatTime = (value) => (value ? new Date(value).toLocaleString() : 'n/a');

const renderServiceLogs = (serviceId) => {
  const service = state.services.find((svc) => svc.id === serviceId);
  if (!service) {
    serviceLogsEl.textContent = 'Select a service and click "View Logs".';
    return;
  }

  const lines = Array.isArray(service.logs) ? service.logs : [];
  if (!lines.length) {
    serviceLogsEl.textContent = `${service.name}\n\nNo logs yet.`;
    return;
  }

  serviceLogsEl.textContent = `${service.name}\n\n${lines
    .map((entry) => `${entry.timestamp || ''} [${entry.source || 'log'}] ${entry.text || ''}`)
    .join('\n')}`;
};

const renderServices = (services) => {
  if (!Array.isArray(services) || !services.length) {
    servicesEl.textContent = 'No services configured.';
    serviceLogsEl.textContent = 'No service logs available.';
    return;
  }

  servicesEl.innerHTML = `<div class="service-list">${services
    .map(
      (service) => `
      <article class="service-row" data-service-id="${service.id}">
        <div>
          <h3 class="service-name">${service.name}</h3>
          <p class="service-subtext">Port ${service.port ?? 'n/a'} | ${service.lanUrl || 'n/a'}</p>
          <p class="service-subtext">PID ${service.pid ?? 'n/a'} | Started ${formatTime(service.startTime)}</p>
        </div>
        <div>
          <span class="status-pill ${statusClass(service)}">${statusText(service)}</span>
          <p class="service-subtext">${service.command}</p>
        </div>
        <div class="row-actions">
          <button class="btn" data-action="start" data-service-id="${service.id}" ${service.running || service.startPending || service.stopPending ? 'disabled' : ''}>Start</button>
          <button class="btn btn-danger" data-action="stop" data-service-id="${service.id}" ${!service.running || service.startPending || service.stopPending ? 'disabled' : ''}>Stop</button>
          <button class="btn btn-secondary" data-action="logs" data-service-id="${service.id}">View Logs</button>
        </div>
      </article>
    `
    )
    .join('')}</div>`;

  if (selectedServiceId) {
    renderServiceLogs(selectedServiceId);
  } else {
    serviceLogsEl.textContent = 'Select a service and click "View Logs".';
  }
};

const renderKafka = () => {
  const process = state.kafkaProcess || {};
  const running = Boolean(process.running);
  startKafkaButton.disabled = running;
  stopKafkaButton.disabled = !running;
  kafkaSummaryEl.innerHTML = `
    <div class="service-row">
      <div>
        <h3 class="service-name">Kafka Broker</h3>
        <p class="service-subtext">Connection: ${state.kafkaConnected ? 'online' : 'offline'}</p>
        <p class="service-subtext">PID ${process.pid ?? 'n/a'} | Started ${formatTime(process.startTime)}</p>
      </div>
      <div>
        <span class="status-pill ${running ? 'status-running' : 'status-stopped'}">${running ? 'running' : 'stopped'}</span>
        <p class="service-subtext">Launcher ${process.scriptAvailable ? 'ready' : 'missing'}</p>
      </div>
      <div></div>
    </div>
  `;

  kafkaDetailsEl.textContent = JSON.stringify(
    {
      serverTime: state.serverTime,
      kafkaConnected: state.kafkaConnected,
      process,
    },
    null,
    2
  );
};

const refreshStatus = async () => {
  const payload = await fetchJson('/api/status');
  state = {
    ...state,
    services: payload.services || [],
    kafkaProcess: payload.kafkaProcess || {},
    kafkaConnected: Boolean(payload.kafkaConnected),
    serverTime: payload.serverTime,
  };
  renderServices(state.services);
  renderKafka();
};

const startService = async (serviceId) => {
  await fetchJson(`/api/services/${serviceId}/start`, { method: 'POST' });
  await refreshStatus();
};

const stopService = async (serviceId) => {
  await fetchJson(`/api/services/${serviceId}/stop`, { method: 'POST' });
  await refreshStatus();
};

async function startKafka() {
  startKafkaButton.disabled = true;
  try {
    await fetchJson('/api/kafka/start', { method: 'POST' });
    await refreshStatus();
  } finally {
    startKafkaButton.disabled = false;
  }
}

async function stopKafka() {
  stopKafkaButton.disabled = true;
  try {
    await fetchJson('/api/kafka/stop', { method: 'POST' });
    await refreshStatus();
  } finally {
    stopKafkaButton.disabled = false;
  }
}

servicesEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const serviceId = button.dataset.serviceId;

  try {
    if (action === 'start') {
      await startService(serviceId);
    }
    if (action === 'stop') {
      await stopService(serviceId);
    }
    if (action === 'logs') {
      selectedServiceId = serviceId;
      renderServiceLogs(selectedServiceId);
    }
  } catch (error) {
    alert(error.message);
  }
});

refreshServicesButton.addEventListener('click', () => refreshStatus().catch((error) => alert(error.message)));
startKafkaButton.addEventListener('click', () => startKafka().catch((error) => alert(error.message)));
stopKafkaButton.addEventListener('click', () => stopKafka().catch((error) => alert(error.message)));

kafkaDetailsToggleButton.addEventListener('click', () => {
  kafkaDetailsEl.classList.toggle('hidden');
});

navBackButton.addEventListener('click', () => history.back());
navForwardButton.addEventListener('click', () => history.forward());
openProjectAdminButton.addEventListener('click', () => window.open('http://localhost:5001/admin', '_blank'));
openClientAppButton.addEventListener('click', () => window.open('http://localhost:5173', '_blank'));

initTools({
  schemaButton: document.getElementById('check-schema'),
  topicsButton: document.getElementById('check-topics'),
  groupsButton: document.getElementById('check-groups'),
  schemaOutput: document.getElementById('schema-output'),
  topicsOutput: document.getElementById('topics-output'),
  groupsOutput: document.getElementById('groups-output'),
});

const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${wsProtocol}://${location.host}/ws`);

socket.addEventListener('message', (event) => {
  try {
    const payload = JSON.parse(event.data);
    if (payload.services) {
      state.services = payload.services;
      renderServices(state.services);
    }
    if (payload.process) {
      state.kafkaProcess = payload.process;
      renderKafka();
    }
    if (typeof payload.kafkaConnected === 'boolean') {
      state.kafkaConnected = payload.kafkaConnected;
      renderKafka();
    }
  } catch (_error) {}
});

socket.addEventListener('close', () => {
  kafkaSummaryEl.textContent = 'WebSocket disconnected. Refresh the page after restarting control panel.';
});

refreshStatus().catch((error) => {
  servicesEl.textContent = `Failed to load services: ${error.message}`;
  kafkaSummaryEl.textContent = `Failed to load Kafka status: ${error.message}`;
});
