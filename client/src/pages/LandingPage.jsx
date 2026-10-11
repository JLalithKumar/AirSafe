import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Activity, 
  Clock, 
  Navigation, 
  ArrowRight, 
  ShieldCheck, 
  MapPin,
  Sparkles,
  Layers,
  Flame,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Button, Card, Badge } from '../components/common/Card';
import { useAirQuality } from '../context/AirQualityContext';
import { useAuth } from '../context/AuthContext';
import { getAqiCategory } from '../utils/aqiUtils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { airData, selectedLocation, loading, error, refresh } = useAirQuality();

  const hasLiveAir = airData && typeof airData.aqi === 'number';
  const aqi = hasLiveAir ? airData.aqi : null;
  const category = aqi !== null ? getAqiCategory(aqi) : null;

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 pt-6 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Atmospheric ambient glow highlights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 sm:pt-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-slate-900 border border-teal-200 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Intelligent Air Exposure Awareness Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.12]">
          Know your air. <br />
          <span className="text-teal-600 dark:text-teal-400">Protect your body.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
          Understand how air pollution affects your planned activity, discover safer times, and make more informed outdoor decisions.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Button
            size="lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            icon={isAuthenticated ? Wind : ArrowRight}
            className="w-full sm:w-auto shadow-md shadow-teal-500/15"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={scrollToFeatures}
            icon={Sparkles}
            className="w-full sm:w-auto"
          >
            Explore AirSafe
          </Button>
        </div>

        {/* Real-time ambient location pill using actual available API data */}
        <div className="pt-4">
          {loading ? (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 shadow-sm animate-pulse">
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Fetching live air quality for {selectedLocation.name}...</span>
            </div>
          ) : error || !hasLiveAir ? (
            <div className="inline-flex items-center gap-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedLocation.name}: Live air data temporarily unavailable</span>
              <button
                onClick={refresh}
                className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 font-semibold ml-1"
                title="Retry fetching live data"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {selectedLocation.name}:
              </span>
              <span
                className="font-bold text-sm"
                style={{ color: category.color }}
              >
                AQI {aqi} ({category.category})
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <Link to="/dashboard" className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">
                View breakdown →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Personal Exposure Estimation Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Why raw AQI isn't enough
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Standard weather forecasts give you a single regional number. But how much pollution you actually inhale depends on how hard you are breathing and how long you are outside.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Traditional AQI App */}
          <div className="surface-card p-6 sm:p-8 space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Traditional AQI App
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              "AQI is 145 today."
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tells you ambient pollution is moderate or unhealthy, but leaves you with uncertain decisions: Is an outdoor 5K safe? Should I shift my commute? Is 6:00 AM better than 6:00 PM?
            </p>
          </div>

          {/* Card 2: AirSafe Personal Exposure Engine */}
          <div className="surface-card p-6 sm:p-8 space-y-4 border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/20">
            <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              AirSafe Exposure Engine
            </div>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
              Personalized Inhaled Dose Model
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              AirSafe factors in ventilation volume—an intense run draws ~45–60 L/min of air versus ~6–8 L/min while resting indoors. We calculate your estimated particulate intake score and recommend cleaner times and routes.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Comprehensive Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Tools built for informed outdoor decisions
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Practical insights for runners, cyclists, daily commuters, and vulnerable families.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Current Air Quality */}
          <Card className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Current Air Quality</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Live OpenWeather readings across PM2.5, PM10, NO2, O3, SO2, and CO with color-coded health risk banding.
              </p>
            </div>
            <Link to="/dashboard" className="text-xs font-semibold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 hover:underline pt-2">
              Explore dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Card 2: Exposure Calculator */}
          <Card className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Activity Exposure Score</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Computes a standardized 0–100 personal intake score based on specific exercise effort and outdoor duration.
              </p>
            </div>
            <Link to="/exposure" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline pt-2">
              Calculate dose <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Card 3: Forecast & Safer Times */}
          <Card className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Safer Time Windows</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Identifies optimal 2-hour clean outdoor windows by analyzing diurnal temperature inversions and wind patterns.
              </p>
            </div>
            <Link to="/forecast" className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 hover:underline pt-2">
              View forecast <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Card 4: Route Comparison */}
          <Card className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Clean Route Comparison</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Compare geographic transit corridors to choose bypasses with lower estimated vehicle exhaust exposure.
              </p>
            </div>
            <Link to="/routes" className="text-xs font-semibold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline pt-2">
              Compare corridors <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      {/* Informed Outdoor Decisions Section */}
      <section className="surface-card p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            How AirSafe empowers healthier routines
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We don't tell you to stay locked indoors. AirSafe gives you the objective data to adapt your schedule intelligently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Time-Shift Outdoor Training</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Moving your jog from evening rush hour (AQI 160) to early morning (AQI 65) can cut inhaled particulate mass by over 50%.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Select Cleaner Corridors</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Choosing residential or park-adjacent bike paths avoids localized diesel exhaust plumes along arterial highways.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Protect Vulnerable Groups</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dedicated school directives help teachers and coaches decide whether recess or sports should be held outdoors.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Conversion CTA Banner */}
      <section className="surface-card p-8 sm:p-12 text-center space-y-5 border border-teal-500/30 bg-gradient-to-b from-teal-50/30 to-white dark:from-teal-950/15 dark:to-slate-900/60 relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Ready to check your local air?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Sign in with Google to calculate your personalized exposure, track historical trends, and plan safer outdoor activities.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            icon={isAuthenticated ? Wind : ShieldCheck}
          >
            {isAuthenticated ? 'Open Dashboard' : 'Get Started with Google'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/school')}
          >
            School Safety Guidelines
          </Button>
        </div>
      </section>
    </div>
  );
}
