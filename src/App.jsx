import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { FarmView, HomeView, OfficeView } from './components/Views';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView } from './components/ToolViews';

function App() {
  const [activeWorkspace, setActiveWorkspace] = useState('farm');
  const [activeTool, setActiveTool] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    // Priority to Tool View if selected
    if (activeTool) {
      switch (activeTool) {
        case 'devices': return <DevicesView />;
        case 'automations': return <AutomationsToolView />;
        case 'alerts': return <AlertsView />;
        case 'settings': return <SettingsView />;
        default: return <DevicesView />;
      }
    }

    // Otherwise Workspace View
    switch (activeWorkspace) {
      case 'home': return <HomeView />;
      case 'farm': return <FarmView />;
      case 'office': return <OfficeView />;
      default: return <FarmView />;
    }
  };

  const currentTitle = activeTool 
    ? activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
    : activeWorkspace === 'farm' ? "Al-Mazra'a Smart Farm" : activeWorkspace?.charAt(0).toUpperCase() + activeWorkspace?.slice(1);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex selection:bg-primary/30">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Wrapper for Mobile */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={setActiveWorkspace}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header 
          activeWorkspace={activeWorkspace || activeTool} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
