import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function HolographicPassport({ passportData, onConnectSpotify }) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [sheen, setSheen] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(true);

  if (!passportData) return null;

  const {
    archetype,
    topGenres = [],
    affinityScore = 95,
    serialNumber = 'TSV-7794-2026',
    issueDate = 'OCT 2026',
    holderName = 'Agente Sonoro',
    holderPhoto = null,
    accountType = 'STANDARD VAULT PASS',
    isPremium = false,
    topArtistName = 'Varios Artistas',
    topArtistImage = null,
    topTrackName = '',
    isDemo = false
  } = passportData;

  // 3D Gyroscope/Tilt Effect
  const handleMouseMove = (e) => {
    if (!tiltEnabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 12; // Máximo 12 deg
    const rotY = ((x - centerX) / centerX) * 14;  // Máximo 14 deg

    const sheenX = Math.round((x / rect.width) * 100);
    const sheenY = Math.round((y / rect.height) * 100);

    setRotate({ x: rotX, y: rotY });
    setSheen({ x: sheenX, y: sheenY, opacity: 0.85 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setSheen({ x: 50, y: 50, opacity: 0 });
  };

  const handleCopySerial = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Exportar a PNG HD utilizando HTML5 Canvas nativo
  const handleDownloadPassport = async () => {
    setIsExporting(true);
    try {
      const width = 1200;
      const height = 680;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Fondo Oscuro Profundo
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, width, height);

      // 2. Gradiente Holográfico de Fondo
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, 'rgba(12, 16, 28, 0.95)');
      bgGrad.addColorStop(0.5, 'rgba(8, 22, 28, 0.95)');
      bgGrad.addColorStop(1, 'rgba(18, 10, 26, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Marco Exterior Neón
      ctx.strokeStyle = archetype.primaryColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Borde Interior Fino
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      // 3. Cabecera del Pasaporte
      ctx.fillStyle = archetype.primaryColor;
      ctx.font = 'bold 22px "Space Grotesk", sans-serif';
      ctx.fillText('THE SONIC VAULT // PASAPORTE DE IDENTIDAD SÓNICA', 50, 70);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '14px "Space Grotesk", monospace';
      ctx.fillText(`SERIAL: ${serialNumber}   •   EMISIÓN: ${issueDate}`, 50, 95);

      // Chip Inteligente en Canvas
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(width - 160, 50, 90, 55);
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.strokeRect(width - 160, 50, 90, 55);
      // Líneas de circuito en el chip
      ctx.beginPath();
      ctx.moveTo(width - 160, 78);
      ctx.lineTo(width - 70, 78);
      ctx.moveTo(width - 115, 50);
      ctx.lineTo(width - 115, 105);
      ctx.stroke();

      // 4. Avatar (o recuadro representativo)
      const avatarX = 50;
      const avatarY = 130;
      const avatarSize = 150;

      ctx.save();
      ctx.strokeStyle = archetype.primaryColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);

      // Intentar cargar la foto del usuario si es posible
      let imgLoaded = false;
      if (holderPhoto) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, avatarX + 2, avatarY + 2, avatarSize - 4, avatarSize - 4);
              imgLoaded = true;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = holderPhoto;
            setTimeout(resolve, 800); // timeout de seguridad
          });
        } catch (e) {
          // Si falla CORS se usa el avatar cibernético
        }
      }

      if (!imgLoaded) {
        ctx.fillStyle = '#111625';
        ctx.fillRect(avatarX + 2, avatarY + 2, avatarSize - 4, avatarSize - 4);
        ctx.fillStyle = archetype.primaryColor;
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(holderName.charAt(0).toUpperCase() || 'V', avatarX + (avatarSize / 2), avatarY + (avatarSize / 2) + 18);
        ctx.textAlign = 'left';
      }
      ctx.restore();

      // Badge VIP o Standard
      ctx.fillStyle = isPremium ? '#ffb300' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(avatarX, avatarY + avatarSize + 15, avatarSize, 28);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPremium ? '★ SPOTIFY PREMIUM VIP' : 'VAULT MEMBER', avatarX + (avatarSize / 2), avatarY + avatarSize + 34);
      ctx.textAlign = 'left';

      // 5. Datos Centrales del Agente
      const infoX = 230;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '13px monospace';
      ctx.fillText('TITULAR AUTORIZADO', infoX, 150);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.fillText(holderName.toUpperCase(), infoX, 190);

      ctx.fillStyle = archetype.primaryColor;
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillText(`ARQUETIPO // ${archetype.name.toUpperCase()}`, infoX, 230);

      ctx.fillStyle = '#a0aec0';
      ctx.font = '16px "Space Grotesk", sans-serif';
      ctx.fillText(archetype.subtitle, infoX, 260);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'italic 15px "Space Grotesk", sans-serif';
      ctx.fillText(`"${archetype.trait}"`, infoX, 290);

      // 6. Espectro de Frecuencias (Barras de Géneros)
      const specX = infoX;
      const specY = 330;
      ctx.fillStyle = archetype.primaryColor;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('ESPECTRO DE FRECUENCIAS SÓNICAS (GÉNEROS DOMINANTES)', specX, specY);

      topGenres.slice(0, 3).forEach((g, idx) => {
        const barY = specY + 25 + (idx * 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText(g.name, specX, barY + 12);

        // Barra de Fondo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(specX + 220, barY, 260, 16);

        // Barra de Progreso Neón
        ctx.fillStyle = idx === 0 ? archetype.primaryColor : archetype.secondaryColor;
        ctx.fillRect(specX + 220, barY, (260 * g.percent) / 100, 16);

        // Porcentaje
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${g.percent}%`, specX + 490, barY + 13);
      });

      // 7. Panel Lateral Derecho: Afinidad y Artista Top
      const rightX = 800;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(rightX, 130, 340, 340);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(rightX, 130, 340, 340);

      ctx.fillStyle = archetype.primaryColor;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('CALIBRACIÓN NEURAL', rightX + 20, 165);

      // Score de Afinidad Gigante
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px "Space Grotesk", sans-serif';
      ctx.fillText(`${affinityScore}%`, rightX + 20, 230);

      ctx.fillStyle = archetype.secondaryColor;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('AFINIDAD ARMÓNICA GLOBAL', rightX + 20, 255);

      // Tempo Estimado
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '13px monospace';
      ctx.fillText(`RANGO BPM ESTIMADO: ${archetype.bpmEstimate}`, rightX + 20, 285);

      // Artista de Cabecera
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('ARTISTA ANCLA / FRECUENCIA RAÍZ:', rightX + 20, 335);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillText(topArtistName, rightX + 20, 365);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '13px sans-serif';
      ctx.fillText(topTrackName ? `Pista: "${topTrackName}"` : 'Perfil Verificado por Spotify API', rightX + 20, 395);

      // 8. Pie de Seguridad y Código de Barras Cyberpunk
      const footerY = 560;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(50, footerY);
      ctx.lineTo(width - 50, footerY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('THE SONIC VAULT NEURAL ENGINE • CERTIFICACIÓN CRIPTOGRÁFICA DE AUDIO • TODOS LOS DERECHOS RESERVADOS', 50, footerY + 35);
      ctx.fillText(`ENCRIPTACIÓN: SHA-256 [${serialNumber}]`, 50, footerY + 55);

      // Código de barras estético a la derecha
      const barCodeX = width - 240;
      const barCodeY = footerY + 15;
      const barHeights = [40, 40, 40, 40];
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = (i % 3 === 0 || i % 7 === 0) ? '#ffffff' : 'rgba(255,255,255,0.4)';
        const barW = (i % 4 === 0) ? 3 : 1.5;
        ctx.fillRect(barCodeX + (i * 4), barCodeY, barW, 40);
      }

      // Descargar Canvas como archivo PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Pasaporte-Sonico-${holderName.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');

    } catch (err) {
      console.error('Error al exportar pasaporte holográfico:', err);
      setIsExporting(false);
    }
  };

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: archetype.primaryColor,
            boxShadow: `0 0 10px ${archetype.primaryColor}`
          }} />
          <h3 style={{
            color: '#fff',
            margin: 0,
            fontSize: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fa-solid fa-id-card-clip" style={{ color: archetype.primaryColor }} />
            Pasaporte Holográfico // Identidad Sónica
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Toggle de Inclinación 3D */}
          <button
            onClick={() => setTiltEnabled(!tiltEnabled)}
            title="Activar/desactivar efecto 3D con el cursor"
            style={{
              background: tiltEnabled ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${tiltEnabled ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: tiltEnabled ? '#00F0FF' : '#888',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-cube" />
            {tiltEnabled ? 'Giro 3D Activo' : 'Vista Plana'}
          </button>

          {/* Copiar Serial */}
          <button
            onClick={handleCopySerial}
            title="Copiar Código de Pasaporte"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: copied ? '#1DB954' : '#bbb',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-fingerprint'}`} />
            {copied ? '¡Copiado!' : serialNumber}
          </button>

          {/* Descargar Pasaporte HD */}
          <button
            onClick={handleDownloadPassport}
            disabled={isExporting}
            style={{
              background: `linear-gradient(135deg, ${archetype.primaryColor} 0%, ${archetype.secondaryColor} 100%)`,
              border: 'none',
              color: '#000',
              padding: '9px 18px',
              borderRadius: '25px',
              fontWeight: '800',
              fontSize: '0.8rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: isExporting ? 'wait' : 'pointer',
              boxShadow: `0 4px 20px ${archetype.glowColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              if (!isExporting) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 30px ${archetype.glowColor}`;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${archetype.glowColor}`;
            }}
          >
            <i className={isExporting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'} />
            {isExporting ? 'Generando PNG...' : 'Descargar Pasaporte (PNG)'}
          </button>
        </div>
      </div>

      {/* CONTENEDOR 3D PERSPECTIVE */}
      <div
        style={{
          perspective: '1200px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {/* TARJETA HOLOGRÁFICA */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1000px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(9, 11, 18, 0.98) 100%)',
            border: `2px solid ${archetype.primaryColor}`,
            boxShadow: isHovered
              ? `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 45px ${archetype.glowColor}`
              : `0 15px 40px rgba(0, 0, 0, 0.6), 0 0 25px ${archetype.glowColor}`,
            transform: tiltEnabled
              ? `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`
              : 'none',
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease',
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
            padding: '2.5rem',
            color: '#fff',
            cursor: tiltEnabled ? 'crosshair' : 'default'
          }}
        >
          {/* LÁMINA HOLOGRÁFICA TORNASOL (FOIL IRIDESCENT SHEEN) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255, 255, 255, 0.3) 0%, rgba(0, 240, 255, 0.2) 20%, rgba(255, 0, 128, 0.2) 40%, rgba(255, 215, 0, 0.15) 60%, transparent 85%)`,
              opacity: isHovered ? 0.9 : 0.25,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              transition: isHovered ? 'opacity 0.2s' : 'opacity 0.6s',
              zIndex: 3
            }}
          />

          {/* LÍNEAS DE SEGURIDAD / SCANLINES CYBERPUNK */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 4px)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />

          {/* SELLO DE AGUA DEL LOGO EN EL FONDO */}
          <div
            style={{
              position: 'absolute',
              right: '-40px',
              bottom: '-40px',
              width: '320px',
              height: '320px',
              opacity: 0.04,
              pointerEvents: 'none',
              fontSize: '22rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              zIndex: 1
            }}
          >
            <i className="fa-solid fa-record-vinyl" />
          </div>

          {/* BANNER PROTOTIPO (SI ES DEMO) */}
          {isDemo && (
            <div style={{
              position: 'relative',
              zIndex: 4,
              background: 'linear-gradient(90deg, rgba(255, 179, 0, 0.15), rgba(255, 0, 122, 0.15))',
              border: '1px solid rgba(255, 179, 0, 0.4)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb300', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-triangle-exclamation" />
                <span><strong>MODO PROTOTIPO:</strong> Mostrando arquetipo de demostración interactivo.</span>
              </div>
              {onConnectSpotify && (
                <button
                  onClick={onConnectSpotify}
                  style={{
                    background: '#1DB954',
                    color: '#000',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-brands fa-spotify" style={{ marginRight: '6px' }} />
                  Sincronizar mi Cuenta
                </button>
              )}
            </div>
          )}

          {/* 1. CABECERA SUPERIOR: BANNER & CHIP */}
          <div style={{
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '1.25rem',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: archetype.primaryColor, fontSize: '0.85rem' }} />
                <span style={{
                  color: archetype.primaryColor,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase'
                }}>
                  THE SONIC VAULT // CERTIFICADO BIOMÉTRICO DE AUDIO
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#8899a6', fontFamily: 'monospace' }}>
                  ID: <strong style={{ color: '#fff' }}>{serialNumber}</strong>
                </span>
                <span style={{ color: '#444' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: '#8899a6', fontFamily: 'monospace' }}>
                  EMITIDO: <strong style={{ color: '#fff' }}>{issueDate}</strong>
                </span>
                <span style={{ color: '#444' }}>•</span>
                <span style={{
                  fontSize: '0.7rem',
                  color: '#1DB954',
                  background: 'rgba(29, 185, 84, 0.12)',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}>
                  <i className="fa-brands fa-spotify" style={{ marginRight: '4px' }} />
                  {isPremium ? 'SPOTIFY PREMIUM' : 'ENLACE VERIFICADO'}
                </span>
              </div>
            </div>

            {/* CHIP METÁLICO HOLOGRÁFICO (SIMULACIÓN DE SMART-CHIP) */}
            <div style={{
              width: '64px',
              height: '46px',
              background: 'linear-gradient(135deg, #d4af37 0%, #f6e27a 40%, #aa771c 100%)',
              borderRadius: '6px',
              border: '1px solid #ffe57f',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 3px 10px rgba(0,0,0,0.5)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {/* Trazos de circuito de tarjeta */}
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0,0,0,0.3)', top: '15px' }} />
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0,0,0,0.3)', bottom: '15px' }} />
              <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(0,0,0,0.3)', left: '20px' }} />
              <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(0,0,0,0.3)', right: '20px' }} />
              <div style={{
                width: '18px',
                height: '14px',
                border: '1px solid rgba(0,0,0,0.35)',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)'
              }} />
            </div>
          </div>

          {/* 2. CUERPO PRINCIPAL DEL PASAPORTE */}
          <div style={{
            position: 'relative',
            zIndex: 4,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* COLUMNA IZQUIERDA: AVATAR & SELLO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '16px',
                padding: '3px',
                background: `linear-gradient(135deg, ${archetype.primaryColor}, ${archetype.secondaryColor})`,
                boxShadow: `0 8px 25px ${archetype.glowColor}`
              }}>
                {holderPhoto ? (
                  <img
                    src={holderPhoto}
                    alt={holderName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '13px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '13px',
                    background: '#121624',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: archetype.primaryColor,
                    fontSize: '3rem',
                    fontWeight: 'bold'
                  }}>
                    {holderName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Insignia del Arquetipo en la esquina */}
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: archetype.primaryColor,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  border: '2px solid #0a0e17'
                }}>
                  <i className={archetype.icon} />
                </div>
              </div>

              {/* TIPO DE CUENTA / RANGO */}
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '12px',
                background: isPremium ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                color: isPremium ? '#ffb300' : '#8899a6',
                border: `1px solid ${isPremium ? 'rgba(255, 179, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`
              }}>
                {accountType}
              </span>
            </div>

            {/* COLUMNA CENTRAL: NOMBRE, ARQUETIPO Y DESCRIPCIÓN */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#8899a6', fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Agente Acreditado:
                </span>
              </div>
              <h2 style={{
                color: '#fff',
                margin: '0 0 6px 0',
                fontSize: '1.9rem',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {holderName}
              </h2>

              {/* TÍTULO DEL ARQUETIPO CON DEGRADADO NEÓN */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: `linear-gradient(90deg, ${archetype.primaryColor}22, ${archetype.secondaryColor}22)`,
                border: `1px solid ${archetype.primaryColor}66`,
                padding: '6px 14px',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <i className={archetype.icon} style={{ color: archetype.primaryColor }} />
                <span style={{
                  color: archetype.primaryColor,
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  letterSpacing: '1px'
                }}>
                  {archetype.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>|</span>
                <span style={{ color: '#e0e6ed', fontSize: '0.85rem', fontWeight: '500' }}>
                  {archetype.subtitle}
                </span>
              </div>

              {/* ELEMENTO SÓNICO */}
              <div style={{ fontSize: '0.85rem', color: '#8899a6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-wave-square" style={{ color: archetype.secondaryColor }} />
                <span>Elemento Clave: <strong style={{ color: '#fff' }}>{archetype.element}</strong></span>
              </div>

              {/* RASGO / LORE */}
              <p style={{
                color: '#b0bec5',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                margin: '0 0 1rem 0',
                fontStyle: 'italic',
                maxWidth: '650px'
              }}>
                &ldquo;{archetype.trait}&rdquo;
              </p>

              {/* 3. ESPECTRO DE FRECUENCIAS (BARRAS DE GÉNEROS) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: archetype.primaryColor, fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-chart-simple" style={{ marginRight: '6px' }} />
                    Espectro de Frecuencias Dominantes
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8899a6', fontFamily: 'monospace' }}>
                    TEMPO EST.: <strong style={{ color: '#fff' }}>{archetype.bpmEstimate}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {topGenres.map((genre, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: '#ddd' }}>{genre.name}</span>
                        <span style={{ color: archetype.primaryColor, fontFamily: 'monospace', fontWeight: 'bold' }}>{genre.percent}%</span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${genre.percent}%`,
                          background: idx === 0 ? archetype.primaryColor : (idx === 1 ? archetype.secondaryColor : '#8000ff'),
                          borderRadius: '3px',
                          boxShadow: `0 0 8px ${idx === 0 ? archetype.primaryColor : archetype.secondaryColor}`
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. SECCIÓN INFERIOR: CALIBRACIÓN Y ARTISTA ANCLA */}
          <div style={{
            position: 'relative',
            zIndex: 4,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.5rem',
            marginTop: '1.75rem'
          }}>
            {/* SCORE DE AFINIDAD */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px 16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: `3px solid ${archetype.primaryColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 15px ${archetype.glowColor}`
              }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>
                  {affinityScore}%
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: archetype.primaryColor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Afinidad Armónica
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#8899a6' }}>
                  Cohesión espectral calibrada con alta precisión auditiva.
                </p>
              </div>
            </div>

            {/* ARTISTA ANCLA / FRECUENCIA RAÍZ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px 16px'
            }}>
              {topArtistImage ? (
                <img
                  src={topArtistImage}
                  alt={topArtistName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: '#1c2030',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: archetype.secondaryColor,
                  fontSize: '1.3rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-star" />
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <span style={{ fontSize: '0.7rem', color: archetype.secondaryColor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Frecuencia Raíz // Artista #1
                </span>
                <h4 style={{
                  margin: '2px 0 0 0',
                  color: '#fff',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {topArtistName}
                </h4>
                {topTrackName && (
                  <span style={{ fontSize: '0.75rem', color: '#778899', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    Pista: {topTrackName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

HolographicPassport.propTypes = {
  passportData: PropTypes.shape({
    archetype: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      subtitle: PropTypes.string,
      icon: PropTypes.string,
      primaryColor: PropTypes.string,
      secondaryColor: PropTypes.string,
      gradient: PropTypes.string,
      glowColor: PropTypes.string,
      element: PropTypes.string,
      trait: PropTypes.string,
      lore: PropTypes.string,
      bpmEstimate: PropTypes.string
    }),
    topGenres: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      percent: PropTypes.number
    })),
    affinityScore: PropTypes.number,
    serialNumber: PropTypes.string,
    issueDate: PropTypes.string,
    holderName: PropTypes.string,
    holderPhoto: PropTypes.string,
    accountType: PropTypes.string,
    isPremium: PropTypes.bool,
    topArtistName: PropTypes.string,
    topArtistImage: PropTypes.string,
    topTrackName: PropTypes.string,
    isDemo: PropTypes.bool
  }),
  onConnectSpotify: PropTypes.func
};
