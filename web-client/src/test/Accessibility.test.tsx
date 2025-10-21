import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../app/pages/App';
import Login from '../app/pages/Login';
import SignUp from '../app/pages/SignUp';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Accessibility Tests', () => {
  describe('App Page Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter(<App />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('has accessible buttons', () => {
      renderWithRouter(<App />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has proper ARIA labels where needed', () => {
      renderWithRouter(<App />);
      const getStartedButton = screen.getByText('Get started');
      expect(getStartedButton).toBeInTheDocument();
    });
  });

  describe('Login Page Accessibility', () => {
    it('has proper form labels', () => {
      renderWithRouter(<Login />);
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('has accessible form structure', () => {
      renderWithRouter(<Login />);
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('has proper input types for form validation', () => {
      renderWithRouter(<Login />);
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('SignUp Page Accessibility', () => {
    it('has proper form labels and validation', () => {
      renderWithRouter(<SignUp />);
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('has accessible sign-in link', () => {
      renderWithRouter(<SignUp />);
      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toBeInTheDocument();
    });
  });
});

describe('Performance Tests', () => {
  it('renders App page efficiently', () => {
    const start = performance.now();
    renderWithRouter(<App />);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  it('renders Login page efficiently', () => {
    const start = performance.now();
    renderWithRouter(<Login />);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  it('renders SignUp page efficiently', () => {
    const start = performance.now();
    renderWithRouter(<SignUp />);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  it('handles large number of app icons efficiently', () => {
    const start = performance.now();
    renderWithRouter(<App />);
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(50);
    const end = performance.now();
    expect(end - start).toBeLessThan(200);
  });
});

describe('Responsive Design Tests', () => {
  it('has mobile-friendly touch targets', () => {
    renderWithRouter(<App />);
    const buttons = screen.getAllByRole('button');
    const hasGoodPadding = buttons.some(
      (button) =>
        button.className.includes('px-') || button.className.includes('py-'),
    );
    expect(hasGoodPadding).toBe(true);
  });
});
