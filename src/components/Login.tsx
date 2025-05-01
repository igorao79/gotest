import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthForms.css';
import { FaEnvelope, FaLock, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Очищаем сообщение об ошибке при изменении полей
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Валидация формы
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Попытка входа с:', { email, password });
      
      // Проверяем наличие пользователя в localStorage
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('Найден пользователь:', user);
          
          // Проверяем email и пароль
          if (user.email === email && user.password === password) {
            console.log('Успешная аутентификация в localStorage');
            
            // Создаем новый токен для сессии
            const newToken = `token-${Date.now()}`;
            localStorage.setItem('token', newToken);
            
            // Обновляем дату последнего входа
            localStorage.setItem('last_login', new Date().toISOString());
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 500);
            return;
          } else if (user.email === email) {
            console.log('Email совпадает, но пароль неверный');
            setError('Неверный пароль');
            setLoading(false);
            return;
          } else {
            console.log('Пользователь не найден в localStorage');
            setError('Пользователь не найден');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Ошибка при проверке сохраненного пользователя:', error);
        }
      }
      
      // Если пользователя нет в localStorage, пробуем запрос к серверу
      try {
        console.log('Отправка запроса на сервер');
        const response = await fetch('https://gotest-cruf.onrender.com/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('Успешный ответ от сервера:', data);
          
          // Сохраняем токен и данные пользователя
          const newToken = data.token || `token-${Date.now()}`;
          localStorage.setItem('token', newToken);
          
          // Сохраняем пользователя с паролем
          localStorage.setItem('user', JSON.stringify({
            ...data.user,
            password: password // Сохраняем пароль
          }));
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          console.error('Ошибка от сервера:', data);
          setError(data.message || 'Ошибка при входе');
          setLoading(false);
        }
      } catch (err) {
        console.warn('Сервер недоступен, создаем демо-пользователя');
        
        // Для демо-режима создаем тестового пользователя
        if (email === 'demo@example.com' && password === 'password') {
          const demoUser = {
            id: '1',
            email: 'demo@example.com',
            password: 'password',
          };
          
          localStorage.setItem('token', `demo-token-${Date.now()}`);
          localStorage.setItem('user', JSON.stringify(demoUser));
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          console.log('Неверные данные для демо-входа');
          setError('Неверные учетные данные. Попробуйте demo@example.com / password');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Общая ошибка входа:', err);
      setError('Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-new">
      <div className="auth-card-center">
        <h2 className="auth-title-new">
          Вход в аккаунт
        </h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}
        
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-btn-new" 
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" style={{ marginRight: '8px' }} /> 
                Вход...
              </>
            ) : 'Войти'}
          </button>
        </form>
        
        <div className="auth-footer-new">
          <p>
            Нет аккаунта? <Link to="/register" className="auth-link">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 