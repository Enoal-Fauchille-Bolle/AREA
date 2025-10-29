import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../services/api';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error when user types
    if (error) setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const verificationCode = code.join('');
      
      if (verificationCode.length !== 6) {
        throw new Error('Please enter the complete 6-digit code');
      }

      if (!email) {
        throw new Error('Email address not found. Please register again.');
      }

      await authApi.verifyEmail({
        email,
        code: verificationCode,
      });

      setSuccess('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Verification failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      if (!email) {
        throw new Error('Email address not found. Please register again.');
      }

      await authApi.resendVerification({ email });
      setSuccess('Verification code sent! Please check your email.');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resend code. Please try again.',
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-black mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to
            <br />
            <span className="font-bold text-black">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.some((d) => !d)}
            className="w-full bg-black text-white py-4 rounded-lg text-lg font-black hover:bg-gray-800 hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600 text-sm">Didn't receive the code?</p>
          <button
            onClick={handleResendCode}
            disabled={isResending || isLoading}
            className="text-black font-bold hover:underline transition-all duration-300 hover:scale-105 transform inline-block disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleBackToLogin}
            disabled={isLoading}
            className="text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
