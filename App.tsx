
import React, { useState, useEffect, useMemo } from 'react';
import { getIcon, PRESET_ICONS, PRESET_COLORS } from './constants';
import { Habit, DayData, LongTermGoal } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getHabitInsights } from './services/geminiService';
import { 
  Plus, 
  Flame, 
  X, 
  Rocket,
  Pencil,
  Trash2,
  AlertTriangle,
  Award,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Cpu,
  Sparkles,
  CheckCircle2,
  History,
  TrendingUp,
  LogOut,
  Info,
  RefreshCw,
  Database,
  UserCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';

// --- Environment Variable Normalization ---
const getEnv = (key: string | undefined): string => {
  if (!key || key === 'undefined' || key === 'null' || key.includes('your_key') || key.includes('your-project-id')) return '';
  return key.trim().replace(/['"]/g, ''); // Remove accidental quotes
};

const API_KEY = getEnv(process.env.API_KEY);
const SUPABASE_URL = getEnv(process.env.SUPABASE_URL);
const SUPABASE_ANON_KEY = getEnv(process.env.SUPABASE_ANON_KEY);

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- Sub-Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)] flex items-center gap-2">
            <div className="w-1.5 h-3 bg-blue-500 rounded-full"></div>
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subValue: string;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, subValue, color, icon }) => (
  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col gap-2 shadow-sm transition-all hover:border-[var(--border-hover)] hover:-translate-y-1 group">
    <div className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em]">{title}</div>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] group-hover:scale-110 transition-transform duration-300" style={{ color }}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="text-2xl font-black leading-none text-[var(--text-main)] mb-1">{value}</div>
        <div className="text-[10px] text-gray-500 font-mono truncate">{subValue}</div>
      </div>
    </div>
  </div>
);

const ActivityHeatmap: React.FC<{ history: DayData[] }> = ({ history }) => {
  const heatmapData = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 97); // 14 weeks
    
    const dates = [];
    for (let i = 0; i < 98; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = history.find(h => h.date === dateStr);
      const count = dayData ? Object.values(dayData.completions).filter(Boolean).length : 0;
      dates.push({ date: dateStr, count });
    }
    return dates;
  }, [history]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'heatmap-0';
    if (count <= 1) return 'heatmap-1';
    if (count <= 2) return 'heatmap-2';
    if (count <= 3) return 'heatmap-3';
    return 'heatmap-4';
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-6 shadow-xl w-full">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black flex items-center gap-2 text-[var(--text-main)] uppercase tracking-[0.2em]">
          <History size={18} className="text-[var(--neon-green)]" />
          Neural Continuity (Last 90 Days)
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[8px] text-gray-500 mr-1">Sparse</span>
          {[0, 1, 2, 3, 4].map(v => (
            <div key={v} className={`w-2.5 h-2.5 rounded-[2px] heatmap-${v}`} />
          ))}
          <span className="text-[8px] text-gray-500 ml-1">Dense</span>
        </div>
      </div>
      <div className="grid grid-rows-7 grid-flow-col gap-[6px] w-full overflow-x-auto no-scrollbar">
        {heatmapData.map((d, i) => (
          <div 
            key={i} 
            title={`${d.date}: ${d.count} protocols logged`}
            className={`w-full aspect-square min-w-[12px] rounded-[2px] heatmap-box transition-all cursor-crosshair ${getColorClass(d.count)}`} 
          />
        ))}
      </div>
    </div>
  );
};

// --- Config Error Screen ---

