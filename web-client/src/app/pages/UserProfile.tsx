import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAreas } from '../../hooks/useAreas';
import AreaCard from '../../components/AreaCard';

function UserProfile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading: authLoading, error: authError, logout } = useAuth();
  const {
    areas,
    isLoading: areasLoading,
    error: areasError,
    toggleAreaStatus,
    deleteArea,
  } = useAreas();

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area.description &&
        area.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleCreateArea = () => {
    navigate('/create');
  };

  const handleDeleteArea = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        await deleteArea(id);
      } catch {
        // Error already handled by deleteArea
      }
    }
  };

  const handleToggleArea = async (id: number) => {
    try {
      await toggleAreaStatus(id);
    } catch {
      // Error already handled by toggleAreaStatus
    }
  };

  const handleEditArea = (id: number) => {
    navigate(`/edit/${id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('.profile-menu-container')) {
          setIsProfileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  if (authLoading || areasLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Loading your profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (authError || areasError) {
    const errorMessage = authError || areasError;
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            Failed to load profile
          </div>
          <div className="text-gray-400 mb-6">{errorMessage}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">AREA</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <span className="hidden sm:inline-block text-base sm:text-lg lg:text-xl font-semibold text-gray-300 hover:text-white hover:scale-105 transform transition-all duration-300 cursor-pointer">
              My Areas
            </span>
            <button
              onClick={handleCreateArea}
              className="bg-white text-black hover:bg-gray-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base lg:text-xl font-semibold hover:scale-105 transform transition-all duration-300"
              aria-label="Create new area"
            >
              Create
            </button>
            <div className="relative profile-menu-container">
              <button
                onClick={toggleProfileMenu}
                className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
                aria-label="Open profile menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    <div className="font-semibold">
                      {user
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                          user.username
                        : 'Loading...'}
                    </div>
                    <div
                      className="text-gray-400 text-xs truncate"
                      title={user?.email || 'Loading...'}
                    >
                      {user?.email || 'Loading...'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/profile/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center"
                    aria-label="Go to profile settings"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center"
                    aria-label="Logout from account"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pb-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-6">My Areas</h2>
          <div className="relative max-w-md mx-auto">
            <label htmlFor="search-areas" className="sr-only">
              Search your areas
            </label>
            <input
              id="search-areas"
              type="text"
              placeholder="Search your areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <svg
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {searchTerm
                ? 'No areas found matching your search.'
                : "You haven't created any areas yet."}
            </div>
            {!searchTerm && (
              <button
                onClick={handleCreateArea}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Area
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area) => (
              <AreaCard
                key={area.id}
                area={area}
                onToggleStatus={handleToggleArea}
                onDelete={handleDeleteArea}
                onEdit={handleEditArea}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserProfile;
