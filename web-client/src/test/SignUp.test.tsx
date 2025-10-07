import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SignUp from '../app/pages/SignUp';

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

describe('SignUp Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByText('Join AREA')).toBeInTheDocument();
  });

  it('renders AREA title', () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByText('AREA')).toBeInTheDocument();
  });

  it('renders signup form elements', () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByText('Join AREA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });


  it('renders Google sign up button', () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('renders login link', () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders background app icons', () => {
    renderWithRouter(<SignUp />);
    const appIcons = document.querySelectorAll('.grid svg');
    expect(appIcons.length).toBeGreaterThan(0);
  });

  it('has proper form validation attributes', () => {
    renderWithRouter(<SignUp />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});