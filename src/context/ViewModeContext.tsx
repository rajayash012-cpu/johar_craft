import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type ViewModePreference = 'auto' | 'desktop' | 'mobile';
export type EffectiveViewMode = 'desktop' | 'mobile';

interface ViewModeContextType {
  preference: ViewModePreference;
  effectiveMode: EffectiveViewMode;
  setPreference: (mode: ViewModePreference) => void;
  isMobile: boolean;
  isDesktop: boolean;
  isActualDesktop: boolean;
  isActualMobile: boolean;
  viewportWidth: number;
}

const STORAGE_KEYS = ['karigarsetu_view_mode', 'joharcraft_view_mode'];

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

function getSavedPreference(): ViewModePreference {
  try {
    for (const key of STORAGE_KEYS) {
      const saved = localStorage.getItem(key);
      if (saved === 'auto' || saved === 'desktop' || saved === 'mobile') {
        return saved;
      }
    }
  } catch (_) {
    // Ignore localStorage read errors
  }
  return 'auto';
}

function savePreference(mode: ViewModePreference) {
  try {
    for (const key of STORAGE_KEYS) {
      localStorage.setItem(key, mode);
    }
  } catch (_) {
    // Ignore localStorage write errors
  }
}

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ViewModePreference>(getSavedPreference);
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setPreference = (mode: ViewModePreference) => {
    setPreferenceState(mode);
    savePreference(mode);
  };

  const isActualDesktop = viewportWidth >= 768;
  const isActualMobile = viewportWidth < 768;

  const effectiveMode: EffectiveViewMode = useMemo(() => {
    if (preference === 'desktop') return 'desktop';
    if (preference === 'mobile') return 'mobile';
    return isActualMobile ? 'mobile' : 'desktop';
  }, [preference, isActualMobile]);

  const value = useMemo<ViewModeContextType>(() => ({
    preference,
    effectiveMode,
    setPreference,
    isMobile: effectiveMode === 'mobile',
    isDesktop: effectiveMode === 'desktop',
    isActualDesktop,
    isActualMobile,
    viewportWidth,
  }), [preference, effectiveMode, isActualDesktop, isActualMobile, viewportWidth]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
