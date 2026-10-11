import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Activity, 
  Clock, 
  MapPin, 
  Navigation, 
  History, 
  School, 
  SlidersHorizontal, 
  Menu, 
  X,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { useAirQuality } from '../../context/AirQualityContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SimulationControlModal from '../simulation/SimulationControlModal';
import LocationSelectorModal from './LocationSelectorModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { isSimulated, activeAlert, dismissAlert } = useSimulation();
  const { selectedLocation, availableLocations, setSelectedLocation, detectUserLocation } = useAirQuality();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Wind },
    { name: 'Exposure Check', path: '/exposure', icon: Activity },
    { name: 'Forecast', path: '/forecast', icon: Clock },
    { name: 'Routes', path: '/routes', icon: Navigation },
    { name: 'History', path: '/history', icon: History },
    { name: 'School Safety', path: '/school', icon: School },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* Active Alert Notification */}
        {activeAlert && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-900/60 px-4 py-2 text-xs text-rose-800 dark:text-rose-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-semibold text-rose-700 dark:text-rose-300">{activeAlert.title}:</span>
                <span className="text-rose-800 dark:text-rose-200/90">{activeAlert.message}</span>
              </div>
              <button
                onClick={dismissAlert}
                className="text-[11px] underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 dark:border-teal-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                AirSafe
              </span>
            </Link>

            {/* Center: Clean spacious Nav Links on a single line (no horizontal scrollbar) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-slate-700 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Location Dropdown + Theme Toggle + Demo Mode + Auth */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {/* Location Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 font-semibold max-w-[130px] md:max-w-[160px] truncate"
                  title="Search or change location"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">{selectedLocation?.name || 'Select City'}</span>
                </button>
                <button
                  type="button"
                  onClick={detectUserLocation}
                  title="Detect GPS location"
                  className="ml-2 pl-2 border-l border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 text-[11px] font-bold"
                >
                  GPS
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Demo Mode Button */}
              <button
                onClick={() => setSimModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                  isSimulated
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{isSimulated ? 'Sim Active' : 'Demo Mode'}</span>
              </button>

              {/* Authentication Controls */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] md:max-w-[110px] truncate">
                      {user?.name?.split(' ')[0] || 'Member'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign out of AirSafe"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-500 shadow-sm transition-colors whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSimModalOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2">
            {/* Mobile Auth Status */}
            {isAuthenticated ? (
              <div className="p-2.5 mb-2 flex items-center justify-between bg-teal-500/10 dark:bg-teal-500/15 rounded-xl border border-teal-500/20">
                <div className="flex items-center gap-2 truncate">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 px-3 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500"
                >
                  Get Started
                </Link>
              </div>
            )}

            <div className="p-2 mb-2 flex items-center justify-between bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1"
              >
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">{selectedLocation?.name || 'Select Location'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  detectUserLocation();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
              >
                GPS
              </button>
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <SimulationControlModal isOpen={simModalOpen} onClose={() => setSimModalOpen(false)} />
      <LocationSelectorModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </>
  );
}
