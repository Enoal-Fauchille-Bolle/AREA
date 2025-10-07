import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserProfile() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const placeholderAreas = [
    {
      id: 1,
      name: "Weather Alert System",
      description: "Get notified when weather changes",
      logo: "🌤️"
    },
    {
      id: 2,
      name: "Email to Discord",
      description: "Forward important emails to Discord",
      logo: "📧"
    },
    {
      id: 3,
      name: "Stock Price Monitor",
      description: "Track your favorite stocks",
      logo: "📈"
    },
    {
      id: 4,
      name: "Social Media Backup",
      description: "Backup your social media posts",
      logo: "💾"
    },
    {
      id: 5,
      name: "Smart Home Controller",
      description: "Automate your smart home devices",
      logo: "🏠"
    },
    {
      id: 6,
      name: "Calendar Sync",
      description: "Sync events across all calendars",
      logo: "📅"
    }
  ];

  const filteredAreas = placeholderAreas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateArea = () => {
    console.log('Create new area');
  };

  const handleExplore = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold">AREA</span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={handleExplore}
              className="text-xl font-semibold text-gray-300 hover:text-white hover:scale-105 transform transition-all duration-300"
            >
              Explore
            </button>
            <span className="text-xl font-semibold text-gray-300 hover:text-white hover:scale-105 transform transition-all duration-300 cursor-pointer">My Areas</span>
            <button
              onClick={handleCreateArea}
              className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-xl font-semibold hover:scale-105 transform transition-all duration-300"
            >
              Create
            </button>
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-300" 
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pb-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-6">My Areas</h1>
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search your areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <svg
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {searchTerm ? 'No areas found matching your search.' : 'You haven\'t created any areas yet.'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAreas.map((area) => (
              <div
                key={area.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gray-700 rounded-lg mb-4 text-2xl group-hover:bg-gray-600 transition-colors">
                  {area.logo}
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {area.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserProfile;