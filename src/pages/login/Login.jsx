import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Container,
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import GradientButton from '../../components/ui/GradientButton';
import StyledTextField from '../../components/ui/StyledTextField';

export const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Use theme colors
  const BLUE_COLOR = theme.palette.primary.main;
  const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
  const RED_COLOR = theme.palette.error.main;
  const TEXT_PRIMARY = theme.palette.text.primary;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);

      // Store email if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha('#1a1a1a', 1)} 0%, ${alpha('#2d2d2d', 1)} 100%)`
          : `linear-gradient(135deg, ${alpha('#f8fafc', 1)} 0%, ${alpha('#f1f5f9', 1)} 100%)`,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 0.5,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 40px rgba(0, 0, 0, 0.3)'
              : '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              sx={{
                fontWeight: 'bold',
                mb: 0.5,
                background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '1.5rem',
              }}
            >
              Power Automation
            </Typography>
            <Typography sx={{ color: TEXT_PRIMARY, fontSize: '0.9rem' }}>
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              icon={<AlertCircle size={20} />}
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(RED_COLOR, 0.1)
                  : alpha(RED_COLOR, 0.05),
                borderLeft: `4px solid ${RED_COLOR}`,
                color: TEXT_PRIMARY,
                '& .MuiAlert-icon': {
                  color: RED_COLOR,
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ '& > *': { mb: 3 } }}>
            <StyledTextField
              fullWidth
              label="Email Address"
              type="email"
              size='small'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  color: TEXT_PRIMARY,
                },
                '& .MuiInputLabel-root': {
                  color: TEXT_PRIMARY,
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: alpha(TEXT_PRIMARY, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: BLUE_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: BLUE_COLOR,
                  },
                  '& input::placeholder': {
                    color: TEXT_PRIMARY,
                    opacity: 0.5,
                  },
                },
              }}
            />

            <StyledTextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              size='small'
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: TEXT_PRIMARY }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  color: TEXT_PRIMARY,
                },
                '& .MuiInputLabel-root': {
                  color: TEXT_PRIMARY,
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: alpha(TEXT_PRIMARY, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: BLUE_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: BLUE_COLOR,
                  },
                  '& input::placeholder': {
                    color: TEXT_PRIMARY,
                    opacity: 0.5,
                  },
                },
              }}
            />

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              mb: 2,
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: BLUE_COLOR,
                      '&.Mui-checked': {
                        color: BLUE_COLOR,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{
                    fontSize: '0.85rem',
                    color: TEXT_PRIMARY,
                  }}>
                    Remember me
                  </Typography>
                }
              />

              <Link
                to="/forgot-password"
                style={{
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  color: BLUE_COLOR,
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <GradientButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 0.9,
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Signing in...
                </Box>
              ) : (
                'Sign In'
              )}
            </GradientButton>
          </Box>

          <Box sx={{
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="body2" color={TEXT_PRIMARY} align="center">
              Need help? Contact your administrator
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};