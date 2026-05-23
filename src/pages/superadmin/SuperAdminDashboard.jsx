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
  PhonelinkLock as IndianIcon,
  VpnKey as GlobalIcon,
  Settings as RuleIcon,
  PhoneAndroid as PhoneIcon,
  Language as GlobalPhoneIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axios';

export const SuperAdminDashboard = () => {
  const theme = useTheme();
  const TEXT_PRIMARY = theme.palette.text.primary;
  
  // Custom Color Palette for Rich Premium Aesthetics
  const BLUE_COLOR = '#3B82F6';
  const TEAL_COLOR = '#0D9488';
  const ORANGE_COLOR = '#F97316';
  const INDIGO_COLOR = '#6366F1';
  const GREEN_COLOR = '#10B981';
  const INACTIVE_COLOR = '#6B7280';
  
  const [counts, setCounts] = useState({
    phoneNumbers: 0,
    phoneNumbersInactive: 0,
    phoneNumbersRunning: 0,
    phoneNumbersCompleted: 0,
    
    indianNumbers: 0,
    indianNumbersInactive: 0,
    indianNumbersRunning: 0,
    indianNumbersCompleted: 0,
    
    passwordFormatters: 0,
    phoneCredentials: 0,
    indianPhoneCredentials: 0,
  });
  
  const [globalTypeSummary, setGlobalTypeSummary] = useState([]);
  const [indianTypeSummary, setIndianTypeSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/phone-numbers/dashboard/stats');
      if (res.data?.success) {
        setCounts(res.data.data.counts);
        setGlobalTypeSummary(res.data.data.globalTypeSummary || []);
        setIndianTypeSummary(res.data.data.indianTypeSummary || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTypeAll = async (type, isIndian = false) => {
    try {
      setDownloading(true);
      const endpoint = isIndian ? '/indian-phone-credentials' : '/phone-credentials';
      const params = isIndian ? { type } : { type, exclude_country_code: '91' };
      
      const res = await axiosInstance.get(endpoint, { params });
      const records = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (!records.length) {
        return;
      }

      const content = records
        .map((cred) => `${cred.phone}\t${cred.password}\t${cred.type}`)
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isIndian ? 'indian' : 'global'}_type_${type}_credentials.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloading(false);
    }
  };

  const glassCardSx = (color) => ({
    p: 2.5,
    height: '100%',
    minHeight: 185,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: 3,
    border: `1.5px solid ${alpha(color, 0.15)}`,
    background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`,
    backdropFilter: 'blur(10px)',
    transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
      background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.04)} 100%)`,
    },
  });

  const statusItemSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.8,
    py: 0.3,
  };

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
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

      <Box sx={{ mb: 3.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            mb: 0.5,
            fontSize: { xs: '1.1rem', sm: '1.3rem' },
            background: `linear-gradient(135deg, ${INDIGO_COLOR} 0%, ${BLUE_COLOR} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.78rem', color: alpha(TEXT_PRIMARY, 0.6) }}>
          Welcome back. Here is the fully optimized, live statistics view of your system activities.
        </Typography>
      </Box>

      {/* Primary KPI Grid (5 Beautiful Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 4.5 }}>
        {/* 1. Phone Numbers (Global) */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={glassCardSx(BLUE_COLOR)}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE_COLOR, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.72rem' }}>
                  Phone Numbers (Global)
                </Typography>
                <GlobalPhoneIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.55), display: 'block', mb: 1 }}>
                Non-Indian target devices registered
              </Typography>
            </Box>
            <Box display="flex" alignItems="flex-end" justifyContent="space-between" gap={2} sx={{ mt: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: BLUE_COLOR, fontSize: '1.85rem' }}>
                {counts.phoneNumbers.toLocaleString()}
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Box sx={statusItemSx}>
                  <BlockIcon sx={{ fontSize: '0.7rem', color: INACTIVE_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: INACTIVE_COLOR }}>
                    {counts.phoneNumbersInactive.toLocaleString()} Inactive
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <PlayArrowIcon sx={{ fontSize: '0.7rem', color: BLUE_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: BLUE_COLOR }}>
                    {counts.phoneNumbersRunning.toLocaleString()} Running
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <DoneIcon sx={{ fontSize: '0.7rem', color: GREEN_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: GREEN_COLOR }}>
                    {counts.phoneNumbersCompleted.toLocaleString()} Done
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 2. Indian Phone Numbers */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={glassCardSx(INDIGO_COLOR)}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: INDIGO_COLOR, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.72rem' }}>
                  Indian Phone Numbers
                </Typography>
                <PhoneIcon sx={{ color: INDIGO_COLOR, fontSize: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.55), display: 'block', mb: 1 }}>
                Indian (+91) operators registered
              </Typography>
            </Box>
            <Box display="flex" alignItems="flex-end" justifyContent="space-between" gap={2} sx={{ mt: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: INDIGO_COLOR, fontSize: '1.85rem' }}>
                {counts.indianNumbers.toLocaleString()}
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Box sx={statusItemSx}>
                  <BlockIcon sx={{ fontSize: '0.7rem', color: INACTIVE_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: INACTIVE_COLOR }}>
                    {counts.indianNumbersInactive.toLocaleString()} Inactive
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <PlayArrowIcon sx={{ fontSize: '0.7rem', color: INDIGO_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: INDIGO_COLOR }}>
                    {counts.indianNumbersRunning.toLocaleString()} Running
                  </Typography>
                </Box>
                <Box sx={statusItemSx}>
                  <DoneIcon sx={{ fontSize: '0.7rem', color: GREEN_COLOR }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: GREEN_COLOR }}>
                    {counts.indianNumbersCompleted.toLocaleString()} Done
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 3. Password Formatters */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={glassCardSx(TEAL_COLOR)}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: TEAL_COLOR, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.72rem' }}>
                  Password Formatters
                </Typography>
                <RuleIcon sx={{ color: TEAL_COLOR, fontSize: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.55), display: 'block', mb: 1 }}>
                Active password generation formatting rules
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: TEAL_COLOR, fontSize: '1.85rem' }}>
                {counts.passwordFormatters.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 4. Valid Phone & Password (Global) */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={0} sx={glassCardSx(ORANGE_COLOR)}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: ORANGE_COLOR, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.72rem' }}>
                  Valid Phone & Password (Global)
                </Typography>
                <GlobalIcon sx={{ color: ORANGE_COLOR, fontSize: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.55), display: 'block', mb: 1 }}>
                Total authenticated global phone credentials
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: ORANGE_COLOR, fontSize: '1.85rem' }}>
                {counts.phoneCredentials.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 5. Indian Valid Phone & Password */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={0} sx={glassCardSx(GREEN_COLOR)}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN_COLOR, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.72rem' }}>
                  Indian Valid Phone & Password
                </Typography>
                <IndianIcon sx={{ color: GREEN_COLOR, fontSize: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.55), display: 'block', mb: 1 }}>
                Total authenticated Indian (+91) credentials
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: GREEN_COLOR, fontSize: '1.85rem' }}>
                {counts.indianPhoneCredentials.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Global Typewise Summaries */}
      <Grid container spacing={4}>
        {/* Global Credentials Column */}
        <Grid item xs={12} md={6}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: ORANGE_COLOR }}>
            Global Credentials by Type
          </Typography>
          {globalTypeSummary.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">No Global type credentials found</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {globalTypeSummary.map(({ type, count }) => {
                const color = ORANGE_COLOR;
                const bg = alpha(color, 0.05);
                const border = alpha(color, 0.2);

                return (
                  <Grid item xs={12} key={type}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        background: bg,
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: `0 4px 12px ${alpha(color, 0.15)}` },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Chip
                              label={type}
                              size="small"
                              sx={{
                                fontSize: '0.72rem',
                                height: 22,
                                backgroundColor: alpha(color, 0.15),
                                color,
                                border: `1px solid ${border}`,
                                fontWeight: 700,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color, fontSize: '1.15rem', lineHeight: 1 }}
                            >
                              {count}
                            </Typography>
                          </Box>

                          {count > 0 && (
                            <Tooltip title={`Download all Global Type ${type} credentials`}>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadTypeAll(type, false)}
                                sx={{
                                  color,
                                  backgroundColor: alpha(color, 0.1),
                                  '&:hover': { backgroundColor: alpha(color, 0.2) },
                                  p: 0.75,
                                }}
                              >
                                <DownloadAllIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Indian Credentials Column */}
        <Grid item xs={12} md={6}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: GREEN_COLOR }}>
            Indian Credentials by Type
          </Typography>
          {indianTypeSummary.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">No Indian type credentials found</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {indianTypeSummary.map(({ type, count }) => {
                const color = GREEN_COLOR;
                const bg = alpha(color, 0.05);
                const border = alpha(color, 0.2);

                return (
                  <Grid item xs={12} key={type}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        background: bg,
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: `0 4px 12px ${alpha(color, 0.15)}` },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Chip
                              label={type}
                              size="small"
                              sx={{
                                fontSize: '0.72rem',
                                height: 22,
                                backgroundColor: alpha(color, 0.15),
                                color,
                                border: `1px solid ${border}`,
                                fontWeight: 700,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color, fontSize: '1.15rem', lineHeight: 1 }}
                            >
                              {count}
                            </Typography>
                          </Box>

                          {count > 0 && (
                            <Tooltip title={`Download all Indian Type ${type} credentials`}>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadTypeAll(type, true)}
                                sx={{
                                  color,
                                  backgroundColor: alpha(color, 0.1),
                                  '&:hover': { backgroundColor: alpha(color, 0.2) },
                                  p: 0.75,
                                }}
                              >
                                <DownloadAllIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;