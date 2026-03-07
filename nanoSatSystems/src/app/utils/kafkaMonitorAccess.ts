function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (common for Tailscale/CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

export function isLocalOrLanHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'localhost' || normalized === '127.0.0.1') return true;
  if (isPrivateIpv4(normalized)) return true;
  return false;
}

export function canAccessKafkaMonitor() {
  return __APP_DEV_ENABLED__ && isLocalOrLanHost(window.location.hostname);
}

