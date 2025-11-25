import React from 'react';
import { Sparkles, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] glass-panel border-b border-white/10 dark:border-gray-300/20 backdrop-blur-xl bg-[#0a0a0f]/90 dark:bg-white/90 shadow-lg">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section - Highlighted */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="logo-symbol">
              <Sparkles className="w-7 h-7 text-white dark:text-[#00e5ff]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="neon-logo text-xl font-extrabold leading-tight">ProGen</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5 leading-tight">AI Platform</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-gray-300 dark:text-gray-700 px-4 py-2 rounded-lg transition-all hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:bg-white/5 dark:hover:bg-gray-100/10"
            >
              Generate
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-gray-300 dark:text-gray-700 px-4 py-2 rounded-lg transition-all hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:bg-white/5 dark:hover:bg-gray-100/10"
            >
              Prompts
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2.5 glass-panel hover:border-[#00e5ff]/30 dark:hover:border-[#ff32b8]/30 rounded-lg border border-white/10 dark:border-gray-300/20 transition-all hover:scale-110"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 font-semibold">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 glass-panel border border-white/10 dark:border-gray-300/20 rounded-lg transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg glass-panel border border-white/10 dark:border-gray-300/20"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white dark:text-gray-800" />
              ) : (
                <Menu className="w-6 h-6 text-white dark:text-gray-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-white/10 dark:border-gray-300/20 mt-2">
            <div className="flex flex-col gap-2">
              <a 
                href="#" 
                className="nav-link text-sm font-medium text-gray-300 dark:text-gray-700 px-4 py-2 rounded-lg transition-all hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Generate
              </a>
              <a 
                href="#" 
                className="nav-link text-sm font-medium text-gray-300 dark:text-gray-700 px-4 py-2 rounded-lg transition-all hover:text-[#00e5ff] dark:hover:text-[#00a8cc] hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Prompts
              </a>
              <button className="btn-primary text-sm px-4 py-2.5 flex items-center justify-center gap-2 font-semibold mt-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
