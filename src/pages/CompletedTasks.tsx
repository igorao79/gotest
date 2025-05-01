import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft,
  FaCheck,
  FaTrash, 
  FaUndo 
} from 'react-icons/fa';
import authService from '../services/AuthService';
import '../styles/Dashboard.css';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

const CompletedTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Получаем данные пользователя
    const userData = authService.getUser();
    if (userData) {
      // Загружаем сохраненные задачи из localStorage
      const savedTasks = localStorage.getItem(`tasks_${userData.id}`);
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          // Преобразуем строки дат обратно в объекты Date и отфильтровываем завершенные задачи
          setTasks(parsedTasks
            .map((task: any) => ({
              ...task,
              createdAt: new Date(task.createdAt)
            }))
            .filter((task: Task) => task.completed)
          );
        } catch (e) {
          console.error('Ошибка при загрузке задач:', e);
          setTasks([]);
        }
      }
    }
    setLoading(false);
  }, [navigate]);

  const toggleTaskComplete = (taskId: number) => {
    const userData = authService.getUser();
    if (!userData) return;

    // Обновляем состояние задачи
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? {...task, completed: !task.completed} : task
    );
    
    // Получаем все задачи (включая не завершенные)
    const savedTasks = localStorage.getItem(`tasks_${userData.id}`);
    if (savedTasks) {
      try {
        const allTasks = JSON.parse(savedTasks);
        // Обновляем состояние задачи среди всех задач
        const allUpdatedTasks = allTasks.map((task: any) => 
          task.id === taskId ? {...task, completed: false} : task
        );
        
        // Сохраняем обновленные задачи
        localStorage.setItem(`tasks_${userData.id}`, JSON.stringify(allUpdatedTasks));
        
        // Обновляем список завершенных задач
        setTasks(updatedTasks.filter(task => task.completed));
        
        // Добавляем запись в историю активности
        addActivity(userData.id, 'Задача возобновлена', '🔄');
      } catch (e) {
        console.error('Ошибка при обновлении задач:', e);
      }
    }
  };

  const deleteTask = (taskId: number) => {
    const userData = authService.getUser();
    if (!userData) return;

    // Получаем все задачи
    const savedTasks = localStorage.getItem(`tasks_${userData.id}`);
    if (savedTasks) {
      try {
        const allTasks = JSON.parse(savedTasks);
        // Удаляем задачу из всех задач
        const updatedTasks = allTasks.filter((task: any) => task.id !== taskId);
        
        // Сохраняем обновленные задачи
        localStorage.setItem(`tasks_${userData.id}`, JSON.stringify(updatedTasks));
        
        // Обновляем список завершенных задач
        setTasks(tasks.filter(task => task.id !== taskId));
        
        // Добавляем запись в историю активности
        addActivity(userData.id, 'Задача удалена', '🗑️');
      } catch (e) {
        console.error('Ошибка при удалении задачи:', e);
      }
    }
  };

  const addActivity = (userId: string | number, action: string, icon: string) => {
    const generateRandomId = () => Math.floor(Math.random() * 10000);
    
    // Загружаем историю активности
    const savedLogs = localStorage.getItem(`activity_${userId}`);
    let activityLogs = [];
    
    if (savedLogs) {
      try {
        activityLogs = JSON.parse(savedLogs);
      } catch (e) {
        console.error('Ошибка при загрузке истории активности:', e);
        activityLogs = [];
      }
    }
    
    // Добавляем новую запись
    const newActivity = {
      id: generateRandomId(),
      action,
      timestamp: new Date(),
      icon
    };
    
    // Сохраняем только 10 последних действий
    const updatedLogs = [newActivity, ...activityLogs.slice(0, 9)];
    localStorage.setItem(`activity_${userId}`, JSON.stringify(updatedLogs));
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">Auth App</div>
          <h2 style={{ color: 'white', margin: 0 }}>Завершенные задачи</h2>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="nav-link"
            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaArrowLeft /> Назад
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="recent-activity">
          <h2>Завершенные задачи <FaCheck style={{ color: '#43a047', marginLeft: '10px' }} /></h2>
          
          {tasks.length > 0 ? (
            <div className="task-list">
              {tasks.map((task) => (
                <div className="task-item completed" key={task.id}>
                  <h4>{task.title}</h4>
                  {task.description && <p>{task.description}</p>}
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Дата создания: {formatDate(task.createdAt)}
                  </p>
                  <div className="task-actions">
                    <button 
                      className="task-btn complete-btn"
                      onClick={() => toggleTaskComplete(task.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FaUndo /> Возобновить
                    </button>
                    <button 
                      className="task-btn delete-btn"
                      onClick={() => deleteTask(task.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FaTrash /> Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FaCheck style={{ fontSize: '48px', marginBottom: '15px', color: '#ddd' }} />
              <p>У вас нет завершенных задач</p>
              <button 
                className="dashboard-action-btn"
                onClick={() => navigate('/dashboard')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
              >
                <FaArrowLeft /> Вернуться на главную
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompletedTasks; 