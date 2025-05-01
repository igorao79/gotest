import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';

const Logout: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Получаем id пользователя для создания записи об активности перед выходом
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const userId = user.id;
          
          // Получаем текущие логи активности
          const savedLogs = localStorage.getItem(`activity_${userId}`);
          if (savedLogs) {
            try {
              const parsedLogs = JSON.parse(savedLogs);
              
              // Создаем запись о выходе
              const logoutActivity = {
                id: Math.floor(Math.random() * 10000),
                action: 'Выход из системы',
                timestamp: new Date(),
                icon: '🚪'
              };
              
              // Добавляем запись в начало массива и сохраняем
              const updatedLogs = [logoutActivity, ...parsedLogs].slice(0, 10);
              localStorage.setItem(`activity_${userId}`, JSON.stringify(updatedLogs));
            } catch (e) {
              console.error('Ошибка при обновлении логов активности:', e);
            }
          }
        } catch (error) {
          console.error('Ошибка при получении пользователя:', error);
        }
      }
      
      // Очищаем данные сессии
      console.log('Выход из системы, очистка данных сессии');
      
      // Пробуем отправить запрос на выход на сервер (может не сработать)
      try {
        const response = await fetch('http://localhost:8080/api/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          console.log('Успешный выход на сервере');
        }
      } catch (error) {
        console.warn('Сервер недоступен при выходе:', error);
      }
      
      // В любом случае очищаем localStorage для выхода
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Добавляем небольшую задержку для анимации
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      disabled={loading}
      className="nav-link"
      style={{ 
        border: 'none', 
        background: 'none', 
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px'
      }}
    >
      {loading ? <FaSpinner className="spinner" /> : <FaSignOutAlt />} 
      {loading ? 'Выход...' : 'Выйти'}
    </button>
  );
};

export default Logout; 