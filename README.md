# Auth App - React + Go + Supabase

Приложение для аутентификации пользователей с использованием:
- React + TypeScript (Frontend)
- Go (Backend)
- Supabase + PostgreSQL (Database)

## Структура проекта

```
auth-app/
├── frontend/         # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── services/    # Сервисы для API
│   │   └── styles/      # CSS стили
├── backend/          # Go сервер
│   ├── config/       # Конфигурация
│   ├── handlers/     # HTTP обработчики
│   ├── models/       # Модели данных
│   └── main.go       # Точка входа сервера
```

## Запуск проекта

### Frontend

1. Установить зависимости:
```
npm install
```

2. Запустить dev-сервер:
```
npm run dev
```

Приложение будет доступно на http://localhost:5173

### Backend

1. Перейти в директорию backend:
```
cd backend
```

2. Создать файл .env с конфигурацией:
```
DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.vgpeaourpdsgahsreyln.supabase.co:5432/postgres
JWT_SECRET=your_jwt_secret_key
PORT=8080
```

3. Запустить сервер:
```
go run main.go
```

Сервер будет доступен на http://localhost:8080

## Функциональность

- Регистрация пользователей
- Аутентификация с помощью JWT
- Защищенные маршруты для авторизованных пользователей
- Выход из системы

## База данных

Для работы с приложением необходимо иметь доступ к базе данных Supabase. 
При первом запуске сервера автоматически создается таблица пользователей, если она не существует.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
