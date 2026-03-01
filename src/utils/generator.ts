import { ServerConfig, AppSettings } from '../types';

export function generateConfig(servers: ServerConfig[], settings: AppSettings) {
  const selectedServers = servers.filter(s => s.selected);
  if (selectedServers.length === 0) return '{\n  "message": "No servers selected"\n}';

  const dnsServers = settings.dnsServers.split(',').map(s => s.trim()).filter(s => s);
  
  const baseConfig: any = {
    dns: {
      port: 53,
      servers: dnsServers.length > 0 ? dnsServers : ["1.1.1.1", "8.8.8.8"],
      queryStrategy: "UseIPv4"
    },
    inbounds: [
      {
        tag: "socks",
        port: settings.socksPort || 10808,
        listen: "127.0.0.1",
        protocol: "socks",
        settings: {
          udp: true,
          auth: "noauth"
        },
        sniffing: {
          enabled: true,
          routeOnly: false,
          destOverride: ["http", "tls", "quic"]
        }
      },
      {
        tag: "http",
        port: settings.httpPort || 10809,
        listen: "127.0.0.1",
        protocol: "http",
        settings: {
          allowTransparent: false
        },
        sniffing: {
          enabled: true,
          routeOnly: false,
          destOverride: ["http", "tls", "quic"]
        }
      }
    ],
    outbounds: [],
    remarks: settings.configRemarks || "Generated Config",
    routing: {
      domainMatcher: "hybrid",
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          type: "field",
          protocol: ["bittorrent"],
          outboundTag: "block"
        }
      ]
    }
  };

  // Add outbounds
  selectedServers.forEach((server, index) => {
    const tag = settings.balancerStrategy !== 'none' && selectedServers.length > 1 ? server.id : (index === 0 ? 'proxy' : `proxy-${index}`);
    
    if (server.protocol === 'vless') {
      const outbound: any = {
        tag: tag,
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: server.address,
              port: server.port,
              users: [
                {
                  id: server.uuid,
                  flow: server.flow || "",
                  encryption: server.encryption || "none"
                }
              ]
            }
          ]
        },
        streamSettings: {
          network: server.type || "tcp",
          security: server.security || "none",
        }
      };

      if (server.security === 'reality') {
        outbound.streamSettings.realitySettings = {
          publicKey: server.pbk || "",
          serverName: server.sni || "",
          fingerprint: server.fp || "chrome",
          show: false,
          shortId: server.sid || "",
          spiderX: server.spx || ""
        };
      } else if (server.security === 'tls') {
        outbound.streamSettings.tlsSettings = {
          serverName: server.sni || "",
          fingerprint: server.fp || "chrome"
        };
      }

      if (server.type === 'ws') {
        outbound.streamSettings.wsSettings = {
          path: server.spx || "/",
          headers: {
            Host: server.sni || ""
          }
        };
      }

      baseConfig.outbounds.push(outbound);
    } else if (server.protocol === 'hysteria2') {
      const outbound: any = {
        tag: tag,
        protocol: "hysteria2",
        settings: {
          server: `${server.address}:${server.port}`,
          password: server.uuid,
          sni: server.sni || "",
          insecure: server.insecure || false
        }
      };
      if (server.obfs) {
        outbound.settings.obfs = server.obfs;
        outbound.settings.obfsPassword = server.obfsPassword || "";
      }
      baseConfig.outbounds.push(outbound);
    }
  });

  // Direct and Block outbounds
  baseConfig.outbounds.push({
    tag: "direct",
    protocol: "freedom"
  });
  baseConfig.outbounds.push({
    tag: "block",
    protocol: "blackhole"
  });

  // Balancer setup
  if (settings.balancerStrategy !== 'none' && selectedServers.length > 1) {
    const tags = selectedServers.map(s => s.id);
    
    baseConfig.burstObservatory = {
      subjectSelector: tags,
      pingConfig: {
        destination: "http://www.gstatic.com/generate_204",
        interval: "15s",
        timeout: "5s",
        sampling: 4
      }
    };

    const balancer: any = {
      tag: "bal_main",
      selector: tags,
      fallbackTag: tags[tags.length - 1]
    };

    if (settings.balancerStrategy === 'leastLoad') {
      balancer.strategy = {
        type: "leastLoad",
        settings: {
          baselines: ["4s"],
          costs: tags.map((tag, i) => ({
            match: tag,
            regexp: false,
            value: i * 100000000
          })),
          expected: 1,
          maxRTT: "6s"
        }
      };
    } else if (settings.balancerStrategy === 'leastPing') {
      balancer.strategy = {
        type: "leastPing"
      };
    }

    baseConfig.routing.balancers = [balancer];
    
    baseConfig.routing.rules.push({
      type: "field",
      inboundTag: ["socks", "http"],
      network: "tcp,udp",
      balancerTag: "bal_main"
    });
  } else {
    baseConfig.routing.rules.push({
      type: "field",
      inboundTag: ["socks", "http"],
      network: "tcp,udp",
      outboundTag: selectedServers.length > 0 ? (settings.balancerStrategy !== 'none' && selectedServers.length > 1 ? selectedServers[0].id : 'proxy') : "direct"
    });
  }

  return JSON.stringify(baseConfig, null, 2);
}
