import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password, name);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-lilac-50 via-bone to-lilac-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lilac-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-lilac-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-lilac-500 to-lilac-700 rounded-3xl mb-6 shadow-medium">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-lilac-900 mb-3" data-testid="auth-title">
            MindHire AI
          </h1>
          <p className="text-lg text-lilac-700">Your AI-Powered Interview Partner</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-medium border border-lilac-100 p-8">
          <div className="flex gap-2 mb-8" data-testid="auth-toggle">
            <Button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-xl transition-all ${
                isLogin
                  ? 'bg-lilac-500 text-white hover:bg-lilac-600 shadow-soft'
                  : 'bg-transparent text-lilac-700 hover:bg-lilac-50 border border-lilac-200'
              }`}
              data-testid="login-tab"
            >
              Login
            </Button>
            <Button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-xl transition-all ${
                !isLogin
                  ? 'bg-lilac-500 text-white hover:bg-lilac-600 shadow-soft'
                  : 'bg-transparent text-lilac-700 hover:bg-lilac-50 border border-lilac-200'
              }`}
              data-testid="register-tab"
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="auth-form">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-lilac-900 font-semibold mb-2 block">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-lilac-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="pl-12 h-12 rounded-xl border-lilac-200 bg-white focus:ring-2 focus:ring-lilac-400 focus:border-transparent"
                    data-testid="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-lilac-900 font-semibold mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-lilac-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 rounded-xl border-lilac-200 bg-white focus:ring-2 focus:ring-lilac-400 focus:border-transparent"
                  data-testid="auth-email-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-lilac-900 font-semibold mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-lilac-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-12 h-12 rounded-xl border-lilac-200 bg-white focus:ring-2 focus:ring-lilac-400 focus:border-transparent"
                  data-testid="auth-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-lilac-500 to-lilac-600 text-white rounded-xl font-semibold hover:shadow-glow transition-all disabled:opacity-50"
              data-testid="auth-submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Please wait...</span>
                </div>
              ) : isLogin ? (
                'Login to Continue'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-lilac-600 mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-lilac-700 font-semibold hover:text-lilac-900 transition-colors"
              data-testid="auth-switch-link"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;