import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Solo se usa al registrarse
  const [error, setError] = useState(null);

  // Función para manejar el formulario manual (Correo/Contraseña)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await signup(email, password, nombre || 'Explorador Anónimo');
      } else {
        await login(email, password);
      }
      // Si todo sale bien, lo mandamos a su bóveda (perfil)
      navigate('/perfil');
    } catch (err) {
      console.error(err.code);
      if (err.code === 'auth/invalid-credential') setError('Credenciales incorrectas.');
      else if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else setError('Ocurrió un error al intentar acceder.');
    }
  };

  // Función para el botón de Google
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/perfil');
    } catch (err) {
      console.error(err);
      setError('Error al conectar con los servidores de Google.');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      
      <div style={{ background: '#111', padding: '3rem', borderRadius: '16px', border: '1px solid #333', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        
        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--accent-color, #00ffcc)', marginBottom: '1.5rem' }}></i>
        <h2 style={{ color: '#fff', marginBottom: '2rem', letterSpacing: '2px' }}>
          {isRegistering ? 'NUEVO EXPLORADOR' : 'ACCESO RESTRINGIDO'}
        </h2>

        {/* Mensaje de Error */}
        {error && (
          <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4444', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Tu Nombre o Alias (Ej. DaftPunk99)" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
            />
          )}

          <input 
            type="email" 
            placeholder="Correo Electrónico" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          
          <input 
            type="password" 
            placeholder="Contraseña (mínimo 6 caracteres)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" style={submitBtnStyle}>
            {isRegistering ? 'CREAR IDENTIDAD' : 'INICIAR SECUENCIA'}
          </button>

        </form>

        <div style={{ margin: '2rem 0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', borderTop: '1px solid #333' }}></div>
          <span style={{ position: 'relative', background: '#111', padding: '0 15px', color: '#666', fontSize: '0.8rem', letterSpacing: '2px' }}>O AUTORIZAR CON</span>
        </div>

        {/* EL BOTÓN MÁGICO DE GOOGLE */}
        <button onClick={handleGoogleLogin} style={googleBtnStyle}>
          <i className="fa-brands fa-google" style={{ fontSize: '1.2rem' }}></i>
          Continuar con Google
        </button>

        {/* Toggle para cambiar entre Login y Registro */}
        <p style={{ color: '#888', marginTop: '2rem', fontSize: '0.9rem' }}>
          {isRegistering ? '¿Ya tienes tus llaves?' : '¿No estás en el sistema?'} <br/>
          <span 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{ color: 'var(--accent-color, #00ffcc)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
            {isRegistering ? 'Entra a la Bóveda' : 'Solicita Acceso Oficial'}
          </span>
        </p>

      </div>
    </div>
  );
}

// Estilos reutilizables para mantener el JSX limpio
const inputStyle = {
  width: '100%', padding: '15px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none'
};

const submitBtnStyle = {
  width: '100%', padding: '15px', background: 'var(--accent-color, #00ffcc)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: '0.2s'
};

const googleBtnStyle = {
  width: '100%', padding: '15px', background: '#fff', border: 'none', borderRadius: '8px', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: '0.2s'
};