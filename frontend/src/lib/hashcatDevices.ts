export interface HashcatDevice {
  id: number;
  aliasId?: number;
  backend: string;
  type: string;
  name: string;
  vendor?: string;
  memory?: string;
}

export const OPENCL_DEVICE_TYPES = [
  { value: 0, label: 'All device types' },
  { value: 1, label: 'CPU only' },
  { value: 2, label: 'GPU only' },
  { value: 3, label: 'FPGA / Co-Processor' },
];

export function parseHashcatDevices(output: string): HashcatDevice[] {
  const devices: HashcatDevice[] = [];
  let backend = 'Backend';
  let current: HashcatDevice | null = null;

  const finishCurrent = () => {
    if (!current) return;
    const existing = devices.find(device => device.id === current?.id);
    if (!existing) {
      devices.push({
        ...current,
        name: current.name || `Device #${current.id}`,
        type: current.type || 'Unknown',
      });
    }
    current = null;
  };

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const backendMatch = line.match(/^([A-Za-z0-9 /+.-]+)\s+(Info|API)\b/i);
    if (backendMatch) {
      backend = backendMatch[1].trim();
      continue;
    }

    const backendDeviceMatch = line.match(/^Backend Device ID #0*(\d+)(?:\s+\(Alias:\s*#0*(\d+)\))?/i);
    if (backendDeviceMatch) {
      finishCurrent();
      current = {
        id: Number(backendDeviceMatch[1]),
        aliasId: backendDeviceMatch[2] ? Number(backendDeviceMatch[2]) : undefined,
        backend,
        type: 'Unknown',
        name: '',
      };
      continue;
    }

    const legacyDeviceMatch = line.match(/^\*?\s*Device #0*(\d+):\s*([^,]+)(?:,|$)/i);
    if (legacyDeviceMatch) {
      finishCurrent();
      devices.push({
        id: Number(legacyDeviceMatch[1]),
        backend,
        type: inferDeviceType(legacyDeviceMatch[2]),
        name: legacyDeviceMatch[2].trim(),
      });
      continue;
    }

    if (!current) continue;

    const fieldMatch = line.match(/^([A-Za-z.()]+)\.*:\s*(.+)$/);
    if (!fieldMatch) continue;

    const key = fieldMatch[1].toLowerCase();
    const value = fieldMatch[2].trim();
    if (key === 'type') current.type = value;
    if (key === 'name') current.name = value;
    if (key === 'vendor') current.vendor = value;
    if (key === 'memory.total') current.memory = value;
  }

  finishCurrent();
  return devices.sort((a, b) => a.id - b.id);
}

function inferDeviceType(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('cpu')) return 'CPU';
  if (
    normalized.includes('gpu') ||
    normalized.includes('nvidia') ||
    normalized.includes('amd') ||
    normalized.includes('radeon') ||
    normalized.includes('geforce') ||
    normalized.includes('rtx') ||
    normalized.includes('apple')
  ) {
    return 'GPU';
  }
  return 'Unknown';
}

export function formatDeviceLabel(device: HashcatDevice) {
  return `#${device.id} ${device.name}`;
}