const ConfigError: React.FC = () => {
  const diagnostics = [
    { name: 'GEMINI_API_KEY', status: API_KEY ? 'Detected' : 'Missing', ok: !!API_KEY },
    { name: 'SUPABASE_URL', status: SUPABASE_URL ? 'Detected' : 'Missing', ok: !!SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', status: SUPABASE_ANON_KEY ? 'Detected' : 'Missing', ok: !!SUPABASE_ANON_KEY },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e14] p-6">
      <div className="max-w-2xl w-full space-y-8 animate-reveal">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Diagnostic</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Initialization failed. The environment variables are not reaching the application core.
          </p>
        </div>

        {/* Diagnostic Dashboard */}
        <div className="bg-[#161b22] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-white/5 border-b border-[var(--border-color)] flex items-center justify-between">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
               <Cpu size={14} /> Environment Health Check
             </h2>
             <span className="text-[9px] font-mono text-blue-400 animate-pulse">Scanning...</span>
          </div>
          <div className="p-6 space-y-4">
            {diagnostics.map((d) => (
              <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-gray-500">{d.name}</span>
                  <span className="text-xs font-black text-white">{d.name.replace(/_/g, ' ')}</span>
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1 rounded-full ${d.ok ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {d.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {d.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-6 rounded-2xl border border-white/5 bg-[#161b22] space-y-3">
             <div className="flex items-center gap-3 text-white">
               <FileText size={20} className="text-blue-400" />
               <h3 className="text-xs font-black uppercase tracking-widest">Verify File</h3>
             </div>
             <p className="text-[11px] text-gray-400 leading-relaxed">
               Ensure your file is named <strong>exactly</strong> <code className="text-blue-400">.env.local</code>. Not <code className="text-red-400">.env.local.tsx</code> or <code className="text-red-400">env.local</code>.
             </p>
           </div>
           <div className="p-6 rounded-2xl border border-white/5 bg-[#161b22] space-y-3">
             <div className="flex items-center gap-3 text-white">
               <RefreshCw size={20} className="text-blue-400" />
               <h3 className="text-xs font-black uppercase tracking-widest">Restart Server</h3>
             </div>
             <p className="text-[11px] text-gray-400 leading-relaxed">
               Vite loads env files <strong>only on startup</strong>. If you just edited the file, you must stop the terminal and run <code>npm run dev</code> again.
             </p>
           </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex gap-4">
          <Info className="text-orange-500 shrink-0" size={20} />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Syntax Tip</h4>
            <p className="text-[11px] text-gray-300">
              Format must be: <code className="text-white">KEY=VALUE</code>. No spaces around <code>=</code>, no quotes needed unless the value contains spaces.
            </p>
          </div>
        </div>
        
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/10">
          <RefreshCw size={16} /> Re-initialize Core
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'loading' | 'dashboard' | 'config_error'>('loading');
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<DayData[]>([]);
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiInsight, setAiInsight] = useState<string>("SYSTEM INITIALIZING...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Modals
  const [activeModal, setActiveModal] = useState<null | 'habit' | 'goal' | 'progress' | 'delete'>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [goalToUpdate, setGoalToUpdate] = useState<LongTermGoal | null>(null);
  const [progressValue, setProgressValue] = useState<string>('0');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitData, setHabitData] = useState({ name: '', icon: 'Zap', color: '#58a6ff' });
  const [editingGoal, setEditingGoal] = useState<LongTermGoal | null>(null);
  const [goalData, setGoalData] = useState({ name: '', target: 100, unit: 'units', color: '#ff7b72' });

  useEffect(() => {
    // Critical check for configuration
    const isConfigured = !!(API_KEY && SUPABASE_URL && SUPABASE_ANON_KEY && supabase);

    if (!isConfigured) {
      setView('config_error');
      return;
    }
    
    const init = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session) {
          setUser(session.user);
          await loadData(session.user.id);
        } else {
          setView('landing');
        }
      } catch (err) {
        console.error("Auth init failed", err);
        setView('config_error');
      }
    };
    init();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        loadData(session.user.id);
      } else {
        setUser(null);
        setView('landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (uid: string) => {
    setView('loading');
    try {
      const { data: habitsList } = await supabase!.from('habits').select('*').eq('user_id', uid);
      const { data: goalsList } = await supabase!.from('long_term_goals').select('*').eq('user_id', uid);
      const { data: historyList } = await supabase!.from('history').select('*').eq('user_id', uid);
      
      setHabits(habitsList?.length ? habitsList : [
        { id: '1', name: 'Neural Focus', icon: 'Zap', color: '#58a6ff' },
        { id: '2', name: 'Physical Upkeep', icon: 'Activity', color: '#bc8cff' }
      ]);
      setLongTermGoals(goalsList || []);
      setHistory(historyList || []);
      setView('dashboard');
    } catch (e) {
      console.error("Data load failed", e);
      setView('dashboard'); // Fallback to empty dashboard if data fails but config is OK
    }
  };

  const handleSignIn = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert(error.message);
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
  };

  const getInsight = async () => {
    if (!habits.length) return;
    setIsAiLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const completedToday = history.find(h => h.date === today);
      const rate = habits.length ? (Object.keys(completedToday?.completions || {}).length / habits.length) * 100 : 0;
      
      const insight = await getHabitInsights(habits, history, { 
        streak: history.length, 
        sevenDayAvg: Math.round(rate), 
        trend: 'optimizing' 
      });
      setAiInsight(insight);
    } catch (e) {
      setAiInsight("NEURAL LINK STABLE. PROCEED WITH PROTOCOLS.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'dashboard') getInsight();
  }, [view]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleHabit = async (date: string, hid: string) => {
    if (new Date(date) > new Date()) return;
    const day = history.find(h => h.date === date) || { date, completions: {} };
    const newCompletions = { ...day.completions, [hid]: !day.completions[hid] };
    
    setHistory(prev => {
      const existing = prev.find(h => h.date === date);
      return existing ? prev.map(h => h.date === date ? { ...h, completions: newCompletions } : h) : [...prev, { date, completions: newCompletions }];
    });

    if (user && supabase) {
      await supabase.from('history').upsert({ user_id: user.id, date, completions: newCompletions });
    }
  };

  const saveHabit = async () => {
    if (!habitData.name.trim() || !user || !supabase) return;
    const payload = { ...habitData, user_id: user.id };
    if (editingHabit) {
      await supabase.from('habits').update(payload).eq('id', editingHabit.id);
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } : h));
    } else {
      const { data } = await supabase.from('habits').insert([payload]).select();
      if (data) setHabits(prev => [...prev, data[0]]);
    }
    setActiveModal(null);
  };

  const deleteHabit = async () => {
    if (!habitToDelete || !supabase) return;
    await supabase.from('habits').delete().eq('id', habitToDelete);
    setHabits(prev => prev.filter(h => h.id !== habitToDelete));
    setActiveModal(null);
  };

  const saveGoal = async () => {
    if (!goalData.name.trim() || !user || !supabase) return;
    const payload = { ...goalData, user_id: user.id, current: editingGoal?.current || 0 };
    if (editingGoal) {
      await supabase.from('long_term_goals').update(payload).eq('id', editingGoal.id);
      setLongTermGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g));
    } else {
      const { data } = await supabase.from('long_term_goals').insert([payload]).select();
      if (data) setLongTermGoals(prev => [...prev, data[0]]);
    }
    setActiveModal(null);
  };

  const updateGoalProgress = async () => {
    if (!goalToUpdate || !supabase) return;
    const added = parseFloat(progressValue);
    if (isNaN(added)) return;
    const newCurrent = Math.min(goalToUpdate.target, Math.max(0, goalToUpdate.current + added));
    await supabase.from('long_term_goals').update({ current: newCurrent }).eq('id', goalToUpdate.id);
    setLongTermGoals(prev => prev.map(g => g.id === goalToUpdate.id ? { ...g, current: newCurrent } : g));
    setActiveModal(null);
  };

  const dailyProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = history.find(h => h.date === todayStr);
    if (!habits.length) return 0;
    const done = Object.keys(todayData?.completions || {}).filter(id => todayData?.completions[id] && habits.find(h => h.id === id)).length;
    return Math.round((done / habits.length) * 100);
  }, [history, habits]);

  const displayDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = d.toISOString().split('T')[0];
      days.push(history.find(h => h.date === str) || { date: str, completions: {} });
    }
    return days.reverse();
  }, [history]);

  if (view === 'config_error') return <ConfigError />;
  
  if (view === 'landing') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e14] relative overflow-hidden">
      <div className="smoke-container">
        <div className="smoke-cloud"></div>
        <div className="smoke-cloud"></div>
        <div className="smoke-cloud"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-12 text-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4 animate-bounce">
            <Rocket size={32} className="text-white" />
          </div>
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white leading-none select-none animate-smoky">
            HABIT<span className="text-blue-500">X</span>
          </h1>
          <p className="text-gray-500 uppercase tracking-[0.5em] text-[10px] font-bold animate-reveal" style={{ animationDelay: '1s' }}>Neural Optimization Protocol</p>
        </div>
        <button 
          onClick={handleSignIn} 
          className="px-10 py-5 bg-white text-gray-950 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:bg-gray-100 hover:scale-[1.05] active:scale-95 animate-reveal"
          style={{ animationDelay: '1.4s' }}
        >
          Access Dashboard
        </button>
      </div>
    </div>
  );

  if (view === 'loading') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e14]">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Syncing Neurons</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <header className="px-6 py-5 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Cloud Synchronized
          </span>
          <span className="text-sm font-semibold text-[var(--text-main)]">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-3">
          <Rocket size={20} className="text-blue-500" />
          <div className="text-2xl font-black text-[var(--text-main)] select-none tracking-tighter">Habit<span className="text-blue-500">X</span></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Uptime</span>
            <span className="text-sm font-mono text-[var(--text-main)]">{currentTime.toLocaleTimeString()}</span>
          </div>
          <button onClick={handleSignOut} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        {/* Insight Header */}
        <section className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 animate-reveal">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            {isAiLoading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-0.5">Neural Insight Engine</span>
            <p className="text-sm md:text-base font-bold text-[var(--text-main)] italic truncate">"{aiInsight}"</p>
          </div>
          <button onClick={getInsight} className="ml-auto p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-400">
            <Cpu size={20} />
          </button>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Sync Status" value="Secure" subValue="End-to-end cloud" color="#bc8cff" icon={<History size={24} />} />
          <StatCard title="Efficiency" value={`${dailyProgress}%`} subValue="Daily performance" color="#7ee787" icon={<Flame size={24} />} />
          <StatCard title="Streak" value={history.length} subValue="Consecutive days" color="#ff7b72" icon={<TrendingUp size={24} />} />
          <StatCard title="Protocols" value={habits.length} subValue="Active routines" color="#3fb950" icon={<Award size={24} />} />
        </section>

        <section className="flex flex-col lg:flex-row gap-8">
          {/* Side Panels */}
          <div className="flex flex-col gap-8 lg:w-72 shrink-0">
            {/* Habit Manager */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Protocols</div>
                <button onClick={() => { setEditingHabit(null); setHabitData({ name: '', icon: 'Zap', color: '#58a6ff' }); setActiveModal('habit'); }} className="text-[10px] text-blue-400 font-black border border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-all flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {habits.map(h => (
                  <div key={h.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-xl flex items-center justify-between group hover:border-[var(--border-hover)] transition-all">
                    <div className="flex items-center gap-3">
                      <div style={{ color: h.color }}>{getIcon(h.icon, 16)}</div>
                      <span className="text-xs font-bold text-[var(--text-main)]">{h.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingHabit(h); setHabitData({ name: h.name, icon: h.icon, color: h.color }); setActiveModal('habit'); }} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => { setHabitToDelete(h.id); setActiveModal('delete'); }} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Manager */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Milestones</div>
                <button onClick={() => { setEditingGoal(null); setGoalData({ name: '', target: 100, unit: 'units', color: '#bc8cff' }); setActiveModal('goal'); }} className="text-[10px] text-blue-400 font-black border border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-all flex items-center gap-1">
                  <Plus size={12} /> New
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {longTermGoals.map(g => {
                  const pct = Math.round((g.current / g.target) * 100);
                  return (
                    <div key={g.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-xl flex flex-col gap-3 hover:border-[var(--border-hover)] transition-all group">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight">{g.name}</span>
                        <button onClick={() => { setGoalToUpdate(g); setProgressValue('0'); setActiveModal('progress'); }} className="p-1.5 bg-[var(--bg-secondary)] rounded-lg text-blue-400 hover:bg-blue-500/10 border border-[var(--border-color)] transition-all"><Plus size={14} /></button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-mono text-gray-500">
                          <span>{g.current} / {g.target} {g.unit}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%`, backgroundColor: g.color }} className="h-full transition-all duration-1000" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-8 overflow-hidden">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-collapse">
                  <thead className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Day Log</th>
                      {habits.map(h => (
                        <th key={h.id} className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div style={{ color: h.color }}>{getIcon(h.icon, 16)}</div>
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter truncate max-w-[80px]">{h.name}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Stability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {displayDays.map((day, i) => {
                      const done = Object.keys(day.completions).filter(id => day.completions[id] && habits.find(h => h.id === id)).length;
                      const prog = habits.length ? (done / habits.length) * 100 : 0;
                      const dateObj = new Date(day.date);
                      const isToday = day.date === new Date().toISOString().split('T')[0];
                      return (
                        <tr key={day.date} className={`transition-colors ${isToday ? 'bg-blue-500/5' : 'hover:bg-white/[0.02]'}`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-[var(--text-main)]">{dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{isToday ? 'Current Cycle' : 'Archive'}</span>
                            </div>
                          </td>
                          {habits.map(h => (
                            <td key={h.id} className="px-4 py-5 text-center">
                              <button 
                                onClick={() => toggleHabit(day.date, h.id)}
                                disabled={dateObj > new Date()}
                                className={`w-7 h-7 mx-auto rounded-lg border-2 transition-all flex items-center justify-center ${
                                  day.completions[h.id] 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                    : 'bg-transparent border-[var(--border-color)] hover:border-gray-500'
                                } active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed`}
                              >
                                {day.completions[h.id] && <Plus size={16} className="rotate-45" />}
                              </button>
                            </td>
                          ))}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-[60px] h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                <div style={{ width: `${prog}%` }} className="h-full bg-[var(--neon-green)] transition-all duration-500 shadow-[0_0_10px_rgba(57,211,83,0.3)]" />
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${prog === 100 ? 'text-[var(--neon-green)]' : 'text-gray-500'}`}>
                                {prog === 100 ? 'Peak' : `${Math.round(prog)}%`}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <ActivityHeatmap history={history} />
          </div>
        </section>
      </main>

      {/* Modals */}
      <Modal isOpen={activeModal === 'habit'} onClose={() => setActiveModal(null)} title={editingHabit ? "Reconfigure Protocol" : "Initialize Protocol"}>
        <div className="space-y-6">
          <input type="text" value={habitData.name} onChange={e => setHabitData({...habitData, name: e.target.value})} placeholder="Protocol Name" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]" />
          <div className="grid grid-cols-7 gap-2">
            {PRESET_ICONS.map(icon => (
              <button key={icon} onClick={() => setHabitData({...habitData, icon})} className={`p-3 rounded-xl border-2 transition-all ${habitData.icon === icon ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-gray-500'}`}>{getIcon(icon, 16)}</button>
            ))}
          </div>
          <button onClick={saveHabit} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest hover:bg-blue-500 transition-all">Synchronize</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'goal'} onClose={() => setActiveModal(null)} title="New Milestone">
        <div className="space-y-6">
          <input type="text" value={goalData.name} onChange={e => setGoalData({...goalData, name: e.target.value})} placeholder="Objective" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={goalData.target} onChange={e => setGoalData({...goalData, target: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-main)]" />
            <input type="text" value={goalData.unit} onChange={e => setGoalData({...goalData, unit: e.target.value})} placeholder="Units" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-main)]" />
          </div>
          <button onClick={saveGoal} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest hover:bg-blue-500 transition-all">Establish Link</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'progress'} onClose={() => setActiveModal(null)} title="Ingest Data">
        <div className="space-y-6 flex flex-col items-center">
          <input type="number" value={progressValue} onChange={e => setProgressValue(e.target.value)} className="w-full bg-transparent border-none text-7xl font-mono text-center focus:outline-none text-[var(--text-main)]" autoFocus />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Incremental {goalToUpdate?.unit}</p>
          <button onClick={updateGoalProgress} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest hover:bg-blue-500 transition-all">Update Vector</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'delete'} onClose={() => setActiveModal(null)} title="Purge Sequence">
        <div className="flex flex-col items-center gap-6 py-4">
          <AlertTriangle size={32} className="text-red-500" />
          <div className="text-center space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Confirm Data Wipe?</h4>
            <p className="text-xs text-gray-500">This protocol will be permanently removed.</p>
          </div>
          <div className="flex gap-4 w-full">
            <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-gray-500 font-bold text-[10px] tracking-widest">Abort</button>
            <button onClick={deleteHabit} className="flex-1 py-3 bg-red-600 text-white font-black text-[10px] tracking-widest rounded-xl">Purge</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
