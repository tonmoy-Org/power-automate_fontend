import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Chip,
    Grid,
    Paper,
    IconButton,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    TextField,
    Button,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Snackbar,
    styled,
    Divider,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Badge,
    InputAdornment,
} from '@mui/material';
import {
    Close as CloseIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Build as BuildIcon,
    Assignment as AssignmentIcon,
    Delete as DeleteIcon,
    CloudUpload as CloudUploadIcon,
    Inventory as InventoryIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Add as AddIcon,
    ArrowBack as BackIcon,
    DirectionsCar as CarIcon,
    History as HistoryIcon,
    PriorityHigh as PriorityIcon,
    DoneAll as DoneIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import GradientButton from '../../../components/ui/GradientButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import axiosInstance from '../../../api/axios';
import { format } from 'date-fns';
import { ViewIcon } from 'lucide-react';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';
const GREEN_COLOR = '#10b981';
const RED_COLOR = '#ef4444';
const ORANGE_COLOR = '#f59e0b';
const PURPLE_COLOR = '#8b5cf6';

const STATUS_CONFIG = {
    AVAILABLE: { label: 'Available', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1), icon: <CheckIcon /> },
    IN_USE: { label: 'In Use', color: BLUE_COLOR, bgColor: alpha(BLUE_COLOR, 0.1), icon: <CarIcon /> },
    MAINTENANCE: { label: 'Maintenance', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1), icon: <BuildIcon /> },
    OUT_OF_SERVICE: { label: 'Out of Service', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1), icon: <WarningIcon /> },
};

const ISSUE_STATUS_CONFIG = {
    OPEN: { label: 'Open', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1), icon: <WarningIcon /> },
    IN_PROGRESS: { label: 'In Progress', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1), icon: <BuildIcon /> },
    RESOLVED: { label: 'Resolved', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1), icon: <CheckIcon /> },
    CLOSED: { label: 'Closed', color: BLUE_COLOR, bgColor: alpha(BLUE_COLOR, 0.1), icon: <DoneIcon /> },
};

