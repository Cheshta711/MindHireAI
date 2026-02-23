import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Brain, Send, CheckCircle, Loader2 } from 'lucide-react';

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/interviews/${interviewId}`);
      setInterview(response.data);

      if (response.data.interview.status === 'completed' || response.data.interview.status === 'evaluated') {
        navigate(`/interview/${interviewId}/results`);
        return;
      }

      await fetchNextQuestion();
    } catch (error) {
      toast.error('Failed to load interview');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    try {
      const response = await api.get(`/interviews/${interviewId}/next-question`);
      setCurrentQuestion(response.data);
      setAnswer('');
    } catch (error) {
      if (error.response?.status === 400) {
        navigate(`/interview/${interviewId}/results`);
      } else {
        toast.error('Failed to load question');
      }
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/interviews/${interviewId}/answers`, {
        question_id: currentQuestion.id,
        answer_text: answer
      });

      toast.success('Answer submitted!');

      // Check if interview is complete
      const interviewResponse = await api.get(`/interviews/${interviewId}`);
      const updatedInterview = interviewResponse.data;

      if (updatedInterview.interview.status === 'completed') {
        toast.success('Interview completed! Generating evaluation...');
        await api.post(`/interviews/${interviewId}/evaluate`);
        navigate(`/interview/${interviewId}/results`);
      } else {
        await fetchNextQuestion();
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lilac-500"></div>
            <p className="mt-4 text-lilac-700 font-heading">Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestion.question_number) / interview.interview.total_questions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lilac-50 via-bone to-lilac-100" data-testid="interview-page">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-lilac-700" data-testid="interview-progress-text">
              Question {currentQuestion.question_number} of {interview.interview.total_questions}
            </p>
            <p className="text-sm font-semibold text-lilac-700">{Math.round(progress)}%</p>
          </div>
          <div className="w-full bg-lilac-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-lilac-500 to-lilac-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              data-testid="interview-progress-bar"
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-12 shadow-medium border border-lilac-100 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gradient-to-br from-lilac-500 to-lilac-600 p-4 rounded-2xl flex-shrink-0">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-heading font-semibold text-lilac-900 leading-relaxed" data-testid="interview-question">
                {currentQuestion.question_text}
              </h2>
            </div>
          </div>

          <div className="bg-lilac-50 rounded-2xl p-6 mb-8">
            <p className="text-sm text-lilac-700 leading-relaxed">
              💡 <strong>Tip:</strong> Take your time to think through your answer. Focus on clarity, structure, and demonstrating your understanding of the concept.
            </p>
          </div>

          {/* Answer Input */}
          <div>
            <label className="block text-lg font-semibold text-lilac-900 mb-3">
              Your Answer
            </label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here... Be clear and concise."
              rows={8}
              className="w-full rounded-2xl border-lilac-200 bg-white focus:ring-2 focus:ring-lilac-400 focus:border-transparent p-6 text-base resize-none"
              disabled={submitting}
              data-testid="interview-answer-textarea"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={submitAnswer}
            disabled={submitting || !answer.trim()}
            className="bg-gradient-to-r from-lilac-500 to-lilac-600 text-white px-8 py-6 rounded-full text-lg font-semibold hover:shadow-glow transition-all disabled:opacity-50"
            data-testid="interview-submit-button"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : currentQuestion.question_number === interview.interview.total_questions ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Submit & Finish
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;