import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(
        formData.email,
        formData.password,
        showTwoFactor ? formData.twoFactorCode : null
      );

      if (result.requiresTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      // Login successful, redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Agency CRM</h1>
        <h2>Login</h2>

        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '5px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {showTwoFactor && (
            <input
              type="text"
              name="twoFactorCode"
              placeholder="Enter 2FA Code"
              value={formData.twoFactorCode}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength={6}
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : showTwoFactor ? 'Verify & Login' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
          <p><strong>Default Admin Credentials:</strong></p>
          <p>Email: admin@agency.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
