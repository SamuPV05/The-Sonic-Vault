import { useState, useCallback } from 'react';

/**
 * Hook reutilizable para disparar notificaciones flotantes (EchoToast)
 * con diseño Cyberpunk neón en cualquier vista de The Sonic Vault.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type = 'info', title = '', message = '', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  return { toasts, showToast, dismissToast };
}

export default useToast;
