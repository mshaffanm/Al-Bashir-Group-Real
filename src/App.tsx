/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, ClipboardList, RefreshCw, Loader2, Lock, KeyRound, ArrowRight } from 'lucide-react';
import CustomerSurvey from './CustomerSurvey';
import CRMDashboard from './CRMDashboard';
import { Survey, Question, Advisor } from './types';
// @ts-ignore
import alBashirLogo from './al_bashir_logo_1783064957865 (2).jpg';

const CRM_DASHBOARD_PASSWORD = 'Albashir321';
const CUSTOMER_PORTAL_PASSWORD = 'Customer321';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'survey'>('dashboard');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('crm_dashboard_auth') === 'true';
  });
  const [isPortalAuthenticated, setIsPortalAuthenticated] = useState(() => {
    return localStorage.getItem('customer_portal_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [portalAuthError, setPortalAuthError] = useState('');

  const handleDashboardLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CRM_DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('crm_dashboard_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handlePortalLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalPassword === CUSTOMER_PORTAL_PASSWORD) {
      setIsPortalAuthenticated(true);
      localStorage.setItem('customer_portal_auth', 'true');
      setPortalAuthError('');
    } else {
      setPortalAuthError('Incorrect password. Please try again.');
    }
  };

  const handleDashboardLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('crm_dashboard_auth');
    setPassword('');
  };

  const handlePortalLogout = () => {
    setIsPortalAuthenticated(false);
    localStorage.removeItem('customer_portal_auth');
    setPortalPassword('');
  };

  const fetchSurveys = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [surveysRes, questionsRes, advisorsRes] = await Promise.all([
        fetch('/api/surveys'),
        fetch('/api/questions'),
        fetch('/api/advisors')
      ]);
      if (surveysRes.ok && questionsRes.ok && advisorsRes.ok) {
        const surveysData = await surveysRes.json();
        const questionsData = await questionsRes.json();
        const advisorsData = await advisorsRes.json();
        setSurveys(surveysData);
        setQuestions(questionsData);
        setAdvisors(advisorsData);
      } else {
        setError('Failed to load database from server.');
      }
    } catch (err) {
      setError('Connection error. Server may be starting or offline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuestionsUpdated = async () => {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvisorsUpdated = async () => {
    try {
      const res = await fetch('/api/advisors');
      if (res.ok) {
        const data = await res.json();
        setAdvisors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-slate-800 relative overflow-x-hidden" id="app-root">
      {/* Dynamic Mesh Background */}
      <div className="mesh-bg"></div>

      {/* Premium Al-Bashir Group Header - Frosted Glass Styled */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-md border border-slate-200 bg-white">
              <img
                src={alBashirLogo}
                alt="Al-Bashir Group Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-slate-900 text-sm font-bold tracking-tight">Al-Bashir Group</h1>
              <span className="text-[10px] text-slate-500 block font-medium opacity-80">Customer Relations CRM Platform</span>
            </div>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  view === 'dashboard'
                    ? 'bg-white text-red-600 border border-slate-200/50 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
                id="header-nav-dashboard"
              >
                <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                CRM Dashboard
              </button>
              <button
                onClick={() => setView('survey')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  view === 'survey'
                    ? 'bg-white text-red-600 border border-slate-200/50 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
                id="header-nav-survey"
              >
                <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                Customer Portal
              </button>
            </div>

            {view === 'dashboard' && isAuthenticated && (
              <button
                onClick={handleDashboardLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-red-200/50"
                title="Lock / Logout Dashboard"
                id="header-lock-btn"
              >
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold hidden sm:inline text-red-600">Lock</span>
              </button>
            )}

            {/* Sync button */}
            <button
              onClick={() => fetchSurveys(true)}
              disabled={loading || refreshing}
              className="p-2 text-slate-500 hover:text-slate-800 disabled:text-slate-400 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              title="Refresh database"
              id="header-sync-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-500' : ''}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 glass-card rounded-2xl p-10 max-w-md mx-auto shadow-sm" id="app-loading-state">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Initializing TFM Database Store...
            </p>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-sm border-red-200 bg-red-50" id="app-error-state">
            <p className="text-sm font-semibold text-red-600">⚠️ System Connection Error</p>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <button
              onClick={() => fetchSurveys()}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-red-600/15"
            >
              Retry Connection
            </button>
          </div>
        ) : view === 'dashboard' ? (
          isAuthenticated ? (
            <CRMDashboard
              surveys={surveys}
              questions={questions}
              advisors={advisors}
              onSurveyDeleted={fetchSurveys}
              onQuestionsUpdated={handleQuestionsUpdated}
              onAdvisorsUpdated={handleAdvisorsUpdated}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 animate-fade-in" id="password-auth-container">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8 text-white text-center relative">
                  <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/20">
                    <KeyRound className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight">Restricted Access</h3>
                  <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto">
                    The Al-Bashir Group CRM Dashboard contains sensitive customer and feedback analytics.
                  </p>
                </div>

                <form onSubmit={handleDashboardLoginSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Enter Security Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3 pr-10 py-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                        required
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <p className="text-[11px] text-red-500 font-semibold text-center" id="auth-error-msg">
                      ⚠️ {authError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md shadow-red-600/10 text-center"
                  >
                    Authenticate Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                </form>
              </div>
            </div>
          )
        ) : isPortalAuthenticated ? (
          <CustomerSurvey
            questions={questions}
            advisors={advisors}
            onSurveySubmitted={fetchSurveys}
            onGoToDashboard={() => setView('dashboard')}
          />
        ) : (
          <div className="max-w-md mx-auto my-12 animate-fade-in" id="portal-password-auth-container">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8 text-white text-center relative">
                <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/20">
                  <KeyRound className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-bold text-lg tracking-tight">Customer Portal Access</h3>
                <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto">
                  Enter the password to access the customer portal and submit feedback.
                </p>
              </div>

              <form onSubmit={handlePortalLoginSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                      required
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {portalAuthError && (
                  <p className="text-[11px] text-red-500 font-semibold text-center" id="portal-auth-error-msg">
                    ⚠️ {portalAuthError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md shadow-red-600/10 text-center"
                >
                  Authenticate Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

              </form>
            </div>
          </div>
        )}
      </main>

      {/* Premium humble branding footer */}
      <footer className="bg-white/40 backdrop-blur-md text-slate-500 text-[10px] text-center py-6 border-t border-slate-200/60 relative z-10" id="app-footer">
        <p className="font-semibold tracking-wider text-slate-700">
          AL-BASHIR GROUP · CUSTOMER RELATIONS DEPARTMENT
        </p>
        <p className="mt-1 opacity-70">
          Developed by{' '}
          <a
            href="https://www.masudcollection.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-900 transition-colors"
          >
            Muhammad Shaffan Masud
          </a>
        </p>
      </footer>
    </div>
  );
}
