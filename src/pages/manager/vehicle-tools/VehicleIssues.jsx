import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextareaAutosize,
    LinearProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    Warning as WarningIcon,
    Build as BuildIcon,
    LocalShipping as TruckIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Edit as EditIcon,
    CheckCircle as CheckIcon,
    PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GradientButton from '../../../components/ui/GradientButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import StyledTextField from '../../../components/ui/StyledTextField';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';
const RED_COLOR = '#ef4444';
const ORANGE_COLOR = '#f59e0b';
const GREEN_COLOR = '#10b981';

const PRIORITY_CONFIG = {
    HIGH: { label: 'High', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1) },
    MEDIUM: { label: 'Medium', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1) },
    LOW: { label: 'Low', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1) },
};

const ISSUE_STATUS_CONFIG = {
    OPEN: { label: 'Open', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1) },
    IN_PROGRESS: { label: 'In Progress', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1) },
    RESOLVED: { label: 'Resolved', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1) },
    CLOSED: { label: 'Closed', color: BLUE_COLOR, bgColor: alpha(BLUE_COLOR, 0.1) }, // Added CLOSED status
};

const PRIORITY_CONFIG_FULL = {
    LOW: { label: 'Low', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1) },
    MEDIUM: { label: 'Medium', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1) },
    HIGH: { label: 'High', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1) },
    CRITICAL: { label: 'Critical', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.3) },
};

const ISSUE_TYPES = [
    'Engine',
    'Transmission',
    'Brakes',
    'Tires',
    'Electrical',
    'Pump System',
    'Hydraulics',
    'Safety Equipment',
    'Body Damage',
    'Other',
];

