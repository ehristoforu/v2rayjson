export interface ServerConfig {
  id: string;
  raw: string;
  protocol: 'vless' | 'hysteria2' | 'unknown';
  address: string;
  port: number;
  remarks: string;
  uuid: string;
  
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
  
  selected: boolean;
}

export interface AppSettings {
  dnsServers: string;
  socksPort: number;
  httpPort: number;
  routingRules: string;
  balancerStrategy: 'leastLoad' | 'leastPing' | 'none';
  configRemarks: string;
}
