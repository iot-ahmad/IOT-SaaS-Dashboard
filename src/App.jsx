import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { FarmView, HomeView, OfficeView } from './components/Views';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView, LiveTerminal } from './components/ToolViews';
import { useMqtt } from './hooks/useMqtt';

function App() {
  const [activeWorkspace, setActiveWorkspace] = useState('farm');
  const [activeTool, setActiveTool] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isConnected, messages, deviceStates, lastSeen, publish, userUID } = useMqtt('demo_user_001');

  const handleSetWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    setActiveTool(null);
  };

  const handleSetTool = (toolId) => {
    setActiveTool(toolId);
    setActiveWorkspace(null);
  };

  const renderContent = () => {
    if (activeTool) {
      switch (activeTool) {
        case 'devices': return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
        case 'automations': return <AutomationsToolView publish={publish} userUID={userUID} />;
        case 'alerts': return <AlertsView />;
        case 'settings': return <SettingsView userUID={userUID} />;
        default: return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
      }
    }

    switch (activeWorkspace) {
      case 'home': return <HomeView />;
      case 'farm': return <FarmView deviceStates={deviceStates} publish={publish} />;
      case 'office': return <OfficeView />;
      default: return <FarmView deviceStates={deviceStates} publish={publish} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex selection:bg-primary/30">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={handleSetWorkspace}
          activeTool={activeTool}
          setActiveTool={handleSetTool}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header 
          activeWorkspace={activeWorkspace}
          activeTool={activeTool}
          isConnected={isConnected}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <div className="flex-1 p-6 md:p-8 pb-40 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </div>

        {/* Live Terminal - always visible at bottom */}
        <LiveTerminal messages={messages} isConnected={isConnected} />
      </main>
    </div>
  );
}

export default App;
