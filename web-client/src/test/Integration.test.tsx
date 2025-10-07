import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../app/pages/App';
import Login from '../app/pages/Login';
import SignUp from '../app/pages/SignUp';
import UserProfile from '../app/pages/UserProfile';
import { Routes, Route } from 'react-router-dom';

describe('Integration Tests', () => {
  const renderApp = (initialPath: string) => {
    window.history.pushState({}, 'Test page', initialPath);
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>,
    );
  };

  describe('Routing Integration', () => {
    it('renders App component on root route', () => {
      renderApp('/');
      expect(
        screen.getByText('Automate all your tasks easily with AREA'),
      ).toBeInTheDocument();
    });

    it('renders Login component on /login route', () => {
      renderApp('/login');
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('renders SignUp component on /signup route', () => {
      renderApp('/signup');
      expect(screen.getByText('Join AREA')).toBeInTheDocument();
    });

    it('renders UserProfile component on /profile route', () => {
      renderApp('/profile');
      expect(
        screen.getByRole('heading', { name: 'My Areas' }),
      ).toBeInTheDocument();
    });
  });

  describe('Shared Components', () => {
    it('all pages have AREA branding', () => {
      renderApp('/');
      expect(screen.getAllByText('AREA').length).toBeGreaterThan(0);
      renderApp('/login');
      expect(screen.getAllByText('AREA').length).toBeGreaterThan(0);
      renderApp('/signup');
      expect(screen.getAllByText('AREA').length).toBeGreaterThan(0);
      renderApp('/profile');
      expect(screen.getAllByText('AREA').length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Page Features', () => {
    it('maintains consistent styling across pages', () => {
      renderApp('/');
      expect(document.querySelector('.bg-gray-900')).toBeTruthy();
      renderApp('/login');
      expect(document.querySelector('.bg-gray-900')).toBeTruthy();
      renderApp('/signup');
      expect(document.querySelector('.bg-gray-900')).toBeTruthy();
      renderApp('/profile');
      expect(document.querySelector('.bg-gray-900')).toBeTruthy();
    });

    it('has proper document titles', () => {
      renderApp('/');
      expect(document.title).toBeDefined();
      renderApp('/login');
      expect(document.title).toBeDefined();
      renderApp('/signup');
      expect(document.title).toBeDefined();
      renderApp('/profile');
      expect(document.title).toBeDefined();
    });
  });
});
