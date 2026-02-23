import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Download, TrendingUp, MessageCircle, Heart, Brain, ChevronLeft, Sparkles } from 'lucide-react';

const ResultsPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchEvaluation();
  }, [interviewId]);

  const fetchEvaluation = async () => {
    try {
      const response = await api.get(`/interviews/${interviewId}/evaluation`);
      setEvaluation(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        // Try to generate evaluation if not found
        try {
          const evalResponse = await api.post(`/interviews/${interviewId}/evaluate`);
          setEvaluation(evalResponse.data);
        } catch (evalError) {
          toast.error('Failed to generate evaluation');
          navigate('/dashboard');
        }
      } else {
        toast.error('Failed to load results');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/interviews/${interviewId}/report`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindhire_report_${interviewId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded!');
    } catch (error) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lilac-500"></div>
            <p className="mt-4 text-lilac-700 font-heading">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  return (
    <div className="min-h-screen bg-bone" data-testid="results-page">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-8 text-lilac-700 hover:text-lilac-900"
          data-testid="back-to-dashboard-button"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-lilac-500 to-lilac-600 rounded-3xl mb-6 shadow-medium">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-lilac-900 mb-4">
            Interview Results
          </h1>
          <p className="text-lg text-lilac-700">Here's your AI-powered assessment</p>
        </div>

        {/* Overall Score */}
        <div className="mb-12">
          <div className={`bg-gradient-to-r ${getScoreBg(evaluation.overall_score)} rounded-3xl p-12 text-center shadow-medium`}>
            <p className="text-white/90 text-lg font-semibold mb-2">Overall Performance</p>
            <h2 className="text-7xl font-heading font-bold text-white mb-2" data-testid="overall-score">
              {evaluation.overall_score.toFixed(0)}
            </h2>
            <p className="text-white/90 text-xl">out of 100</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft" data-testid="technical-score-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-lilac-100 p-3 rounded-2xl">
                <Brain className="h-6 w-6 text-lilac-600" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-lilac-900">Technical Skills</h3>
            </div>
            <p className={`text-5xl font-heading font-bold ${getScoreColor(evaluation.technical_score)} mb-2`}>
              {evaluation.technical_score.toFixed(0)}
            </p>
            <p className="text-sm text-lilac-600">Problem-solving & Knowledge</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft" data-testid="communication-score-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-lilac-900">Communication</h3>
            </div>
            <p className={`text-5xl font-heading font-bold ${getScoreColor(evaluation.communication_score)} mb-2`}>
              {evaluation.communication_score.toFixed(0)}
            </p>
            <p className="text-sm text-lilac-600">Clarity & Structure</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft" data-testid="emotional-score-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-100 p-3 rounded-2xl">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-lilac-900">Emotional Stability</h3>
            </div>
            <p className={`text-5xl font-heading font-bold ${getScoreColor(evaluation.emotional_stability_score)} mb-2`}>
              {evaluation.emotional_stability_score.toFixed(0)}
            </p>
            <p className="text-sm text-lilac-600">Composure & Confidence</p>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft">
            <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              Key Strengths
            </h3>
            <ul className="space-y-4" data-testid="strengths-list">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-emerald-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-lilac-800 leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft">
            <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-600" />
              Areas for Improvement
            </h3>
            <ul className="space-y-4" data-testid="improvements-list">
              {evaluation.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-amber-100 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  </div>
                  <span className="text-lilac-800 leading-relaxed">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Psychological Profile */}
        <div className="bg-gradient-to-br from-lilac-100 to-lilac-200 rounded-3xl p-8 shadow-soft mb-12">
          <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6">Psychological Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-lilac-700 mb-2">Overall Sentiment</p>
              <p className="text-xl font-heading capitalize text-lilac-900" data-testid="sentiment-analysis">
                {evaluation.sentiment_analysis}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-lilac-700 mb-2">Stress Indicators Detected</p>
              <p className="text-xl font-heading text-lilac-900" data-testid="stress-markers-count">
                {evaluation.stress_markers.length} marker{evaluation.stress_markers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="mt-6 bg-white/50 rounded-2xl p-4">
            <p className="text-xs text-lilac-700 italic">
              ⚠️ Note: This is an AI-generated assessment and should not be considered as a clinical psychological diagnosis. It is intended for recruitment and talent assessment purposes only.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={downloadReport}
            disabled={downloading}
            className="bg-gradient-to-r from-lilac-500 to-lilac-600 text-white px-8 py-6 rounded-full text-lg font-semibold hover:shadow-glow transition-all"
            data-testid="download-report-button"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download PDF Report
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="border-2 border-lilac-300 text-lilac-700 hover:bg-lilac-50 px-8 py-6 rounded-full text-lg font-semibold transition-all"
            data-testid="return-dashboard-button"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;