export interface ServerConfig {
  id: string;
  raw: string;
  protocol: 'vless' | 'hysteria2' | 'socks' | 'unknown';
  address: string;
  port: number;
  remarks: string;
  serverDescription?: string;
  uuid: string; // auth for hysteria2/socks
  selected: boolean;
  
  // VLESS
  security?: string;
  sni?: string;
  fp?: string;
  pbk?: string;
  type?: string;
  flow?: string;
  packetEncoding?: string;
  encryption?: string;
  sid?: string;
  spx?: string;
  
  // Hysteria2
  obfs?: string;
  obfsPassword?: string;
  insecure?: boolean;
  pinSHA256?: string;
  mportHopInt?: number;

  // Advanced (DPI)
  fragment?: string;
  noises?: string;
}

export interface AppSettings {
  dnsServers: string;
  socksPort: number;
  httpPort: number;
  routingRules: string;
  balancerStrategy: 'leastLoad' | 'leastPing' | 'none';
  configRemarks: string;
  
  // Balancer Ping Config
  pingDestination: string;
  pingInterval: string;
  pingTimeout: string;
  pingSampling: number;
  
  // Balancer Strategy Settings (leastLoad)
  leastLoadBaselines: string;
  leastLoadExpected: number;
  leastLoadMaxRTT: string;
}
