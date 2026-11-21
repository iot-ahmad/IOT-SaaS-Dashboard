import React, { useState, useRef, useEffect } from 'react';
import { Zap, CheckCircle2, AlertTriangle, Info, Copy, Check, Terminal, Bell, ChevronUp, ChevronDown, Trash2, X } from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Card = ({ children, className = '' }) => (
  <div className={`hw-panel bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:border-white/15 ${className}`}>
    {children}
  </div>
);

// Copy Topic Button Component
const CopyTopicButton = ({ topic, userUID }) => {
  const [copied, setCopied] = useState(false);
  const fullTopic = `${userUID}/${topic}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      title={`Copy: ${fullTopic}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${copied ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground/70'}`}
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} className="text-primary" />}
      {copied ? 'Copied!' : fullTopic}
    </button>
  );
};

// ==================== AUTOMATIONS VIEW ====================
export const AutomationsToolView = ({ publish, userUID }) => {
  const [autos, setAutos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from Firestore
  useEffect(() => {
    if (!userUID) return;
    const load = async () => {
      try {
        const ref = doc(db, 'users', userUID, 'settings', 'automations');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAutos(snap.data().list || []);
        } else {
          // Default mock data
          const defaults = [
            { id: 1, name: 'Drought Prevention', rule: 'If Soil Moisture < 20% → Irrigation ON', trigger: 'farm/soil_moisture', action: 'farm/irrigation:1', active: true, operator: '<', value: 20, lastRan: 'Never', usage: '—' },
            { id: 2, name: 'Heat Protection', rule: 'If Temp > 35°C → Open Vents', trigger: 'farm/greenhouse_temp', action: 'farm/vents:1', active: true, operator: '>', value: 35, lastRan: 'Never', usage: '—' },
          ];
          setAutos(defaults);
        }
      } catch (err) {
        console.error("Failed to load automations", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userUID]);

  const saveAutos = async (list) => {
    setAutos(list);
    try {
      await setDoc(doc(db, 'users', userUID, 'settings', 'automations'), { list });
    } catch (err) {
      console.error("Failed to save automations", err);
    }
  };

  const toggleAuto = (id) => {
    const updated = autos.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAutos(updated);
  };

  const handleDelete = (id) => {
    saveAutos(autos.filter(a => a.id !== id));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAuto = {
      id: Date.now(),
      name: fd.get('name'),
      rule: `If ${fd.get('trigger')} ${fd.get('operator')} ${fd.get('value')} → ${fd.get('action')}`,
      trigger: fd.get('triggerTopic'),
      action: fd.get('actionTopic'),
      operator: fd.get('operator'),
      value: Number(fd.get('value')) || 0,
      active: true,
      lastRan: 'Never',
      usage: '—'
    };
    saveAutos([...autos, newAuto]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Workflow Automations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Autonomous IF → THEN rules triggered by real-time MQTT sensor updates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm cursor-pointer"
        >
          <Zap size={16} /> New Rule
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading automations...</div>
      ) : autos.length === 0 ? (
        <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 text-muted-foreground text-sm">
          No automations yet. Click "New Rule" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {autos.map(auto => (
            <Card key={auto.id} className="relative group flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Zap size={20} className={auto.active ? 'text-primary shrink-0' : 'text-muted-foreground shrink-0'} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{auto.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{auto.rule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAuto(auto.id)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                      auto.active ? 'bg-primary' : 'bg-muted border border-border'
                    }`}
                    title={auto.active ? 'Disable rule' : 'Enable rule'}
                  >
                    <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${auto.active ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/80'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* IF -> THEN Flow Blocks */}
              <div className="space-y-2">
                <div className="bg-muted/40 border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                      IF
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-foreground">
                      {auto.operator} <span className="text-primary">{auto.value}</span>
                    </span>
                  </div>
                  <CopyTopicButton topic={auto.trigger} userUID={userUID} />
                </div>

                <div className="bg-muted/40 border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 shrink-0">
                    THEN
                  </span>
                  <CopyTopicButton topic={auto.action} userUID={userUID} />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground font-mono border-t border-border pt-3">
                <span>Last ran: <span className="text-primary">{auto.lastRan}</span></span>
                <span>Runs: <span className="text-primary">{auto.usage}</span></span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="hw-panel bg-card border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Automation Rule</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Turn on light at night" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Trigger Metric</label>
                  <input required name="trigger" placeholder="e.g. Temp" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 30" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Trigger Topic</label>
                <input required name="triggerTopic" placeholder="e.g. sensor/temp" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Description</label>
                <input required name="action" placeholder="e.g. Turn Fan ON" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Topic Payload (Topic:Payload)</label>
                <input required name="actionTopic" placeholder="e.g. actuator/fan:ON" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
              >
                Save Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ALERTS VIEW ====================
export const AlertsView = ({ userUID }) => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'rules'
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!userUID) {
      setAlerts([]);
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let historyReady = false;
    let rulesReady = false;
    const markReady = () => {
      if (historyReady && rulesReady) setLoading(false);
    };

    const historyRef = doc(db, 'users', userUID, 'settings', 'alert_history');
    const rulesRef = doc(db, 'users', userUID, 'settings', 'alert_rules');

    const unsubHistory = onSnapshot(
      historyRef,
      (snap) => {
        setAlerts(snap.exists() ? (snap.data().list || []) : []);
        historyReady = true;
        markReady();
      },
      (err) => {
        console.error('Failed to subscribe to alert history:', err);
        historyReady = true;
        markReady();
      },
    );

    const unsubRules = onSnapshot(
      rulesRef,
      (snap) => {
        setRules(snap.exists() ? (snap.data().list || []) : []);
        rulesReady = true;
        markReady();
      },
      (err) => {
        console.error('Failed to subscribe to alert rules:', err);
        rulesReady = true;
        markReady();
      },
    );

    return () => {
      unsubHistory();
      unsubRules();
    };
  }, [userUID]);

  const saveAlerts = async (list) => {
    setAlerts(list);
    try { await setDoc(doc(db, 'users', userUID, 'settings', 'alert_history'), { list }); } catch (e) {}
  };

  const saveRules = async (list) => {
    setRules(list);
    try { await setDoc(doc(db, 'users', userUID, 'settings', 'alert_rules'), { list }); } catch (e) {}
  };

  const dismissAlert = (id) => saveAlerts(alerts.filter(a => a.id !== id));
  const clearAllAlerts = () => saveAlerts([]);
  const deleteRule = (id) => saveRules(rules.filter(r => r.id !== id));
  const toggleRule = (id) => saveRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const handleAddRule = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = String(fd.get('name') || '').trim();
    const metric = String(fd.get('metric') || '').trim();
    const operator = String(fd.get('operator') || '>');
    const value = String(fd.get('value') || '').trim();
    const severity = String(fd.get('severity') || 'warning');
    const rawTopic = String(fd.get('topic') || '').trim().replace(/^\/+/, '');
    const cleanTopic = userUID && rawTopic.startsWith(`${userUID}/`)
      ? rawTopic.slice(userUID.length + 1)
      : rawTopic;

    if (!name || !cleanTopic || !metric || !value) return;

    const newRule = {
      id: Date.now(),
      name,
      metric,
      operator,
      value,
      severity,
      condition: `${metric} ${operator} ${value}`,
      topic: cleanTopic,
      active: true,
    };
    saveRules([...rules, newRule]);
    setShowAddModal(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/12 border-red-500/25', accent: 'border-l-2 border-l-red-500', badge: 'CRITICAL' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/12 border-amber-500/25', accent: 'border-l-2 border-l-amber-500', badge: 'WARNING' };
      case 'success': return { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/12 border-primary/25', accent: 'border-l-2 border-l-primary', badge: 'SUCCESS' };
      default: return { icon: Info, color: 'text-primary', bg: 'bg-primary/12 border-primary/25', accent: 'border-l-2 border-l-primary', badge: 'INFO' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">System Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Live MQTT threshold rules and hardware fault events</p>
        </div>
        <div className="flex bg-muted border border-border p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'history' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'rules' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Alert Rules (<span className="font-mono text-primary">{rules.length}</span>)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading alerts...</div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground"><span className="text-primary font-bold">{alerts.length}</span> alerts</span>
            {alerts.length > 0 && (
              <button onClick={clearAllAlerts} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer">Clear All</button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 px-4 space-y-2">
              <Bell size={28} className="text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">No alerts triggered yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Create a threshold rule in Alert Rules or publish directly from your ESP32 to{' '}
                <code className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded">{userUID}/alerts</code>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const { icon: Icon, color, bg, accent, badge } = getIcon(alert.type);
                return (
                  <div key={alert.id} className={`hw-panel p-4 rounded-xl border border-border ${accent} flex items-center justify-between gap-3 bg-card hover:border-primary/30 transition-colors`}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon size={18} className={`${color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${bg} ${color}`}>{badge}</span>
                          <p className="text-sm font-semibold text-foreground">{alert.msg}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[11px] text-muted-foreground font-mono">{alert.time}</p>
                          {alert.topic && (
                            <span className="text-[10px] font-mono text-primary bg-muted px-1.5 py-0.5 rounded">{userUID}/{alert.topic}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors shrink-0 cursor-pointer">Dismiss</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm cursor-pointer"
            >
              <Bell size={15} /> New Alert Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 px-4 space-y-2">
              <Bell size={28} className="text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">No alert rules configured</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Click &ldquo;New Alert Rule&rdquo; to monitor an incoming MQTT sensor topic and record real-time alerts automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => {
                const { badge, bg, color } = getIcon(rule.severity || 'warning');
                return (
                  <div key={rule.id} className="hw-panel p-5 rounded-xl border border-border bg-card relative group hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border mb-1.5 ${bg} ${color}`}>{badge}</span>
                        <h3 className="font-bold text-sm text-foreground truncate">{rule.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => toggleRule(rule.id)}
                          className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${rule.active ? 'bg-primary' : 'bg-muted border border-border'}`}
                          title={rule.active ? 'Disable rule' : 'Enable rule'}
                        >
                          <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${rule.active ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/80'}`} />
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete rule">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Condition: <span className="font-semibold text-foreground">{rule.condition}</span></p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">Topic:</span>
                        <CopyTopicButton topic={rule.topic} userUID={userUID} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="hw-panel bg-card border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Alert Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Critical Temp Alert" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Topic to Monitor</label>
                <input required name="topic" placeholder="e.g. sensor/temp" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">Evaluates messages arriving on {userUID}/&lt;topic&gt;</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Metric</label>
                  <input required name="metric" placeholder="e.g. Temp" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                    <option>!=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 40" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Severity Level</label>
                <select name="severity" defaultValue="warning" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50">
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
              >
                Save Alert Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



// ==================== LIVE TERMINAL ====================
export const LiveTerminal = ({ messages, isConnected, isSidebarCollapsed = false }) => {
  const scrollRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'incoming' | 'outgoing'

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded, filter]);

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.type === filter);

  const rxCount = messages.filter(m => m.type === 'incoming').length;
  const txCount = messages.filter(m => m.type === 'outgoing').length;

  return (
    <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-16' : 'md:left-64'} right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border transition-all duration-300 ${isExpanded ? 'h-52' : 'h-10'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-muted/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-bold text-foreground tracking-wide">Live MQTT Bus</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            isConnected
              ? 'bg-primary/10 border-primary/25 text-primary'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>

          {/* Interactive Bus Filters */}
          <div className="hidden sm:flex items-center gap-1 ml-2 bg-muted/60 border border-border rounded-md p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'incoming', label: 'RX' },
              { id: 'outgoing', label: 'TX' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter(f.id);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            RX <span className="text-primary font-bold">{rxCount}</span> · TX <span className="text-primary font-bold">{txCount}</span> · <span className="text-primary font-bold">{messages.length}</span> total
          </span>
          <div className="text-primary">
            {isExpanded ? <ChevronDown size={16} className="text-primary" /> : <ChevronUp size={16} className="text-primary" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div ref={scrollRef} className="h-40 overflow-y-auto px-4 py-2.5 font-mono text-[11px] space-y-1 bg-background border-t border-border scrollbar-thin">
          {filteredMessages.length === 0 && (
            <p className="text-muted-foreground italic">Waiting for MQTT packets from ESP32 or dashboard...</p>
          )}
          {filteredMessages.map(msg => {
            const badge =
              msg.type === 'incoming'
                ? <span className="px-1.5 py-0.2 rounded bg-primary/15 text-primary font-bold shrink-0">RX ◀</span>
                : msg.type === 'outgoing'
                  ? <span className="px-1.5 py-0.2 rounded bg-muted text-primary font-bold shrink-0">TX ▶</span>
                  : msg.type === 'error'
                    ? <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 font-bold shrink-0">ERR ✕</span>
                    : <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-bold shrink-0">SYS ●</span>;

            return (
              <div key={msg.id} className="flex items-center gap-2 leading-relaxed">
                <span className="text-muted-foreground flex-shrink-0">{msg.timestamp}</span>
                {badge}
                <span className="text-foreground break-all">{msg.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
