/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  User,
  Check,
  Trash2,
  Search,
  MessageSquare,
  AlertTriangle,
  Sliders,
  BarChart2,
  Award,
  BookOpen,
  Settings,
  HelpCircle,
  Plus,
  Edit,
  X,
  ClipboardList,
} from 'lucide-react';
import { Survey, Question, Advisor } from './types.js';

interface CRMDashboardProps {
  surveys: Survey[];
  questions: Question[];
  advisors: Advisor[];
  onSurveyDeleted: () => void;
  onQuestionsUpdated: () => void;
  onAdvisorsUpdated: () => void;
}

export default function CRMDashboard({
  surveys,
  questions = [],
  advisors = [],
  onSurveyDeleted,
  onQuestionsUpdated,
  onAdvisorsUpdated,
}: CRMDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'advisors' | 'parameters' | 'trends' | 'voc' | 'entries' | 'questions' | 'manage_advisors'>('overview');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  // Sync default selected advisor
  useEffect(() => {
    if (advisors.length > 0) {
      if (!selectedAdvisor || !advisors.some(a => a.name === selectedAdvisor)) {
        setSelectedAdvisor(advisors[0].name);
      }
    }
  }, [advisors, selectedAdvisor]);
  
  // Search & Filter state for Admin / Entries log
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'promoters' | 'passives' | 'detractors'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dynamic questions and indicators state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [questionHeader, setQuestionHeader] = useState('');
  const [questionLabel, setQuestionLabel] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState('');

  // Dynamic advisors state
  const [isAddingAdvisor, setIsAddingAdvisor] = useState(false);
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [advisorError, setAdvisorError] = useState('');
  const [advisorSuccess, setAdvisorSuccess] = useState('');

  // Dynamic label dictionaries based on loaded questions catalog
  const PARAM_LABELS = useMemo(() => {
    const labels: { [key: string]: string } = {};
    questions.forEach(q => {
      labels[q.id] = q.label;
    });
    return labels;
  }, [questions]);

  const HEATMAP_PARAMS = useMemo(() => {
    return questions.map((q, idx) => ({
      key: q.id,
      header: q.header,
      label: q.label
    }));
  }, [questions]);

  // ────────────────────────────────────────────────────────
  // DYNAMIC CALCULATIONS
  // ────────────────────────────────────────────────────────

  // Compute average of a single survey
  const getSurveyAvg = (s: Survey) => {
    if (questions.length === 0) return 0;
    let sum = 0;
    let count = 0;
    questions.forEach(q => {
      if (s[q.id] !== undefined) {
        sum += s[q.id];
        count++;
      }
    });
    return count > 0 ? Number((sum / count).toFixed(2)) : 10;
  };

  // Process overall stats
  const stats = useMemo(() => {
    let total = surveys.length;
    if (total === 0) {
      return {
        overallAvg: 0,
        promotersCount: 0,
        passivesCount: 0,
        detractorsCount: 0,
        promotersPct: 0,
        passivesPct: 0,
        detractorsPct: 0,
        paramAverages: {},
        topAdvisor: 'None',
        lowestParam: 'None',
        monthlyStats: {},
        advisorStats: [],
        scoreDist: Array(11).fill(0),
        lowScoreCountByParam: {},
      };
    }

    let sumOverallAvg = 0;
    let promotersCount = 0;
    let passivesCount = 0;
    let detractorsCount = 0;

    const paramSums: { [key: string]: number } = {};
    const lowScoreCountByParam: { [key: string]: number } = {};

    questions.forEach(q => {
      paramSums[q.id] = 0;
      lowScoreCountByParam[q.id] = 0;
    });

    const scoreDist = Array(11).fill(0); // Index 0 is ignored, 1 to 10

    // Advisor mapping
    const advMap: { [key: string]: { sum: number; count: number; promoter: number; passive: number; detractor: number; params: { [key: string]: number } } } = {};
    const advisorsList = advisors.length > 0 ? advisors.map(a => a.name) : ['Iqtdar', 'Naeem', 'Bushra', 'Yasir', 'Moazzam'];
    advisorsList.forEach(name => {
      const initialParams: { [key: string]: number } = {};
      questions.forEach(q => {
        initialParams[q.id] = 0;
      });
      advMap[name] = {
        sum: 0,
        count: 0,
        promoter: 0,
        passive: 0,
        detractor: 0,
        params: initialParams,
      };
    });

    // Monthly mapping
    const monthMap: { [key: string]: { sum: number; count: number; advisors: { [adv: string]: number } } } = {
      "Aug'25": { sum: 0, count: 0, advisors: {} },
      "Feb'26": { sum: 0, count: 0, advisors: {} },
      "Mar'26": { sum: 0, count: 0, advisors: {} },
      "Apr'26": { sum: 0, count: 0, advisors: {} },
      "May'26": { sum: 0, count: 0, advisors: {} },
      "Jun'26": { sum: 0, count: 0, advisors: {} },
    };

    surveys.forEach(s => {
      const sAvg = getSurveyAvg(s);
      sumOverallAvg += sAvg;

      // Classify sentiment based on average
      if (sAvg >= 9.0) {
        promotersCount++;
      } else if (sAvg >= 7.0) {
        passivesCount++;
      } else {
        detractorsCount++;
      }

      // Rounded overall score for distribution (1 to 10)
      const roundedAvg = Math.max(1, Math.min(10, Math.round(sAvg)));
      scoreDist[roundedAvg]++;

      // Parameter sums & low scores (<7)
      questions.forEach(q => {
        const val = s[q.id] !== undefined ? Number(s[q.id]) : 10;
        paramSums[q.id] += val;
        if (val < 7) {
          lowScoreCountByParam[q.id] = (lowScoreCountByParam[q.id] || 0) + 1;
        }
      });

      // Advisor stats
      const advName = s.advisorName;
      if (advMap[advName] !== undefined) {
        advMap[advName].count++;
        advMap[advName].sum += sAvg;
        if (sAvg >= 9.0) advMap[advName].promoter++;
        else if (sAvg >= 7.0) advMap[advName].passive++;
        else advMap[advName].detractor++;

        questions.forEach(q => {
          const val = s[q.id] !== undefined ? Number(s[q.id]) : 10;
          advMap[advName].params[q.id] += val;
        });
      }

      // Map month
      let monthLabel = "Jun'26"; // Fallback / current month
      const dateStr = s.timestamp;
      if (dateStr.includes('2025-08')) monthLabel = "Aug'25";
      else if (dateStr.includes('2026-02')) monthLabel = "Feb'26";
      else if (dateStr.includes('2026-03')) monthLabel = "Mar'26";
      else if (dateStr.includes('2026-04')) monthLabel = "Apr'26";
      else if (dateStr.includes('2026-05')) monthLabel = "May'26";
      else if (dateStr.includes('2026-06')) monthLabel = "Jun'26";

      if (monthMap[monthLabel] !== undefined) {
        monthMap[monthLabel].count++;
        monthMap[monthLabel].sum += sAvg;
        if (!monthMap[monthLabel].advisors[advName]) {
          monthMap[monthLabel].advisors[advName] = 0;
        }
        monthMap[monthLabel].advisors[advName]++;
      }
    });

    const overallAvg = Number((sumOverallAvg / total).toFixed(2));
    const promotersPct = Number(((promotersCount / total) * 100).toFixed(1));
    const passivesPct = Number(((passivesCount / total) * 100).toFixed(1));
    const detractorsPct = Number(((detractorsCount / total) * 100).toFixed(1));

    const paramAverages: { [key: string]: number } = {};
    questions.forEach(q => {
      paramAverages[q.label] = total > 0 ? Number(((paramSums[q.id] || 0) / total).toFixed(2)) : 0;
    });

    // Find Lowest Parameter
    let lowestParam = questions[0]?.label || 'None';
    let minScore = 11;
    Object.entries(paramAverages).forEach(([p, val]) => {
      if (val < minScore) {
        minScore = val;
        lowestParam = p;
      }
    });

    // Advisor Ranking & Stats processing
    const processedAdvisors = Object.entries(advMap).map(([name, data]) => {
      const count = data.count;
      const avgScore = count ? Number((data.sum / count).toFixed(2)) : 0;
      const paramsAvg: { [key: string]: number } = {};
      Object.entries(data.params).forEach(([p, sum]) => {
        paramsAvg[p] = count ? Number((sum / count).toFixed(2)) : 0;
      });

      return {
        name,
        count,
        avg: avgScore,
        promoters: data.promoter,
        passives: data.passive,
        detractors: data.detractor,
        params: paramsAvg,
      };
    }).sort((a, b) => b.avg - a.avg);

    const topAdvisor = processedAdvisors[0]?.name || 'None';

    return {
      overallAvg,
      promotersCount,
      passivesCount,
      detractorsCount,
      promotersPct,
      passivesPct,
      detractorsPct,
      paramAverages,
      topAdvisor,
      lowestParam,
      monthlyStats: monthMap,
      advisorStats: processedAdvisors,
      scoreDist,
      lowScoreCountByParam,
    };
  }, [surveys, questions, advisors]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onSurveyDeleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filters for Admin / Entries log
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      // Search text matches customer, regNumber, remarks, or advisor
      const text = `${s.customerName} ${s.regNumber} ${s.advisorName} ${s.remarks}`.toLowerCase();
      const matchesSearch = text.includes(searchQuery.toLowerCase());

      // Sentiment filter
      const avg = getSurveyAvg(s);
      let matchesSentiment = true;
      if (filterSentiment === 'promoters') matchesSentiment = avg >= 9.0;
      else if (filterSentiment === 'passives') matchesSentiment = avg >= 7.0 && avg < 9.0;
      else if (filterSentiment === 'detractors') matchesSentiment = avg < 7.0;

      return matchesSearch && matchesSentiment;
    });
  }, [surveys, searchQuery, filterSentiment]);

  // Color mappings for scores (light-mode friendly)
  const scoreBadgeStyle = (score: number) => {
    if (score >= 9.5) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 9.0) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (score >= 7.0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getHeatmapColor = (score: number) => {
    if (score >= 9.7) return { bg: 'bg-green-100/80', text: 'text-green-800 font-bold' };
    if (score >= 9.5) return { bg: 'bg-green-50/80', text: 'text-green-700 font-semibold' };
    if (score >= 9.3) return { bg: 'bg-yellow-50/80', text: 'text-yellow-800' };
    if (score >= 9.0) return { bg: 'bg-amber-50/80', text: 'text-amber-700' };
    return { bg: 'bg-red-100/80', text: 'text-red-800 font-bold' };
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError('');
    setQuestionSuccess('');
    if (!questionHeader.trim() || !questionLabel.trim()) {
      setQuestionError('Short header and full label are required.');
      return;
    }

    try {
      if (isAddingQuestion) {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            header: questionHeader,
            label: questionLabel,
            desc: questionDesc,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setQuestionSuccess('New survey question added successfully.');
          setIsAddingQuestion(false);
          setQuestionHeader('');
          setQuestionLabel('');
          setQuestionDesc('');
          onQuestionsUpdated();
        } else {
          setQuestionError(data.error || 'Failed to save question.');
        }
      } else if (editingQuestion) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            header: questionHeader,
            label: questionLabel,
            desc: questionDesc,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setQuestionSuccess('Survey question updated successfully.');
          setEditingQuestion(null);
          setQuestionHeader('');
          setQuestionLabel('');
          setQuestionDesc('');
          onQuestionsUpdated();
        } else {
          setQuestionError(data.error || 'Failed to update question.');
        }
      }
    } catch (err) {
      setQuestionError('Connection error to server.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question? This may impact statistical averages of past entries for this parameter.')) {
      return;
    }
    setQuestionError('');
    setQuestionSuccess('');
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setQuestionSuccess('Question deleted successfully.');
        onQuestionsUpdated();
      } else {
        setQuestionError(data.error || 'Failed to delete question.');
      }
    } catch (err) {
      setQuestionError('Connection error to server.');
    }
  };

  const handleAdvisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvisorError('');
    setAdvisorSuccess('');
    if (!newAdvisorName.trim()) {
      setAdvisorError('Advisor name is required.');
      return;
    }

    try {
      const res = await fetch('/api/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdvisorName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdvisorSuccess(`Advisor "${newAdvisorName.trim()}" added successfully.`);
        setNewAdvisorName('');
        setIsAddingAdvisor(false);
        onAdvisorsUpdated();
      } else {
        setAdvisorError(data.error || 'Failed to save advisor.');
      }
    } catch (err) {
      setAdvisorError('Connection error to server.');
    }
  };

  const handleDeleteAdvisor = async (name: string) => {
    if (!confirm(`Are you sure you want to remove advisor "${name}"? Past survey records associated with this advisor will still be retained.`)) {
      return;
    }
    setAdvisorError('');
    setAdvisorSuccess('');
    try {
      const res = await fetch(`/api/advisors/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setAdvisorSuccess(`Advisor "${name}" deleted successfully.`);
        onAdvisorsUpdated();
      } else {
        setAdvisorError(data.error || 'Failed to delete advisor.');
      }
    } catch (err) {
      setAdvisorError('Connection error to server.');
    }
  };

  const activeAdvisorObj = stats.advisorStats.find((a: any) => a.name === selectedAdvisor) || stats.advisorStats[0];

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-wrapper">
      {/* Dynamic Nav Tabs - Frosted Glass styled */}
      <div className="flex border-b border-slate-200/60 overflow-x-auto glass-card rounded-xl p-1 shadow-md" id="dashboard-nav">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'advisors', label: 'Performance', icon: Award },
          { id: 'parameters', label: 'Analysis', icon: Sliders },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'voc', label: 'VOC & Issues', icon: MessageSquare },
          { id: 'entries', label: 'Admin / Entries log', icon: Settings },
          { id: 'questions', label: 'Survey Questions', icon: ClipboardList },
          { id: 'manage_advisors', label: 'Advisors', icon: User },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-[3px] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600 bg-red-50/50 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in" id="tab-overview">
          <div className="flex justify-between items-center glass-card p-5 rounded-xl shadow-sm border-slate-200/40">
            <div>
              <h2 className="font-display text-2xl text-slate-900 font-bold">TFM CRM Overview</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time compilation of all in-house customer satisfaction parameters</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 border border-red-200 rounded-full uppercase tracking-wider">
                Live Server Synced
              </span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4" id="kpi-grid">
            <div className="glass-card border-t-[4px] border-t-red-500 rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overall Score</span>
              <span className="font-display text-2xl font-bold text-slate-900 mt-1 block">
                {stats.overallAvg.toFixed(2)}
                <span className="text-xs font-normal text-slate-500">/10</span>
              </span>
              <span className="inline-block mt-2 text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">
                Excellent
              </span>
            </div>

            <div className="glass-card border-t-[4px] border-t-green-600 rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Surveys</span>
              <span className="font-display text-2xl font-bold text-slate-900 mt-1 block">{surveys.length}</span>
              <span className="text-[10px] text-slate-500 mt-2 block">All completed logs</span>
            </div>

            <div className="glass-card border-t-[4px] border-t-green-500 rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Promoters</span>
              <span className="font-display text-2xl font-bold text-slate-900 mt-1 block">
                {stats.promotersPct}%
              </span>
              <span className="inline-block mt-2 text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">
                {stats.promotersCount}
              </span>
            </div>

            <div className="glass-card border-t-[4px] border-t-yellow-500 rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Passives</span>
              <span className="font-display text-2xl font-bold text-slate-900 mt-1 block">
                {stats.passivesPct}%
              </span>
              <span className="inline-block mt-2 text-[10px] bg-yellow-50 text-yellow-700 font-bold px-2 py-0.5 rounded border border-yellow-200">
                {stats.passivesCount}
              </span>
            </div>

            <div className="glass-card border-t-[4px] border-t-amber-600 rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Detractors</span>
              <span className="font-display text-2xl font-bold text-slate-900 mt-1 block">
                {stats.detractorsPct}%
              </span>
              <span className="inline-block mt-2 text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                {stats.detractorsCount}
              </span>
            </div>

            <div className="glass-card rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Top Advisor</span>
              <span className="font-display text-base font-bold text-slate-900 mt-2 block truncate">{stats.topAdvisor}</span>
              <span className="inline-block mt-2 text-[9px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-100">
                Avg Rating
              </span>
            </div>

            <div className="glass-card rounded-xl p-4 relative shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lowest Param</span>
              <span className="font-display text-xs font-bold text-amber-700 mt-2 block truncate leading-tight">
                {stats.lowestParam}
              </span>
              <span className="inline-block mt-1 text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
                Needs Attention
              </span>
            </div>
          </div>

          {/* Performance Averages vs Sentiment Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-secondary-grid">
            <div className="lg:col-span-2 glass-card rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Parameter Averages</h3>
                  <p className="text-[10px] text-slate-500">Mean scores out of 10 for each dimension</p>
                </div>
                <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                  All Advisors
                </span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(stats.paramAverages).map(([label, val]: any) => {
                  const pct = Math.max(10, val * 10);
                  const isLow = val < 9.5;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="font-bold text-slate-900">{val.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isLow ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut Chart and Legend */}
            <div className="glass-card rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Customer Sentiment</h3>
                <p className="text-[10px] text-slate-500">Classification of overall feedback</p>
              </div>

              <div className="my-6 flex flex-col items-center gap-4">
                <div className="relative w-36 h-36">
                  {/* Circle SVG */}
                  <svg width="100%" height="100%" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="55" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="18" />
                    {/* Detractors Arc (Red) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="18"
                      strokeDasharray={`${(stats.detractorsPct / 100) * 345.5} 345.5`}
                      strokeDashoffset="0"
                      transform="rotate(-90 80 80)"
                      className="transition-all duration-1000"
                    />
                    {/* Passives Arc (Yellow) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="18"
                      strokeDasharray={`${(stats.passivesPct / 100) * 345.5} 345.5`}
                      strokeDashoffset={`-${(stats.detractorsPct / 100) * 345.5}`}
                      transform="rotate(-90 80 80)"
                      className="transition-all duration-1000"
                    />
                    {/* Promoters Arc (Green) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="18"
                      strokeDasharray={`${(stats.promotersPct / 100) * 345.5} 345.5`}
                      strokeDashoffset={`-${((stats.detractorsPct + stats.passivesPct) / 100) * 345.5}`}
                      transform="rotate(-90 80 80)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-slate-800">{stats.promotersPct}%</span>
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Promoters</span>
                  </div>
                </div>

                <div className="w-full text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
                      Promoters (9-10)
                    </span>
                    <span className="font-bold text-slate-800">{stats.promotersCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block"></span>
                      Passives (7-8)
                    </span>
                    <span className="font-bold text-slate-800">{stats.passivesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                      Detractors (&lt;7)
                    </span>
                    <span className="font-bold text-slate-800">{stats.detractorsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend & Score Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-tertiary-grid">
            {/* Trend chart */}
            <div className="glass-card rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">Monthly Score Trend</h3>
              <p className="text-[10px] text-slate-500 mb-6">Average survey satisfaction score per month</p>
  
              <div className="flex gap-4 items-end justify-between h-36 pt-4 border-b border-slate-200/60">
                {Object.entries(stats.monthlyStats).map(([month, data]: any) => {
                  const score = data.count ? Number((data.sum / data.count).toFixed(2)) : 0;
                  const count = data.count;
                  
                  // Score above baseline 9.0 to zoom height
                  const baseline = 9.0;
                  const pct = Math.max(8, ((score - baseline) / 1.0) * 100);
                  const isApr = month === "Apr'26";
  
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      <span className={`text-[9px] font-extrabold transition-opacity ${isApr ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                        {score || '0.00'}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-1000 ${
                          isApr
                            ? 'bg-amber-500'
                            : score >= 9.6
                            ? 'bg-red-500'
                            : 'bg-red-500/50'
                        }`}
                        style={{ height: `${pct}px` }}
                      ></div>
                      <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{month}</span>
                      <span className="text-[8px] text-slate-600 font-bold group-hover:text-slate-900">{count} srv</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Bar height represents rating above 9.0 baseline</span>
                <span>* Jun'26 contains partial data</span>
              </div>
            </div>
  
            {/* Distribution chart */}
            <div className="glass-card rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">Score Distribution</h3>
                <p className="text-[10px] text-slate-500 mb-6">Grouping by final rounded survey score</p>
              </div>
  
              <div className="flex gap-2 items-end justify-between h-36 border-b border-slate-200/60">
                {stats.scoreDist.map((cnt: number, score: number) => {
                  if (score === 0) return null; // Ignore index 0
                  
                  // Calculate height relative to max count in distribution
                  const maxCount = Math.max(...stats.scoreDist, 1);
                  const pct = (cnt / maxCount) * 100;
                  const isPerfect = score === 10;
                  const isLow = score < 7;
  
                  return (
                    <div key={score} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <span className="text-[8px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
                        {cnt}
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-1000 ${
                          isPerfect
                            ? 'bg-green-500'
                            : isLow
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ height: `${pct}%` }}
                      ></div>
                      <span className="text-[10px] text-slate-600 font-bold">{score}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-2.5 bg-green-50 border border-green-200 rounded-lg text-[11px] text-green-800 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Perfect 10s: {stats.scoreDist[10]} surveys ( {Math.round((stats.scoreDist[10] / surveys.length) * 100)}% of total )
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: SERVICE ADVISORS ── */}
      {activeTab === 'advisors' && (
        <div className="space-y-6 animate-fade-in" id="tab-advisors">
          {/* Advisor Rankings */}
          <div className="glass-card rounded-xl overflow-hidden shadow-sm border-slate-200/40">
            <div className="p-5 border-b border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Advisor Rankings</h3>
              <p className="text-[10px] text-slate-500 mt-1">Detailed stats, sentiment mix, and weakest dimensions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider">Rank</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider">Advisor</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider text-center">Surveys</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider text-center">Avg Rating</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider text-center">Promoters</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider text-center">Passives</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider text-center">Detractors</th>
                    <th className="px-5 py-3 text-slate-600 font-bold uppercase tracking-wider">Weakest Dimension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.advisorStats.map((adv: any, idx: number) => {
                    // Find weakest param
                    let weakest = 'Customer Lounge';
                    let min = 11;
                    Object.entries(adv.params).forEach(([p, val]: any) => {
                      if (val < min) {
                        min = val;
                        weakest = p;
                      }
                    });

                    return (
                      <tr key={adv.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold">
                          <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{adv.name}</td>
                        <td className="px-5 py-3.5 text-center font-medium text-slate-600">{adv.count}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${scoreBadgeStyle(adv.avg)}`}>
                            {adv.avg.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-green-600 font-semibold">
                          {adv.promoters} <span className="text-[10px] text-slate-500">({Math.round((adv.promoters/adv.count)*100)}%)</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-amber-600 font-semibold">
                          {adv.passives} <span className="text-[10px] text-slate-500">({Math.round((adv.passives/adv.count)*100)}%)</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-red-600 font-semibold">
                          {adv.detractors} <span className="text-[10px] text-slate-500">({Math.round((adv.detractors/adv.count)*100)}%)</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-700">{weakest}</span>
                          <span className="text-slate-500 text-[10px] ml-1">({min.toFixed(2)})</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advisor Drill Down View */}
          <div className="space-y-4 border-t border-slate-200/60 pt-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Advisor Drill-Down Detail</h3>
              <p className="text-xs text-slate-500">Select an advisor to see their parameter score vs team averages</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(advisors.length > 0 ? advisors.map(a => a.name) : ['Iqtdar', 'Naeem', 'Bushra', 'Yasir', 'Moazzam']).map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedAdvisor(name)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedAdvisor === name
                      ? 'bg-red-600 text-white border-red-600 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {activeAdvisorObj && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="advisor-drilldown-details">
                {/* Parameter sliders */}
                <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {activeAdvisorObj.name}'s Parameter Scores
                    </h4>
                    <span className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 border border-slate-100 rounded">
                      Guide vertical line = TFM Team Average
                    </span>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(activeAdvisorObj.params).map(([pName, pVal]: any) => {
                      const displayName = PARAM_LABELS[pName] || pName;
                      const teamAvg = stats.paramAverages[displayName] || 9.5;
                      
                      // Normalize heights from 9.0 to 10.0 range for zoom clarity
                      const scorePct = Math.max(5, ((pVal - 9.0) / 1.0) * 100);
                      const teamPct = Math.max(5, ((teamAvg - 9.0) / 1.0) * 100);

                      const color = pVal >= 9.7 ? 'bg-green-500' : pVal >= 9.5 ? 'bg-red-500' : 'bg-amber-500';

                      return (
                        <div key={pName} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-600">{displayName}</span>
                            <span className="font-bold text-slate-950">
                              {pVal.toFixed(2)}
                              <span className="text-[10px] font-normal text-slate-500 ml-1">
                                (vs {teamAvg.toFixed(2)} team)
                              </span>
                            </span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                            <div
                              className={`h-full rounded-lg transition-all duration-1000 ${color}`}
                              style={{ width: `${scorePct}%` }}
                            ></div>
                            {/* Team Benchmark Marker */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                              style={{ left: `${teamPct}%` }}
                              title={`Team average: ${teamAvg}`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500">
                    Sliders visual baseline starts at 9.0 out of 10 for fine performance differences.
                  </div>
                </div>

                {/* Performance stats summary */}
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
                      {activeAdvisorObj.name}'s Sentiment Share
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-center">
                        <span className="text-[22px] font-extrabold block text-slate-900">
                          {activeAdvisorObj.avg.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Average Rating</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-center">
                        <span className="text-[22px] font-extrabold block text-slate-900">
                          {activeAdvisorObj.count}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Surveys</span>
                      </div>
                      <div className="bg-green-50 border border-green-200 p-3.5 rounded-lg text-center">
                        <span className="text-[22px] font-extrabold block text-green-700">
                          {Math.round((activeAdvisorObj.promoters / activeAdvisorObj.count) * 100)}%
                        </span>
                        <span className="text-[9px] text-green-700 uppercase font-semibold">Promoters</span>
                      </div>
                      <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-center">
                        <span className="text-[22px] font-extrabold block text-red-700">
                          {Math.round((activeAdvisorObj.detractors / activeAdvisorObj.count) * 100)}%
                        </span>
                        <span className="text-[9px] text-red-700 uppercase font-semibold">Detractors</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Performance Highlights
                    </h4>
                    
                    {(() => {
                      const paramsList = Object.entries(activeAdvisorObj.params).map(([k, v]) => [
                        PARAM_LABELS[k] || k,
                        v
                      ]) as [string, number][];
                      const best = [...paramsList].sort((a, b) => b[1] - a[1])[0];
                      const worst = [...paramsList].sort((a, b) => a[1] - b[1])[0];

                      return (
                        <div className="space-y-3">
                          <div className="flex gap-3 items-start p-3 bg-green-50 border-l-[4px] border-l-green-600 rounded-r-lg">
                            <span className="text-green-800 font-bold text-xs bg-green-100 border border-green-200 px-2 py-1 rounded uppercase">
                              TOP
                            </span>
                            <div>
                              <span className="font-bold text-xs block text-green-800">{best[0]}</span>
                              <p className="text-[11px] text-green-700 mt-0.5">
                                Consistently strongest performing dimension with a mean score of <strong>{best[1].toFixed(2)}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 items-start p-3 bg-amber-50 border-l-[4px] border-l-amber-600 rounded-r-lg">
                            <span className="text-amber-800 font-bold text-xs bg-amber-100 border border-amber-200 px-2 py-1 rounded uppercase">
                              GAP
                            </span>
                            <div>
                              <span className="font-bold text-xs block text-amber-800">{worst[0]}</span>
                              <p className="text-[11px] text-amber-700 mt-0.5">
                                Current primary opportunity for improvement with an average of <strong>{worst[1].toFixed(2)}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: PARAMETER ANALYSIS ── */}
      {activeTab === 'parameters' && (
        <div className="space-y-6 animate-fade-in" id="tab-parameters">
          {/* Heatmap Grid */}
          <div className="glass-card rounded-xl overflow-hidden shadow-sm border-slate-200/40">
            <div className="p-5 border-b border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Advisor × Parameter Heatmap</h3>
              <p className="text-[10px] text-slate-500 mt-1">Green indicates high score; yellow/orange indicates warning; red indicates focus gap</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                    <th className="px-4 py-3.5 text-left font-semibold">Advisor</th>
                    {HEATMAP_PARAMS.map(p => (
                      <th key={p.key} className="px-3 py-3.5" title={p.label}>{p.header}</th>
                    ))}
                    <th className="px-4 py-3.5 font-bold bg-slate-100 text-slate-800 border-l border-slate-200">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.advisorStats.map((adv: any) => (
                    <tr key={adv.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-left text-slate-800 bg-slate-50">{adv.name}</td>
                      {HEATMAP_PARAMS.map(p => {
                        const val = adv.params[p.key] || 0;
                        return (
                          <td key={p.key} className={`px-3 py-3.5 ${getHeatmapColor(val).bg} ${getHeatmapColor(val).text}`}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                      <td className={`px-4 py-3.5 font-bold bg-slate-50/50 text-slate-900 border-l border-slate-200 ${getHeatmapColor(adv.avg).text}`}>
                        {adv.avg.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Overall Team Row */}
                  <tr className="border-t border-slate-300 font-bold">
                    <td className="px-4 py-3.5 text-left text-slate-900 bg-slate-100/80 uppercase tracking-wider">Overall Average</td>
                    {HEATMAP_PARAMS.map(p => {
                      const avg = stats.paramAverages[p.label] || 0;
                      return (
                        <td key={p.key} className="px-3 py-3.5 text-slate-900 bg-slate-100/80">
                          {avg.toFixed(2)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-red-900 bg-red-50 border border-red-200 font-extrabold">{stats.overallAvg.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="parameters-low-scores">
            {/* Low Rating Frequency */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Low Rating Frequency
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">Total number of survey ratings strictly below 7</p>

              <div className="space-y-3.5">
                {[
                  { key: 'recommendLikelihood', label: 'Recommend Outlet / Dealer' },
                  { key: 'repeatVisitLikelihood', label: 'Repeat Visit Likelihood' },
                  { key: 'timelyHandover', label: 'Timely Handover Process' },
                  { key: 'advisorCourtesy', label: 'Service Advisor Courtesy' },
                  { key: 'advisorExplanation', label: 'Advisor Explanation Quality' },
                  { key: 'loungeComfort', label: 'Waiting Lounge Comfort' },
                  { key: 'repairQuality', label: 'Overall Repair Quality' },
                  { key: 'onTimeDelivery', label: 'On-Time Vehicle Delivery' },
                ].map(param => {
                  const cnt = stats.lowScoreCountByParam[param.key as keyof typeof stats.lowScoreCountByParam] || 0;
                  
                  // Simple scaling bar
                  const maxLowCount = Math.max(...(Object.values(stats.lowScoreCountByParam) as number[]), 1);
                  const widthPct = (cnt / maxLowCount) * 100;

                  return (
                    <div key={param.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{param.label}</span>
                        <span className="text-red-600 font-bold">{cnt} occurrences</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-amber-500 rounded transition-all duration-1000"
                          style={{ width: `${widthPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parameter takeaways */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">CRM Insights & Actions</h3>
                <p className="text-[10px] text-slate-500 font-medium">Analysis extracted from low-score reviews</p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-l-red-600">
                  <span className="font-bold text-red-800 block text-[11px]">Customer Lounge AC Cooling & Flies Gap</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">
                    Highest complaining focus parameter (57 detractors). Customers highlight AC shutdown during peak electricity hours, flies in the waiting room, and lack of clean disposable cups. Direct comparisons with competitor workshops.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-l-amber-600">
                  <span className="font-bold text-amber-800 block text-[11px]">On-Time Delivery Backlogs</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">
                    36 low scores. Delays are frequently linked to body & paint processes or technical backlogs during peak load days. No automatic buffer system is present.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-600">
                  <span className="font-bold text-blue-800 block text-[11px]">Careful Listening Strengths</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">
                    Only 22 low scores. Team average is 9.67. Excellent general communication skills across service advisors (especially Iqtdar with 9.82). This is a strong team benchmark to maintain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: TRENDS ── */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-fade-in" id="tab-trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="trends-charts-row">
            {/* Monthly Volume */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Monthly Survey Volume
              </h3>
              <p className="text-[10px] text-slate-500 mb-6">Total number of survey logs per operational month</p>

              <div className="flex gap-4 items-end justify-between h-40 pt-4 border-b border-slate-200">
                {Object.entries(stats.monthlyStats).map(([month, data]: any) => {
                  const cnt = data.count;
                  // scale bar height
                  const pct = Math.max(5, (cnt / 250) * 100);
                  const isApr = month === "Apr'26";

                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-extrabold ${isApr ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                        {cnt}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-1000 ${
                          isApr ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ height: `${pct}%` }}
                      ></div>
                      <span className="text-[10px] text-slate-500 font-medium">{month}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                Operational volume peaked in April 2026 with 238 surveys, which coincided with the lowest overall satisfaction rating.
              </p>
            </div>

            {/* April Anomaly Panel */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40 space-y-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>April 2026 Anomaly Analysis</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                During April 2026, the dealership recorded its absolute highest volume of surveys (238) but suffered its lowest overall monthly average score (9.42, down from 9.58).
              </p>

              <div className="space-y-3.5 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">1</span>
                  <p className="text-slate-700">
                    <strong>Capacity Constraint:</strong> High workload on advisors reduced the time spent per vehicle hand-off, creating delivery bottlenecks.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">2</span>
                  <p className="text-slate-700">
                    <strong>Climate Factors:</strong> Severe customer lounge complaints spiked as temperatures rose in Faisalabad and cooling systems were overwhelmed.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-bold">✓</span>
                  <p className="text-slate-700">
                    <strong>Full Recovery:</strong> In May 2026, the overall score bounced back to <strong>9.70</strong> (highest of all months), confirming the April drop was operational rather than structural.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Volume share by month table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-sm border-slate-200/40">
            <div className="p-5 border-b border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Advisor Survey Share by Month</h3>
              <p className="text-[10px] text-slate-500 mt-1">Relative workload share (total survey count) per advisor</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Advisor</th>
                    <th className="px-3 py-3 text-center">Aug'25</th>
                    <th className="px-3 py-3 text-center">Feb'26</th>
                    <th className="px-3 py-3 text-center">Mar'26</th>
                    <th className="px-3 py-3 text-center bg-amber-50/50">Apr'26 ⚠️</th>
                    <th className="px-3 py-3 text-center">May'26</th>
                    <th className="px-3 py-3 text-center">Jun'26</th>
                    <th className="px-5 py-3 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.advisorStats.map((adv: any) => {
                    const months = ["Aug'25", "Feb'26", "Mar'26", "Apr'26", "May'26", "Jun'26"];
                    return (
                      <tr key={adv.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800 bg-slate-50">{adv.name}</td>
                        {months.map(m => {
                           const mData = stats.monthlyStats[m];
                           const totalM = mData ? mData.count : 0;
                           
                           // Scan surveys to find counts for this advisor in this month
                           const count = surveys.filter(s => {
                             if (s.advisorName !== adv.name) return false;
                             if (m === "Aug'25" && s.timestamp.includes('2025-08')) return true;
                             if (m === "Feb'26" && s.timestamp.includes('2026-02')) return true;
                             if (m === "Mar'26" && s.timestamp.includes('2026-03')) return true;
                             if (m === "Apr'26" && s.timestamp.includes('2026-04')) return true;
                             if (m === "May'26" && s.timestamp.includes('2026-05')) return true;
                             if (m === "Jun'26" && s.timestamp.includes('2026-06')) return true;
                             return false;
                           }).length;

                           const pct = totalM > 0 ? Math.round((count / totalM) * 100) : 0;

                           return (
                             <td key={m} className={`px-3 py-3.5 text-center font-medium ${m === "Apr'26" ? 'bg-amber-50/50 font-semibold text-amber-800' : 'text-slate-600'}`}>
                               {count}
                               <span className="text-[9px] text-slate-500 font-normal ml-0.5">({pct}%)</span>
                             </td>
                           );
                        })}
                        <td className="px-5 py-3.5 text-center font-bold text-slate-800 bg-slate-50">{adv.count}</td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="px-5 py-3.5 text-slate-700 bg-slate-50">Total</td>
                    {["Aug'25", "Feb'26", "Mar'26", "Apr'26", "May'26", "Jun'26"].map(m => {
                      const totalM = stats.monthlyStats[m] ? stats.monthlyStats[m].count : 0;
                      return (
                        <td key={m} className={`px-3 py-3.5 text-center ${m === "Apr'26" ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-slate-600 bg-slate-50'}`}>
                          {totalM}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3.5 text-center text-red-700 font-extrabold bg-red-50">{surveys.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: VOC & VERBATIMS ── */}
      {activeTab === 'voc' && (
        <div className="space-y-6 animate-fade-in" id="tab-voc">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="voc-themes-row">
            {/* Complaint themes */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Top Complaint Themes
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">Recurring negative comments in text remarks</p>

              <div className="space-y-3.5 text-xs">
                {[
                  { label: 'Customer Lounge Quality (flies, AC cooling, hygiene)', count: 57, pct: 100, color: 'bg-amber-500' },
                  { label: 'On-Time delivery / late vehicle returns', count: 36, pct: 63, color: 'bg-red-500' },
                  { label: 'High parts & service pricing complaints', count: 24, pct: 42, color: 'bg-red-400' },
                  { label: 'Token waiting times and queues too long', count: 18, pct: 32, color: 'bg-slate-400' },
                  { label: 'Work quality issues (Body & Paint split paint)', count: 7, pct: 12, color: 'bg-slate-400' },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-900">{item.count} mentions</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded overflow-hidden">
                      <div className={`h-full rounded ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Positive themes */}
            <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Key Positive Themes
                </h3>
                <p className="text-[10px] text-slate-500">Loyalty triggers and strengths mentioned</p>
              </div>

              <div className="space-y-3.5 text-xs">
                {[
                  { label: 'Highly satisfied / returning customers', count: '120+ reviews', pct: 100 },
                  { label: 'Polite, cooperative & professional dealing', count: '40+ reviews', pct: 33 },
                  { label: 'Named advisors praised (especially Naeem, Akasha)', count: '12 reviews', pct: 10 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-semibold text-green-800">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 p-3.5 border border-green-200 rounded-lg text-xs leading-relaxed text-green-800">
                <span className="font-bold block text-[11px] text-green-900">Brand Loyalty Signals</span>
                Multiple customers highlighted switching to Al-Bashir from competitor workshops, visiting since 2007–2016, or traveling from far areas specifically for Al-Bashir service.
              </div>
            </div>
          </div>

          {/* Notable Verbatims */}
          <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Notable Customer Verbatims</h3>
              <p className="text-[10px] text-slate-500">High-priority feedback logs requiring management attention</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="voc-verbatim-list">
              {surveys
                .filter(s => s.remarks && getSurveyAvg(s) < 7.0)
                .slice(0, 10)
                .map((s, idx) => {
                  const sAvg = getSurveyAvg(s);
                  return (
                    <div
                      key={s.id}
                      className="bg-slate-50 border border-slate-200/60 rounded-lg p-3.5 flex gap-3 items-start hover:border-red-300 transition-colors"
                    >
                      <div className="bg-red-50 border border-red-200 px-2 py-1.5 rounded text-center text-red-700 text-xs font-black min-w-[50px] flex-shrink-0">
                        {sAvg.toFixed(1)} <span className="block text-[8px] font-normal text-red-600 uppercase">Avg</span>
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center flex-wrap gap-x-2">
                          <span className="text-xs font-bold text-slate-800">
                            {s.customerName} ({s.regNumber})
                          </span>
                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Advisor: {s.advisorName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{s.remarks}"</p>
                        <span className="text-[9px] text-slate-400 block pt-1">
                          Date: {new Date(s.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: ADMIN / RAW ENTRIES ── */}
      {activeTab === 'entries' && (
        <div className="space-y-4 animate-fade-in" id="tab-entries">
          {/* Header & Filters card */}
          <div className="glass-card rounded-xl p-5 shadow-sm border-slate-200/40 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Survey Database Admin Log</h3>
                <p className="text-[10px] text-slate-500">Search, filter, inspect, or remove individual logs to test system responsiveness</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded">
                Database Store: {filteredSurveys.length} of {surveys.length} entries shown
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search customer, registration number, remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-300 text-slate-800 placeholder-slate-400 shadow-inner"
                  id="admin-search-input"
                />
              </div>

              {/* Sentiment filter */}
              <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {[
                  { id: 'all', label: 'All Rating Classes' },
                  { id: 'promoters', label: 'Promoters (9-10)' },
                  { id: 'passives', label: 'Passives (7-8)' },
                  { id: 'detractors', label: 'Detractors (<7)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterSentiment(opt.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      filterSentiment === opt.id
                        ? 'bg-white text-slate-800 font-bold border border-slate-200/60 shadow-sm'
                        : 'text-slate-600 hover:text-slate-850'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="glass-card rounded-xl overflow-hidden shadow-sm border-slate-200/40">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" id="admin-entries-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                    <th className="px-5 py-3">Customer (Plate)</th>
                    <th className="px-5 py-3">Advisor</th>
                    {HEATMAP_PARAMS.map(p => (
                      <th key={p.key} className="px-3 py-3 text-center" title={p.label}>{p.header.replace(/^Q\d+:\s*/, '')}</th>
                    ))}
                    <th className="px-5 py-3 text-center font-bold bg-slate-100 text-slate-800 border-l border-slate-200">Avg</th>
                    <th className="px-5 py-3">VOC Remarks</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSurveys.slice(0, 100).map((s) => {
                    const avg = getSurveyAvg(s);
                    const isDeleting = deletingId === s.id;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">
                          {s.customerName}
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">{s.regNumber}</span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-600">{s.advisorName}</td>
                        {HEATMAP_PARAMS.map(p => {
                          const val = s[p.key as keyof Survey] as number || 0;
                          return (
                            <td key={p.key} className="px-3 py-3 text-center font-bold text-slate-700">{val}</td>
                          );
                        })}
                        <td className="px-5 py-3 text-center bg-slate-50 border-l border-slate-200">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${scoreBadgeStyle(avg)}`}>
                            {avg.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-[200px] truncate text-slate-600 italic" title={s.remarks}>
                          {s.remarks || '—'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDelete(s.id)}
                            className="p-1 text-red-600 hover:text-red-800 disabled:text-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete survey"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSurveys.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-5 py-8 text-center text-slate-500 font-medium">
                        No surveys found matching filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredSurveys.length > 100 && (
              <div className="bg-slate-50 p-3 text-center text-xs text-slate-500 border-t border-slate-200 font-semibold">
                Only showing the 100 latest logs in Admin view for rendering speed. All {surveys.length} records are used in dashboard summaries.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-6 animate-fade-in" id="questions-management-tab">
          <div className="glass-card rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Survey Question Catalog</h3>
                <p className="text-[11px] text-slate-500">Configure customer satisfaction indicators. Changes here dynamically update the Customer Portal and CRM metrics.</p>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setQuestionHeader('');
                  setQuestionLabel('');
                  setQuestionDesc('');
                  setIsAddingQuestion(true);
                  setQuestionError('');
                  setQuestionSuccess('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-toyota-red hover:bg-toyota-red-dark text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Indicator
              </button>
            </div>

            {questionSuccess && (
              <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                {questionSuccess}
              </div>
            )}

            {questionError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {questionError}
              </div>
            )}

            {/* Questions Table/Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-slate-200/60 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Question #{idx + 1} ({q.id})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setQuestionHeader(q.header);
                            setQuestionLabel(q.label);
                            setQuestionDesc(q.desc);
                            setIsAddingQuestion(false);
                            setQuestionError('');
                            setQuestionSuccess('');
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit Question"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-500 hover:text-toyota-red transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 flex items-baseline gap-2">
                      <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                        {q.header}
                      </span>
                      <span>{q.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {q.desc || <span className="italic text-slate-400">No descriptive guideline text provided.</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide-over or persistent Modal/Card for Add/Edit */}
          {(isAddingQuestion || editingQuestion) && (
            <div className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {isAddingQuestion ? 'Add New Survey Question' : 'Edit Question Details'}
                </h4>
                <button
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setEditingQuestion(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Short Header <span className="text-toyota-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={questionHeader}
                      onChange={(e) => setQuestionHeader(e.target.value)}
                      placeholder="e.g. Q1: Rec Outlet"
                      className="w-full p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                    />
                    <p className="text-[10px] text-slate-400">Used for column headings & charts.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Full Question Label <span className="text-toyota-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={questionLabel}
                      onChange={(e) => setQuestionLabel(e.target.value)}
                      placeholder="e.g. Recommend Outlet / Dealer"
                      className="w-full p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                    />
                    <p className="text-[10px] text-slate-400">The primary prompt shown to customers.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Description / Guideline Text
                  </label>
                  <textarea
                    value={questionDesc}
                    onChange={(e) => setQuestionDesc(e.target.value)}
                    placeholder="e.g. How likely is it that you would recommend our outlet/dealer to family or friends?"
                    className="w-full h-20 p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                  />
                  <p className="text-[10px] text-slate-400">Displays underneath the parameter slider to clarify meaning.</p>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingQuestion(false);
                      setEditingQuestion(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-toyota-red hover:bg-toyota-red-dark text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {isAddingQuestion ? 'Add Indicator' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage_advisors' && (
        <div className="space-y-6 animate-fade-in" id="advisors-management-tab">
          <div className="glass-card rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Al-Bashir Group Service Advisors</h3>
                <p className="text-[11px] text-slate-500">Configure active Service Advisors on the CRM Dashboard and Customer Portal dropdown dynamically.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingAdvisor(prev => !prev);
                  setAdvisorError('');
                  setAdvisorSuccess('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-toyota-red hover:bg-toyota-red-dark text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Advisor
              </button>
            </div>

            {advisorSuccess && (
              <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                {advisorSuccess}
              </div>
            )}

            {advisorError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {advisorError}
              </div>
            )}

            {/* Add Advisor Form */}
            {isAddingAdvisor && (
              <form onSubmit={handleAdvisorSubmit} className="mb-6 p-4 border border-slate-200/60 rounded-xl bg-slate-50/50 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Service Advisor Name <span className="text-toyota-red">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newAdvisorName}
                      onChange={(e) => setNewAdvisorName(e.target.value)}
                      placeholder="e.g. Iqtdar, Naeem, Bushra, etc."
                      className="flex-1 p-2.5 text-xs text-slate-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-toyota-red"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-toyota-red hover:bg-toyota-red-dark text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Save Advisor
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAdvisor(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Advisors list grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {advisors.map((adv) => (
                <div key={adv.name} className="p-4 border border-slate-200/60 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-toyota-red font-bold text-xs">
                      {adv.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{adv.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Advisor</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAdvisor(adv.name)}
                    className="p-1.5 text-slate-400 hover:text-toyota-red hover:bg-slate-100 rounded transition-colors"
                    title="Remove Advisor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {advisors.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 font-medium">
                  No registered advisors in system.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
