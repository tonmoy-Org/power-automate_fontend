import React, { useState, useEffect, useMemo } from 'react'; // Add useMemo
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  alpha,
  useTheme,
  Chip, // Add Chip
  Card, // Add Card
  CardContent, // Add CardContent
  Tooltip, // Add Tooltip
  IconButton, // Add IconButton
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  DownloadForOffline as DownloadAllIcon, // Add DownloadAllIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axios';

export const SuperAdminDashboard = () => {
  const theme = useTheme();
  const BLUE_COLOR = theme.palette.primary.main;
  const TEXT_PRIMARY = theme.palette.text.primary;
  const GREEN_COLOR = theme.palette.success.main;
  const RED_COLOR = theme.palette.error.main;
  const WARNING_COLOR = theme.palette.warning.main; // Add warning color
  const GREY_COLOR = theme.palette.grey[500]; // Add grey color

  const [counts, setCounts] = useState({
    phoneNumbers: 0,
    phoneNumbersActive: 0,
    phoneNumbersInactive: 0,
    passwordFormatters: 0,
    phoneCredentials: 0
  });
  const [credentials, setCredentials] = useState([]); // Add credentials state
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
        axiosInstance.get('/phone-credentials?limit=1000') // Increase limit to get all credentials
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

      // Store credentials for type summary
      const credentialsData = phoneCredentialsRes.data || [];
      setCredentials(Array.isArray(credentialsData) ? credentialsData : (credentialsData?.data ?? []));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add type summary calculation
  const typeSummary = useMemo(() => {
    if (!credentials.length) return [
      { type: 'A', count: 0 },
      { type: 'B', count: 0 },
      { type: 'C', count: 0 }
    ];

    const uniqueTypes = [...new Set(credentials.map((c) => c.type))].sort();
    return uniqueTypes.map((type) => ({
      type,
      count: credentials.filter((c) => c.type === type).length,
    }));
  }, [credentials]);

  // Add color helper functions
  const getTypeColor = (type, hasType) => {
    if (!hasType) return GREY_COLOR;
    switch (type) {
      case 'A': return GREEN_COLOR;
      case 'B': return BLUE_COLOR;
      case 'C': return WARNING_COLOR;
      default: return BLUE_COLOR;
    }
  };

  const getTypeBackground = (type, hasType) => {
    const c = getTypeColor(type, hasType);
    return alpha(c, 0.1);
  };

  const getTypeBorder = (type, hasType) => {
    const c = getTypeColor(type, hasType);
    return alpha(c, 0.25);
  };

  // Add download handler for type
  const handleDownloadTypeAll = (type) => {
    try {
      const typeCredentials = credentials.filter((cred) => cred.type === type);
      if (!typeCredentials.length) {
        console.error(`No Type ${type} credentials to download`);
        return;
      }

      const content = typeCredentials
        .map((cred) => `${cred.phone}:${cred.password}`)
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_type_${type}_credentials.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
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

      {/* First row - Main stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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

      {/* Second row - Type Summary Cards */}
      {credentials.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{
            fontWeight: 600,
            mb: 2,
            fontSize: { xs: '0.95rem', sm: '1rem' },
          }}>
            Valid Phone & Password by Type
          </Typography>

          <Grid container spacing={2}>
            {typeSummary.map(({ type, count }) => {
              const color = getTypeColor(type, count > 0);
              const bg = getTypeBackground(type, count > 0);
              const border = getTypeBorder(type, count > 0);

              return (
                <Grid item xs={12} sm={6} md={4} key={type}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${border}`,
                      borderRadius: 2,
                      background: bg,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: `0 4px 12px ${alpha(color, 0.2)}` },
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        {/* Left side - Type and count */}
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Chip
                            label={`${type}`}
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              backgroundColor: alpha(color, 0.15),
                              color,
                              border: `1px solid ${border}`,
                              fontWeight: 700,
                            }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color,
                              fontSize: '1.35rem',
                              lineHeight: 1
                            }}
                          >
                            {count}
                          </Typography>
                        </Box>

                        {/* Right side - Download button */}
                        {count > 0 && (
                          <Tooltip title={`Download all Type ${type} credentials`}>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadTypeAll(type)}
                              sx={{
                                color,
                                backgroundColor: alpha(color, 0.1),
                                '&:hover': { backgroundColor: alpha(color, 0.2) },
                                p: 1,
                              }}
                            >
                              <DownloadAllIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Optional: Add a small progress or percentage indicator */}
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(color, 0.8) }}>
                          {((count / credentials.length) * 100).toFixed(1)}% of total credentials
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
};