const VehicleIssues = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [openIssueDialog, setOpenIssueDialog] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [issueForm, setIssueForm] = useState({
        vehicleId: '',
        title: '',
        description: '',
        type: '',
        priority: 'MEDIUM',
        images: [],
    });

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const response = await axiosInstance.get('/vehicles');
            return response.data.vehicles || response.data.data || response.data;
        },
    });

    const { data: issuesData = {}, isLoading } = useQuery({
        queryKey: ['vehicle-issues'],
        queryFn: async () => {
            const response = await axiosInstance.get('/vehicle-issues');
            console.log('Fetched issues response:', response.data);
            return response.data;
        },
    });

    // Extract issues from the nested structure
    const issues = issuesData.data || [];
    const stats = issuesData.stats || {};

    const createIssueMutation = useMutation({
        mutationFn: async (issueData) => {
            const response = await axiosInstance.post('/vehicle-issues', issueData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-issues'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setOpenIssueDialog(false);
            resetIssueForm();
        },
    });

    const updateIssueStatusMutation = useMutation({
        mutationFn: async ({ issueId, status }) => {
            const response = await axiosInstance.patch(`/vehicle-issues/${issueId}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-issues'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
    });

    const filteredIssues = issues.filter(issue => {
        const matchesSearch = searchQuery === '' ||
            issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (issue.vehicleId && typeof issue.vehicleId === 'object' && 
             issue.vehicleId.truckNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || issue.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getVehicleInfo = (vehicleData) => {
        // Handle both cases: vehicleId could be a string ID or populated object
        if (!vehicleData) return null;
        
        if (typeof vehicleData === 'object' && vehicleData._id) {
            // It's a populated vehicle object
            return {
                id: vehicleData._id,
                truckNumber: vehicleData.truckNumber,
                vehicleType: vehicleData.vehicleType,
                licensePlate: vehicleData.licensePlate,
                make: vehicleData.make,
                model: vehicleData.model
            };
        }
        
        // It's just a string ID, find vehicle in vehicles list
        const vehicle = vehicles.find(v => v._id === vehicleData);
        return vehicle ? {
            id: vehicle._id,
            truckNumber: vehicle.truckNumber,
            vehicleType: vehicle.vehicleType,
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model
        } : null;
    };

    const resetIssueForm = () => {
        setIssueForm({
            vehicleId: '',
            title: '',
            description: '',
            type: '',
            priority: 'MEDIUM',
            images: [],
        });
        setSelectedIssue(null);
    };

    const handleCreateIssue = () => {
        createIssueMutation.mutate(issueForm);
    };

    const handleStatusChange = (issueId, newStatus) => {
        updateIssueStatusMutation.mutate({ issueId, status: newStatus });
    };

    // Stats display component
    const StatsDisplay = () => (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <Paper sx={{ p: 2, minWidth: 200, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status Summary
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {Object.entries(stats.status || {}).map(([status, count]) => (
                        <Chip
                            key={status}
                            label={`${ISSUE_STATUS_CONFIG[status]?.label || status}: ${count}`}
                            size="small"
                            sx={{
                                backgroundColor: ISSUE_STATUS_CONFIG[status]?.bgColor || alpha('#000', 0.1),
                                color: ISSUE_STATUS_CONFIG[status]?.color || 'text.primary',
                            }}
                        />
                    ))}
                </Box>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 200, flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Priority Summary
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {Object.entries(stats.priority || {}).map(([priority, count]) => (
                        <Chip
                            key={priority}
                            label={`${PRIORITY_CONFIG_FULL[priority]?.label || priority}: ${count}`}
                            size="small"
                            sx={{
                                backgroundColor: PRIORITY_CONFIG_FULL[priority]?.bgColor || alpha('#000', 0.1),
                                color: PRIORITY_CONFIG_FULL[priority]?.color || 'text.primary',
                            }}
                        />
                    ))}
                </Box>
            </Paper>
        </Box>
    );

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <LinearProgress sx={{ width: '100%' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Vehicle Issues
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and track vehicle maintenance issues
                    </Typography>
                </Box>
                
                <GradientButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenIssueDialog(true)}
                >
                    Report Issue
                </GradientButton>
            </Box>

            {/* Stats Display */}
            {stats && Object.keys(stats).length > 0 && <StatsDisplay />}

            {/* Filters */}
            <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
                <StyledTextField
                    placeholder="Search issues, vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: BLUE_COLOR }} />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                    sx={{ width: 300 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                    >
                        <MenuItem value="ALL">All Status</MenuItem>
                        {Object.entries(ISSUE_STATUS_CONFIG).map(([key, config]) => (
                            <MenuItem key={key} value={key}>
                                {config.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        label="Priority"
                    >
                        <MenuItem value="ALL">All Priority</MenuItem>
                        {Object.entries(PRIORITY_CONFIG_FULL).map(([key, config]) => (
                            <MenuItem key={key} value={key}>
                                {config.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <TableContainer
                component={Paper}
                elevation={1}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha('#000', 0.08)}`,
                    overflow: 'hidden',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: alpha(BLUE_COLOR, 0.05) }}>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Issue Details</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Vehicle</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Priority</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Reported</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Reported By</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: BLUE_DARK }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredIssues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <WarningIcon sx={{ fontSize: 48, color: alpha('#000', 0.1), mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No issues found. {searchQuery ? 'Try a different search.' : 'All vehicles are in good condition!'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredIssues.map((issue) => {
                                const vehicle = getVehicleInfo(issue.vehicleId);
                                const statusConfig = ISSUE_STATUS_CONFIG[issue.status] || ISSUE_STATUS_CONFIG.OPEN;
                                const priorityConfig = PRIORITY_CONFIG_FULL[issue.priority] || PRIORITY_CONFIG_FULL.MEDIUM;

                                return (
                                    <TableRow
                                        key={issue._id}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: alpha(BLUE_COLOR, 0.03),
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography fontWeight={600} gutterBottom>
                                                    {issue.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {issue.description?.substring(0, 100)}...
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {vehicle ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <TruckIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {vehicle.truckNumber}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {vehicle.vehicleType} • {vehicle.licensePlate}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Vehicle not found
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={issue.type}
                                                size="small"
                                                icon={<BuildIcon sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                    color: BLUE_DARK,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={priorityConfig.label}
                                                size="small"
                                                icon={issue.priority === 'HIGH' || issue.priority === 'CRITICAL' ? 
                                                    <PriorityIcon sx={{ fontSize: 14 }} /> : null}
                                                sx={{
                                                    backgroundColor: priorityConfig.bgColor,
                                                    color: priorityConfig.color,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={statusConfig.label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: statusConfig.bgColor,
                                                    color: statusConfig.color,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(issue.reportedDate).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(issue.reportedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <PersonIcon sx={{ fontSize: 16, color: BLUE_COLOR }} />
                                                <Typography variant="body2">
                                                    {issue.reportedByName || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Mark as In Progress">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleStatusChange(issue._id, 'IN_PROGRESS')}
                                                    disabled={issue.status === 'IN_PROGRESS' || issue.status === 'RESOLVED' || issue.status === 'CLOSED'}
                                                    sx={{
                                                        color: ORANGE_COLOR,
                                                        '&:hover': { backgroundColor: alpha(ORANGE_COLOR, 0.1) },
                                                    }}
                                                >
                                                    <BuildIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Mark as Resolved">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleStatusChange(issue._id, 'RESOLVED')}
                                                    disabled={issue.status === 'RESOLVED' || issue.status === 'CLOSED'}
                                                    sx={{
                                                        color: GREEN_COLOR,
                                                        '&:hover': { backgroundColor: alpha(GREEN_COLOR, 0.1) },
                                                    }}
                                                >
                                                    <CheckIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Report Issue Dialog */}
            <Dialog
                open={openIssueDialog}
                onClose={() => setOpenIssueDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{
                    pb: 2,
                    background: `linear-gradient(135deg, ${BLUE_COLOR} 0%, ${BLUE_DARK} 100%)`,
                    color: 'white',
                }}>
                    Report Vehicle Issue
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Select Vehicle</InputLabel>
                                <Select
                                    value={issueForm.vehicleId}
                                    onChange={(e) => setIssueForm({ ...issueForm, vehicleId: e.target.value })}
                                    label="Select Vehicle"
                                >
                                    {vehicles.map(vehicle => (
                                        <MenuItem key={vehicle._id} value={vehicle._id}>
                                            {vehicle.truckNumber} - {vehicle.vehicleType} ({vehicle.licensePlate})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Issue Title"
                                value={issueForm.title}
                                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Issue Type</InputLabel>
                                <Select
                                    value={issueForm.type}
                                    onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                                    label="Issue Type"
                                >
                                    {ISSUE_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={issueForm.priority}
                                    onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                                    label="Priority"
                                >
                                    {Object.entries(PRIORITY_CONFIG_FULL).map(([key, config]) => (
                                        <MenuItem key={key} value={key}>
                                            {config.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={4}
                                value={issueForm.description}
                                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                                size="small"
                                required
                                placeholder="Describe the issue in detail..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <OutlineButton onClick={() => setOpenIssueDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleCreateIssue}
                        disabled={!issueForm.vehicleId || !issueForm.title || !issueForm.type || !issueForm.description}
                        loading={createIssueMutation.isPending}
                    >
                        Submit Issue Report
                    </GradientButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VehicleIssues;