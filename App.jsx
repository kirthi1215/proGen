import React, { useState } from 'react';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';
import Navbar from './components/Navbar';
import Generator from './components/Generator';

function App() {
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Floating Bars Background */}
      <div className="floating-bar"></div>
      <div className="floating-bar"></div>
      <div className="floating-bar"></div>
      <div className="floating-bar"></div>
      <div className="floating-bar"></div>

      {/* Header - Always visible when showHeader is true */}
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 z-[100] w-full">
          <Navbar />
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 relative z-10 overflow-hidden ${showHeader ? 'pt-20' : 'pt-0'}`}>
        <Generator />
      </main>

      {/* Footer - Always visible when showFooter is true */}
      {showFooter && (
        <footer className="relative z-10 w-full border-t border-white/10 dark:border-gray-300/20 glass-panel bg-[#0a0a0f]/90 dark:bg-white/90 backdrop-blur-xl py-8 mt-auto shadow-lg">
          <div className="max-w-full mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Left Section - Brand */}
              <div className="flex items-center gap-4">
                <div className="logo-symbol">
                  <Sparkles className="w-6 h-6 text-white dark:text-[#00e5ff]" />
                </div>
                <div>
                  <span className="neon-logo text-xl font-extrabold">ProGen</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">© 2025 All rights reserved</p>
                </div>
              </div>

              {/* Center Section - Links */}
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a 
                  href="#" 
                  className="nav-link text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] transition-colors font-medium"
                >
                  Privacy
                </a>
                <a 
                  href="#" 
                  className="nav-link text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] transition-colors font-medium"
                >
                  Terms
                </a>
                <a 
                  href="#" 
                  className="nav-link text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] transition-colors font-medium"
                >
                  Contact
                </a>
                <a 
                  href="#" 
                  className="nav-link text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] transition-colors font-medium"
                >
                  About
                </a>
              </div>

              {/* Right Section - Social Links */}
              <div className="flex items-center gap-4">
                <a 
                  href="#" 
                  className="p-2 glass-panel border border-white/10 dark:border-gray-300/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:border-[#00e5ff]/30 transition-all"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="p-2 glass-panel border border-white/10 dark:border-gray-300/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:border-[#00e5ff]/30 transition-all"
                  title="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="p-2 glass-panel border border-white/10 dark:border-gray-300/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:border-[#00e5ff]/30 transition-all"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Visibility Controls - Hidden in production, shown for testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed right-4 bottom-6 z-[200] flex flex-col gap-2">
          <button
            onClick={() => setShowHeader(s => !s)}
            className="text-xs px-3 py-2 rounded-md glass-panel border border-white/10 dark:border-gray-300/20 text-white dark:text-gray-800 hover:border-[#00e5ff]/30 transition-all"
          >
            {showHeader ? 'Hide Header' : 'Show Header'}
          </button>
          <button
            onClick={() => setShowFooter(s => !s)}
            className="text-xs px-3 py-2 rounded-md glass-panel border border-white/10 dark:border-gray-300/20 text-white dark:text-gray-800 hover:border-[#00e5ff]/30 transition-all"
          >
            {showFooter ? 'Hide Footer' : 'Show Footer'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
