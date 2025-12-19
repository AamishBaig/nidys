import React, { useContext } from 'react';
import Header from './components/Header';
import Menu from './components/Menu';
import CheckoutPane from './components/CheckoutPane';
import { AppContext } from './context/AppContext';
import MediaManager from './components/MediaManager';

const App: React.FC = () => {
  const { theme, isMediaManagerOpen, setMediaManagerOpen } = useContext(AppContext);

  // ✅ SAFETY CHECK: Don't render until theme is loaded
  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-all duration-500"
      style={{ 
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen bg-black/60 text-white">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24">
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3">
              <Menu />
            </div>
            <div className="lg:col-span-2 mt-8 lg:mt-0">
              <div className="sticky top-24">
                <CheckoutPane />
              </div>
            </div>
          </div>
        </main>
        <MediaManager isOpen={isMediaManagerOpen} onClose={() => setMediaManagerOpen(false)} />
      </div>
    </div>
  );
};

export default App;
