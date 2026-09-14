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
  <div style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
    className={`border p-6 backdrop-blur-md hover:opacity-90 transition-all duration-300 group ${className}`}>
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
      tokenColor: 'var(--accent)'
    },
    {
      number: '2',
      title: 'أضف أداة تحكم',
      subTitle: 'Add Tool',
      desc: 'ادخل مساحة العمل واضغط "Add Tool" لإضافة أزرار، عدادات (Gauge)، أو D-Pad للتحكم والتحليل.',
      icon: Gamepad2,
      tokenColor: 'var(--secondary)'
    },
    {
      number: '3',
      title: 'اربط جهاز ESP32',
      subTitle: 'Connect ESP32',
      desc: 'استخدم الـ Data Key المخصص للأداة لربط حساسات أو محركات جهازك ESP32 بالمنصة مباشرة.',
      icon: Cpu,
      tokenColor: 'var(--destructive)'
    },
    {
      number: '4',
      title: 'انسخ كود التشغيل',
      subTitle: 'Copy Arduino Code',
      desc: 'توجه إلى "Developer Guide" وانسخ كود C++ الجاهز والمهيأ للبدء بالبث والتحكم بثوانٍ.',
      icon: Zap,
      tokenColor: 'var(--primary)'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 relative overflow-hidden mt-6 shadow-sm">
      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
        <span className="px-3 py-1 rounded-md bg-muted border border-border text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          دليل البدء السريع · Quick Start Guide
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-3">
          مرحباً بك في منصة IOT365 الذكية
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
          اتبع الخطوات الأربع البسيطة التالية لربط جهاز ESP32 الخاص بك وبدء التحكم به خلال دقائق معدودة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Connection line between steps (desktop only) */}
        <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-px bg-border z-0" />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={idx} className="flex flex-col items-center text-center group z-10 relative">
              {/* Step circle */}
              <div
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }}
                className="w-14 h-14 flex items-center justify-center transition-transform duration-200"
              >
                <StepIcon size={22} className="text-muted-foreground" />
              </div>
              
              {/* Step number badge */}
              <span className="mt-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground font-mono">
                STEP 0{step.number}
              </span>

              <h4 className="text-sm font-bold text-foreground mt-3 mb-0.5">
                {step.title}
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {step.subTitle}
              </span>
              
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px] md:max-w-none">
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
          <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius)' }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer border border-border"
          >
            <Plus size={16} />
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
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)', borderRadius: 'var(--radius)' }}
                className="text-left border p-6 hover:bg-muted/30 transition-colors duration-150 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'var(--muted)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }} className="w-10 h-10 flex items-center justify-center border border-border">
                      <Gamepad2 size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h3 style={{ color: 'var(--foreground)' }} className="text-base font-semibold transition-colors">{ws.name}</h3>
                      <p style={{ color: 'var(--muted-foreground)' }} className="text-xs mt-1 font-mono">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }} className="border p-6 w-full max-w-sm relative z-10 shadow-lg">
            <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--muted-foreground)' }} className="absolute top-4 right-4 hover:text-foreground transition-colors cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Project</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label style={{ color: 'var(--muted-foreground)' }} className="block text-xs mb-1">Project Name</label>
                <input
                  autoFocus
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Smart Car, Weather Station..."
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }}
                  className="w-full border py-2 px-3 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label style={{ color: 'var(--muted-foreground)' }} className="block text-xs mb-1">ESP32 Target UID (Optional)</label>
                <input
                  value={newEsp32}
                  onChange={e => setNewEsp32(e.target.value)}
                  placeholder="e.g. ESP_A1B2C3"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }}
                  className="w-full border py-2 px-3 text-sm focus:outline-none"
                />
                <p style={{ color: 'var(--muted-foreground)' }} className="text-[10px] mt-1">If provided, widgets in this project will automatically target this specific ESP32.</p>
              </div>
              <button type="submit" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius)' }} className="w-full font-semibold py-2.5 hover:opacity-90 transition-opacity cursor-pointer border border-border text-sm">
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
              <h3 className="text-foreground/80 font-medium">Occupancy</h3>
            </div>
            <span className="text-2xl font-bold text-foreground">14 People</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Meeting Room A: Occupied</p>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-teal-400">
              <Thermometer size={20} />
              <h3 className="text-foreground/80 font-medium">Air Quality</h3>
            </div>
            <span className="text-2xl font-bold text-foreground">Excellent</span>
          </div>
        </div>
        <p className="text-xs text-teal-400 mt-4">CO2: 420 ppm</p>
      </Card>

      <Card className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-muted-foreground" size={20} />
          <h3 className="text-foreground/80 font-medium">Desk Bookings</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${i < 5 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/60'}`}>
              D{i}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
