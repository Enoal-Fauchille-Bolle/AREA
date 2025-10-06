import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../app/pages/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Welcome to AREA')).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<App />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
