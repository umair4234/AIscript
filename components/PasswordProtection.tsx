import React, { useState } from 'react';

interface PasswordProtectionProps {
  onSuccess: () => void;
}

const CORRECT_PASSWORD = 'UmairGpt';

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50">
      <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-sm border border-gray-700">
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">Protected Access</h1>
        <p className="text-on-surface-secondary mb-6 text-center text-sm">Please enter the password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-brand-bg border border-gray-600 rounded-md p-3 text-on-surface focus:ring-primary focus:border-primary text-center"
              placeholder="••••••••"
              required
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>
          {error && <p id="password-error" className="text-error text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity disabled:bg-gray-600"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordProtection;
