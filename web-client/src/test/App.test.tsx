import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../app/pages/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(
      screen.getByText('Every thing works better together'),
    ).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<App />);
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('renders AREA logo', () => {
    render(<App />);
    expect(screen.getByText('AREA')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<App />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });
});
