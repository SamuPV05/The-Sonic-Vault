import React from 'react';

/**
 * Componente de notificación flotante (Toast) para Echo-Safe
 * Estilo cyberpunk oscuro con resplandor neón acorde al diseño de The Sonic Vault
 */
export default function EchoToast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          borderColor: '#10B981',
          shadowColor: 'rgba(16, 185, 129, 0.35)',
          iconColor: '#10B981',
          icon: 'fa-circle-check'
        };
      case 'error':
        return {
          borderColor: '#FF007A',
          shadowColor: 'rgba(255, 0, 122, 0.4)',
          iconColor: '#FF007A',
          icon: 'fa-circle-exclamation'
        };
      case 'warning':
        return {
          borderColor: '#FBBF24',
          shadowColor: 'rgba(251, 191, 36, 0.35)',
          iconColor: '#FBBF24',
          icon: 'fa-triangle-exclamation'
        };
      default:
        return {
          borderColor: '#00F0FF',
          shadowColor: 'rgba(0, 240, 255, 0.35)',
          iconColor: '#00F0FF',
          icon: 'fa-circle-info'
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const theme = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(13, 14, 21, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${theme.borderColor}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${theme.shadowColor}`,
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#ffffff',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              animation: 'echoToastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.25s ease'
            }}
          >
            <i
              className={`fa-solid ${theme.icon}`}
              style={{
                color: theme.iconColor,
                fontSize: '1.25rem',
                marginTop: '2px',
                filter: `drop-shadow(0 0 6px ${theme.shadowColor})`
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', letterSpacing: '0.5px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#c3cad9', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Cerrar notificación"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6e7a90',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'color 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#6e7a90')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes echoToastSlide {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
