import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from '../app/pages/UserProfile';

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

describe('UserProfile Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    renderWithRouter(<UserProfile />);
    expect(screen.getAllByText('My Areas')).toHaveLength(2);
  });

  it('renders AREA title', () => {
    renderWithRouter(<UserProfile />);
    expect(screen.getByText('AREA')).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    renderWithRouter(<UserProfile />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getAllByText('My Areas')).toHaveLength(2);
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders profile picture placeholder', () => {
    renderWithRouter(<UserProfile />);
    const profilePicture = document.querySelector(
      '.w-10.h-10.bg-gray-600.rounded-full',
    );
    expect(profilePicture).toBeInTheDocument();
  });

  it('renders search bar', () => {
    renderWithRouter(<UserProfile />);
    expect(
      screen.getByPlaceholderText('Search your areas...'),
    ).toBeInTheDocument();
  });

  it('renders placeholder areas', () => {
    renderWithRouter(<UserProfile />);
    expect(screen.getByText('Weather Alert System')).toBeInTheDocument();
    expect(screen.getByText('Email to Discord')).toBeInTheDocument();
    expect(screen.getByText('Stock Price Monitor')).toBeInTheDocument();
    expect(screen.getByText('Social Media Backup')).toBeInTheDocument();
    expect(screen.getByText('Smart Home Controller')).toBeInTheDocument();
    expect(screen.getByText('Calendar Sync')).toBeInTheDocument();
  });

  it('filters areas based on search input', () => {
    renderWithRouter(<UserProfile />);
    const searchInput = screen.getByPlaceholderText('Search your areas...');

    fireEvent.change(searchInput, { target: { value: 'weather' } });
    expect(screen.getByText('Weather Alert System')).toBeInTheDocument();
    expect(screen.queryByText('Email to Discord')).not.toBeInTheDocument();
  });

  it('shows no results message when search yields no matches', () => {
    renderWithRouter(<UserProfile />);
    const searchInput = screen.getByPlaceholderText('Search your areas...');

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(
      screen.getByText('No areas found matching your search.'),
    ).toBeInTheDocument();
  });

  it('navigates to home when Explore is clicked', () => {
    renderWithRouter(<UserProfile />);
    const exploreButton = screen.getByText('Explore');
    fireEvent.click(exploreButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('logs create action when Create button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderWithRouter(<UserProfile />);
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    expect(consoleSpy).toHaveBeenCalledWith('Create new area');
    consoleSpy.mockRestore();
  });

  it('renders area cards with proper structure', () => {
    renderWithRouter(<UserProfile />);
    const areaCards = document.querySelectorAll(
      '.bg-gray-800.border.border-gray-700.rounded-lg',
    );
    expect(areaCards.length).toBeGreaterThanOrEqual(6);

    expect(screen.getByText('Weather Alert System')).toBeInTheDocument();
    expect(
      screen.getByText('Get notified when weather changes'),
    ).toBeInTheDocument();
  });

  it('has hover effects on area cards', () => {
    renderWithRouter(<UserProfile />);
    const areaCards = document.querySelectorAll('.hover\\:border-blue-500');
    expect(areaCards.length).toBeGreaterThan(0);
  });

  it('renders emoji icons for each area', () => {
    renderWithRouter(<UserProfile />);
    expect(screen.getByText('🌤️')).toBeInTheDocument();
    expect(screen.getByText('📧')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
    expect(screen.getByText('💾')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('📅')).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    renderWithRouter(<UserProfile />);
    const mainContainer = document.querySelector('.min-h-screen.bg-gray-900');
    expect(mainContainer).toBeInTheDocument();
  });

  it('centers the main content properly', () => {
    renderWithRouter(<UserProfile />);
    const centeredSection = document.querySelector('.text-center');
    expect(centeredSection).toBeInTheDocument();
  });
});
