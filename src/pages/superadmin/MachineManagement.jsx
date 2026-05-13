import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Button,
  alpha,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Computer as ComputerIcon,
  CheckCircle as OnlineIcon,
  Block as OfflineIcon,
  Sync as SyncIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import GradientButton from "../../components/ui/GradientButton";
import axiosInstance from "../../api/axios";
import { formatDistanceToNow } from "date-fns";

// Circular Progress Component with Label
const CircularProgressWithLabel = ({ value, index, color = "primary" }) => {
  const theme = useTheme();
  return (
    <Box sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={42}
          thickness={4}
          sx={{ color: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={42}
          thickness={4}
          sx={{
            position: "absolute",
            left: 0,
            color: value > 80 ? theme.palette.warning.main : theme.palette.primary.main,
            strokeLinecap: "round",
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ fontSize: "0.6rem", mt: 0.5, opacity: 0.7 }}>
        {index + 1}
      </Typography>
    </Box>
  );
};

const MachineRow = ({ machine, theme, BLUE_COLOR, GREEN_COLOR, RED_COLOR, GREY_COLOR, onDelete }) => {
  const isOnline = machine.status === "online";
  const statusColor = isOnline ? GREEN_COLOR : GREY_COLOR;

  const lastSeenText = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(machine.lastSeen), { addSuffix: true });
    } catch {
      return "Never";
    }
  }, [machine.lastSeen]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        background: theme.palette.mode === "dark" 
          ? alpha(theme.palette.background.paper, 0.5) 
          : "white",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        {/* Machine Info */}
        <Grid item xs={12} md={2.5}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(statusColor, 0.1),
                color: statusColor,
              }}
            >
              <ComputerIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {machine.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  {isOnline ? "Online" : "Offline"}
                </Typography>
                <Typography variant="caption" sx={{ ml: 1, opacity: 0.5 }}>
                  {lastSeenText}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Progress Gauges */}
        <Grid item xs={12} md={6}>
          <Box display="flex" gap={2} justifyContent="space-between" flexWrap="wrap">
            {(machine.tasks || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).map((val, idx) => (
              <CircularProgressWithLabel key={idx} value={val} index={idx} />
            ))}
          </Box>
        </Grid>

        {/* Status Indicators & Actions */}
        <Grid item xs={12} md={3.5}>
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1.5}>
            <Box textAlign="right" sx={{ mr: 2 }}>
               <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                 {machine.mode}
               </Typography>
               <Typography variant="caption" sx={{ fontWeight: 600 }}>
                 Auto Add: {machine.autoAdd ? 'On' : 'Off'}
               </Typography>
            </Box>
            
            <Tooltip title="Play">
              <IconButton size="small" sx={{ color: GREEN_COLOR }}>
                <PlayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pause">
              <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                <PauseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" sx={{ color: RED_COLOR }} onClick={() => onDelete(machine._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export const MachineManagement = () => {
  const theme = useTheme();
  const BLUE_COLOR = theme.palette.primary.main;
  const GREEN_COLOR = theme.palette.success.main;
  const RED_COLOR = theme.palette.error.main;
  const WARNING_COLOR = theme.palette.warning.main;
  const GREY_COLOR = theme.palette.grey[500];

  const [hideOffline, setHideOffline] = useState(false);
  const [autoNumber, setAutoNumber] = useState(false);

  // Real data fetching from backend
  const { data: machines = [], isLoading, refetch } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/machines");
        return response.data.data || [];
      } catch (error) {
        console.error("Failed to fetch machines:", error);
        return [];
      }
    },
    refetchInterval: 5000, // Refresh every 5s for real-time feel
  });

  const handleDeleteMachine = async (id) => {
    if (window.confirm("Are you sure you want to delete this machine record?")) {
      try {
        await axiosInstance.delete(`/machines/${id}`);
        refetch();
      } catch (error) {
        console.error("Failed to delete machine:", error);
      }
    }
  };

  const stats = useMemo(() => {
    const online = machines.filter((m) => m.status === "online").length;
    return {
      total: machines.length,
      online,
      offline: machines.length - online,
    };
  }, [machines]);

  return (
    <Box>
      <Helmet>
        <title>Machine Management | Power Automate</title>
      </Helmet>

      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Machine Management
          </Typography>
          <Typography variant="caption" color="textSecondary">
            BD KING | Monitoring {stats.total} total instances
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
           <GradientButton startIcon={<AddIcon />} variant="contained">
             Add Machine
           </GradientButton>
        </Box>
      </Box>

      {/* Control Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={3} alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <OnlineIcon sx={{ color: GREEN_COLOR, fontSize: 16 }} />
                <Typography variant="caption" fontWeight={600}>
                  {stats.online} Online
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <OfflineIcon sx={{ color: GREY_COLOR, fontSize: 16 }} />
                <Typography variant="caption" fontWeight={600}>
                  {stats.offline} Offline
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={hideOffline}
                    onChange={(e) => setHideOffline(e.target.checked)}
                  />
                }
                label={<Typography variant="caption">Hide Offline</Typography>}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                startIcon={<SyncIcon />}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem' }}
              >
                Auto cycle
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayIcon />}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', color: GREEN_COLOR }}
              >
                Play Online
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PauseIcon />}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem' }}
              >
                Pause All
              </Button>
              <IconButton size="small">
                <TuneIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Machine List */}
      <Box>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          machines
            .filter((m) => !hideOffline || m.status === "online")
            .map((machine) => (
              <MachineRow
                key={machine._id}
                machine={machine}
                theme={theme}
                BLUE_COLOR={BLUE_COLOR}
                GREEN_COLOR={GREEN_COLOR}
                RED_COLOR={RED_COLOR}
                GREY_COLOR={GREY_COLOR}
                onDelete={handleDeleteMachine}
              />
            ))
        )}
      </Box>
    </Box>
  );
};

export default MachineManagement;
