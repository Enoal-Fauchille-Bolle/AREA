import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../app/pages/App';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('App (Landing Page)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(
      screen.getByText('Automate all your tasks easily with AREA'),
    ).toBeInTheDocument();
  });

  it('renders AREA title', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('AREA')).toBeInTheDocument();
  });

  it('renders main heading and subtitle', () => {
    renderWithRouter(<App />);
    expect(
      screen.getByText('Automate all your tasks easily with AREA'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Build powerful automations between the tools you already use. Save time and increase productivity with seamless integrations.',
      ),
    ).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('navigates to signup when Get Started is clicked', () => {
    renderWithRouter(<App />);
    const getStartedButton = screen.getByText('Get started');
    fireEvent.click(getStartedButton);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('navigates to login when Log in is clicked', () => {
    renderWithRouter(<App />);
    const loginButton = screen.getByText('Log in');
    fireEvent.click(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders background app icons', () => {
    renderWithRouter(<App />);
    const appIcons = document.querySelectorAll('.grid svg');
    expect(appIcons.length).toBeGreaterThan(0);
  });

  it('applies correct CSS classes for layout', () => {
    renderWithRouter(<App />);
    const mainContainer = document.querySelector('.min-h-screen.bg-gray-900');
    expect(mainContainer).toBeInTheDocument();
  });
});
