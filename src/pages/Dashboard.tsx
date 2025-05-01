import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaBell, 
  FaClock, 
  FaUser, 
  FaLock, 
  FaPlus,
  FaTrash,
  FaCheck,
  FaHistory,
  FaHome,
  FaSignOutAlt,
  FaKey,
  FaTasks,
  FaCalendarAlt,
  FaInfoCircle,
  FaSignInAlt,
  FaEdit,
  FaExchangeAlt
} from 'react-icons/fa';
import Logout from '../components/Logout';
import authService from '../services/AuthService';
import '../styles/Dashboard.css';

interface User {
  id: number;
  email: string;
  password?: string; // Добавляем поле пароля, опциональное
}

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface ActivityLog {
  id: number;
  action: string;
  timestamp: Date;
  iconType: string;
}

// Функция для получения иконки по типу
const getIconForActivity = (iconType: string) => {
  switch (iconType) {
    case 'auth':
      return <FaSignInAlt style={{ color: '#4f46e5' }} />;
    case 'logout':
      return <FaSignOutAlt style={{ color: '#ef4444' }} />;
    case 'task-add':
      return <FaClipboardList style={{ color: '#10b981' }} />;
    case 'task-complete':
      return <FaCheckCircle style={{ color: '#10b981' }} />;
    case 'task-delete':
      return <FaTrash style={{ color: '#ef4444' }} />;
    case 'password-change':
      return <FaKey style={{ color: '#f97316' }} />;
    case 'task-resume':
      return <FaExchangeAlt style={{ color: '#f59e0b' }} />;
    default:
      return <FaInfoCircle style={{ color: '#4b5563' }} />;
  }
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  const navigate = useNavigate();

  const generateRandomId = () => Math.floor(Math.random() * 10000);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Получаем данные пользователя из localStorage напрямую
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      
      // Приводим ID к числовому типу, если он строка
      setUser({
        ...userData,
        id: typeof userData.id === 'string' ? parseInt(userData.id, 10) : userData.id
      });
      
      // Загружаем сохраненные задачи из localStorage
      const savedTasks = localStorage.getItem(`tasks_${userData.id}`);
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          // Преобразуем строки дат обратно в объекты Date
          setTasks(parsedTasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt)
          })));
        } catch (e) {
          console.error('Ошибка при загрузке задач:', e);
          setTasks([]);
        }
      }
      
      // Загружаем историю активности
      const savedLogs = localStorage.getItem(`activity_${userData.id}`);
      
      // Создаем новую запись о входе при каждом посещении
      const loginActivity = {
        id: generateRandomId(),
        action: 'Авторизация',
        timestamp: new Date(),
        iconType: 'auth'
      };
      
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          
          // Конвертируем старые записи с эмодзи в новый формат с типами иконок
          const updatedParsedLogs = parsedLogs.map((log: any) => {
            // Если уже есть iconType, оставляем его
            if (log.iconType) return { ...log, timestamp: new Date(log.timestamp) };
            
            // Если есть icon (эмодзи), конвертируем в iconType
            let iconType = 'info';
            if (log.icon === '🔐') iconType = 'auth';
            else if (log.icon === '🚪') iconType = 'logout';
            else if (log.icon === '📋') iconType = 'task-add';
            else if (log.icon === '✅') iconType = 'task-complete';
            else if (log.icon === '🗑️') iconType = 'task-delete';
            else if (log.icon === '🔄') iconType = 'task-resume';
            else if (log.icon === '🔑') iconType = 'password-change';
            
            return {
              id: log.id,
              action: log.action,
              timestamp: new Date(log.timestamp),
              iconType
            };
          });
          
          // Добавляем новую запись о входе в начало массива
          const updatedLogs = [
            loginActivity, 
            ...updatedParsedLogs
          ].slice(0, 10); // Ограничиваем до 10 записей
          
          setActivityLogs(updatedLogs);
          localStorage.setItem(`activity_${userData.id}`, JSON.stringify(updatedLogs));
        } catch (e) {
          console.error('Ошибка при загрузке истории активности:', e);
          createDefaultActivityLog(userData.id);
        }
      } else {
        createDefaultActivityLog(userData.id);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
      navigate('/login');
    }
    
    setLoading(false);
  }, [navigate]);

  const createDefaultActivityLog = (userId: string | number) => {
    const loginActivity = {
      id: generateRandomId(),
      action: 'Авторизация',
      timestamp: new Date(),
      iconType: 'auth'
    };
    setActivityLogs([loginActivity]);
    localStorage.setItem(`activity_${userId}`, JSON.stringify([loginActivity]));
  };

  // Сохраняем задачи в localStorage при изменении
  useEffect(() => {
    if (user && tasks.length > 0) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  // Сохраняем логи активности
  useEffect(() => {
    if (user && activityLogs.length > 0) {
      localStorage.setItem(`activity_${user.id}`, JSON.stringify(activityLogs));
    }
  }, [activityLogs, user]);

  const addActivity = (action: string, iconType: string) => {
    if (!user) return;
    
    const newActivity = {
      id: generateRandomId(),
      action,
      timestamp: new Date(),
      iconType
    };
    
    setActivityLogs(prev => [newActivity, ...prev.slice(0, 9)]); // Сохраняем только 10 последних действий
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Проверка заполнения полей
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Пожалуйста, заполните все поля');
      return;
    }
    
    // Проверка совпадения паролей
    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    // Проверка, что новый пароль отличается от текущего
    if (newPassword === currentPassword) {
      setPasswordError('Новый пароль должен отличаться от текущего');
      return;
    }
    
    try {
      // Используем сервис для смены пароля
      await authService.changePassword(currentPassword, newPassword);
      
      // Сохраняем запись о смене пароля в активность
      addActivity('Смена пароля', 'password-change');
      
      // Показываем сообщение об успехе
      setPasswordSuccess('Пароль успешно изменен!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Закрываем модальное окно через 2 секунды
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setPasswordError(error.message);
      } else {
        setPasswordError('Произошла ошибка при смене пароля');
      }
      console.error('Ошибка при смене пароля:', error);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: generateRandomId(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowTaskModal(false);
    
    // Добавляем запись в историю активности
    addActivity('Добавлена задача', 'task-add');
  };

  const toggleTaskComplete = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? {...task, completed: !task.completed} : task
    ));
    
    // Добавляем запись в историю активности
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addActivity(
        task.completed ? 'Задача возобновлена' : 'Задача завершена', 
        task.completed ? 'task-resume' : 'task-complete'
      );
    }
  };

  const deleteTask = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    
    // Добавляем запись в историю активности
    addActivity('Задача удалена', 'task-delete');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="auth-card">
          <h2 className="auth-title">Доступ запрещен</h2>
          <p style={{textAlign: 'center'}}>Пожалуйста, войдите в систему</p>
          <Link to="/login" className="auth-btn" style={{display: 'block', textAlign: 'center', textDecoration: 'none'}}>Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">Auth App</div>
          <div className="user-welcome">Добро пожаловать, {user?.email}</div>
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-link">
              <FaHome /> Главная
            </Link>
            <button 
              onClick={() => setShowPasswordModal(true)} 
              className="nav-link"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <FaKey /> Сменить пароль
            </button>
            <Logout />
          </nav>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3><FaTasks /> Активные задачи</h3>
              <span className="stat-number">{tasks.filter(t => !t.completed).length}</span>
              <button 
                className="dashboard-action-btn"
                onClick={() => setShowTaskModal(true)}
              >
                <FaPlus /> Добавить задачу
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3><FaCheckCircle /> Завершенные задачи</h3>
              <span className="stat-number">{tasks.filter(t => t.completed).length}</span>
              <button 
                className="dashboard-action-btn"
                onClick={() => navigate('/completed-tasks')}
              >
                <FaHistory /> Просмотреть
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3><FaBell /> Уведомления</h3>
              <span className="stat-number">0</span>
              <button 
                className="dashboard-action-btn"
              >
                <FaCheckCircle /> Просмотреть все
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3><FaCalendarAlt /> Последнее обновление</h3>
              <span className="stat-number">
                {activityLogs.length > 0 
                  ? formatDate(activityLogs[0].timestamp) 
                  : 'Нет данных'}
              </span>
              <button 
                className="dashboard-action-btn"
              >
                <FaHistory /> История действий
              </button>
            </div>
          </div>
          
          <div className="dashboard-sections">
            <div className="recent-activity">
              <h2><FaHistory /> Последние действия</h2>
              {activityLogs.length > 0 ? (
                <ul className="activity-list">
                  {activityLogs.map((activity) => (
                    <li className="activity-item" key={activity.id}>
                      <div className="activity-icon">
                        {getIconForActivity(activity.iconType)}
                      </div>
                      <div className="activity-details">
                        <h4 className="activity-title">{activity.action}</h4>
                        <span className="activity-time">{formatDate(activity.timestamp)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <span>🔍</span>
                  <p>История действий пуста</p>
                </div>
              )}
            </div>
            
            <div className="recent-activity">
              <h2><FaClipboardList /> Текущие задачи</h2>
              {tasks.length > 0 ? (
                <div className="task-list">
                  {tasks.filter(task => !task.completed).map((task) => (
                    <div className={`task-item ${task.completed ? 'completed' : ''}`} key={task.id}>
                      <h4>{task.title}</h4>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-actions">
                        <button 
                          className="task-btn complete-btn"
                          onClick={() => toggleTaskComplete(task.id)}
                        >
                          <FaCheck /> Завершить
                        </button>
                        <button 
                          className="task-btn delete-btn"
                          onClick={() => deleteTask(task.id)}
                        >
                          <FaTrash /> Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>📝</span>
                  <p>У вас нет активных задач</p>
                  <button 
                    className="add-task-btn"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <FaPlus /> Добавить задачу
                  </button>
                </div>
              )}
              
              {tasks.filter(task => !task.completed).length === 0 && tasks.length > 0 && (
                <button 
                  className="add-task-btn"
                  onClick={() => setShowTaskModal(true)}
                >
                  <FaPlus /> Добавить задачу
                </button>
              )}
            </div>
            
            <div className="dashboard-card profile-card">
              <h3><FaUser /> Информация профиля</h3>
              <div className="card-content">
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Статус:</strong> <span style={{color: '#43a047'}}>Активен</span></p>
                <p><strong>Дата регистрации:</strong> {new Date().toLocaleDateString('ru-RU')}</p>
              </div>
              <button 
                className="dashboard-action-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                <FaLock /> Сменить пароль
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Модальное окно смены пароля */}
      <div className={`modal-overlay ${showPasswordModal ? 'active' : ''}`} onClick={() => setShowPasswordModal(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <button 
            className="modal-close"
            onClick={() => {
              setShowPasswordModal(false);
              setPasswordError('');
              setPasswordSuccess('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            ✕
          </button>
          <div className="modal-header">
            <h3><FaKey /> Смена пароля</h3>
          </div>
          {passwordError && <div className="error-message">{passwordError}</div>}
          {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-row">
              <input
                type="password"
                placeholder="Текущий пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                placeholder="Подтвердите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="dashboard-action-btn"
              style={{margin: '0 auto'}}
            >
              <FaKey /> Изменить пароль
            </button>
          </form>
        </div>
      </div>
      
      {/* Модальное окно добавления задачи */}
      <div className={`modal-overlay ${showTaskModal ? 'active' : ''}`} onClick={() => setShowTaskModal(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <button 
            className="modal-close"
            onClick={() => setShowTaskModal(false)}
          >
            ✕
          </button>
          <div className="modal-header">
            <h3><FaClipboardList /> Новая задача</h3>
          </div>
          <form onSubmit={handleAddTask} className="task-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Название задачи"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="form-row">
              <textarea
                placeholder="Описание (необязательно)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <button 
              type="submit" 
              className="dashboard-action-btn"
              style={{margin: '0 auto'}}
            >
              <FaPlus /> Добавить задачу
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 