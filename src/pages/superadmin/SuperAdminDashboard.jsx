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
import axiosInstance from '../../api/axios';

export const SuperAdminDashboard = () => {
  const theme = useTheme();
  const BLUE_COLOR = theme.palette.primary.main;
  const TEXT_PRIMARY = theme.palette.text.primary;

  const [counts, setCounts] = useState({
    phoneNumbers: 0,
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
        axiosInstance.get('/phone-numbers'),
        axiosInstance.get('/password-formatters'),
        axiosInstance.get('/phone-credentials')
      ]);

      setCounts({
        phoneNumbers: phoneNumbersRes.data?.data?.length || 0,
        passwordFormatters: passwordFormattersRes.data?.data?.length || 0,
        phoneCredentials: phoneCredentialsRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Phone Numbers',
      count: counts.phoneNumbers,
      color: 'primary',
      description: 'Total registered phone numbers'
    },
    {
      title: 'Password Formatters',
      count: counts.passwordFormatters,
      color: 'success',
      description: 'Active password formatting rules'
    },
    {
      title: 'Valid Phone & Password',
      count: counts.phoneCredentials,
      color: 'warning',
      description: 'Valid phone and password combinations'
    }
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
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

      <Box>
        <Grid container spacing={3}>
          {dashboardCards.map((card, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 2.5,
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: `0 4px 10px ${alpha(BLUE_COLOR, 0.15)}`,
                  },
                }}
              >
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body1"
                    color={`${card.color}.main`}
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      mb: 0.5
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem', 
                      color: alpha(TEXT_PRIMARY, 0.7),
                      display: 'block',
                      lineHeight: 1.3
                    }}
                  >
                    {card.description}
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Typography
                    variant="h3"
                    component="div"
                    color={`${card.color}.main`}
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '2rem',
                      lineHeight: 1.2
                    }}
                  >
                    {card.count.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};