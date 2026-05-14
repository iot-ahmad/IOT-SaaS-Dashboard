import React from 'react';
import { motion } from "framer-motion";

export default function ESP32Model() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden pointer-events-none z-0 opacity-40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateX: 25, rotateY: -20, rotateZ: 5 }}
        animate={{ opacity: 1, scale: 1.1, rotateX: 25, rotateY: -20, rotateZ: 5 }}
        whileHover={{ rotateY: -10, rotateX: 15 }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        transition={{ duration: 1.5, bounce: 0.4, type: "spring" }}
        className="relative pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* The 3D PCB Board */}
        <div 
          className="relative w-[320px] h-[460px] bg-zinc-900 rounded-[2px] shadow-[60px_80px_120px_rgba(0,0,0,0.9)] border border-white/5"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Subtly textured PCB surface */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.02),transparent)] pointer-events-none" />
          
          {/* Top Metallic Shield Module (ESP32-WROOM) */}
          <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-44 h-52 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded-sm shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),4px_6px_10px_rgba(0,0,0,0.4)] border border-zinc-500 overflow-hidden flex flex-col items-center justify-center">
            {/* Metallic Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
            
            {/* Minimal circuit-like pattern on shield (instead of text) */}
            <div className="w-20 h-[1px] bg-black/20 mb-2" />
            <div className="w-16 h-[1px] bg-black/20 mb-2" />
            <div className="flex gap-2">
                <div className="w-4 h-4 bg-black/10 rounded-full" />
                <div className="w-4 h-4 bg-black/10 rounded-full" />
            </div>
          </div>

          {/* Antenna Trace Area (Gold/Copper) */}
          <div className="absolute top-[15px] left-1/2 -translate-x-1/2 w-32 h-10 flex flex-col gap-1 items-center justify-center">
             <div className="w-full h-[3px] bg-amber-500/60 shadow-[0_0_2px_rgba(245,158,11,0.5)]" />
             <div className="w-[85%] h-[3px] bg-amber-500/60 self-start" />
             <div className="w-full h-[3px] bg-amber-500/60" />
             <div className="w-[85%] h-[3px] bg-amber-500/60 self-end" />
          </div>

          {/* Side Pin Headers (Metallic Gold blocks) */}
          <div className="absolute top-[80px] left-[6px] flex flex-col gap-[7.5px]">
            {Array.from({length: 15}).map((_, i) => (
              <div key={i} className="w-7 h-[14px] bg-gradient-to-r from-amber-600 to-amber-400 border border-amber-500 shadow-md rounded-[1px]" />
            ))}
          </div>
          <div className="absolute top-[80px] right-[6px] flex flex-col gap-[7.5px]">
            {Array.from({length: 15}).map((_, i) => (
              <div key={i} className="w-7 h-[14px] bg-gradient-to-l from-amber-600 to-amber-400 border border-amber-500 shadow-md rounded-[1px]" />
            ))}
          </div>

          {/* Detailed Components (Middle & Bottom Section) */}
          
          {/* LDO / IC Chip */}
          <div className="absolute bottom-[110px] left-[80px] w-10 h-10 bg-zinc-800 rounded-sm border border-white/5 shadow-lg shadow-black/50" />
          
          {/* UART Chip */}
          <div className="absolute bottom-[140px] right-[80px] w-8 h-8 bg-zinc-800 rounded-sm border border-white/5 shadow-lg shadow-black/50" />

          {/* Mixed Capacitors (Small gold/brown blocks) */}
          <div className="absolute top-[280px] left-1/2 -translate-x-1/2 w-24 grid grid-cols-4 gap-3">
             {Array.from({length: 8}).map((_, i) => (
               <div key={i} className="w-3 h-2 bg-amber-800/80 border border-amber-700/50 rounded-[1px]" />
             ))}
          </div>

          {/* USB-C / Micro-USB connector mockup */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-10 bg-zinc-700 border border-zinc-500 rounded-t-sm shadow-xl flex items-center justify-center">
             <div className="w-10 h-4 bg-black rounded-full border border-white/10" />
          </div>

          {/* Buttons (BOOT & EN/RESET) */}
          <div className="absolute bottom-[60px] left-[50px] w-6 h-6 bg-zinc-800 border-2 border-white/10 rounded-sm flex items-center justify-center p-1 cursor-pointer hover:bg-zinc-700 transition-colors">
             <div className="w-full h-full bg-zinc-900 rounded-full" />
          </div>
          <div className="absolute bottom-[60px] right-[50px] w-6 h-6 bg-zinc-800 border-2 border-white/10 rounded-sm flex items-center justify-center p-1 cursor-pointer hover:bg-zinc-700 transition-colors">
             <div className="w-full h-full bg-zinc-900 rounded-full" />
          </div>

          {/* Status LEDs (Small glowing points) */}
          <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex gap-4">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_red] opacity-80" />
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_blue] opacity-80" />
          </div>

        </div>

        {/* Huge glowing aura to make it "pop" */}
        <div className="absolute inset-0 bg-blue-500/10 blur-[180px] -z-10 rounded-full translate-y-32" />
      </motion.div>
    </div>
  );
}
