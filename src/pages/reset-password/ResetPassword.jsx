import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
    Box,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Container,
    alpha,
    useTheme,
    IconButton,
    InputAdornment,
    Button,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import GradientButton from '../../components/ui/GradientButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';

export const ResetPassword = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Use theme colors
    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
    const GREEN_COLOR = theme.palette.success.main;
    const TEXT_PRIMARY = theme.palette.text.primary;

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localSuccess, setLocalSuccess] = useState('');
    const [localError, setLocalError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: '',
        color: 'error',
    });
    const token = searchParams.get('token');

    // Query to validate token on component mount
    const { 
        data: tokenValidation, 
        isLoading: isTokenValidating, 
        isError: tokenValidationError,
        refetch: refetchTokenValidation
    } = useQuery({
        queryKey: ['validate-reset-token', token],
        queryFn: async () => {
            if (!token) throw new Error('No token provided');
            
            const response = await axiosInstance.get(
                `/auth/validate-reset-token/${token}`
            );
            console.log(response.data)
            return response.data;
        },
        enabled: !!token,
        retry: false,
        staleTime: 0,
    });

    // Password strength checker
    const checkPasswordStrength = (password) => {
        let score = 0;
        let message = '';
        let color = 'error';

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        switch (score) {
            case 0:
            case 1:
                message = 'Very Weak';
                color = 'error';
                break;
            case 2:
                message = 'Weak';
                color = 'error';
                break;
            case 3:
                message = 'Medium';
                color = 'warning';
                break;
            case 4:
                message = 'Strong';
                color = 'success';
                break;
            case 5:
                message = 'Very Strong';
                color = 'success';
                break;
            default:
                message = '';
                color = 'error';
        }

        return { score, message, color };
    };

    // Handle password change
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, password: value }));

        if (value) {
            const strength = checkPasswordStrength(value);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength({ score: 0, message: '', color: 'error' });
        }

        if (localError) setLocalError('');
    };

    // Handle confirm password change
    const handleConfirmPasswordChange = (e) => {
        setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
        if (localError) setLocalError('');
    };

    // React Query mutation for reset password
    const resetPasswordMutation = useMutation({
        mutationFn: async (data) => {
            const response = await axiosInstance.post(
                '/auth/reset-password',
                data
            );
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                setLocalSuccess(data.message || 'Password has been reset successfully!');
                setLocalError('');

                // Clear form
                setFormData({
                    password: '',
                    confirmPassword: '',
                });

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', {
                        state: { 
                            message: 'Password reset successful. Please login with your new password.' 
                        }
                    });
                }, 3000);
            } else {
                setLocalError(data.message || 'Failed to reset password');
                setLocalSuccess('');
            }
        },
        onError: (error) => {
            console.error('Reset password error:', error);

            if (error.response) {
                const errorMsg = error.response.data?.message ||
                    error.response.data?.error ||
                    'Failed to reset password';
                setLocalError(errorMsg);

                // If token is invalid or expired, refetch validation
                if (error.response.status === 400 && 
                    (errorMsg.includes('token') || errorMsg.includes('expired'))) {
                    refetchTokenValidation();
                }
            } else if (error.request) {
                setLocalError('Network error. Please check your connection.');
            } else {
                setLocalError('An unexpected error occurred. Please try again.');
            }
            setLocalSuccess('');
        },
        onMutate: () => {
            setLocalError('');
            setLocalSuccess('');
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate token first
        if (!tokenValidation?.success) {
            setLocalError('Invalid or expired reset link. Please request a new one.');
            return;
        }

        // Validate form
        if (!formData.password || !formData.confirmPassword) {
            setLocalError('Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters long');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        // Call the mutation
        resetPasswordMutation.mutate({
            token,
            newPassword: formData.password
        });
    };

    // Extract loading state
    const isLoading = resetPasswordMutation.isPending;

    // Password strength color
    const getStrengthColor = () => {
        switch (passwordStrength.color) {
            case 'error': return theme.palette.error.main;
            case 'warning': return theme.palette.warning.main;
            case 'success': return theme.palette.success.main;
            default: return TEXT_PRIMARY;
        }
    };

    // Show loading state while validating token
    if (isTokenValidating) {
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
                            textAlign: 'center',
                        }}
                    >
                        <CircularProgress sx={{ color: BLUE_COLOR, mb: 3 }} />
                        <Typography
                            sx={{
                                color: TEXT_PRIMARY,
                                fontWeight: 500,
                                mb: 1,
                            }}
                        >
                            Validating reset link...
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: alpha(TEXT_PRIMARY, 0.7) }}
                        >
                            Please wait while we verify your reset link
                        </Typography>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Show expired/invalid token page
    if (!token || tokenValidationError || !tokenValidation?.success) {
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
                            p: { xs: 2, md: 2 },
                            borderRadius: 0.5,
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 10px 40px rgba(0, 0, 0, 0.3)'
                                : '0 10px 40px rgba(0, 0, 0, 0.08)',
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.paper,
                            textAlign: 'center',
                        }}
                    >                      
                        <Typography
                            sx={{
                                fontWeight: 'bold',
                                mb: 1,
                                color: theme.palette.error.main,
                                fontSize: '1.5rem',
                            }}
                        >
                            Reset Link {!token ? 'Invalid' : 'Expired'}
                        </Typography>

                        <Alert
                            severity="info"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.info.main, 0.1)
                                    : alpha(theme.palette.info.main, 0.05),
                                borderLeft: `4px solid ${theme.palette.info.main}`,
                                color: TEXT_PRIMARY,
                                textAlign: 'left',
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                For security reasons:
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                • Password reset links expire after 5 minutes<br />
                                • Each link can only be used once<br />
                                • Links are unique to each request
                            </Typography>
                        </Alert>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => navigate('/login')}
                                startIcon={<ArrowLeft size={18} />}
                                sx={{
                                    py: 0.9,
                                    borderColor: alpha(TEXT_PRIMARY, 0.3),
                                    color: TEXT_PRIMARY,
                                    '&:hover': {
                                        borderColor: BLUE_COLOR,
                                        backgroundColor: alpha(BLUE_COLOR, 0.04),
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Back to Login
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Show reset password form if token is valid
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
                            Set New Password
                        </Typography>
                        <Typography sx={{ color: TEXT_PRIMARY, fontSize: '0.9rem' }}>
                            Create a new password for your account
                        </Typography>
                        
                        {/* Show email and expiry info if available */}
                        {tokenValidation?.email && (
                            <Alert
                                severity="info"
                                sx={{
                                    mt: 2,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? alpha(theme.palette.info.main, 0.1)
                                        : alpha(theme.palette.info.main, 0.05),
                                    borderLeft: `4px solid ${theme.palette.info.main}`,
                                    color: TEXT_PRIMARY,
                                    py: 0.5,
                                    fontSize: '0.85rem',
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        Account: {tokenValidation.email}
                                    </Typography>
                                    {tokenValidation.expiresIn && (
                                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                                            This link expires in {tokenValidation.expiresIn} minute(s)
                                        </Typography>
                                    )}
                                </Box>
                            </Alert>
                        )}
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
                            }}
                            onClose={() => setLocalError('')}
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
                            }}
                            icon={<CheckCircle />}
                        >
                            {localSuccess}
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                                Redirecting to login page...
                            </Typography>
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <StyledTextField
                            fullWidth
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            size='small'
                            value={formData.password}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            required
                            disabled={isLoading || !!localSuccess}
                            autoComplete="new-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: TEXT_PRIMARY }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 1.5,
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
                                },
                            }}
                        />

                        {/* Password strength indicator */}
                        {formData.password && (
                            <Box sx={{ mb: 2, ml: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: getStrengthColor(),
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    Password strength: {passwordStrength.message}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                    {[1, 2, 3, 4, 5].map((index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                flex: 1,
                                                height: 4,
                                                borderRadius: 1,
                                                backgroundColor: index <= passwordStrength.score
                                                    ? getStrengthColor()
                                                    : alpha(TEXT_PRIMARY, 0.1),
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <StyledTextField
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            size='small'
                            value={formData.confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            placeholder="Confirm new password"
                            required
                            disabled={isLoading || !!localSuccess}
                            autoComplete="new-password"
                            error={!!formData.confirmPassword && formData.password !== formData.confirmPassword}
                            helperText={!!formData.confirmPassword && formData.password !== formData.confirmPassword
                                ? "Passwords don't match"
                                : ""}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: TEXT_PRIMARY }}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
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
                                '& .MuiFormHelperText-root': {
                                    marginLeft: 0,
                                    marginTop: 0.5,
                                },
                            }}
                        />

                        <GradientButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading || !!localSuccess ||
                                !formData.password || !formData.confirmPassword ||
                                formData.password.length < 6 ||
                                formData.password !== formData.confirmPassword}
                            sx={{
                                mb: 2,
                                py: 0.9,
                                opacity: (isLoading || !!localSuccess ||
                                    !formData.password || !formData.confirmPassword ||
                                    formData.password.length < 6 ||
                                    formData.password !== formData.confirmPassword) ? 0.7 : 1,
                                transition: 'opacity 0.2s',
                                '&:disabled': {
                                    background: `linear-gradient(135deg, ${alpha(BLUE_DARK, 0.5)} 0%, ${alpha(BLUE_COLOR, 0.5)} 100%)`,
                                },
                            }}
                        >
                            {isLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                                    <CircularProgress size={20} sx={{ color: 'white' }} />
                                    Resetting Password...
                                </Box>
                            ) : (
                                'Reset Password'
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
                </Paper>
            </Container>
        </Box>
    );
};

export default ResetPassword;