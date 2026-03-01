/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ServerConfig, AppSettings } from './types';
import { parseSubscription } from './utils/parser';
import { generateConfig } from './utils/generator';
import { Settings, Server, Download, Copy, Trash2, Check, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    dnsServers: '1.1.1.1, 8.8.8.8',
    socksPort: 10808,
    httpPort: 10809,
    routingRules: '',
    balancerStrategy: 'leastLoad',
    configRemarks: 'Сгенерированный конфиг',
    pingDestination: 'http://www.gstatic.com/generate_204',
    pingInterval: '15s',
    pingTimeout: '5s',
    pingSampling: 4,
    leastLoadBaselines: '4s',
    leastLoadExpected: 1,
    leastLoadMaxRTT: '6s'
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const moveServer = useCallback((index: number, direction: 'up' | 'down') => {
    setServers(prev => {
      const newServers = [...prev];
      if (direction === 'up' && index > 0) {
        [newServers[index - 1], newServers[index]] = [newServers[index], newServers[index - 1]];
      } else if (direction === 'down' && index < newServers.length - 1) {
        [newServers[index + 1], newServers[index]] = [newServers[index], newServers[index + 1]];
      }
      return newServers;
    });
  }, []);

  const updateRemark = useCallback((id: string, newRemark: string) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, remarks: newRemark } : s));
  }, []);

  const generatedConfigs = useMemo(() => generateConfig(servers, settings), [servers, settings]);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleDownload = useCallback((text: string, index: number) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-${index + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black">
      <div className="max-w-5xl mx-auto p-6 space-y-12">
        
        <header className="border-b border-white/10 pb-6 pt-12">
          <h1 className="text-4xl font-medium tracking-tight">Конвертер конфигов Happ</h1>
          <p className="text-white/50 mt-2 text-sm">Конвертируйте ссылки VLESS/Hysteria2 и JSON в единый конфиг с балансировкой нагрузки.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-12">
            
            {/* Input Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center gap-2" title="Вставьте сюда ваши ссылки или конфиги">
                  <Plus className="w-4 h-4" /> Импорт серверов
                </h2>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Вставьте ссылки vless://, hy2://, base64 подписку или готовый JSON конфиг..."
                className="w-full h-32 bg-transparent border border-white/20 rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors resize-none font-mono"
                title="Поддерживаются ссылки vless://, hysteria2://, hy2://, а также JSON конфиги (одиночные или несколько подряд)"
              />
              <button
                onClick={handleParse}
                disabled={!input.trim()}
                className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Нажмите, чтобы распознать введенный текст и добавить серверы в список"
              >
                Распознать и добавить
              </button>
            </section>

            {/* Settings Section */}
            <section className="space-y-6">
              <h2 className="text-lg font-medium flex items-center gap-2" title="Настройки итогового JSON конфига">
                <Settings className="w-4 h-4" /> Настройки конфигурации
              </h2>
              
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2" title="Общее название для сгенерированного конфига (поле remarks)">Название конфига (Remarks)</label>
                  <input
                    type="text"
                    value={settings.configRemarks}
                    onChange={e => setSettings({...settings, configRemarks: e.target.value})}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors"
                    title="Это название будет отображаться в клиенте Happ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2" title="Локальный порт для SOCKS прокси">SOCKS Порт</label>
                    <input
                      type="number"
                      value={settings.socksPort}
                      onChange={e => setSettings({...settings, socksPort: parseInt(e.target.value) || 10808})}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2" title="Локальный порт для HTTP прокси">HTTP Порт</label>
                    <input
                      type="number"
                      value={settings.httpPort}
                      onChange={e => setSettings({...settings, httpPort: parseInt(e.target.value) || 10809})}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2" title="DNS серверы для разрешения доменов">DNS Серверы (через запятую)</label>
                  <input
                    type="text"
                    value={settings.dnsServers}
                    onChange={e => setSettings({...settings, dnsServers: e.target.value})}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2" title="Как распределять трафик между серверами">Стратегия балансировщика</label>
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
                        title={strategy === 'none' ? 'Генерировать отдельные конфиги для каждого сервера' : 'Объединить серверы в один конфиг с балансировкой'}
                      >
                        {strategy === 'none' ? 'Выключен' : strategy === 'leastLoad' ? 'Меньшая нагрузка' : 'Меньший пинг'}
                      </button>
                    ))}
                  </div>
                </div>

                {settings.balancerStrategy !== 'none' && (
                  <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors w-full"
                    >
                      {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Расширенные настройки балансировщика
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="URL для проверки пинга">Ping Dest</label>
                            <input
                              type="text"
                              value={settings.pingDestination}
                              onChange={e => setSettings({...settings, pingDestination: e.target.value})}
                              className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Интервал между проверками">Ping Interval</label>
                            <input
                              type="text"
                              value={settings.pingInterval}
                              onChange={e => setSettings({...settings, pingInterval: e.target.value})}
                              className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Таймаут проверки">Ping Timeout</label>
                            <input
                              type="text"
                              value={settings.pingTimeout}
                              onChange={e => setSettings({...settings, pingTimeout: e.target.value})}
                              className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Количество проверок для усреднения">Ping Sampling</label>
                            <input
                              type="number"
                              value={settings.pingSampling}
                              onChange={e => setSettings({...settings, pingSampling: parseInt(e.target.value) || 4})}
                              className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                            />
                          </div>
                        </div>

                        {settings.balancerStrategy === 'leastLoad' && (
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Базовые значения RTT">Baselines</label>
                              <input
                                type="text"
                                value={settings.leastLoadBaselines}
                                onChange={e => setSettings({...settings, leastLoadBaselines: e.target.value})}
                                className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Ожидаемое количество узлов">Expected</label>
                              <input
                                type="number"
                                value={settings.leastLoadExpected}
                                onChange={e => setSettings({...settings, leastLoadExpected: parseInt(e.target.value) || 1})}
                                className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1" title="Максимальный RTT">Max RTT</label>
                              <input
                                type="text"
                                value={settings.leastLoadMaxRTT}
                                onChange={e => setSettings({...settings, leastLoadMaxRTT: e.target.value})}
                                className="w-full bg-transparent border-b border-white/20 pb-1 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>

          <div className="space-y-12">
            
            {/* Servers List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium flex items-center gap-2" title="Список добавленных серверов">
                  <Server className="w-4 h-4" /> Серверы ({servers.length})
                </h2>
                {servers.length > 0 && (
                  <button 
                    onClick={() => setServers([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    title="Удалить все серверы из списка"
                  >
                    Очистить все
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {servers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/30 text-sm">
                    Серверы пока не добавлены
                  </div>
                ) : (
                  servers.map((server, index) => (
                    <div 
                      key={server.id} 
                      className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                        server.selected ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => moveServer(index, 'up')}
                          disabled={index === 0}
                          className="text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                          title="Переместить вверх"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => moveServer(index, 'down')}
                          disabled={index === servers.length - 1}
                          className="text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                          title="Переместить вниз"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            server.protocol === 'vless' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {server.protocol}
                          </span>
                          <div className="flex-1 flex items-center gap-2 group">
                            <input
                              type="text"
                              value={server.remarks}
                              onChange={(e) => updateRemark(server.id, e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/50 focus:outline-none text-sm font-medium truncate w-full transition-colors"
                              title="Нажмите, чтобы изменить название сервера"
                            />
                            <Edit2 className="w-3 h-3 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div 
                          className="text-xs text-white/40 font-mono truncate cursor-pointer hover:text-white/60 transition-colors"
                          onClick={() => toggleServer(server.id)}
                          title="Нажмите, чтобы включить/выключить сервер"
                        >
                          {server.address}:{server.port}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleServer(server.id)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                            server.selected ? 'bg-white border-white text-black' : 'border-white/20 text-transparent'
                          }`}
                          title={server.selected ? "Выключить сервер" : "Включить сервер"}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeServer(server.id)}
                          className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                          title="Удалить сервер"
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
                <h2 className="text-lg font-medium" title="Сгенерированные JSON конфигурации">Готовый JSON</h2>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {generatedConfigs.map((config, index) => (
                  <div key={index} className="relative group border border-white/10 rounded-xl overflow-hidden">
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <button 
                        onClick={() => handleCopy(config, index)}
                        className="p-1.5 rounded-md bg-black/50 hover:bg-white/20 transition-colors text-white/70 hover:text-white backdrop-blur-sm"
                        title="Копировать JSON"
                      >
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => handleDownload(config, index)}
                        className="p-1.5 rounded-md bg-black/50 hover:bg-white/20 transition-colors text-white/70 hover:text-white backdrop-blur-sm"
                        title="Скачать JSON файл"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="w-full h-[300px] bg-[#111] p-4 pt-10 text-xs text-white/70 overflow-auto font-mono custom-scrollbar">
                      {config}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
