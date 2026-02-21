import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axios';

export const SuperAdminDashboard = () => {
  const theme = useTheme();
  const BLUE_COLOR = theme.palette.primary.main;
  const TEXT_PRIMARY = theme.palette.text.primary;
  const GREEN_COLOR = theme.palette.success.main;
  const RED_COLOR = theme.palette.error.main;

  const [counts, setCounts] = useState({
    phoneNumbers: 0,
    phoneNumbersActive: 0,
    phoneNumbersInactive: 0,
    passwordFormatters: 0,
    phoneCredentials: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);

      const [phoneNumbersRes, passwordFormattersRes, phoneCredentialsRes] = await Promise.all([
        axiosInstance.get('/phone-numbers?limit=9999'),
        axiosInstance.get('/password-formatters'),
        axiosInstance.get('/phone-credentials')
      ]);

      const phoneNumbersList = phoneNumbersRes.data?.data || [];
      const activeCount = phoneNumbersList.filter(p => p.is_active).length;
      const inactiveCount = phoneNumbersList.filter(p => !p.is_active).length;

      setCounts({
        phoneNumbers: phoneNumbersRes.data?.pagination?.total || phoneNumbersList.length,
        phoneNumbersActive: activeCount,
        phoneNumbersInactive: inactiveCount,
        passwordFormatters: passwordFormattersRes.data?.data?.length || 0,
        phoneCredentials: phoneCredentialsRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box>
      <Helmet>
        <title>Dashboard | Power Automate Admin</title>
      </Helmet>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontWeight: 600,
          mb: 0.5,
          fontSize: { xs: '1rem', sm: '1.1rem' },
        }}>
          Dashboard Overview
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
          Welcome to the Super Admin Dashboard. Here's a summary of your system statistics.
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* Phone Numbers card — with active/inactive breakdown */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { boxShadow: `0 4px 10px ${alpha(BLUE_COLOR, 0.15)}` },
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                Phone Numbers
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.7), display: 'block', lineHeight: 1.3 }}>
                Total registered phone numbers
              </Typography>
            </Box>

            <Box sx={{ mt: 'auto' }} display="flex" alignItems="flex-end" justifyContent="space-between">
              <Typography variant="h3" component="div" color="primary.main" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
                {counts.phoneNumbers.toLocaleString()}
              </Typography>

              {/* Active / Inactive breakdown */}
              <Box display="flex" flexDirection="column" gap={0.4} alignItems="flex-end">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CheckCircleIcon sx={{ fontSize: '0.75rem', color: GREEN_COLOR }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: GREEN_COLOR }}>
                    {counts.phoneNumbersActive.toLocaleString()} Active
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <BlockIcon sx={{ fontSize: '0.75rem', color: RED_COLOR }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: RED_COLOR }}>
                    {counts.phoneNumbersInactive.toLocaleString()} Inactive
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Password Formatters card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { boxShadow: `0 4px 10px ${alpha(BLUE_COLOR, 0.15)}` },
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Typography variant="body1" color="success.main" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                Password Formatters
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.7), display: 'block', lineHeight: 1.3 }}>
                Active password formatting rules
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="h3" component="div" color="success.main" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
                {counts.passwordFormatters.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Valid Phone & Password card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { boxShadow: `0 4px 10px ${alpha(BLUE_COLOR, 0.15)}` },
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Typography variant="body1" color="warning.main" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                Valid Phone & Password
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.7), display: 'block', lineHeight: 1.3 }}>
                Valid phone and password combinations
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="h3" component="div" color="warning.main" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
                {counts.phoneCredentials.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};