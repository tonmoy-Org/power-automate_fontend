import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  alpha,
  useTheme,
  Chip,
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  PlayArrow as PlayArrowIcon,
  Block as BlockIcon,
  Done as DoneIcon,
  DownloadForOffline as DownloadAllIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axios';

export const SuperAdminDashboard = () => {
  const theme = useTheme();
  const BLUE_COLOR = theme.palette.primary.main;
  const TEXT_PRIMARY = theme.palette.text.primary;
  const INACTIVE_COLOR = '#6B7280';
  const RUNNING_COLOR = theme.palette.primary.main;
  const COMPLETED_COLOR = theme.palette.success.main;
  const WARNING_COLOR = theme.palette.warning.main;
  const GREY_COLOR = theme.palette.grey[500];

  const [counts, setCounts] = useState({
    phoneNumbers: 0,
    phoneNumbersInactive: 0,
    phoneNumbersRunning: 0,
    phoneNumbersCompleted: 0,
    passwordFormatters: 0,
    phoneCredentials: 0,
  });
  const [credentials, setCredentials] = useState([]);
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
        axiosInstance.get('/phone-credentials?limit=1000'),
      ]);

      const phoneNumbersList = phoneNumbersRes.data?.data || [];
      const inactiveCount = phoneNumbersList.filter((p) => p.is_active === 'inactive').length;
      const runningCount = phoneNumbersList.filter((p) => p.is_active === 'running').length;
      const completedCount = phoneNumbersList.filter((p) => p.is_active === 'completed').length;

      setCounts({
        phoneNumbers: phoneNumbersRes.data?.pagination?.total || phoneNumbersList.length,
        phoneNumbersInactive: inactiveCount,
        phoneNumbersRunning: runningCount,
        phoneNumbersCompleted: completedCount,
        passwordFormatters: passwordFormattersRes.data?.data?.length || 0,
        phoneCredentials: phoneCredentialsRes.data?.length || 0,
      });

      const credentialsData = phoneCredentialsRes.data || [];
      setCredentials(Array.isArray(credentialsData) ? credentialsData : (credentialsData?.data ?? []));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeSummary = useMemo(() => {
    const uniqueTypes = [...new Set(credentials.map((c) => c.type))].sort();
    return uniqueTypes.map((type) => ({
      type,
      count: credentials.filter((c) => c.type === type).length,
    }));
  }, [credentials]);

  const getTypeColor = (hasType) => (hasType ? BLUE_COLOR : GREY_COLOR);
  const getTypeBackground = (hasType) => alpha(getTypeColor(hasType), 0.1);
  const getTypeBorder = (hasType) => alpha(getTypeColor(hasType), 0.25);

  // Downloads plain phone:password lines — no headers or comments
  const handleDownloadTypeAll = (type) => {
    try {
      const typeCredentials = credentials.filter((cred) => cred.type === type);
      if (!typeCredentials.length) return;

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

  const glassCardSx = (color) => ({
    p: 2.5,
    height: 'auto',
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${alpha(color, 0.2)}`,
    background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.04)} 100%)`,
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      boxShadow: `0 4px 16px ${alpha(color, 0.2)}`,
      background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.06)} 100%)`,
    },
  });

  const statusItemSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.8,
    py: 0.6,
  };

  if (loading) {
    return (
      <Box
        position="absolute"
        top={0} left={0} right={0} bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.7)"
        zIndex={1}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Helmet>
        <title>Dashboard | Power Automate Admin</title>
      </Helmet>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
          Dashboard Overview
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
          Welcome to the Super Admin Dashboard. Here's a summary of your system statistics.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={0} sx={glassCardSx(BLUE_COLOR)}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                Phone Numbers
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.7), display: 'block', lineHeight: 1.3 }}>
                Total registered phone numbers
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto' }} display="flex" alignItems="flex-end" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Typography variant="h3" component="div" color="primary.main" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
                {counts.phoneNumbers.toLocaleString()}
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.4} alignItems="flex-end">
                <Box sx={statusItemSx}>
                  <BlockIcon sx={{ fontSize: '0.75rem', color: INACTIVE_COLOR }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: INACTIVE_COLOR }}>
                    {counts.phoneNumbersInactive.toLocaleString()} Inactive
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <PlayArrowIcon sx={{ fontSize: '0.75rem', color: RUNNING_COLOR }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: RUNNING_COLOR }}>
                    {counts.phoneNumbersRunning.toLocaleString()} Running
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <DoneIcon sx={{ fontSize: '0.75rem', color: COMPLETED_COLOR }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: COMPLETED_COLOR }}>
                    {counts.phoneNumbersCompleted.toLocaleString()} Completed
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={0} sx={glassCardSx(COMPLETED_COLOR)}>
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

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={0} sx={glassCardSx(WARNING_COLOR)}>
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

      {typeSummary.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
            Valid Phone & Password by Type
          </Typography>

          <Grid container spacing={2}>
            {typeSummary.map(({ type, count }) => {
              const color = getTypeColor(count > 0);
              const bg = getTypeBackground(count > 0);
              const border = getTypeBorder(count > 0);

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
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Chip
                            label={type}
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
                            sx={{ fontWeight: 700, color, fontSize: '1.35rem', lineHeight: 1 }}
                          >
                            {count}
                          </Typography>
                        </Box>

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

export default SuperAdminDashboard;