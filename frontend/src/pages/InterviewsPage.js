import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Plus, Calendar, Trophy, Brain, ChevronRight } from 'lucide-react';

const InterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/interviews');
      setInterviews(response.data);
    } catch (error) {
      toast.error('Failed to load interviews');
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

  const getStatusBadge = (status) => {
    const styles = {
      in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      evaluated: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    const labels = {
      in_progress: 'In Progress',
      completed: 'Completed',
      evaluated: 'Evaluated'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lilac-500"></div>
            <p className="mt-4 text-lilac-700 font-heading">Loading interviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone" data-testid="interviews-page">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-lilac-900 mb-3">
              My Interviews
            </h1>
            <p className="text-lg text-lilac-700">Track your progress and review past assessments</p>
          </div>
          <Button
            onClick={startInterview}
            className="bg-gradient-to-r from-lilac-500 to-lilac-600 text-white px-6 py-6 rounded-full font-semibold hover:shadow-glow transition-all"
            data-testid="start-new-interview-button"
          >
            <Plus className="mr-2 h-5 w-5" />
            Start New Interview
          </Button>
        </div>

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-16 text-center shadow-soft">
            <Brain className="h-20 w-20 text-lilac-300 mx-auto mb-6" />
            <h3 className="text-2xl font-heading font-semibold text-lilac-900 mb-3">
              No Interviews Yet
            </h3>
            <p className="text-lilac-700 mb-8">Start your first AI-powered interview to showcase your skills!</p>
            <Button
              onClick={startInterview}
              className="bg-gradient-to-r from-lilac-500 to-lilac-600 text-white px-8 py-6 rounded-full font-semibold hover:shadow-glow transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="interviews-list">
            {interviews.map((interview) => (
              <div
                key={interview.interview.id}
                className="bg-white/80 backdrop-blur-sm border border-lilac-100 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all"
                data-testid={`interview-card-${interview.interview.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-heading font-semibold text-lilac-900">
                        Interview #{interview.interview.id.slice(0, 8)}
                      </h3>
                      {getStatusBadge(interview.interview.status)}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-lilac-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(interview.interview.started_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        <span>
                          {interview.questions_answered} / {interview.interview.total_questions} questions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {interview.evaluation && (
                      <div className="bg-gradient-to-br from-lilac-500 to-lilac-600 rounded-2xl p-6 text-center min-w-[120px]">
                        <Trophy className="h-5 w-5 text-white mx-auto mb-2" />
                        <p className="text-3xl font-heading font-bold text-white">
                          {interview.evaluation.overall_score.toFixed(0)}
                        </p>
                        <p className="text-xs text-lilac-100">Overall Score</p>
                      </div>
                    )}

                    {interview.interview.status === 'in_progress' ? (
                      <Button
                        onClick={() => navigate(`/interview/${interview.interview.id}`)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-semibold transition-all"
                        data-testid={`continue-interview-${interview.interview.id}`}
                      >
                        Continue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(`/interview/${interview.interview.id}/results`)}
                        className="bg-lilac-500 hover:bg-lilac-600 text-white px-6 py-3 rounded-full font-semibold transition-all"
                        data-testid={`view-results-${interview.interview.id}`}
                      >
                        View Results
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewsPage;