import { ServerConfig, AppSettings } from '../types';

function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => (v && typeof v === 'object' ? cleanObject(v) : v)).filter(v => v !== null && v !== undefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [k, v]) => {
      if (v !== null && v !== undefined) {
        acc[k] = typeof v === 'object' ? cleanObject(v) : v;
      }
      return acc;
    }, {} as any);
  }
  return obj;
}

export function generateConfig(servers: ServerConfig[], settings: AppSettings): string[] {
  const selectedServers = servers.filter(s => s.selected);
  if (selectedServers.length === 0) return ['{\n  "message": "No servers selected"\n}'];

  const isBalancer = settings.balancerStrategy !== 'none' && selectedServers.length > 1;
  const dnsServers = settings.dnsServers.split(',').map(s => s.trim()).filter(s => s);
  
  const createBaseConfig = (remarks: string) => ({
    dns: {
      hosts: {
        "domain:googleapis.cn": "googleapis.com"
      },
      queryStrategy: "UseIPv4",
      servers: dnsServers.length > 0 ? dnsServers : [
        "1.1.1.1",
        {
          address: "1.1.1.1",
          domains: [],
          port: 53
        },
        {
          address: "8.8.8.8",
          domains: [],
          port: 53
        }
      ]
    },
    inbounds: [
      {
        listen: "127.0.0.1",
        port: settings.socksPort || 10808,
        protocol: "socks",
        settings: {
          auth: "noauth",
          udp: true,
          userLevel: 8
        },
        sniffing: {
          destOverride: ["http", "tls", "quic"],
          enabled: true
        },
        tag: "socks"
      },
      {
        listen: "127.0.0.1",
        port: settings.httpPort || 10809,
        protocol: "http",
        settings: {
          userLevel: 8
        },
        sniffing: {
          destOverride: ["http", "tls", "quic"],
          enabled: true
        },
        tag: "http"
      },
      {
        listen: "127.0.0.1",
        port: 11111,
        protocol: "dokodemo-door",
        settings: {
          address: "127.0.0.1"
        },
        tag: "metrics_in"
      }
    ],
    log: {
      loglevel: "warning"
    },
    metrics: {
      tag: "metrics_out"
    },
    outbounds: [] as any[],
    policy: {
      levels: {
        "0": {
          statsUserDownlink: true,
          statsUserUplink: true
        },
        "8": {
          connIdle: 300,
          downlinkOnly: 1,
          handshake: 4,
          uplinkOnly: 1
        }
      },
      system: {
        statsInboundDownlink: true,
        statsInboundUplink: true,
        statsOutboundDownlink: true,
        statsOutboundUplink: true
      }
    },
    remarks: remarks || "Generated Config",
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          inboundTag: ["metrics_in"],
          outboundTag: "metrics_out"
        },
        {
          inboundTag: ["socks"],
          outboundTag: "proxy",
          port: "53"
        },
        {
          ip: ["1.1.1.1"],
          outboundTag: "proxy",
          port: "53"
        },
        {
          ip: ["8.8.8.8"],
          outboundTag: "direct",
          port: "53"
        }
      ]
    },
    stats: {}
  });

  const createOutbound = (server: ServerConfig, tag: string) => {
    if (server.protocol === 'vless') {
      const outbound: any = {
        mux: {
          concurrency: -1,
          enabled: false,
          xudpConcurrency: 8,
          xudpProxyUDP443: ""
        },
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: server.address,
              port: server.port,
              users: [
                {
                  encryption: server.encryption || "none",
                  flow: server.flow || "",
                  id: server.uuid,
                  level: 8,
                  security: "auto"
                }
              ]
            }
          ]
        },
        streamSettings: {
          network: server.type || "tcp",
          security: server.security || "none"
        },
        tag: tag
      };

      if (server.security === 'reality') {
        outbound.streamSettings.realitySettings = {
          allowInsecure: false,
          fingerprint: server.fp || "chrome",
          publicKey: server.pbk || "",
          serverName: server.sni || "",
          shortId: server.sid || "",
          show: false,
          spiderX: server.spx || "/"
        };
      } else if (server.security === 'tls') {
        outbound.streamSettings.tlsSettings = {
          allowInsecure: false,
          fingerprint: server.fp || "chrome",
          serverName: server.sni || "",
          show: false
        };
      }

      if (server.type === 'tcp' || !server.type) {
        outbound.streamSettings.tcpSettings = {
          header: {
            type: "none"
          }
        };
      } else if (server.type === 'ws') {
        outbound.streamSettings.wsSettings = {
          path: server.spx || "/",
          headers: {
            Host: server.sni || ""
          }
        };
      } else if (server.type === 'grpc') {
        outbound.streamSettings.grpcSettings = {
          serviceName: server.spx || "",
          multiMode: false
        };
      }
      return outbound;
    } else if (server.protocol === 'hysteria2') {
      const outbound: any = {
        mux: {
          concurrency: -1,
          enabled: false,
          xudpConcurrency: 8,
          xudpProxyUDP443: ""
        },
        protocol: "hysteria",
        settings: {
          address: server.address,
          port: server.port,
          version: 2
        },
        streamSettings: {
          hysteriaSettings: {
            auth: server.uuid,
            version: 2
          },
          network: "hysteria",
          security: "tls",
          tlsSettings: {
            allowInsecure: server.insecure || false,
            alpn: ["h3"],
            serverName: server.sni || "",
            show: false
          }
        },
        tag: tag
      };
      
      if (server.obfs) {
        outbound.settings.obfs = server.obfs;
        outbound.settings.obfsPassword = server.obfsPassword || "";
      }
      return outbound;
    }
    return null;
  };

  const addDirectAndBlock = (config: any) => {
    config.outbounds.push({
      protocol: "freedom",
      settings: {
        domainStrategy: "UseIP"
      },
      tag: "direct"
    });
    config.outbounds.push({
      protocol: "blackhole",
      settings: {
        response: {
          type: "http"
        }
      },
      tag: "block"
    });
  };

  if (!isBalancer) {
    // Generate one config per server
    return selectedServers.map(server => {
      const config = createBaseConfig(server.remarks || settings.configRemarks);
      const outbound = createOutbound(server, 'proxy');
      if (outbound) config.outbounds.push(outbound);
      addDirectAndBlock(config);
      return JSON.stringify(cleanObject(config), null, 2);
    });
  }

  // Generate single config with balancer
  const baseConfig = createBaseConfig(settings.configRemarks);
  
  selectedServers.forEach((server, index) => {
    const tag = server.id;
    const outbound = createOutbound(server, tag);
    if (outbound) baseConfig.outbounds.push(outbound);
  });

  addDirectAndBlock(baseConfig);

  const tags = selectedServers.map(s => s.id);
  
  baseConfig.burstObservatory = {
    subjectSelector: tags,
    pingConfig: {
      destination: settings.pingDestination || "http://www.gstatic.com/generate_204",
      interval: settings.pingInterval || "15s",
      timeout: settings.pingTimeout || "5s",
      sampling: settings.pingSampling || 4
    }
  };

  baseConfig.routing.domainMatcher = "hybrid";
  baseConfig.routing.rules = [
    {
      type: "field",
      protocol: ["bittorrent"],
      outboundTag: "block"
    },
    {
      type: "field",
      inboundTag: ["socks", "http"],
      network: "tcp,udp",
      balancerTag: "bal_main"
    },
    ...baseConfig.routing.rules
  ];

  const balancer: any = {
    tag: "bal_main",
    selector: tags,
    fallbackTag: tags[tags.length - 1]
  };

  if (settings.balancerStrategy === 'leastLoad') {
    balancer.strategy = {
      type: "leastLoad",
      settings: {
        baselines: (settings.leastLoadBaselines || "4s").split(',').map(s => s.trim()),
        costs: tags.map((tag, i) => ({
          match: tag,
          regexp: false,
          value: i * 100000000
        })),
        expected: settings.leastLoadExpected || 1,
        maxRTT: settings.leastLoadMaxRTT || "6s"
      }
    };
  } else if (settings.balancerStrategy === 'leastPing') {
    balancer.strategy = {
      type: "leastPing"
    };
  }

  baseConfig.routing.balancers = [balancer];

  return [JSON.stringify(cleanObject(baseConfig), null, 2)];
}
