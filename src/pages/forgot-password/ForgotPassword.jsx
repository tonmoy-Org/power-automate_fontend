import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Container,
  alpha,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import GradientButton from '../../components/ui/GradientButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';

export const ForgotPassword = () => {
  const theme = useTheme();

  // Use theme colors
  const BLUE_COLOR = theme.palette.primary.main;
  const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
  const GREEN_COLOR = theme.palette.success.main;
  const TEXT_PRIMARY = theme.palette.text.primary;

  const [email, setEmail] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [localError, setLocalError] = useState('');

  // React Query mutation for forgot password
  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailData) => {
      const response = await axiosInstance.post(
        '/auth/forgot-password',
        emailData
      );
      console.log(response.data)
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Use server message or fallback message
        const successMessage = data.message || 
          `If a user with that email exists, password reset instructions have been sent to ${email}`;
        setLocalSuccess(successMessage);
        setEmail('');
        setLocalError('');
      } else {
        setLocalError(data.message || 'Failed to send reset instructions');
        setLocalSuccess('');
      }
    },
    onError: (error) => {
      console.error('Forgot password error:', error);
      
      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.message || 
                        error.response.data?.error ||
                        'Failed to send reset instructions';
        setLocalError(errorMsg);
      } else if (error.request) {
        // Request was made but no response
        setLocalError('Network error. Please check your connection.');
      } else {
        // Something else happened
        setLocalError('An unexpected error occurred. Please try again.');
      }
      setLocalSuccess('');
    },
    onMutate: () => {
      // Clear previous messages when mutation starts
      setLocalError('');
      setLocalSuccess('');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Clear previous messages
    setLocalError('');
    setLocalSuccess('');

    // Call the mutation
    forgotPasswordMutation.mutate({ email });
  };

  // Handle input change
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  // Clear all messages
  const handleClearMessages = () => {
    setLocalError('');
    setLocalSuccess('');
  };

  // Extract loading state from mutation
  const isLoading = forgotPasswordMutation.isPending;

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
              Reset Password
            </Typography>
            <Typography sx={{ color: TEXT_PRIMARY, fontSize: '0.9rem' }}>
              Enter your email to receive reset instructions
            </Typography>
          </Box>

          {localError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.error.main, 0.05),
                borderLeft: `4px solid ${theme.palette.error.main}`,
                color: TEXT_PRIMARY,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              onClose={handleClearMessages}
            >
              {localError}
            </Alert>
          )}

          {localSuccess && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(GREEN_COLOR, 0.1)
                  : alpha(GREEN_COLOR, 0.05),
                borderLeft: `4px solid ${GREEN_COLOR}`,
                color: TEXT_PRIMARY,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              onClose={handleClearMessages}
            >
              {localSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <StyledTextField
              fullWidth
              label="Email Address"
              type="email"
              size='small'
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
              inputProps={{
                'data-testid': 'email-input',
              }}
              error={!!localError && !localSuccess}
              sx={{
                mb: 3,
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
                  '&.Mui-disabled': {
                    backgroundColor: alpha(TEXT_PRIMARY, 0.04),
                  },
                  '&.Mui-error fieldset': {
                    borderColor: theme.palette.error.main,
                  },
                },
              }}
            />

            <GradientButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !email || !email.includes('@') || !email.includes('.')}
              sx={{
                mb: 2,
                py: 0.9,
                opacity: (isLoading || !email || !email.includes('@') || !email.includes('.')) ? 0.7 : 1,
                transition: 'opacity 0.2s',
                '&:disabled': {
                  background: `linear-gradient(135deg, ${alpha(BLUE_DARK, 0.5)} 0%, ${alpha(BLUE_COLOR, 0.5)} 100%)`,
                },
              }}
              data-testid="submit-button"
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Sending...
                </Box>
              ) : (
                'Send Reset Instructions'
              )}
            </GradientButton>

            <Box sx={{
              pt: 2,
              textAlign: 'center',
            }}>
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: BLUE_COLOR,
                  fontWeight: 500,
                  pointerEvents: isLoading ? 'none' : 'auto',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    textDecoration: 'underline',
                    opacity: 0.8,
                  },
                }}
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </Box>
          </Box>

          <Box sx={{
            pt: 3,
            mt: 2,
            borderTop: `1px solid ${alpha(TEXT_PRIMARY, 0.1)}`,
          }}>
            <Typography 
              variant="body2" 
              color={TEXT_PRIMARY} 
              align="center" 
              sx={{ 
                fontSize: '0.8rem',
                opacity: 0.8,
                lineHeight: 1.6,
              }}
            >
              <Box component="span" display="block">
                Need help? Contact your administrator
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;