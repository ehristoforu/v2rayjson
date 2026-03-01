/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ServerConfig, AppSettings } from './types';
import { parseSubscription } from './utils/parser';
import { generateConfig } from './utils/generator';
import { Settings, Server, Download, Copy, Trash2, Check, Plus } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    dnsServers: '1.1.1.1, 8.8.8.8',
    socksPort: 10808,
    httpPort: 10809,
    routingRules: '',
    balancerStrategy: 'leastLoad',
    configRemarks: 'Generated Config'
  });
  const [copied, setCopied] = useState(false);

  const handleParse = useCallback(() => {
    const parsed = parseSubscription(input);
    setServers(prev => [...prev, ...parsed]);
    setInput('');
  }, [input]);

  const toggleServer = useCallback((id: string) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  }, []);

  const removeServer = useCallback((id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
  }, []);

  const generatedJson = useMemo(() => generateConfig(servers, settings), [servers, settings]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedJson]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedJson]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black">
      <div className="max-w-5xl mx-auto p-6 space-y-12">
        
        <header className="border-b border-white/10 pb-6 pt-12">
          <h1 className="text-4xl font-medium tracking-tight">Happ Config Converter</h1>
          <p className="text-white/50 mt-2 text-sm">Convert VLESS/Hysteria links to JSON with load balancing.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-12">
            
            {/* Input Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Import Links
                </h2>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste vless:// or hysteria2:// links, or a base64 subscription..."
                className="w-full h-32 bg-transparent border border-white/20 rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors resize-none font-mono"
              />
              <button
                onClick={handleParse}
                disabled={!input.trim()}
                className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Parse & Add
              </button>
            </section>

            {/* Settings Section */}
            <section className="space-y-6">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" /> Configuration
              </h2>
              
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Config Remarks</label>
                  <input
                    type="text"
                    value={settings.configRemarks}
                    onChange={e => setSettings({...settings, configRemarks: e.target.value})}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">SOCKS Port</label>
                    <input
                      type="number"
                      value={settings.socksPort}
                      onChange={e => setSettings({...settings, socksPort: parseInt(e.target.value) || 10808})}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">HTTP Port</label>
                    <input
                      type="number"
                      value={settings.httpPort}
                      onChange={e => setSettings({...settings, httpPort: parseInt(e.target.value) || 10809})}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">DNS Servers (comma separated)</label>
                  <input
                    type="text"
                    value={settings.dnsServers}
                    onChange={e => setSettings({...settings, dnsServers: e.target.value})}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Balancer Strategy</label>
                  <div className="flex gap-2">
                    {(['leastLoad', 'leastPing', 'none'] as const).map(strategy => (
                      <button
                        key={strategy}
                        onClick={() => setSettings({...settings, balancerStrategy: strategy})}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${
                          settings.balancerStrategy === strategy 
                            ? 'bg-white text-black border-white' 
                            : 'bg-transparent text-white/70 border-white/20 hover:border-white/50'
                        }`}
                      >
                        {strategy === 'none' ? 'Disabled' : strategy === 'leastLoad' ? 'Least Load' : 'Least Ping'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>

          <div className="space-y-12">
            
            {/* Servers List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" /> Servers ({servers.length})
                </h2>
                {servers.length > 0 && (
                  <button 
                    onClick={() => setServers([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {servers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/30 text-sm">
                    No servers added yet
                  </div>
                ) : (
                  servers.map(server => (
                    <div 
                      key={server.id} 
                      className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                        server.selected ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleServer(server.id)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            server.protocol === 'vless' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {server.protocol}
                          </span>
                          <span className="text-sm font-medium truncate">{server.remarks}</span>
                        </div>
                        <div className="text-xs text-white/40 font-mono truncate">
                          {server.address}:{server.port}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleServer(server.id)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                            server.selected ? 'bg-white border-white text-black' : 'border-white/20 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeServer(server.id)}
                          className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Output Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Output JSON</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-xs"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 text-xs font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              <div className="relative group">
                <pre className="w-full h-[400px] bg-[#111] border border-white/10 rounded-xl p-4 text-xs text-white/70 overflow-auto font-mono custom-scrollbar">
                  {generatedJson}
                </pre>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
