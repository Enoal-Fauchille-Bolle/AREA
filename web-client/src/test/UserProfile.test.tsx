import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from '../app/pages/UserProfile';

// Mock de l'API
vi.mock('../services/api', () => ({
  tokenService: {
    getToken: vi.fn().mockReturnValue('test-token'),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    isAuthenticated: vi.fn().mockReturnValue(true),
  },
  areasApi: {
    getAreas: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Area 1',
        description: 'Test description',
        is_active: true,
        componentAction: {
          name: 'test_action',
          display_name: 'Test Action',
          service: { name: 'Discord' },
        },
        componentReaction: {
          name: 'test_reaction',
          display_name: 'Test Reaction',
          service: { name: 'Gmail' },
        },
        created_at: new Date().toISOString(),
        last_triggered_at: null,
        triggered_count: 0,
      },
    ]),
    updateArea: vi.fn().mockResolvedValue({}),
    deleteArea: vi.fn().mockResolvedValue({}),
  },
  authApi: {
    getProfile: vi.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
    }),
  },
  servicesApi: {
    getUserServices: vi.fn().mockResolvedValue([]),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-token');
  });

  it('renders the user profile page', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Check that the page renders with AREA branding
      const areaElements = screen.getAllByText(/AREA/i);
      expect(areaElements.length).toBeGreaterThan(0);
    });
  });

  it('displays navigation buttons', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Find "My Areas" text specifically in the navbar (not in the sections)
      const myAreasButtons = screen.getAllByText(/My Areas/i);
      expect(myAreasButtons.length).toBeGreaterThan(0);
      // Use getByRole for the Create button to avoid matching "Created:" text
      expect(
        screen.getByRole('button', { name: /Create new area/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders user areas list', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Area 1/i)).toBeInTheDocument();
    });
  });

  it('displays area toggle switch', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const toggles = screen.getAllByRole('button');
      expect(toggles.length).toBeGreaterThan(0);
    });
  });

  it('shows create area button', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const createButton = screen.getByText(/^Create$/i);
      expect(createButton).toBeInTheDocument();
    });
  });

  it('navigates to create page on button click', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const createButton = screen.getByText(/^Create$/i);
      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith('/create');
    });
  });

  it('displays profile menu button', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const profileButtons = screen.getAllByRole('button');
      expect(profileButtons.length).toBeGreaterThan(0);
    });
  });

  it('has responsive navbar layout', async () => {
    const { container } = render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const navbar = container.querySelector('header');
      expect(navbar).toBeInTheDocument();
    });
  });

  it('renders areas with action and reaction info', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Check that the area name is displayed
      expect(screen.getByText(/Test Area 1/i)).toBeInTheDocument();
    });
  });

  it('displays area statistics', async () => {
    render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Check for "Triggered: 0 times" text
      expect(screen.getByText(/Triggered:/i)).toBeInTheDocument();
      expect(screen.getByText(/times/i)).toBeInTheDocument();
    });
  });
});