const PRIORITY_CONFIG = {
    LOW: { label: 'Low', color: GREEN_COLOR, bgColor: alpha(GREEN_COLOR, 0.1), icon: <PriorityIcon /> },
    MEDIUM: { label: 'Medium', color: ORANGE_COLOR, bgColor: alpha(ORANGE_COLOR, 0.1), icon: <PriorityIcon /> },
    HIGH: { label: 'High', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.1), icon: <PriorityIcon /> },
    CRITICAL: { label: 'Critical', color: RED_COLOR, bgColor: alpha(RED_COLOR, 0.3), icon: <PriorityIcon /> },
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

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    padding: theme.spacing(2),
    borderRadius: 12,
    border: `1px solid ${alpha('#000', 0.08)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
}));

const PhotoUploadContainer = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: 12,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: BLUE_COLOR,
        backgroundColor: alpha(BLUE_COLOR, 0.02),
    },
}));

const VehicleDetails = ({ open, onClose, vehicle, technicians, onRefresh }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [reportingIssue, setReportingIssue] = useState(false);
    const [viewingIssue, setViewingIssue] = useState(null);
    const [addingNote, setAddingNote] = useState(false);
    const [addingParts, setAddingParts] = useState(false);
    const [issues, setIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [issueDetails, setIssueDetails] = useState(null);
    const [issueForm, setIssueForm] = useState({
        title: '',
        description: '',
        type: 'Other',
        priority: 'MEDIUM',
        estimatedCost: '',
        requiresAttention: false,
        isSafetyCritical: false,
        preventsDispatch: false,
    });
    const [noteForm, setNoteForm] = useState({
        text: '',
        isInternal: false,
    });
    const [partsForm, setPartsForm] = useState({
        partName: '',
        partNumber: '',
        quantity: 1,
        unitCost: '',
        supplier: '',
    });
    const [issuePhotos, setIssuePhotos] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        if (open && vehicle?._id) {
            fetchVehicleIssues();
            if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE') {
                setActiveTab(1);
            }
        }
    }, [open, vehicle?._id]);

    useEffect(() => {
        if (viewingIssue) {
            fetchIssueDetails(viewingIssue._id);
        }
    }, [viewingIssue]);

    if (!vehicle) return null;

    const statusConfig = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.AVAILABLE;
    const vehiclePhotos = vehicle.images || [];
    const allPhotos = [...vehiclePhotos, ...selectedPhotos];
    const openIssues = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS');
    const resolvedIssues = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED');

    const fetchVehicleIssues = async () => {
        if (!vehicle?._id) return;
        setLoadingIssues(true);
        try {
            const response = await axiosInstance.get(`/vehicle-issues/vehicle/${vehicle._id}`);
            console.log('Vehicle issues response:', response.data);
            if (response.data?.success || Array.isArray(response.data)) {
                const issuesData = response.data.data || response.data;
                setIssues(Array.isArray(issuesData) ? issuesData : [issuesData]);
            }
        } catch (error) {
            console.error('Error loading vehicle issues:', error);
            setSnackbar({
                open: true,
                message: 'Error loading vehicle issues',
                severity: 'error',
            });
        } finally {
            setLoadingIssues(false);
        }
    };

    const fetchIssueDetails = async (issueId) => {
        setLoadingDetails(true);
        try {
            const response = await axiosInstance.get(`/vehicle-issues/${issueId}`);
            if (response.data?.success) {
                setIssueDetails(response.data.data);
            }
        } catch (error) {
            console.error('Error loading issue details:', error);
            setSnackbar({
                open: true,
                message: 'Error loading issue details',
                severity: 'error',
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePhotoUpload = (event, isIssuePhoto = false) => {
        const files = Array.from(event.target.files);
        const uploadedPhotos = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            url: URL.createObjectURL(file),
            file,
            uploadedAt: new Date(),
        }));
        isIssuePhoto
            ? setIssuePhotos(prev => [...prev, ...uploadedPhotos])
            : setSelectedPhotos(prev => [...prev, ...uploadedPhotos]);
        event.target.value = '';
    };

    const handleRemovePhoto = (photoId, isIssuePhoto = false) => {
        isIssuePhoto
            ? setIssuePhotos(prev => prev.filter(photo => photo.id !== photoId))
            : setSelectedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    };

    const handleSubmitIssue = async () => {
        if (!issueForm.title || !issueForm.description || !issueForm.type) {
            setSnackbar({
                open: true,
                message: 'Please fill all required fields',
                severity: 'warning',
            });
            return;
        }
        setUploading(true);
        try {
            const issueData = {
                vehicleId: vehicle._id,
                title: issueForm.title,
                description: issueForm.description,
                type: issueForm.type,
                priority: issueForm.priority,
                estimatedCost: issueForm.estimatedCost ? parseFloat(issueForm.estimatedCost) : 0,
                requiresAttention: issueForm.requiresAttention,
                isSafetyCritical: issueForm.isSafetyCritical,
                preventsDispatch: issueForm.preventsDispatch,
            };
            const formData = new FormData();
            formData.append('data', JSON.stringify(issueData));
            issuePhotos.forEach(photo => {
                if (photo.file) {
                    formData.append('images', photo.file);
                }
            });
            const response = await axiosInstance.post('/vehicle-issues', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data?.success) {
                setSnackbar({
                    open: true,
                    message: 'Issue reported successfully',
                    severity: 'success',
                });
                setReportingIssue(false);
                setIssueForm({
                    title: '',
                    description: '',
                    type: 'Other',
                    priority: 'MEDIUM',
                    estimatedCost: '',
                    requiresAttention: false,
                    isSafetyCritical: false,
                    preventsDispatch: false,
                });
                setIssuePhotos([]);
                fetchVehicleIssues();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Error reporting issue:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error reporting issue',
                severity: 'error',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleStatusChange = async (issueId, newStatus) => {
        try {
            const response = await axiosInstance.patch(`/vehicle-issues/${issueId}/status`, { status: newStatus });
            if (response.data?.success) {
                setSnackbar({ open: true, message: `Issue marked as ${newStatus}`, severity: 'success' });
                fetchVehicleIssues();
                if (viewingIssue?._id === issueId) {
                    fetchIssueDetails(issueId);
                }
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
        }
    };

    const handleAddNote = async (issueId) => {
        if (!noteForm.text.trim()) return;
        try {
            const response = await axiosInstance.post(`/vehicle-issues/${issueId}/notes`, noteForm);
            if (response.data?.success) {
                setSnackbar({ open: true, message: 'Note added successfully', severity: 'success' });
                setNoteForm({ text: '', isInternal: false });
                setAddingNote(false);
                fetchIssueDetails(issueId);
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Error adding note', severity: 'error' });
        }
    };

    const handleAddParts = async (issueId) => {
        if (!partsForm.partName || !partsForm.quantity || !partsForm.unitCost) return;
        try {
            const response = await axiosInstance.post(`/vehicle-issues/${issueId}/parts`, {
                ...partsForm,
                totalCost: partsForm.quantity * parseFloat(partsForm.unitCost),
            });
            if (response.data?.success) {
                setSnackbar({ open: true, message: 'Parts added successfully', severity: 'success' });
                setPartsForm({
                    partName: '',
                    partNumber: '',
                    quantity: 1,
                    unitCost: '',
                    supplier: '',
                });
                setAddingParts(false);
                fetchIssueDetails(issueId);
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Error adding parts', severity: 'error' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const calculateTotalCost = (issue) => {
        if (!issue.partsUsed?.length) return issue.actualCost || 0;
        return issue.partsUsed.reduce((sum, part) => sum + (part.totalCost || part.unitCost * part.quantity), 0);
    };

    const renderIssueDetails = () => {
        if (!issueDetails) return null;
        const totalCost = calculateTotalCost(issueDetails);
        const statusConfig = ISSUE_STATUS_CONFIG[issueDetails.status] || ISSUE_STATUS_CONFIG.OPEN;
        const priorityConfig = PRIORITY_CONFIG[issueDetails.priority] || PRIORITY_CONFIG.MEDIUM;

        return (
            <Box>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => setViewingIssue(null)} sx={{ mr: 2 }}>
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600}>{issueDetails.title}</Typography>
                </Box>
                {loadingDetails ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {/* Left Column - Issue Info */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Item sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                            Issue Description
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {issueDetails.description}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" gap={1}>
                                        <Chip
                                            label={statusConfig.label}
                                            size="small"
                                            sx={{
                                                backgroundColor: statusConfig.bgColor,
                                                color: statusConfig.color,
                                                fontWeight: 600,
                                            }}
                                        />
                                        <Chip
                                            label={priorityConfig.label}
                                            size="small"
                                            sx={{
                                                backgroundColor: priorityConfig.bgColor,
                                                color: priorityConfig.color,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Type</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {issueDetails.type}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Reported By</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {issueDetails.reportedByName || 'Unknown'}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Reported Date</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {formatDate(issueDetails.reportedDate)}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {formatDate(issueDetails.updatedAt)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Item>

                            {/* Status History */}
                            <Item sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Status History
                                </Typography>
                                <List dense>
                                    {issueDetails.statusHistory?.map((history, index) => (
                                        <ListItem key={index} divider={index < issueDetails.statusHistory.length - 1}>
                                            <ListItemIcon>
                                                {ISSUE_STATUS_CONFIG[history.status]?.icon || <HistoryIcon />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={history.status}
                                                secondary={`${formatDate(history.createdAt)} • ${history.changedByName || 'System'}`}
                                            />
                                            {history.notes && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {history.notes}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </Item>

                            {/* Notes */}
                            <Item sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Notes ({issueDetails.notes?.length || 0})
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => setAddingNote(true)}
                                    >
                                        Add Note
                                    </Button>
                                </Box>
                                {issueDetails.notes?.map((note, index) => (
                                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: alpha('#000', 0.02), borderRadius: 1 }}>
                                        <Typography variant="body2" paragraph>
                                            {note.text}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">
                                                {note.createdBy?.name || 'Unknown'} • {formatDate(note.createdAt)}
                                            </Typography>
                                            {note.isInternal && (
                                                <Chip label="Internal" size="small" sx={{ height: 20 }} />
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                                {addingNote && (
                                    <Box mt={2}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder="Add a note..."
                                            value={noteForm.text}
                                            onChange={(e) => setNoteForm({ ...noteForm, text: e.target.value })}
                                            sx={{ mb: 1 }}
                                        />
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={noteForm.isInternal}
                                                        onChange={(e) => setNoteForm({ ...noteForm, isInternal: e.target.checked })}
                                                        size="small"
                                                    />
                                                }
                                                label="Internal Note"
                                            />
                                            <Box>
                                                <Button onClick={() => setAddingNote(false)}>Cancel</Button>
                                                <GradientButton onClick={() => handleAddNote(issueDetails._id)}>
                                                    Save Note
                                                </GradientButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </Item>
                        </Grid>

                        {/* Right Column - Actions & Details */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            {/* Quick Actions */}
                            <Item sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Quick Actions
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {issueDetails.status === 'OPEN' && (
                                        <GradientButton
                                            fullWidth
                                            startIcon={<BuildIcon />}
                                            onClick={() => handleStatusChange(issueDetails._id, 'IN_PROGRESS')}
                                        >
                                            Start Work
                                        </GradientButton>
                                    )}
                                    {issueDetails.status === 'IN_PROGRESS' && (
                                        <GradientButton
                                            fullWidth
                                            startIcon={<CheckIcon />}
                                            onClick={() => handleStatusChange(issueDetails._id, 'RESOLVED')}
                                        >
                                            Mark as Resolved
                                        </GradientButton>
                                    )}
                                    <OutlineButton
                                        fullWidth
                                        startIcon={<AssignmentIcon />}
                                        onClick={() => {
                                            // Handle technician assignment modal
                                        }}
                                    >
                                        Assign Technician
                                    </OutlineButton>
                                    <OutlineButton
                                        fullWidth
                                        startIcon={<InventoryIcon />}
                                        onClick={() => setAddingParts(true)}
                                    >
                                        Add Parts
                                    </OutlineButton>
                                </Box>
                            </Item>

                            {/* Cost Summary */}
                            <Item sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Cost Summary
                                </Typography>
                                <Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Estimated Cost:</Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formatCurrency(issueDetails.estimatedCost)}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Actual Cost:</Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formatCurrency(issueDetails.actualCost)}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Parts Cost:</Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formatCurrency(totalCost)}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body1" fontWeight={600}>Total:</Typography>
                                        <Typography variant="body1" fontWeight={600} color={GREEN_COLOR}>
                                            {formatCurrency((issueDetails.actualCost || 0) + totalCost)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Item>

                            {/* Parts Used */}
                            {issueDetails.partsUsed?.length > 0 && (
                                <Item sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Parts Used ({issueDetails.partsUsed.length})
                                    </Typography>
                                    <List dense>
                                        {issueDetails.partsUsed.map((part, index) => (
                                            <ListItem key={index} divider={index < issueDetails.partsUsed.length - 1}>
                                                <ListItemIcon>
                                                    <InventoryIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={part.partName}
                                                    secondary={`Qty: ${part.quantity} • ${formatCurrency(part.unitCost)} each`}
                                                />
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(part.totalCost || part.unitCost * part.quantity)}
                                                </Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Item>
                            )}

                            {/* Images */}
                            {issueDetails.images?.length > 0 && (
                                <Item>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Images ({issueDetails.images.length})
                                    </Typography>
                                    <ImageList cols={2} gap={8}>
                                        {issueDetails.images.map((image, index) => (
                                            <ImageListItem key={index}>
                                                <img
                                                    src={image}
                                                    alt={`Issue image ${index + 1}`}
                                                    loading="lazy"
                                                    style={{ borderRadius: 8 }}
                                                />
                                            </ImageListItem>
                                        ))}
                                    </ImageList>
                                </Item>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Box>
        );
    };

    const renderReportIssue = () => (
        <Box>
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => setReportingIssue(false)} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={600}>Report New Issue</Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Issue Title *"
                        value={issueForm.title}
                        onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                        size="small"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Issue Type *</InputLabel>
                        <Select
                            value={issueForm.type}
                            onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                            label="Issue Type *"
                        >
                            {ISSUE_TYPES.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                            value={issueForm.priority}
                            onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                            label="Priority"
                        >
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <MenuItem key={key} value={key}>{config.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Estimated Cost"
                        type="number"
                        value={issueForm.estimatedCost}
                        onChange={(e) => setIssueForm({ ...issueForm, estimatedCost: e.target.value })}
                        size="small"
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Description *"
                        multiline
                        rows={4}
                        value={issueForm.description}
                        onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                        size="small"
                        placeholder="Describe the issue in detail..."
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={2}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={issueForm.requiresAttention}
                                    onChange={(e) => setIssueForm({ ...issueForm, requiresAttention: e.target.checked })}
                                />
                            }
                            label="Requires Immediate Attention"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={issueForm.isSafetyCritical}
                                    onChange={(e) => setIssueForm({ ...issueForm, isSafetyCritical: e.target.checked })}
                                />
                            }
                            label="Safety Critical"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={issueForm.preventsDispatch}
                                    onChange={(e) => setIssueForm({ ...issueForm, preventsDispatch: e.target.checked })}
                                />
                            }
                            label="Prevents Dispatch"
                        />
                    </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Upload Images</Typography>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="issue-photo-upload"
                        multiple
                        type="file"
                        onChange={(e) => handlePhotoUpload(e, true)}
                    />
                    <label htmlFor="issue-photo-upload">
                        <PhotoUploadContainer>
                            <CloudUploadIcon sx={{ fontSize: 48, color: BLUE_COLOR, mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Click to upload issue images
                            </Typography>
                            <OutlineButton component="span">Select Photos</OutlineButton>
                        </PhotoUploadContainer>
                    </label>
                    {issuePhotos.length > 0 && (
                        <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
                            {issuePhotos.map(photo => (
                                <ImageListItem key={photo.id}>
                                    <img src={photo.url} alt={photo.name} loading="lazy" />
                                    <ImageListItemBar
                                        title={photo.name}
                                        actionIcon={
                                            <IconButton
                                                sx={{ color: 'white' }}
                                                onClick={() => handleRemovePhoto(photo.id, true)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <OutlineButton onClick={() => setReportingIssue(false)}>
                            Cancel
                        </OutlineButton>
                        <GradientButton
                            onClick={handleSubmitIssue}
                            disabled={uploading || !issueForm.title || !issueForm.description || !issueForm.type}
                            loading={uploading}
                        >
                            {uploading ? 'Submitting...' : 'Submit Issue Report'}
                        </GradientButton>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, height: '90vh' } }}
            >
                {viewingIssue ? (
                    <DialogContent sx={{ p: 3, overflow: 'auto' }}>
                        {renderIssueDetails()}
                    </DialogContent>
                ) : reportingIssue ? (
                    <DialogContent sx={{ p: 3, overflow: 'auto' }}>
                        {renderReportIssue()}
                    </DialogContent>
                ) : (
                    <>
                        <DialogTitle sx={{
                            background: `linear-gradient(135deg, ${BLUE_COLOR}, ${BLUE_DARK})`,
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {vehicle.truckNumber}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="body2">
                                        {vehicle.licensePlate} • {vehicle.vehicleType}
                                    </Typography>
                                    <Chip
                                        label={statusConfig.label}
                                        size="small"
                                        sx={{
                                            backgroundColor: alpha('#fff', 0.2),
                                            color: 'white',
                                            fontWeight: 600,
                                        }}
                                        icon={statusConfig.icon}
                                    />
                                </Box>
                            </Box>
                            <IconButton onClick={onClose} sx={{ color: 'white' }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <Tabs
                                value={activeTab}
                                onChange={(e, v) => setActiveTab(v)}
                                sx={{
                                    minHeight: 48,
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '0.875rem',
                                        minHeight: 48,
                                        '&.Mui-selected': {
                                            color: BLUE_DARK,
                                        },
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: BLUE_DARK,
                                    },
                                }}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tab
                                    label={
                                        <Badge badgeContent={openIssues.length} color="error">
                                            <Box>Overview</Box>
                                        </Badge>
                                    }
                                />
                                <Tab
                                    label={
                                        <Badge badgeContent={openIssues.length} color="error">
                                            <Box>Active Issues</Box>
                                        </Badge>
                                    }
                                />
                                <Tab label="History" />
                                <Tab label={`Photos (${allPhotos.length})`} />
                                <Tab label="Maintenance" />
                            </Tabs>
                            <Box sx={{ p: 3, overflow: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                                {activeTab === 0 && (
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12 }}>
                                            <Item>
                                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                                    <Box>
                                                        <Typography variant="h6" gutterBottom>
                                                            Vehicle Information
                                                        </Typography>
                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Make & Model
                                                                </Typography>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {vehicle.make} {vehicle.model}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Year
                                                                </Typography>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {vehicle.year || 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    VIN
                                                                </Typography>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {vehicle.vin || 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Fuel Type
                                                                </Typography>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {vehicle.fuelType || 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                    <Box>
                                                        <GradientButton
                                                            startIcon={<WarningIcon />}
                                                            onClick={() => setReportingIssue(true)}
                                                        >
                                                            Report Issue
                                                        </GradientButton>
                                                    </Box>
                                                </Box>
                                            </Item>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Item>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                    Status Overview
                                                </Typography>
                                                <Box>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="body2">Current Status:</Typography>
                                                        <Chip
                                                            label={statusConfig.label}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: statusConfig.bgColor,
                                                                color: statusConfig.color,
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="body2">Last Maintenance:</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {vehicle.lastMaintenanceDate ? formatDate(vehicle.lastMaintenanceDate) : 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between">
                                                        <Typography variant="body2">Next Service Due:</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {vehicle.nextServiceDate ? formatDate(vehicle.nextServiceDate) : 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Item>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Item>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                    Issues Summary
                                                </Typography>
                                                <Box>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="body2">Active Issues:</Typography>
                                                        <Chip
                                                            label={openIssues.length}
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="body2">Total Issues:</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {issues.length}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between">
                                                        <Typography variant="body2">Resolution Rate:</Typography>
                                                        <Typography variant="body2" fontWeight={500} color={GREEN_COLOR}>
                                                            {issues.length > 0 ? `${Math.round((resolvedIssues.length / issues.length) * 100)}%` : '100%'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Item>
                                        </Grid>
                                    </Grid>
                                )}

                                {activeTab === 1 && (
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Typography variant="h6">
                                                Active Issues ({openIssues.length})
                                            </Typography>
                                            <GradientButton
                                                startIcon={<AddIcon />}
                                                onClick={() => setReportingIssue(true)}
                                            >
                                                Report New Issue
                                            </GradientButton>
                                        </Box>
                                        {loadingIssues ? (
                                            <Box display="flex" justifyContent="center" p={3}>
                                                <CircularProgress />
                                            </Box>
                                        ) : openIssues.length === 0 ? (
                                            <Item sx={{ textAlign: 'center', py: 4 }}>
                                                <CheckIcon sx={{ fontSize: 48, color: GREEN_COLOR, mb: 2 }} />
                                                <Typography variant="h6" gutterBottom>
                                                    No Active Issues
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    All reported issues have been resolved.
                                                </Typography>
                                                <GradientButton
                                                    startIcon={<WarningIcon />}
                                                    onClick={() => setReportingIssue(true)}
                                                >
                                                    Report First Issue
                                                </GradientButton>
                                            </Item>
                                        ) : (
                                            <Grid container spacing={2}>
                                                {openIssues.map(issue => {
                                                    const statusConfig = ISSUE_STATUS_CONFIG[issue.status] || ISSUE_STATUS_CONFIG.OPEN;
                                                    const priorityConfig = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.MEDIUM;
                                                    return (
                                                        <Grid size={{ xs: 12 }} key={issue._id}>
                                                            <Item>
                                                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                                                    <Box flex={1}>
                                                                        <Box display="flex" gap={2} alignItems="center" mb={1}>
                                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                                {issue.title}
                                                                            </Typography>
                                                                            <Chip
                                                                                label={statusConfig.label}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: statusConfig.bgColor,
                                                                                    color: statusConfig.color,
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />
                                                                            <Chip
                                                                                label={priorityConfig.label}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: priorityConfig.bgColor,
                                                                                    color: priorityConfig.color,
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                        <Typography variant="body2" color="text.secondary" paragraph>
                                                                            {issue.description?.substring(0, 200)}...
                                                                        </Typography>
                                                                        <Box display="flex" gap={2}>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                <CalendarIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                                                {formatDate(issue.reportedDate)}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                <PersonIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                                                {issue.reportedByName || 'Unknown'}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                <BuildIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                                                {issue.type}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <Box display="flex" flexDirection="column" gap={1}>
                                                                        <GradientButton
                                                                            size="small"
                                                                            startIcon={<ViewIcon />}
                                                                            onClick={() => setViewingIssue(issue)}
                                                                        >
                                                                            View Details
                                                                        </GradientButton>
                                                                        {issue.status === 'OPEN' && (
                                                                            <OutlineButton
                                                                                size="small"
                                                                                startIcon={<BuildIcon />}
                                                                                onClick={() => handleStatusChange(issue._id, 'IN_PROGRESS')}
                                                                            >
                                                                                Start Work
                                                                            </OutlineButton>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            </Item>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        )}
                                    </Box>
                                )}

                                {activeTab === 2 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>Vehicle History</Typography>
                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Item>
                                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                        Timeline
                                                    </Typography>
                                                    <List dense>
                                                        <ListItem>
                                                            <ListItemIcon><CalendarIcon /></ListItemIcon>
                                                            <ListItemText
                                                                primary="Created"
                                                                secondary={formatDate(vehicle.createdAt)}
                                                            />
                                                        </ListItem>
                                                        <ListItem>
                                                            <ListItemIcon><CalendarIcon /></ListItemIcon>
                                                            <ListItemText
                                                                primary="Last Updated"
                                                                secondary={formatDate(vehicle.updatedAt)}
                                                            />
                                                        </ListItem>
                                                        {vehicle.lastMaintenanceDate && (
                                                            <ListItem>
                                                                <ListItemIcon><BuildIcon /></ListItemIcon>
                                                                <ListItemText
                                                                    primary="Last Maintenance"
                                                                    secondary={formatDate(vehicle.lastMaintenanceDate)}
                                                                />
                                                            </ListItem>
                                                        )}
                                                    </List>
                                                </Item>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Item>
                                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                        Resolved Issues ({resolvedIssues.length})
                                                    </Typography>
                                                    {resolvedIssues.length === 0 ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No resolved issues yet.
                                                        </Typography>
                                                    ) : (
                                                        <List dense>
                                                            {resolvedIssues.slice(0, 5).map(issue => (
                                                                <ListItem key={issue._id}>
                                                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                                                    <ListItemText
                                                                        primary={issue.title}
                                                                        secondary={`Resolved: ${formatDate(issue.updatedAt)}`}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    )}
                                                </Item>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {activeTab === 3 && (
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Typography variant="h6">
                                                Photos ({allPhotos.length})
                                            </Typography>
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="vehicle-photo-upload"
                                                multiple
                                                type="file"
                                                onChange={e => handlePhotoUpload(e)}
                                            />
                                            <label htmlFor="vehicle-photo-upload">
                                                <GradientButton component="span" startIcon={<CloudUploadIcon />}>
                                                    Upload Photos
                                                </GradientButton>
                                            </label>
                                        </Box>
                                        {allPhotos.length === 0 ? (
                                            <PhotoUploadContainer>
                                                <CloudUploadIcon sx={{ fontSize: 48, color: alpha('#000', 0.3), mb: 2 }} />
                                                <Typography variant="h6" gutterBottom>
                                                    No Photos Available
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    Upload photos of the vehicle for documentation.
                                                </Typography>
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="vehicle-photo-upload-empty"
                                                    multiple
                                                    type="file"
                                                    onChange={e => handlePhotoUpload(e)}
                                                />
                                                <label htmlFor="vehicle-photo-upload-empty">
                                                    <GradientButton component="span">
                                                        Upload First Photo
                                                    </GradientButton>
                                                </label>
                                            </PhotoUploadContainer>
                                        ) : (
                                            <ImageList cols={3} gap={16} variant="masonry">
                                                {allPhotos.map((photo, index) => (
                                                    <ImageListItem key={photo.id || index}>
                                                        <img
                                                            src={photo.url || photo}
                                                            alt={`Vehicle photo ${index + 1}`}
                                                            loading="lazy"
                                                            style={{ borderRadius: 8 }}
                                                        />
                                                        <ImageListItemBar
                                                            title={`Photo ${index + 1}`}
                                                            subtitle={photo.uploadedAt && formatDate(photo.uploadedAt)}
                                                            actionIcon={
                                                                photo.id && (
                                                                    <IconButton
                                                                        sx={{ color: 'white' }}
                                                                        onClick={() => handleRemovePhoto(photo.id)}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                )
                                                            }
                                                        />
                                                    </ImageListItem>
                                                ))}
                                            </ImageList>
                                        )}
                                    </Box>
                                )}

                                {activeTab === 4 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>Maintenance Records</Typography>
                                        <Item>
                                            <Typography variant="body2" color="text.secondary" align="center" py={3}>
                                                Maintenance records feature coming soon...
                                            </Typography>
                                        </Item>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar(p => ({ ...p, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default VehicleDetails;