import { ServerConfig } from '../types';

function decodeBase64(str: string) {
  try {
    return atob(str);
  } catch (e) {
    return str;
  }
}

function extractJSONs(text: string): any[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    const results: any[] = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          try {
            results.push(JSON.parse(text.substring(start, i + 1)));
          } catch (err) {}
          start = -1;
        }
      }
    }
    return results;
  }
}

export function parseSubscription(input: string): ServerConfig[] {
  let text = input.trim();
  const servers: ServerConfig[] = [];

  // 1. Try parsing as JSON(s)
  const jsonConfigs = extractJSONs(text);
  if (jsonConfigs.length > 0) {
    jsonConfigs.forEach((config, index) => {
      if (config.outbounds && Array.isArray(config.outbounds)) {
        config.outbounds.forEach((outbound: any) => {
          if (outbound.protocol === 'vless') {
            const vnext = outbound.settings?.vnext?.[0];
            if (!vnext) return;
            const user = vnext.users?.[0];
            if (!user) return;

            const stream = outbound.streamSettings || {};
            const reality = stream.realitySettings || {};
            const tls = stream.tlsSettings || {};
            const ws = stream.wsSettings || {};
            const grpc = stream.grpcSettings || {};

            servers.push({
              id: `grp-${index}-${Math.random().toString(36).substring(2, 9)}`,
              raw: JSON.stringify(outbound),
              protocol: 'vless',
              address: vnext.address,
              port: vnext.port,
              remarks: config.remarks || outbound.tag || `Server ${servers.length + 1}`,
              uuid: user.id,
              selected: true,
              security: stream.security || 'none',
              sni: reality.serverName || tls.serverName || ws.headers?.Host || '',
              fp: reality.fingerprint || tls.fingerprint || '',
              pbk: reality.publicKey || '',
              type: stream.network || 'tcp',
              flow: user.flow || '',
              packetEncoding: outbound.mux?.xudpProxyUDP443 ? 'xudp' : '',
              encryption: user.encryption || 'none',
              sid: reality.shortId || '',
              spx: reality.spiderX || ws.path || grpc.serviceName || '',
            });
          } else if (outbound.protocol === 'hysteria' || outbound.protocol === 'hysteria2') {
            const stream = outbound.streamSettings || {};
            const tls = stream.tlsSettings || {};
            const hyst = stream.hysteriaSettings || {};

            servers.push({
              id: `grp-${index}-${Math.random().toString(36).substring(2, 9)}`,
              raw: JSON.stringify(outbound),
              protocol: 'hysteria2',
              address: outbound.settings?.address || '',
              port: outbound.settings?.port || 443,
              remarks: config.remarks || outbound.tag || `Server ${servers.length + 1}`,
              uuid: hyst.auth || '',
              selected: true,
              sni: tls.serverName || '',
              obfs: outbound.settings?.obfs || '',
              obfsPassword: outbound.settings?.obfsPassword || '',
              insecure: tls.allowInsecure || false,
              pinSHA256: '',
            });
          }
        });
      }
    });
    
    if (servers.length > 0) {
      return servers;
    }
  }

  // 2. Fallback to standard link parsing
  if (!text.includes('://')) {
    text = decodeBase64(text);
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  lines.forEach((line, index) => {
    try {
      if (line.startsWith('vless://')) {
        const urlStr = line.replace(/^vless:\/\//i, 'http://');
        const url = new URL(urlStr);
        const uuid = url.username;
        const address = url.hostname;
        const port = parseInt(url.port || '443', 10);
        const remarks = decodeURIComponent(url.hash.replace('#', '')) || `Server ${servers.length + 1}`;
        
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
        const urlStr = line.replace(/^(hysteria2|hy2):\/\//i, 'http://');
        const url = new URL(urlStr);
        const uuid = url.username;
        const address = url.hostname;
        const port = parseInt(url.port || '443', 10);
        const remarks = decodeURIComponent(url.hash.replace('#', '')) || `Server ${servers.length + 1}`;
        
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
