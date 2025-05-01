interface User {
  id: string;
  email: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface ApiResponse {
  message: string;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private apiUrl = 'http://localhost:8080/api';

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка входа');
    }
    
    return data;
  }

  async register(email: string, password: string): Promise<ApiResponse> {
    const response = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка регистрации');
    }
    
    return data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Проверяем, есть ли токен для авторизованного запроса
      const token = this.getToken();
      console.log("Using token for auth:", token ? "Token exists" : "No token");
      
      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const passwordData: PasswordChangeRequest = {
        currentPassword,
        newPassword
      };
      
      console.log("Sending password change request to:", `${this.apiUrl}/change-password`);
      console.log("Request data:", JSON.stringify(passwordData));

      const response = await fetch(`${this.apiUrl}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
        credentials: 'include',
      });
      
      console.log("Response status:", response.status, response.statusText);
      
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        data = { message: "Ошибка формата ответа сервера" };
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при смене пароля');
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка при смене пароля:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

export default new AuthService(); 