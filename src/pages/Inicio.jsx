import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Inicio() {
  const { user } = useAuth();
  
  // Estados para simular el pulso de la bóveda
  const [exploradores, setExploradores] = useState(0);
  const [beats, setBeats] = useState(0);
  const [decibelios, setDecibelios] = useState(0);

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 3;
      if (start <= 142) setExploradores(start);
      if (start <= 854) setBeats(Math.floor(start * 6));
      if (start <= 3200) setDecibelios(Math.floor(start * 22));
      if (start > 150) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ overflowX: 'hidden' }}>
      
      {/* =========================================
          BLOQUE 1: HERO (El vinilo original)
          ========================================= */}
      <section className="hero">
        <h2>THE SONIC <br/><span className="accent">VAULT</span></h2>

       {/* EL ROBOT COMPOSITOR V1.5 (RESPONSIVO Y SEGURO) */}
<div style={{
  /* EL ENVOLTORIO MÁGICO: Evita que el robot tape letras al hacer zoom */
  display: 'flex', 
  justifyContent: 'center', 
  margin: '0 auto 3rem auto',
  width: '100%',
  maxWidth: '280px', /* Tope máximo para que no sea gigante en pantallas grandes */
}}>
  
  {/* CONTENEDOR ESCALABLE: Si la pantalla se achica, usamos CSS para escalarlo */}
  <div className="robot-scaler" style={{
    position: 'relative',
    width: '240px', /* Ancho original */
    height: '220px', /* Alto original */
    transformOrigin: 'top center',
  }}>
    
    {/* Notas musicales flotando */}
    <div style={{ position: 'absolute', top: '20px', left: '40px', color: 'var(--accent-color, #00ffcc)', fontSize: '24px', animation: 'floatNote 2s linear infinite' }}>♪</div>
    <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'var(--accent-color, #00ffcc)', fontSize: '20px', animation: 'floatNote 2.5s linear infinite 1.2s' }}>♫</div>

    {/* MANITO SALUDANDO */}
    <div style={{ 
      position: 'absolute', right: '20px', top: '90px', zIndex: 5, 
      animation: 'stateGreet 10s infinite' 
    }}>
      <div style={{ 
        width: '20px', height: '28px', background: 'var(--accent-color, #00ffcc)', 
        borderRadius: '10px', boxShadow: '0 0 10px var(--accent-color, #00ffcc)', 
        transformOrigin: 'bottom center', animation: 'waveHand 0.35s ease-in-out infinite alternate' 
      }}></div>
    </div>

    {/* CONTENEDOR DE LA CABEZA */}
    <div style={{ 
      position: 'absolute', 
      top: '20px', 
      animation: 'headBob 0.8s ease-in-out infinite alternate',
      zIndex: 3,
      display: 'flex',
      justifyContent: 'center',
      width: '100%'
    }}>
      
      {/* Diadema de los Audífonos */}
      <div style={{ position: 'absolute', width: '120px', height: '130px', borderTop: '8px solid #333', borderRadius: '50% 50% 0 0', top: '15px' }}></div>
      
      {/* Orejeras Neón */}
      <div style={{ position: 'absolute', width: '20px', height: '50px', background: '#111', border: '2px solid var(--accent-color, #00ffcc)', borderRadius: '10px', left: '45px', top: '65px', boxShadow: '0 0 15px rgba(0,255,204,0.4)' }}></div>
      <div style={{ position: 'absolute', width: '20px', height: '50px', background: '#111', border: '2px solid var(--accent-color, #00ffcc)', borderRadius: '10px', right: '45px', top: '65px', boxShadow: '0 0 15px rgba(0,255,204,0.4)' }}></div>

      {/* Cabeza del Robot */}
      <div style={{ 
        position: 'absolute', width: '100px', height: '75px', background: '#1a1a1a', 
        border: '3px solid #2a2a2a', borderRadius: '15px', top: '55px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 20px rgba(0,0,0,0.6)'
      }}>
         {/* Pantalla plana */}
         <div style={{ width: '80px', height: '45px', background: '#050505', borderRadius: '8px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 10px #000' }}>
            
            <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'faceLookUp 10s infinite' }}>
              
              {/* CARA 1: CONCENTRADO */}
              <div style={{ position: 'absolute', display: 'flex', gap: '15px', animation: 'stateNormal 10s infinite' }}>
                <div style={{ width: '15px', height: '6px', background: 'var(--accent-color, #00ffcc)', borderRadius: '3px', animation: 'robotBlink 4s infinite', boxShadow: '0 0 8px var(--accent-color, #00ffcc)' }}></div>
                <div style={{ width: '15px', height: '6px', background: 'var(--accent-color, #00ffcc)', borderRadius: '3px', animation: 'robotBlink 4s infinite', boxShadow: '0 0 8px var(--accent-color, #00ffcc)' }}></div>
              </div>

              {/* CARA 2: FELIZ SALUDANDO */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', animation: 'stateGreet 10s infinite' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '14px', height: '8px', borderTop: '3px solid var(--accent-color, #00ffcc)', borderRadius: '50%', boxShadow: '0 -2px 6px rgba(0,255,204,0.4)' }}></div>
                  <div style={{ width: '14px', height: '8px', borderTop: '3px solid var(--accent-color, #00ffcc)', borderRadius: '50%', boxShadow: '0 -2px 6px rgba(0,255,204,0.4)' }}></div>
                </div>
                <div style={{ width: '10px', height: '5px', borderBottom: '2px solid var(--accent-color, #00ffcc)', borderRadius: '50%' }}></div>
              </div>

            </div>
         </div>
      </div>
    </div>

    {/* CONTENEDOR DEL CUERPO */}
    <div style={{ position: 'absolute', top: '130px', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: '70px', height: '80px', background: '#111', border: '2px solid #222', borderRadius: '20px 20px 10px 10px' }}></div>
    </div>

    {/* CONTENEDOR DE LA LIBRETA CLÁSICA */}
    <div style={{ 
      position: 'absolute', top: '160px', left: '50%', zIndex: 4, 
      width: '110px', height: '60px', background: '#0a0a0a', 
      border: '2px solid #333', borderRadius: '5px', 
      transform: 'translateX(-50%) rotate(-5deg)', padding: '10px', boxSizing: 'border-box',
      boxShadow: '0 5px 15px rgba(0,0,0,0.8)'
    }}>
       {/* Renglones */}
       <div style={{ width: '100%', height: '2px', background: '#222', marginBottom: '8px' }}></div>
       <div style={{ width: '80%', height: '2px', background: '#222', marginBottom: '8px' }}></div>
       <div style={{ width: '90%', height: '2px', background: '#222', marginBottom: '8px' }}></div>
       
       {/* Lápiz */}
       <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', animation: 'stateNormal 10s infinite', pointerEvents: 'none' }}>
         <div style={{ 
           position: 'absolute', width: '8px', height: '18px', 
           background: 'var(--accent-color, #00ffcc)', borderRadius: '4px', 
           top: '12px', left: '15px', 
           boxShadow: '0 0 10px var(--accent-color, #00ffcc)', 
           animation: 'robotWrite 1.5s ease-in-out infinite' 
         }}></div>
       </div>
    </div>
  </div>
  
  {/* ESTILOS, ANIMACIONES Y LA MEDIA QUERY DE ESCALADO */}
  <style>{`
    /* RESPONSIVIDAD: Cuando la pantalla sea más pequeña que 400px o hagan zoom masivo, el robot se encoge proporcionalmente */
    @media (max-width: 400px) {
      .robot-scaler {
        transform: scale(0.75);
        margin-bottom: -50px; /* Compensa el espacio sobrante al achicarse */
      }
    }
    
    @media (max-width: 300px) {
      .robot-scaler {
        transform: scale(0.6);
        margin-bottom: -80px;
      }
    }

    /* Animaciones... (Igual que antes) */
    @keyframes stateNormal { 0%, 65% { opacity: 1; transform: scale(1); } 68%, 92% { opacity: 0; transform: scale(0.8); } 95%, 100% { opacity: 1; transform: scale(1); } }
    @keyframes stateGreet { 0%, 65% { opacity: 0; transform: scale(0.8); pointer-events: none; } 68%, 92% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(0.8); pointer-events: none; } }
    @keyframes faceLookUp { 0%, 65% { transform: translateY(5px); } 70%, 90% { transform: translateY(-2px) scale(1.05); } 95%, 100% { transform: translateY(5px); } }
    @keyframes waveHand { 0% { transform: rotate(-15deg); } 100% { transform: rotate(35deg); } }
    @keyframes headBob { 0% { transform: translateY(0px) rotate(-1deg); } 100% { transform: translateY(6px) rotate(2deg); } }
    @keyframes robotWrite { 0% { transform: translateX(0px) translateY(0px); } 20% { transform: translateX(15px) translateY(-5px); } 40% { transform: translateX(30px) translateY(2px); } 60% { transform: translateX(45px) translateY(-3px); } 80% { transform: translateX(65px) translateY(1px); } 100% { transform: translateX(0px) translateY(0px); } }
    @keyframes floatNote { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 20% { opacity: 0.8; } 100% { transform: translateY(-40px) scale(1.5) rotate(15deg); opacity: 0; } }
    @keyframes robotBlink { 0%, 94%, 100% { transform: scaleY(1); opacity: 1; } 96% { transform: scaleY(0.1); opacity: 0.5; } }
  `}</style>
</div>
        
        <p style={{ color: '#aaa', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '1.1rem' }}>
          El ecosistema definitivo donde los exploradores sónicos coleccionan, crean y miden el impacto del sonido en su entorno.
        </p>
      </section>

      {/* =========================================
          BLOQUE 2: EL PULSO DE LA BÓVEDA
          ========================================= */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', padding: '0 2rem 5rem 2rem' }}>
        {[
          { id: 1, icon: 'fa-users', num: exploradores, label: 'Exploradores' },
          { id: 2, icon: 'fa-sliders', num: beats, label: 'Beats Creados' },
          { id: 3, icon: 'fa-wave-square', num: decibelios, label: 'dB Mapeados' }
        ].map((stat) => (
          <div key={stat.id} style={{ textAlign: 'center' }}>
            <i className={`fa-solid ${stat.icon}`} style={{ color: 'var(--accent-color)', fontSize: '1.5rem', marginBottom: '10px' }}></i>
            <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>{stat.num}</h3>
            <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* =========================================
          BLOQUE 3: EL HUB DE CONTROL
          ========================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 5rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          <div style={{ border: '1px solid #333', padding: '2rem', borderRadius: '12px', textAlign: 'center', background: '#0a0a0a' }}>
            <i className="fa-solid fa-microphone-lines" style={{ color: 'var(--accent-color)', fontSize: '2.5rem', marginBottom: '15px' }}></i>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>SALÓN DE ARTISTAS</h3>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Descubre la historia detrás de las leyendas de culto y su universo sonoro.</p>
            <Link to="/artistas" style={{ color: 'var(--accent-color)', textDecoration: 'none', border: '1px solid var(--accent-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Explorar</Link>
          </div>

          <div style={{ border: '1px solid #333', padding: '2rem', borderRadius: '12px', textAlign: 'center', background: '#0a0a0a' }}>
            <i className="fa-solid fa-drum" style={{ color: 'var(--accent-color)', fontSize: '2.5rem', marginBottom: '15px' }}></i>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>ESTUDIO BEAT IT</h3>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Sintetiza, graba y crea tus propias maquetas en un MPC integrado.</p>
            <Link to="/beat-it" style={{ color: 'var(--accent-color)', textDecoration: 'none', border: '1px solid var(--accent-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Abrir MPC</Link>
          </div>

          <div style={{ border: '1px solid #333', padding: '2rem', borderRadius: '12px', textAlign: 'center', background: '#0a0a0a' }}>
            <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--accent-color)', fontSize: '2.5rem', marginBottom: '15px' }}></i>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>RADAR ECHO-SAFE</h3>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Mapea tu entorno y encuentra las zonas de mayor tranquilidad urbana.</p>
            <Link to="/echo-safe" style={{ color: 'var(--accent-color)', textDecoration: 'none', border: '1px solid var(--accent-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Abrir Radar</Link>
          </div>

        </div>
      </section>

      {/* =========================================
          NUEVO BLOQUE 4: MANIFIESTO VISUAL (Storytelling)
          ========================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 6rem auto', padding: '0 2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>MÁS QUE UN <br/><span style={{ color: 'var(--accent-color)' }}>REPRODUCTOR</span></h2>
          <p style={{ color: '#aaa', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            The Sonic Vault nace de la necesidad de devolverle el respeto a la obra musical. No somos un algoritmo saltando de canción en canción. Somos una bóveda diseñada para aquellos que escuchan el silencio entre las notas, que buscan la calidad pura y entienden que el sonido afecta directamente nuestra realidad urbana.
          </p>
          <div style={{ width: '50px', height: '4px', background: 'var(--accent-color)' }}></div>
        </div>
        <div style={{ flex: '1 1 400px', position: 'relative' }}>
          {/* Un elemento visual abstracto usando CSS para no depender de imágenes externas */}
          <div style={{ width: '100%', height: '300px', background: 'linear-gradient(45deg, #050505, #1a1a1a)', border: '1px solid #333', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(0,255,204,0.1) 0%, transparent 50%)', animation: 'spin 15s linear infinite' }}></div>
            <i className="fa-solid fa-headphones-simple" style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.05)', zIndex: 1 }}></i>
          </div>
        </div>
      </section>

      {/* =========================================
          NUEVO BLOQUE 5: EL DESGLOSE TECNOLÓGICO
          ========================================= */}
      <section style={{ background: '#080808', padding: '5rem 2rem', borderTop: '1px solid #111', borderBottom: '1px solid #111', marginBottom: '5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '3rem', letterSpacing: '2px' }}>ARQUITECTURA DE <span style={{ color: 'var(--accent-color)' }}>ALTA FIDELIDAD</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <i className="fa-brands fa-react" style={{ color: '#61dafb', fontSize: '2.5rem', marginBottom: '1rem' }}></i>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Ecosistema React</h4>
              <p style={{ color: '#777', fontSize: '0.9rem' }}>Interfaces dinámicas y de carga instantánea sin interrupciones sónicas.</p>
            </div>
            <div>
              <i className="fa-brands fa-google" style={{ color: '#ea4335', fontSize: '2.5rem', marginBottom: '1rem' }}></i>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Cloud Firestore</h4>
              <p style={{ color: '#777', fontSize: '0.9rem' }}>Tus maquetas y reportes guardados de forma segura en la nube global.</p>
            </div>
            <div>
              <i className="fa-solid fa-microchip" style={{ color: 'var(--accent-color)', fontSize: '2.5rem', marginBottom: '1rem' }}></i>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Web Audio API</h4>
              <p style={{ color: '#777', fontSize: '0.9rem' }}>Síntesis de sonido directamente manipulando el hardware de tu navegador.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          NUEVO BLOQUE 6: CARRUSEL DE ARTISTAS
          ========================================= */}
      <section style={{ margin: '0 auto 6rem auto', padding: '0 2rem', overflow: 'hidden' }}>
        <h3 style={{ textAlign: 'center', color: '#555', fontSize: '0.9rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '2rem' }}>Leyendas en custodia</h3>
        
        {/* Contenedor del Marquee (Carrusel infinito) */}
        <div className="marquee-container" style={{ display: 'flex', whiteSpace: 'nowrap', width: '100%', overflow: 'hidden', position: 'relative' }}>
          {/* Duplicamos el contenido para que el bucle sea infinito y suave */}
          <div className="marquee-content" style={{ display: 'flex', gap: '4rem', paddingRight: '4rem', alignItems: 'center' }}>
            <span style={marqueeItemStyle}>MICHAEL JACKSON</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>BRUNO MARS</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>LADY GAGA</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>LANA DEL REY</span>
            <span style={marqueeItemStyle}>•</span>
          </div>
          <div className="marquee-content" style={{ display: 'flex', gap: '4rem', paddingRight: '4rem', alignItems: 'center' }}>
            <span style={marqueeItemStyle}>MICHAEL JACKSON</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>BRUNO MARS</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>LADY GAGA</span>
            <span style={marqueeItemStyle}>•</span>
            <span style={marqueeItemStyle}>LANA DEL REY</span>
            <span style={marqueeItemStyle}>•</span>
          </div>
        </div>
      </section>

      {/* =========================================
          BLOQUE 7: EL MANIFIESTO FINAL (Botón)
          ========================================= */}
      <section style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: '1px solid #222' }}>
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>LA TECNOLOGÍA Y LA MÚSICA</h2>
        <p style={{ color: 'var(--accent-color)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '30px', fontSize: '0.9rem' }}>Codificadas en un solo lugar</p>
        
        {user ? (
          <Link to="/perfil" style={{ background: 'var(--accent-color)', color: '#000', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            <i className="fa-solid fa-user-astronaut"></i> IR A MI CENTRO DE MANDO
          </Link>
        ) : (
          <Link to="/login" style={{ background: 'var(--accent-color)', color: '#000', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            <i className="fa-solid fa-key"></i> SOLICITAR ACCESO OFICIAL
          </Link>
        )}
      </section>

      {/* Estilos inyectados para la animación del carrusel */}
      <style>{`
        .marquee-content {
          animation: scrollMarquee 20s linear infinite;
        }
        @keyframes scrollMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      
    </main>
  );
}

const marqueeItemStyle = {
  color: '#333', 
  fontSize: '2rem', 
  fontWeight: '900', 
  letterSpacing: '2px',
  WebkitTextStroke: '1px #444',
  textTransform: 'uppercase'
};