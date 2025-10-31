import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appIcons } from '../../lib/appIcons';

function App() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkFontLoaded = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setFontLoaded(true);
        });
      } else {
        setTimeout(() => setFontLoaded(true), 100);
      }
    };

    checkFontLoaded();
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div
      className={`min-h-screen bg-gray-900 relative overflow-hidden ${fontLoaded ? 'font-loaded' : 'font-loading'}`}
    >
      {/* Background pattern - adaptive grid for mobile and desktop */}
      <div className="absolute inset-0 opacity-10">
        {/* Mobile version: smaller grid */}
        <div className="grid md:hidden grid-cols-4 gap-4 p-4 transform rotate-9 scale-110">
          {Array.from({ length: 32 }).map((_, i) => {
            const appIndex = i % appIcons.length;
            return (
              <div
                key={i}
                className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"
              >
                {appIcons[appIndex]}
              </div>
            );
          })}
        </div>
        {/* Desktop version: larger grid */}
        <div className="hidden md:grid grid-cols-8 gap-8 p-6 transform rotate-9 scale-110">
          {Array.from({ length: 64 }).map((_, i) => {
            const appIndex = i % appIcons.length;
            return (
              <div
                key={i}
                className="w-16 h-16 bg-white rounded-lg flex items-center justify-center"
              >
                {appIcons[appIndex]}
              </div>
            );
          })}
        </div>
      </div>

      <header className="relative z-10 p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white select-none">
            AREA
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6 md:space-x-8">
            <button
              onClick={handleLogin}
              className="text-white hover:text-gray-300 text-sm sm:text-base md:text-lg transition-all duration-300 hover:scale-110 transform"
            >
              Log in
            </button>
            <button
              onClick={handleGetStarted}
              className="bg-white text-black px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-sm sm:text-base md:text-lg font-black hover:bg-gray-200 hover:scale-110 transform transition-all duration-300"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
        <div className="text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight max-w-4xl select-none px-2">
            Automate all your tasks easily with AREA
          </h1>
          <button
            onClick={handleGetStarted}
            className="bg-white text-black px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-full text-lg sm:text-xl md:text-2xl font-black hover:bg-gray-200 hover:scale-110 transform transition-all duration-300"
          >
            Start now
          </button>
        </div>
      </main>

      <section className="bg-white py-12 sm:py-16 md:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-4 sm:mb-6">
              Connect your favorite apps
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Build powerful automations between the tools you already use. Save
              time and increase productivity with seamless integrations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
