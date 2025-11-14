import React, { useState, useEffect } from 'react';
import { User, Building2, Lock, Mail, Eye, EyeOff, Upload, Calendar, Clock, FileText, Download, CheckCircle, XCircle, LogOut, Shield, AlertCircle, Loader, Link2, RefreshCw, Key } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://exam-blockchain-system.onrender.com/api';

export default function ExamSystem() {
  const [currentView, setCurrentView] = useState('login');
  const [userType, setUserType] = useState('examiner');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  
  // OTP and Password Reset
  const [otpCode, setOtpCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    name: '',
    centerId: ''
  });

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      setUserType(userData.userType);
      setCurrentView('dashboard');
      loadFiles();
    }
  }, [token]);

  // Password strength checker
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength++;
      if (/[a-z]/.test(formData.password)) strength++;
      if (/[A-Z]/.test(formData.password)) strength++;
      if (/\d/.test(formData.password)) strength++;
      if (/[@$!%*?&]/.test(formData.password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return { text: '', color: '' };
    if (passwordStrength <= 2) return { text: 'Weak', color: 'text-red-600' };
    if (passwordStrength <= 3) return { text: 'Medium', color: 'text-yellow-600' };
    if (passwordStrength <= 4) return { text: 'Good', color: 'text-blue-600' };
    return { text: 'Strong', color: 'text-green-600' };
  };

  const getPasswordStrengthBar = () => {
    const percentage = (passwordStrength / 5) * 100;
    let bgColor = 'bg-red-500';
    if (passwordStrength > 3) bgColor = 'bg-green-500';
    else if (passwordStrength > 2) bgColor = 'bg-yellow-500';
    
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
        <div 
          className={`h-full ${bgColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const apiCall = async (endpoint, method = 'GET', body = null, isFormData = false) => {
    const headers = {};
    const currentToken = token || localStorage.getItem('token');
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    if (!isFormData && body) {
      headers['Content-Type'] = 'application/json';
    }

    const config = { method, headers };
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (data.requiresVerification) {
            setCurrentView('verify-otp');
            setResetEmail(data.email);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken('');
            setUser(null);
            setCurrentView('login');
          }
        }
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    if (passwordStrength < 4) {
      setError('Please use a stronger password (at least Good strength)');
      setLoading(false);
      return;
    }

    try {
      const data = await apiCall('/auth/register', 'POST', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType,
        centerId: userType === 'center' ? formData.centerId : undefined
      });

      setResetEmail(formData.email);
      setSuccess(data.message);
      setCurrentView('verify-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/verify-email', 'POST', {
        email: resetEmail,
        otp: otpCode
      });

      setSuccess(data.message);
      setTimeout(() => {
        setCurrentView('login');
        setOtpCode('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/resend-otp', 'POST', {
        email: resetEmail
      });
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/login', 'POST', {
        email: formData.email,
        password: formData.password,
        userType
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentView('dashboard');
      await loadFiles();
      setSuccess('Login successful!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/forgot-password', 'POST', {
        email: resetEmail
      });
      setSuccess(data.message);
      setCurrentView('reset-password');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await apiCall('/auth/reset-password', 'POST', {
        email: resetEmail,
        otp: resetOtp,
        newPassword
      });

      setSuccess(data.message);
      setTimeout(() => {
        setCurrentView('login');
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('login');
    setUploadedFiles([]);
    setFormData({ email: '', password: '', name: '', centerId: '' });
  };

  const loadFiles = async () => {
    try {
      const endpoint = userType === 'examiner' ? '/examiner/files' : '/center/files';
      const files = await apiCall(endpoint);
      setUploadedFiles(files);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setShowUploadModal(true);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setExamDate(tomorrow.toISOString().split('T')[0]);
    setExamTime('10:00');
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !examDate || !examTime) {
      setError('Please select date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('examDate', examDate);
      formData.append('examTime', examTime);

      await apiCall('/examiner/upload', 'POST', formData, true);
      setSuccess('File uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setExamDate('');
      setExamTime('');
      await loadFiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to encrypt this file? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentToken = token || localStorage.getItem('token');
      
      if (!currentToken) {
        setError('Session expired. Please login again.');
        handleLogout();
        return;
      }

      const response = await fetch(`${API_URL}/examiner/encrypt/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Encryption failed');
      }

      setSuccess('File encrypted and added to blockchain!');
      await loadFiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (fileId, filename) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/center/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('File downloaded successfully!');
      await loadFiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewBlockchain = async () => {
    setLoading(true);
    setError('');
    try {
      const chain = await apiCall('/blockchain/chain');
      const verification = await apiCall('/blockchain/verify');
      setBlockchainInfo({ chain, verification });
      setCurrentView('blockchain');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatDateTime = (dateString) => new Date(dateString).toLocaleString();
  const formatFileSize = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  // OTP VERIFICATION VIEW
  if (currentView === 'verify-otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
            <p className="text-gray-600">Enter the 6-digit code sent to</p>
            <p className="text-indigo-600 font-semibold">{resetEmail}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-bold"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Verify Email
              </button>

              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </button>

              <button
                onClick={() => setCurrentView('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORGOT PASSWORD VIEW
  if (currentView === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">Enter your email to receive a reset code</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Send Reset Code
              </button>

              <button
                onClick={() => setCurrentView('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESET PASSWORD VIEW
  if (currentView === 'reset-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter the code and your new password</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code</label>
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-xl tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Reset Password
              </button>

              <button
                onClick={() => setCurrentView('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN/REGISTER VIEW
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Portal</h1>
            <p className="text-gray-600">{currentView === 'login' ? 'Sign in to access your dashboard' : 'Create your account'}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setUserType('examiner')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  userType === 'examiner'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                Examiner
              </button>
              <button
                onClick={() => setUserType('center')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  userType === 'center'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Exam Center
              </button>
            </div>

            <div className="space-y-5">
              {currentView === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              )}

              {currentView === 'register' && userType === 'center' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center ID *</label>
                  <input
                    type="text"
                    value={formData.centerId}
                    onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                    placeholder="Enter center ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ?'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {currentView === 'register' && formData.password && (
                  <div className="mt-2">
                    {getPasswordStrengthBar()}
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-sm font-medium ${getPasswordStrengthText().color}`}>
                        {getPasswordStrengthText().text}
                      </span>
                      <span className="text-xs text-gray-500">
                        {passwordStrength}/5
                      </span>
                    </div>
                  </div>
                )}
                
                {currentView === 'register' && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p className="flex items-center gap-1">
                      <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        {formData.password.length >= 8 ? '✓' : '○'}
                      </span>
                      At least 8 characters
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[a-z]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      One lowercase letter
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      One uppercase letter
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        {/\d/.test(formData.password) ? '✓' : '○'}
                      </span>
                      One number
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[@$!%*?&]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      One special character (@$!%*?&)
                    </p>
                  </div>
                )}
              </div>

              {currentView === 'login' && (
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => {
                      setCurrentView('forgot-password');
                      setResetEmail(formData.email);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                onClick={currentView === 'login' ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {currentView === 'login' ? 'Sign In' : 'Register'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {currentView === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => {
                    setCurrentView(currentView === 'login' ? 'register' : 'login');
                    setError('');
                    setSuccess('');
                    setFormData({ email: '', password: '', name: '', centerId: '' });
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {currentView === 'login' ? 'Register here' : 'Login here'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BLOCKCHAIN VIEW (Keep existing code)
  if (currentView === 'blockchain') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Blockchain Explorer</h1>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {blockchainInfo && (
            <>
              <div className={`mb-6 p-4 rounded-xl ${blockchainInfo.verification.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {blockchainInfo.verification.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${blockchainInfo.verification.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {blockchainInfo.verification.valid ? 'Blockchain is Valid' : 'Blockchain is Invalid'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${blockchainInfo.verification.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {blockchainInfo.verification.message || blockchainInfo.verification.error}
                </p>
              </div>

              <div className="space-y-4">
                {blockchainInfo.chain.map((block) => (
                  <div key={block._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Block #{block.index}</h3>
                        <p className="text-sm text-gray-500">{formatDateTime(block.timestamp)}</p>
                      </div>
                      <div className="text-xs font-mono bg-gray-100 px-3 py-1 rounded">
                        Nonce: {block.nonce}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Action:</span>
                        <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          {block.data.action}
                        </span>
                      </div>
                      {block.data.filename && (
                        <div>
                          <span className="font-medium text-gray-700">File:</span>
                          <span className="ml-2 text-gray-600">{block.data.filename}</span>
                        </div>
                      )}
                      {block.data.performedBy && (
                        <div>
                          <span className="font-medium text-gray-700">Performed By:</span>
                          <span className="ml-2 text-gray-600">{block.data.performedBy}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Hash:</span>
                        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <code className="text-xs text-indigo-700 break-all block font-mono">
                            {block.hash}
                          </code>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Previous Hash:</span>
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <code className="text-xs text-gray-600 break-all block font-mono">
                            {block.previousHash}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // EXAMINER DASHBOARD (Keep existing code - same as before)
  if (currentView === 'dashboard' && userType === 'examiner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Schedule Exam</h3>
              <p className="text-gray-600 mb-6">Selected file: <span className="font-semibold">{selectedFile?.name}</span></p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Exam Time
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={loading || !examDate || !examTime}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Examiner Dashboard
                </h1>
                <p className="text-sm text-gray-600 font-medium">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={viewBlockchain}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                Blockchain
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Success</h3>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              Upload Exam Files
            </h2>
            <p className="text-gray-600 mb-6">Select your exam paper and schedule the exam date and time</p>
            <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">Click to upload exam file</p>
              <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX (Max 10MB)</p>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                disabled={loading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Choose File'}
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                Uploaded Files
                <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-base font-semibold">
                  {uploadedFiles.length}
                </span>
              </h2>
            </div>
            <div className="space-y-4">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No files uploaded yet</p>
                  <p className="text-gray-400 text-sm mt-2">Upload your first exam file to get started</p>
                </div>
              ) : (
                uploadedFiles.map(file => (
                  <div key={file._id} className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            file.encrypted ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <FileText className={`w-6 h-6 ${file.encrypted ? 'text-green-600' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{file.originalName}</h3>
                            <p className="text-sm text-gray-500">Size: {formatFileSize(file.fileSize)}</p>
                            <p className="text-xs text-gray-400">Uploaded: {formatDateTime(file.uploadedAt)}</p>
                          </div>
                        </div>
                      </div>
                      {file.encrypted ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold shadow-sm">
                          <Shield className="w-5 h-5" />
                          Encrypted
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold shadow-sm">
                          <AlertCircle className="w-5 h-5" />
                          Not Encrypted
                        </div>
                      )}
                    </div>

                    {file.encrypted ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm bg-gray-50 px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{formatDate(file.examDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-medium">{file.examTime}</span>
                          </div>
                        </div>
                        {file.blockchainHash && (
                          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Link2 className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">Blockchain Hash</span>
                            </div>
                            <code className="text-xs font-mono text-indigo-700 break-all block">
                              {file.blockchainHash}
                            </code>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEncryptFile(file._id)}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading && <Loader className="w-4 h-4 animate-spin" />}
                        {loading ? 'Encrypting...' : 'Encrypt & Lock File'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EXAM CENTER DASHBOARD (Keep existing code from previous version)
  if (currentView === 'dashboard' && userType === 'center') {
    const today = new Date().toISOString().split('T')[0];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Exam Center Dashboard
                </h1>
                <p className="text-sm text-gray-600 font-medium">{user?.name} • {user?.centerId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={viewBlockchain}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                Blockchain
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Success</h3>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Today's Date</p>
                <p className="text-3xl font-bold text-blue-900">{formatDate(today)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                Exam Files
                <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-base font-semibold">
                  {uploadedFiles.length}
                </span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No exam files available</p>
                  <p className="text-gray-400 text-sm mt-2">Files will appear here when examiners upload them</p>
                </div>
              ) : (
                uploadedFiles.map(file => {
                  const fileDate = new Date(file.examDate).toISOString().split('T')[0];
                  const isAccessible = fileDate === today || file.isAccessible;
                  
                  return (
                    <div 
                      key={file._id} 
                      className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
                        isAccessible 
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isAccessible ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <FileText className={`w-6 h-6 ${isAccessible ? 'text-green-600' : 'text-gray-500'}`} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{file.originalName}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-3 ml-15">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium">{formatDate(file.examDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium">{file.examTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="font-medium">{formatFileSize(file.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          {isAccessible ? (
                            <>
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold shadow-sm">
                                <CheckCircle className="w-5 h-5" />
                                Available Now
                              </div>
                              <button 
                                onClick={() => handleDownloadFile(file._id, file.originalName)}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Download className="w-5 h-5" />
                                {loading ? 'Downloading...' : 'Download File'}
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold shadow-sm">
                              <XCircle className="w-5 h-5" />
                              Locked
                            </div>
                          )}
                        </div>
                      </div>
                      {!isAccessible && (
                        <div className="flex items-start gap-3 text-sm bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl mt-4">
                          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900">File Locked Until Exam Date</p>
                            <p className="text-amber-700 mt-1">
                              This file will automatically become available on <strong>{formatDate(file.examDate)}</strong> at <strong>{file.examTime}</strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}