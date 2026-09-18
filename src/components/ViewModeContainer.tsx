import React from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { ViewModeSwitcher } from './ViewModeSwitcher';
import { Smartphone, Monitor } from 'lucide-react';

interface ViewModeContainerProps {
  children: React.ReactNode;
}

export function ViewModeContainer({ children }: ViewModeContainerProps) {
  const { effectiveMode, isActualDesktop, isActualMobile } = useViewMode();

  // Case 1: User chose Mobile Mode while on a Desktop/Laptop screen
  if (effectiveMode === 'mobile' && isActualDesktop) {
    return (
      <div className="min-h-screen bg-[#1E1612] flex flex-col items-center justify-start text-earth-950">
        {/* Top Desktop Preview Toolbar */}
        <header className="w-full bg-[#291F1A] border-b border-[#3D2E26] px-4 py-2.5 flex items-center justify-between text-xs text-earth-200 z-50 sticky top-0 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600/20 text-brand-300 flex items-center justify-center font-bold">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-white font-serif">KarigarSetu</span>
              <span className="text-earth-400 ml-1.5 hidden sm:inline">
                Mobile View Preview (Phone Container)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSwitcher />
          </div>
        </header>

        {/* Centered Mobile Phone Container with CSS Containing Block */}
        <div className="w-full max-w-[425px] min-h-[calc(100vh-45px)] bg-[#F7F0E3] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-x border-[#3D2E26] relative flex flex-col transform-gpu [transform:translateZ(0)]">
          {children}
        </div>
      </div>
    );
  }

  // Case 2: User chose Desktop Mode while on a Mobile device screen
  if (effectiveMode === 'desktop' && isActualMobile) {
    return (
      <div className="min-h-screen bg-earth-100 flex flex-col">
        {/* Notice Bar for Mobile User */}
        <div className="bg-[#291F1A] text-earth-200 px-3 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold text-white">Desktop View</span>
          </div>
          <ViewModeSwitcher compact />
        </div>
        {/* Horizontal scroll desktop frame */}
        <div className="overflow-x-auto flex-1 min-w-[1024px]">
          {children}
        </div>
      </div>
    );
  }

  // Case 3: Natural Viewport (Desktop on Desktop, Mobile on Mobile)
  return <>{children}</>;
}

export default ViewModeContainer;
