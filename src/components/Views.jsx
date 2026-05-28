import { useState } from 'react';
import { 
  SoilMoistureCard, 
  IrrigationValveCard, 
  WaterTankCard, 
  GreenhouseTempCard, 
  AutomationsCard 
} from './Cards';
import ESP32Model from './ESP32Model';
import { Zap, Users, Thermometer, Briefcase, Plus, X, Gamepad2, Cpu } from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-300 dark:border-white/20 group ${className}`}>
    {children}
  </div>
);

export const FarmView = ({ deviceStates, publish }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SoilMoistureCard deviceStates={deviceStates} publish={publish} />
      <IrrigationValveCard deviceStates={deviceStates} publish={publish} />
      <WaterTankCard deviceStates={deviceStates} />
      <GreenhouseTempCard deviceStates={deviceStates} />
    </div>
    <div className="grid grid-cols-1 gap-6">
      <AutomationsCard publish={publish} />
    </div>
  </div>
);

const OnboardingWizard = () => {
  const steps = [
    {
      number: '1',
      title: 'أنشئ مساحة عمل',
      subTitle: 'Create Workspace',
      desc: 'اضغط على زر "Add Project" لإنشاء مساحة عمل مخصصة لمشروعك (مثل: سيارة ذكية أو بيت زراعي).',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500 shadow-blue-500/20'
    },
    {
      number: '2',
      title: 'أضف أداة تحكم',
      subTitle: 'Add Tool',
      desc: 'ادخل مساحة العمل واضغط "Add Tool" لإضافة أزرار، عدادات (Gauge)، أو D-Pad للتحكم والتحليل.',
      icon: Gamepad2,
      color: 'from-violet-500 to-purple-500 shadow-violet-500/20'
    },
    {
      number: '3',
      title: 'اربط جهاز ESP32',
      subTitle: 'Connect ESP32',
      desc: 'استخدم الـ Data Key المخصص للأداة لربط حساسات أو محركات جهازك ESP32 بالمنصة مباشرة.',
      icon: Cpu,
      color: 'from-pink-500 to-rose-500 shadow-pink-500/20'
    },
    {
      number: '4',
      title: 'انسخ كود التشغيل',
      subTitle: 'Copy Arduino Code',
      desc: 'توجه إلى "Developer Guide" وانسخ كود C++ الجاهز والمهيأ للبدء بالبث والتحكم بثوانٍ.',
      icon: Zap,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/20'
    }
  ];

  return (
    <div className="bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden mt-6 shadow-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
        <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tracking-wide uppercase">
          دليل البدء السريع · Quick Start Guide
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-3">
          مرحباً بك في منصة IOT365 الذكية
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-white/40 mt-2 leading-relaxed">
          اتبع الخطوات الأربع البسيطة التالية لربط جهاز ESP32 الخاص بك وبدء التحكم به خلال دقائق معدودة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Connection line between steps (desktop only) */}
        <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-amber-500/20 z-0" />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={idx} className="flex flex-col items-center text-center group z-10 relative">
              {/* Step circle */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} border border-white/20 text-slate-900 dark:text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <StepIcon size={24} />
              </div>
              
              {/* Step number badge */}
              <span className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-mono">
                STEP 0{step.number}
              </span>

              <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-3 mb-0.5">
                {step.title}
              </h4>
              <span className="text-[10px] text-primary/80 font-mono uppercase tracking-wider">
                {step.subTitle}
              </span>
              
              <p className="text-xs text-slate-500 dark:text-white/30 mt-2 leading-relaxed max-w-[200px] md:max-w-none">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HomeView = ({ workspaces, onAddWorkspace, setActiveWorkspace }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEsp32, setNewEsp32] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddWorkspace(newName.trim(), newEsp32.trim());
      setNewName('');
      setNewEsp32('');
      setShowAddModal(false);
    }
  };

  const customWorkspaces = workspaces?.filter(ws => ws.isCustom) || [];

  return (
    <div className="relative min-h-[600px] w-full">
      <ESP32Model />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Projects</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span>Add Project</span>
          </button>
        </div>

        {customWorkspaces.length === 0 ? (
          <OnboardingWizard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customWorkspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className="text-left bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/50 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Gamepad2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{ws.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
                        {ws.esp32Prefix ? `Target: ${ws.esp32Prefix}` : 'Universal Control'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0b0d] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Project</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Project Name</label>
                <input 
                  autoFocus
                  required
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Smart Car, Weather Station..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">ESP32 Target UID (Optional)</label>
                <input 
                  value={newEsp32} 
                  onChange={e => setNewEsp32(e.target.value)}
                  placeholder="e.g. ESP_A1B2C3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm"
                />
                <p className="text-[10px] text-white/30 mt-1">If provided, widgets in this project will automatically target this specific ESP32.</p>
              </div>
              <button type="submit" className="w-full bg-primary text-black font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const OfficeView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-orange-400">
              <Users size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Occupancy</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">14 People</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-white/50 mt-4">Meeting Room A: Occupied</p>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-teal-400">
              <Thermometer size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Air Quality</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Excellent</span>
          </div>
        </div>
        <p className="text-xs text-teal-400 mt-4">CO2: 420 ppm</p>
      </Card>

      <Card className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-slate-600 dark:text-white/40" size={20} />
          <h3 className="text-slate-800 dark:text-white/80 font-medium">Desk Bookings</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${i < 5 ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20'}`}>
              D{i}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
