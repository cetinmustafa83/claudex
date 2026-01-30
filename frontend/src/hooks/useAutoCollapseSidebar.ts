import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store';
import { MOBILE_BREAKPOINT } from '@/config/constants';

export function useAutoCollapseSidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const sidebarAutoCollapsed = useUIStore((state) => state.sidebarAutoCollapsed);
  const setSidebarAutoCollapsed = useUIStore((state) => state.setSidebarAutoCollapsed);

  const prevWidthRef = useRef(
    typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT,
  );
  const wasManuallyOpenedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { sidebarOpen: initialSidebarOpen, sidebarAutoCollapsed: initialAutoCollapsed } =
      useUIStore.getState();

    if (window.innerWidth < MOBILE_BREAKPOINT && initialSidebarOpen && !initialAutoCollapsed) {
      setSidebarOpen(false);
      setSidebarAutoCollapsed(true);
    }

    if (window.innerWidth >= MOBILE_BREAKPOINT && initialAutoCollapsed && !initialSidebarOpen) {
      setSidebarOpen(true);
      setSidebarAutoCollapsed(false);
    }
  }, [setSidebarOpen, setSidebarAutoCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const prevWidth = prevWidthRef.current;

      if (currentWidth < prevWidth) {
        if (sidebarOpen && currentWidth < MOBILE_BREAKPOINT && !wasManuallyOpenedRef.current) {
          setSidebarOpen(false);
          setSidebarAutoCollapsed(true);
        }
      } else if (currentWidth > prevWidth) {
        if (currentWidth >= MOBILE_BREAKPOINT) {
          wasManuallyOpenedRef.current = false;
          if (!sidebarOpen && sidebarAutoCollapsed) {
            setSidebarOpen(true);
            setSidebarAutoCollapsed(false);
          }
        }
      }

      prevWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, sidebarAutoCollapsed, setSidebarOpen, setSidebarAutoCollapsed]);

  useEffect(() => {
    if (!sidebarOpen && !sidebarAutoCollapsed) {
      wasManuallyOpenedRef.current = false;
    }
  }, [sidebarOpen, sidebarAutoCollapsed]);

  const handleManualToggle = (isOpen: boolean) => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      wasManuallyOpenedRef.current = true;
    } else {
      wasManuallyOpenedRef.current = false;
    }
    setSidebarAutoCollapsed(false);
    setSidebarOpen(isOpen);
  };

  return { handleManualToggle };
}
