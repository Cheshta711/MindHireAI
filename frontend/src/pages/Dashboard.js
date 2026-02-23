import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Brain, TrendingUp, Clock, Award, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, interviewsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/interviews')
      ]);
      setStats(statsRes.data);
      setInterviews(interviewsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    try {
      const response = await api.post('/interviews');
      toast.success('Interview started!');
      navigate(`/interview/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to start interview');
    }
  };

  // Chart data
  const scoreData = interviews
    .filter(i => i.evaluation)
    .slice(-5)
    .map((interview, index) => ({
      name: `Interview ${index + 1}`,
      Technical: interview.evaluation.technical_score,
      Communication: interview.evaluation.communication_score,
      Emotional: interview.evaluation.emotional_stability_score
    }));

  const overallScoreData = interviews
    .filter(i => i.evaluation)
    .slice(-6)
    .map((interview, index) => ({
      name: `#${index + 1}`,
      Score: interview.evaluation.overall_score
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lilac-500"></div>
            <p className="mt-4 text-lilac-700 font-heading">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone" data-testid="dashboard-page">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-lilac-900 mb-4" data-testid="dashboard-welcome">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg md:text-xl text-lilac-700 leading-relaxed">
            Ready to showcase your skills? Start a new AI-powered interview session.
          </p>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1" data-testid="stat-total-interviews">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-lilac-100 p-3 rounded-2xl">
                <Brain className="h-6 w-6 text-lilac-600" />
              </div>
            </div>
            <h3 className="text-3xl font-heading font-bold text-lilac-900 mb-1">
              {stats?.total_interviews || 0}
            </h3>
            <p className="text-sm text-lilac-600">Total Interviews</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1" data-testid="stat-completed-interviews">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-3xl font-heading font-bold text-lilac-900 mb-1">
              {stats?.completed_interviews || 0}
            </h3>
            <p className="text-sm text-lilac-600">Completed</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1" data-testid="stat-in-progress">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-2xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-3xl font-heading font-bold text-lilac-900 mb-1">
              {stats?.in_progress_interviews || 0}
            </h3>
            <p className="text-sm text-lilac-600">In Progress</p>
          </div>

          <div className="bg-gradient-to-br from-lilac-500 to-lilac-600 rounded-3xl p-8 shadow-medium hover:shadow-glow transition-all hover:-translate-y-1" data-testid="stat-average-score">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-heading font-bold text-white mb-1">
              {stats?.average_overall_score?.toFixed(1) || 'N/A'}
            </h3>
            <p className="text-sm text-lilac-100">Average Score</p>
          </div>
        </div>

        {/* Start Interview CTA */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-lilac-500 via-lilac-600 to-lilac-700 rounded-3xl p-12 text-center shadow-medium relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                Ready for Your Next Challenge?
              </h2>
              <p className="text-lg text-lilac-100 mb-8 max-w-2xl mx-auto">
                Our AI will assess your technical skills, communication, and emotional stability through a series of Computer Science questions.
              </p>
              <Button
                onClick={startInterview}
                className="bg-white text-lilac-700 hover:bg-lilac-50 font-semibold px-8 py-6 rounded-full text-lg shadow-soft hover:shadow-glow transition-all"
                data-testid="start-interview-button"
              >
                Start New Interview
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        {scoreData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft">
              <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6">Performance Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                  <XAxis dataKey="name" stroke="#7e22ce" />
                  <YAxis stroke="#7e22ce" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e9d5ff',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="Technical" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Communication" fill="#34d399" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Emotional" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft">
              <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6">Score Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overallScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                  <XAxis dataKey="name" stroke="#7e22ce" />
                  <YAxis stroke="#7e22ce" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e9d5ff',
                      borderRadius: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Score"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft">
          <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-6">Recent Interviews</h3>
          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-lilac-300 mx-auto mb-4" />
              <p className="text-lilac-600">No interviews yet. Start your first one!</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="interview-history">
              {interviews.slice(0, 5).map((interview) => (
                <div
                  key={interview.interview.id}
                  className="flex items-center justify-between p-6 bg-white rounded-2xl border border-lilac-100 hover:shadow-soft transition-all"
                  data-testid={`interview-item-${interview.interview.id}`}
                >
                  <div>
                    <p className="font-semibold text-lilac-900">
                      Interview #{interview.interview.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-lilac-600">
                      {new Date(interview.interview.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {interview.evaluation && (
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-lilac-700">
                          {interview.evaluation.overall_score.toFixed(0)}
                        </p>
                        <p className="text-xs text-lilac-600">Overall Score</p>
                      </div>
                    )}
                    <Button
                      onClick={() => navigate(`/interview/${interview.interview.id}/results`)}
                      variant="ghost"
                      size="sm"
                      className="text-lilac-700 hover:text-lilac-900"
                      data-testid={`view-results-${interview.interview.id}`}
                    >
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;