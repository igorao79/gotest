import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthForms.css';
import { FaEnvelope, FaLock, FaShieldAlt, FaCheck } from 'react-icons/fa';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Регистрация успешна! Сейчас вы будете перенаправлены на страницу входа.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError('Сервер недоступен. Пожалуйста, попробуйте позже.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-new">
      <div className="auth-card-center">
        <h2 className="auth-title-new">
          Регистрация
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form-new">
          <div className="form-group-new">
            <div className="input-icon-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                className="form-control-new"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
              />
            </div>
          </div>
          
          <div className="form-group-new">
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                className="form-control-new"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Пароль"
              />
            </div>
          </div>
          
          <div className="form-group-new">
            <div className="input-icon-wrapper">
              <FaShieldAlt className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                className="form-control-new"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Подтвердите пароль"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-btn-new" 
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="auth-footer-new">
          <p>
            Уже есть аккаунт? <Link to="/login" className="auth-link">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 