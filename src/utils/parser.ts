import { ServerConfig } from '../types';

function decodeBase64(str: string) {
  try {
    return atob(str);
  } catch (e) {
    return str;
  }
}

export function parseSubscription(input: string): ServerConfig[] {
  let text = input.trim();
  if (!text.includes('://')) {
    text = decodeBase64(text);
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const servers: ServerConfig[] = [];

  lines.forEach((line, index) => {
    try {
      if (line.startsWith('vless://')) {
        const url = new URL(line);
        const uuid = url.username;
        const address = url.hostname;
        const port = parseInt(url.port || '443', 10);
        const remarks = decodeURIComponent(url.hash.replace('#', '')) || `Server ${index + 1}`;
        
        servers.push({
          id: `grp-${index + 1}-${Math.random().toString(36).substring(2, 9)}`,
          raw: line,
          protocol: 'vless',
          address,
          port,
          remarks,
          uuid,
          selected: true,
          security: url.searchParams.get('security') || 'none',
          sni: url.searchParams.get('sni') || '',
          fp: url.searchParams.get('fp') || '',
          pbk: url.searchParams.get('pbk') || '',
          type: url.searchParams.get('type') || 'tcp',
          flow: url.searchParams.get('flow') || '',
          packetEncoding: url.searchParams.get('packetEncoding') || '',
          encryption: url.searchParams.get('encryption') || 'none',
          sid: url.searchParams.get('sid') || '',
          spx: url.searchParams.get('spx') || '',
        });
      } else if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) {
        const url = new URL(line);
        const uuid = url.username;
        const address = url.hostname;
        const port = parseInt(url.port || '443', 10);
        const remarks = decodeURIComponent(url.hash.replace('#', '')) || `Server ${index + 1}`;
        
        servers.push({
          id: `grp-${index + 1}-${Math.random().toString(36).substring(2, 9)}`,
          raw: line,
          protocol: 'hysteria2',
          address,
          port,
          remarks,
          uuid,
          selected: true,
          sni: url.searchParams.get('sni') || '',
          obfs: url.searchParams.get('obfs') || '',
          obfsPassword: url.searchParams.get('obfs-password') || '',
          insecure: url.searchParams.get('insecure') === '1',
          pinSHA256: url.searchParams.get('pinSHA256') || '',
        });
      }
    } catch (e) {
      console.error('Failed to parse line:', line, e);
    }
  });

  return servers;
}
