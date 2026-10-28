import { useState, useEffect } from 'react';

/**
 * Hook reactivo para detectar dimensiones del viewport y breakpoints en tiempo real.
 * Se actualiza inmediatamente al redimensionar la ventana o rotar dispositivos móviles.
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width: w,
      height: h,
      isMobile: w < 768,
      isSmallMobile: w < 500,
      isTablet: w >= 768 && w < 1024,
      isDesktop: w >= 1024
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setWindowSize({
          width: w,
          height: h,
          isMobile: w < 768,
          isSmallMobile: w < 500,
          isTablet: w >= 768 && w < 1024,
          isDesktop: w >= 1024
        });
      }, 40);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return windowSize;
}

export default useWindowSize;
