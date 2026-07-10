/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, User, Car, FileText, Sliders, Loader2, RefreshCw } from 'lucide-react';
import { addSurvey } from './supabaseService';
import { Survey, Question, Advisor } from './types.js';

interface CustomerSurveyProps {
  questions: Question[];
  advisors: Advisor[];
  onSurveySubmitted: () => void;
  onGoToDashboard?: () => void;
}

export default function CustomerSurvey({ questions = [], advisors = [], onSurveySubmitted, onGoToDashboard }: CustomerSurveyProps) {
  const [activeMode, setActiveMode] = useState<'classic' | 'ai'>('ai');
  const [feedbackText, setFeedbackText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [remarks, setRemarks] = useState('');

  // Sync advisorName when advisors are loaded
  useEffect(() => {
    if (advisors.length > 0 && !advisorName) {
      setAdvisorName(advisors[0].name);
    }
  }, [advisors, advisorName]);

  // Initialize ratings on questions change
  useEffect(() => {
    const initial: { [key: string]: number } = {};
    questions.forEach(q => {
      initial[q.id] = 10;
    });
    setRatings(initial);
  }, [questions]);

  const getRating = (id: string) => ratings[id] ?? 10;
  const setRating = (id: string, val: number) => {
    setRatings(prev => ({ ...prev, [id]: val }));
  };

  const handleAIParse = async () => {
    if (!feedbackText.trim()) {
      setErrorMsg('Please enter some customer remarks first.');
      return;
    }
    setLoadingAI(true);
    setErrorMsg('');
    try {
      // Gemini parsing is not available because the backend server is not deployed.
      setErrorMsg('AI parsing is disabled in this deployment. Please fill in the feedback manually.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !regNumber.trim() || !advisorName) {
      setErrorMsg('Please fill in all mandatory fields: Customer Name, Registration Number, and Service Advisor.');
      return;
    }

    try {
      await addSurvey({
        customerName,
        regNumber: regNumber.toUpperCase(),
        advisorName,
        remarks,
        ...ratings
      });

      setSuccess(true);
      // Reset Form
      setCustomerName('');
      setRegNumber('');
      setFeedbackText('');
      setRemarks('');
      
      const resetRatings: { [key: string]: number } = {};
      questions.forEach(q => {
        resetRatings[q.id] = 10;
      });
      setRatings(resetRatings);
      
      // Notify Parent Dashboard
      onSurveySubmitted();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error submitting survey to Supabase.');
    }
  };

  const parameters = questions.map((q, idx) => ({
    id: q.id,
    label: `${q.label} (Q${idx + 1})`,
    val: getRating(q.id),
    set: (v: number) => setRating(q.id, v),
    desc: q.desc
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="survey-form-container">
      {success ? (
        <div className="bg-white border border-green-200 rounded-xl p-8 text-center shadow-sm space-y-4 animate-fade-in" id="survey-success-card">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full text-green-600 mb-2">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl text-toyota-black">Survey Submitted Successfully!</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Thank you for your feedback. The submission has been added automatically to the Al-Bashir Group dashboard in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onGoToDashboard && (
              <button
                onClick={() => {
                  setSuccess(false);
                  onGoToDashboard();
                }}
                className="px-6 py-2.5 bg-toyota-dark hover:bg-toyota-black text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                Go to CRM Dashboard
              </button>
            )}
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-bold text-xs transition-all cursor-pointer"
            >
              Submit Another Survey
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" id="survey-inputs-card">
          {/* Header */}
          <div className="bg-toyota-dark text-white px-6 py-4 flex items-center justify-between border-b-4 border-toyota-red">
            <div>
              <h3 className="font-semibold text-lg">Al-Bashir Group In-House Customer Survey</h3>
              <p className="text-xs text-gray-400">Al-Bashir Group · Customer Relations Department</p>
            </div>
            <div className="bg-toyota-red px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
              Live Feed
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Mode selection */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('ai');
                  setErrorMsg('');
                }}
                className={`flex-1 pb-3 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeMode === 'ai'
                    ? 'border-toyota-red text-toyota-red font-semibold'
                    : 'border-transparent text-gray-500 hover:text-toyota-black'
                }`}
                id="ai-mode-btn"
              >
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-4 h-4" />
                  AI Voice/Text Review Parser
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('classic');
                  setErrorMsg('');
                }}
                className={`flex-1 pb-3 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeMode === 'classic'
                    ? 'border-toyota-red text-toyota-red font-semibold'
                    : 'border-transparent text-gray-500 hover:text-toyota-black'
                }`}
                id="classic-mode-btn"
              >
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Sliders className="w-4 h-4" />
                  Classic Manual Survey
                </span>
              </button>
            </div>

            {/* AI Parsing Screen */}
            {activeMode === 'ai' && (
              <div className="bg-[#fcf8f8] border border-red-100 rounded-xl p-5 space-y-4" id="ai-review-parser">
                <div className="flex items-start gap-3">
                  <div className="bg-red-50 p-2 rounded-lg text-toyota-red">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-toyota-black">Instant AI Feedback Extraction</h4>
                    <p className="text-xs text-gray-500">
                      Paste a raw customer review, call transcription, or email. The Gemini model will automatically identify the customer details, their advisor, and score the 8 categories!
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Example: I came today for my FSD-2101 Fortuner. Dealt with Yasir. Listening was top class. He estimated the bill correctly. But lounge was very dusty, had no cooling and the AC was off, flies everywhere. Car delivered late by 2 hours..."
                    className="w-full h-28 p-3 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                  ></textarea>

                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-gray-400">
                      Supports English, Roman Urdu/Hindi & transcriptions.
                    </div>
                    <button
                      type="button"
                      disabled={loadingAI}
                      onClick={handleAIParse}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-toyota-red hover:bg-toyota-red-dark disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      id="ai-analyze-btn"
                    >
                      {loadingAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Analyzing with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Analyze & Autofill Form
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6" id="survey-main-form">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-toyota-red font-medium" id="form-error-alert">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Core info row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="form-customer-details">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Customer Name <span className="text-toyota-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Zahoor Ahmad"
                    className="w-full p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-gray-400" />
                    Registration/Plate <span className="text-toyota-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. ACV-201 or FSD-999"
                    className="w-full p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Service Advisor <span className="text-toyota-red">*</span>
                  </label>
                  <select
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    className="w-full p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                  >
                    {advisors.map(adv => (
                      <option key={adv.name} value={adv.name}>{adv.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
                  <Sliders className="w-4 h-4 text-gray-400" />
                  Satisfaction Parameters (Score 1 to 10)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" id="form-ratings-grid">
                  {parameters.map((p, idx) => {
                    const isLow = p.val < 7;
                    const isPerfect = p.val === 10;
                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-toyota-black">{p.label}</span>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                            isPerfect
                              ? 'bg-green-100 text-green-700'
                              : isLow
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.val} / 10
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">{p.desc}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-medium">1</span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={p.val}
                            onChange={(e) => p.set(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-toyota-red"
                          />
                          <span className="text-[10px] text-gray-400 font-medium">10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remarks Area */}
              <div className="space-y-1.5 border-t border-gray-100 pt-5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Voice of Customer Remarks / Explanations
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Summarize the customer's remarks, specific complaints, or praises..."
                  className="w-full h-24 p-3 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                ></textarea>
              </div>

              {/* Submit Row */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                  By clicking Submit, this survey will be posted instantly to the reporting server.
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-toyota-red hover:bg-toyota-red-dark text-white rounded-lg font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  id="survey-submit-btn"
                >
                  Submit Official Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
