import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import SignUp from './SignUp.tsx';
import Login from './Login.tsx';

function Router() {
  const path = window.location.pathname;

  switch (path) {
    case '/signup':
      return <SignUp />;
    case '/login':
      return <Login />;
    default:
      return <App />;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
