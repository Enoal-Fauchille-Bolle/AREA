import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../app/pages/Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders AREA title', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('AREA')).toBeInTheDocument();
  });

  it('renders login form elements', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders back to home button', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('← Back to Home')).toBeInTheDocument();
  });

  it('renders Google sign in button', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('renders background app icons', () => {
    renderWithRouter(<Login />);
    const appIcons = document.querySelectorAll('.grid svg');
    expect(appIcons.length).toBeGreaterThan(0);
  });

  it('has proper form validation attributes', () => {
    renderWithRouter(<Login />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});