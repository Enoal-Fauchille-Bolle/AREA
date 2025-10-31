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
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 gap-8 p-6 transform rotate-9 scale-110">
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

      <header className="relative z-10 p-6">
        <div className="flex justify-between items-center">
          <div className="text-6xl font-black text-white select-none">AREA</div>
          <div className="flex items-center space-x-8">
            <button
              onClick={handleLogin}
              className="text-white hover:text-gray-300 text-lg transition-all duration-300 hover:scale-110 transform"
            >
              Log in
            </button>
            <button
              onClick={handleGetStarted}
              className="bg-white text-black px-8 py-3 rounded-full text-lg font-black hover:bg-gray-200 hover:scale-110 transform transition-all duration-300"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-8">
          <h1 className="text-7xl font-black text-white leading-tight max-w-4xl select-none">
            Automate all your tasks easily with AREA
          </h1>
          <button
            onClick={handleGetStarted}
            className="bg-white text-black px-12 py-6 rounded-full text-2xl font-black hover:bg-gray-200 hover:scale-110 transform transition-all duration-300"
          >
            Start now
          </button>
        </div>
      </main>

      <section className="bg-white py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-black text-black mb-6">
              Connect your favorite apps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
