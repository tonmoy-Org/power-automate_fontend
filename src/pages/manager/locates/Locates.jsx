import React, { useState, useMemo, useEffect } from 'react';
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
    Snackbar,
    Alert,
    CircularProgress,
    Avatar,
    Stack,
    Checkbox,
    Button,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    DialogContentText,
} from '@mui/material';
import {
    Sync as SyncIcon,
    CheckCircle,
    AccessTime,
    Timer,
    Email,
    Person,
    Tag,
    Edit,
    Close,
    Add,
    Delete,
    Search,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';
import {
    format,
    addBusinessDays,
    addHours,
    isBefore,
    isWeekend,
    addDays,
} from 'date-fns';
import StyledTextField from '../../../components/ui/StyledTextField';

// ── Utility function ──
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
        console.warn('Invalid date format:', dateString);
        return '—';
    }
};

// Format emergency countdown
const formatEmergencyCountdown = (remainingMs) => {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

// Calculate business days remaining
const getBusinessDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);

    if (now >= end) return { days: 0, expired: true };

    let current = new Date(now);
    let businessDays = 0;

    // Move to next day if we're past business hours (5 PM)
    if (current.getHours() >= 17) {
        current = addDays(current, 1);
    }

    // Set to start of next business day
    current.setHours(8, 0, 0, 0);

    while (current < end) {
        if (!isWeekend(current)) {
            businessDays++;
        }
        current = addDays(current, 1);
    }

    return { days: businessDays, expired: false };
};

const BLUE_COLOR = '#1976d2';
const BLUE_DARK = '#1565c0';
const GREEN_COLOR = '#2e7d32';
const RED_COLOR = '#d32f2f';
const ORANGE_COLOR = '#ed6c02';
const PURPLE_COLOR = '#9c27b0';

const parseDashboardAddress = (fullAddress) => {
    if (!fullAddress) return { street: '', city: '', state: '', zip: '', original: '' };
    const parts = fullAddress.split(' - ');
    if (parts.length < 2) return { street: fullAddress, city: '', state: '', zip: '', original: fullAddress };
    const street = parts[0].trim();
    const remaining = parts[1].trim();
    const zipMatch = remaining.match(/\b\d{5}\b/);
    const zip = zipMatch ? zipMatch[0] : '';
    const withoutZip = remaining.replace(zip, '').trim();
    const cityState = withoutZip.split(',').map(s => s.trim());
    return {
        street,
        city: cityState[0] || '',
        state: cityState[1] || '',
        zip,
        original: fullAddress,
    };
};

// Function to get user data from localStorage
const getUserDataFromStorage = () => {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            return {
                name: parsed.name || parsed.fullName || parsed.displayName || '',
                email: parsed.email || '',
            };
        }
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
    }
    return { name: '', email: '' };
};

const Locates = () => {
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Get user data from localStorage
    const userData = getUserDataFromStorage();

    const [selectedExcavator, setSelectedExcavator] = useState(new Set());
    const [selectedInProgress, setSelectedInProgress] = useState(new Set());
    const [selectedCompleted, setSelectedCompleted] = useState(new Set());

    // Dialogs
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());
    const [deletionSection, setDeletionSection] = useState('');
    const [selectedForTagging, setSelectedForTagging] = useState([]);
    const [tagForm, setTagForm] = useState({
        name: userData.name,
        email: userData.email,
        tags: 'Locates Needed',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyUntagged, setShowOnlyUntagged] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // Update current time every second for countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // ── Data Fetching ──
    const { data: rawData = [], isLoading, refetch } = useQuery({
        queryKey: ['locates-all'],
        queryFn: async () => {
            const res = await axiosInstance.get('/locates/all-locates');
            return Array.isArray(res.data) ? res.data : res.data?.data || [];
        },
        staleTime: 3 * 60 * 1000,
    });

    // ── Mutations ──
    const invalidateAndRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['locates-all'] });
        queryClient.refetchQueries({ queryKey: ['locates-all'] });
    };

    const syncMutation = useMutation({
        mutationFn: () => axiosInstance.get('/locates/sync-dashboard'),
        onSuccess: () => {
            invalidateAndRefetch();
            showSnackbar('Sync completed successfully', 'success');
        },
        onError: (err) => showSnackbar(err?.response?.data?.message || 'Sync failed', 'error'),
    });

    const markCalledMutation = useMutation({
        mutationFn: async ({ id, callType }) => {
            console.log('=== FRONTEND DEBUG ===');
            console.log('Marking as called:', { id, callType });

            const response = await axiosInstance.patch(
                `/locates/work-order/${id}/update-call-status`,
                {
                    locatesCalled: true,
                    callType,
                    calledAt: new Date().toISOString(),
                }
            );

            console.log('Response received:', response.data);
            return response;
        },
        onSuccess: (response) => {
            console.log('Mutation success:', response.data);
            invalidateAndRefetch();
            showSnackbar('Locate call status updated', 'success');
        },
        onError: (err) => {
            console.error('Mutation error:', err);
            console.error('Error response:', err.response?.data);
            showSnackbar(err?.response?.data?.message || 'Update failed', 'error');
        },
    });

    const deleteBulkMutation = useMutation({
        mutationFn: (ids) =>
            axiosInstance.delete('/locates/work-order/bulk-delete', { data: { ids: Array.from(ids) } }),
        onSuccess: () => {
            invalidateAndRefetch();
            setSelectedExcavator(new Set());
            setSelectedInProgress(new Set());
            setSelectedCompleted(new Set());
            showSnackbar('Selected items deleted', 'success');
        },
        onError: (err) => showSnackbar(err?.response?.data?.message || 'Delete failed', 'error'),
    });

    // ── Tagging Mutations ──
    const tagLocatesNeededMutation = useMutation({
        mutationFn: async ({ workOrderNumber, name, email, tags }) => {
            const response = await axiosInstance.post('/locates/tag-locates-needed', {
                workOrderNumber,
                name,
                email,
                tags,
            });
            return response.data;
        },
        onSuccess: (data) => {
            invalidateAndRefetch();
            setTagDialogOpen(false);
            setTagForm({
                name: userData.name,
                email: userData.email,
                tags: 'Locates Needed',
            });
            showSnackbar(data.message || 'Work order tagged successfully', 'success');
        },
        onError: (err) => {
            showSnackbar(err?.response?.data?.message || 'Tagging failed', 'error');
        },
    });

    const bulkTagLocatesNeededMutation = useMutation({
        mutationFn: async ({ workOrderNumbers, name, email, tags }) => {
            const response = await axiosInstance.post('/locates/bulk-tag-locates-needed', {
                workOrderNumbers,
                name,
                email,
                tags,
            });
            return response.data;
        },
        onSuccess: (data) => {
            invalidateAndRefetch();
            setBulkTagDialogOpen(false);
            setSelectedExcavator(new Set());
            setTagForm({
                name: userData.name,
                email: userData.email,
                tags: 'Locates Needed',
            });
            showSnackbar(data.message || 'Bulk tagging completed', 'success');
        },
        onError: (err) => {
            showSnackbar(err?.response?.data?.message || 'Bulk tagging failed', 'error');
        },
    });

    // ── Data Processing ──
    const processed = useMemo(() => {
        return rawData
            .flatMap(item => item.workOrders || [])
            .map(wo => {
                const addr = parseDashboardAddress(wo.customerAddress || '');
                const isEmergency = (wo.type || wo.priorityName || '').toUpperCase().includes('EMERGENCY');
                const type = isEmergency ? 'EMERGENCY' : 'STANDARD';

                let completionDate = null;
                let timeRemainingText = '';
                let timeRemainingDetail = '';
                let timeRemainingColor = 'inherit';
                let isExpired = false;

                // Extract called by information
                const calledByName = wo.calledBy || wo.metadata?.updatedBy || '';
                const calledByEmail = wo.calledByEmail || '';
                const taggedByName = wo.taggedBy || '';
                const taggedByEmail = wo.taggedByEmail || '';

                if (wo.locatesCalled && wo.calledAt && wo.callType) {
                    const called = new Date(wo.calledAt);
                    completionDate = wo.completionDate ? new Date(wo.completionDate) :
                        (wo.callType === 'EMERGENCY' ? addHours(called, 4) : addBusinessDays(called, 2));

                    const now = currentTime;
                    isExpired = isBefore(completionDate, now);

                    if (!isExpired) {
                        if (wo.callType === 'EMERGENCY') {
                            // Emergency: 4 hours from called time
                            const totalMs = 4 * 60 * 60 * 1000;
                            const elapsedMs = now.getTime() - called.getTime();
                            const remainingMs = Math.max(0, totalMs - elapsedMs);

                            timeRemainingText = formatEmergencyCountdown(remainingMs);
                            timeRemainingDetail = `Expires at: ${format(completionDate, 'MMM dd, HH:mm:ss')}`;

                            // Color coding for emergency
                            if (remainingMs <= 30 * 60 * 1000) {
                                timeRemainingColor = RED_COLOR;
                            } else if (remainingMs <= 60 * 60 * 1000) {
                                timeRemainingColor = ORANGE_COLOR;
                            } else {
                                timeRemainingColor = BLUE_COLOR;
                            }
                        } else {
                            // Standard: 2 business days
                            const businessInfo = getBusinessDaysRemaining(completionDate);

                            // Check if it's a business day
                            const now = new Date();
                            const isBusinessDay = !isWeekend(now);

                            if (businessInfo.days === 0 && isBusinessDay) {
                                const businessHoursRemaining = Math.max(0, 17 - now.getHours());
                                timeRemainingText = `${businessHoursRemaining}h remaining today`;
                            } else if (businessInfo.days === 1) {
                                timeRemainingText = `1 business day`;
                            } else {
                                timeRemainingText = `${businessInfo.days} business days`;
                            }

                            timeRemainingDetail = `Expires: ${format(completionDate, 'MMM dd, yyyy')}`;

                            // Color coding for standard
                            if (businessInfo.days === 0) {
                                timeRemainingColor = ORANGE_COLOR;
                            } else if (businessInfo.days <= 1) {
                                timeRemainingColor = ORANGE_COLOR;
                            } else {
                                timeRemainingColor = BLUE_COLOR;
                            }
                        }
                    } else {
                        timeRemainingText = 'EXPIRED';
                        timeRemainingDetail = `Expired on: ${format(completionDate, 'MMM dd, yyyy HH:mm')}`;
                        timeRemainingColor = RED_COLOR;
                    }
                }

                return {
                    id: wo._id || `ext-${wo.workOrderNumber || Math.random().toString(36).slice(2, 9)}`,
                    jobId: wo.workOrderNumber || 'N/A',
                    workOrderNumber: wo.workOrderNumber || '',
                    customerName: wo.customerName || 'Unknown',
                    ...addr,
                    type,
                    techName: wo.techName || wo.technician || 'Unassigned',
                    requestedDate: wo.createdDate || wo.requestedDate,
                    completedAt: wo.completedDate,
                    locatesCalled: !!wo.locatesCalled,
                    callType: wo.callType || null,
                    calledByName,
                    calledByEmail,
                    taggedByName,
                    taggedByEmail,
                    calledAt: wo.calledAt,
                    completionDate: completionDate,
                    priorityName: wo.priorityName || 'Standard',
                    priorityColor: wo.priorityColor,
                    needsCall: (wo.priorityName || '').toUpperCase() === 'EXCAVATOR',
                    isExpired,
                    timeRemainingText,
                    timeRemainingDetail,
                    timeRemainingColor,
                    tags: wo.tags || '',
                    manuallyTagged: wo.manuallyTagged || false,
                };
            });
    }, [rawData, currentTime]);

    const excavatorPending = useMemo(() => {
        let filtered = processed.filter(l => l.needsCall && !l.locatesCalled);

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(l =>
                l.workOrderNumber?.toLowerCase().includes(searchLower) ||
                l.customerName?.toLowerCase().includes(searchLower) ||
                l.street?.toLowerCase().includes(searchLower) ||
                l.city?.toLowerCase().includes(searchLower) ||
                l.techName?.toLowerCase().includes(searchLower)
            );
        }

        // Apply "Show Only Untagged" filter
        if (showOnlyUntagged) {
            filtered = filtered.filter(l => !l.manuallyTagged);
        }

        return filtered;
    }, [processed, searchTerm, showOnlyUntagged]);

    const inProgress = useMemo(() =>
        processed.filter(l => l.locatesCalled && !l.isExpired), [processed]);

    const completed = useMemo(() =>
        processed.filter(l => l.locatesCalled && l.isExpired), [processed]);

    // ── Helpers ──
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleMarkCalled = (id, callType) => {
        markCalledMutation.mutate({ id, callType });
    };

    const confirmBulkDelete = (selectionSet, section) => {
        if (selectionSet.size === 0) return;

        setSelectedForDeletion(selectionSet);
        setDeletionSection(section);
        setDeleteDialogOpen(true);
    };

    const executeBulkDelete = () => {
        deleteBulkMutation.mutate(selectedForDeletion);
        setDeleteDialogOpen(false);
        setSelectedForDeletion(new Set());
    };

    const toggleSelection = (setState, id) => {
        setState(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    // Tagging functions
    const openTagDialog = (item) => {
        setSelectedForTagging([item]);
        setTagForm({
            name: userData.name,
            email: userData.email,
            tags: item.tags || 'Locates Needed',
        });
        setTagDialogOpen(true);
    };

    const openBulkTagDialog = () => {
        const selectedItems = Array.from(selectedExcavator)
            .map(id => excavatorPending.find(item => item.id === id))
            .filter(Boolean);

        if (selectedItems.length === 0) {
            showSnackbar('Please select items to tag', 'warning');
            return;
        }

        setSelectedForTagging(selectedItems);
        setTagForm({
            name: userData.name,
            email: userData.email,
            tags: 'Locates Needed',
        });
        setBulkTagDialogOpen(true);
    };

    const handleTagSubmit = () => {
        if (!tagForm.name.trim() || !tagForm.email.trim()) {
            showSnackbar('Name and email are required', 'error');
            return;
        }

        if (bulkTagDialogOpen) {
            // Bulk tagging
            const workOrderNumbers = selectedForTagging.map(item => item.workOrderNumber).filter(Boolean);
            if (workOrderNumbers.length === 0) {
                showSnackbar('No valid work order numbers found', 'error');
                return;
            }

            bulkTagLocatesNeededMutation.mutate({
                workOrderNumbers,
                name: tagForm.name,
                email: tagForm.email,
                tags: tagForm.tags,
            });
        } else {
            // Single tagging
            const item = selectedForTagging[0];
            if (!item?.workOrderNumber) {
                showSnackbar('Invalid work order', 'error');
                return;
            }

            tagLocatesNeededMutation.mutate({
                workOrderNumber: item.workOrderNumber,
                name: tagForm.name,
                email: tagForm.email,
                tags: tagForm.tags,
            });
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography
                    sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: 20,
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Locate Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<SyncIcon />}
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        sx={{ textTransform: 'none' }}
                    >
                        {syncMutation.isPending ? 'Syncing...' : 'Sync Dashboard'}
                    </Button>
                </Box>
            </Box>

            {/* Excavator - Call Needed */}
            <Section
                title="Call Needed "
                color={ORANGE_COLOR}
                count={excavatorPending.length}
                selectedCount={selectedExcavator.size}
                onDelete={() => confirmBulkDelete(selectedExcavator, 'Call Needed')}
                additionalActions={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StyledTextField
                            size="small"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchTerm('')}
                                            edge="end"
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 200 }}
                        />
                        {selectedExcavator.size > 0 && (
                            <Button
                                variant="contained"
                                startIcon={<Tag />}
                                onClick={openBulkTagDialog}
                                size="small"
                                sx={{
                                    bgcolor: PURPLE_COLOR,
                                    '&:hover': { bgcolor: alpha(PURPLE_COLOR, 0.9) },
                                    textTransform: 'none'
                                }}
                            >
                                Tag Selected ({selectedExcavator.size})
                            </Button>
                        )}
                    </Stack>
                }
            >
                <LocateTable
                    items={excavatorPending}
                    selected={selectedExcavator}
                    onToggleSelect={(id) => toggleSelection(setSelectedExcavator, id)}
                    onMarkCalled={handleMarkCalled}
                    onTag={openTagDialog}
                    color={ORANGE_COLOR}
                    showCallAction
                    showTagAction
                    showTaggedBy
                />
            </Section>

            {/* In Progress */}
            <Section
                title="In Progress"
                color={BLUE_COLOR}
                count={inProgress.length}
                selectedCount={selectedInProgress.size}
                onDelete={() => confirmBulkDelete(selectedInProgress, 'In Progress')}
                showTimer
            >
                <LocateTable
                    items={inProgress}
                    selected={selectedInProgress}
                    onToggleSelect={(id) => toggleSelection(setSelectedInProgress, id)}
                    color={BLUE_COLOR}
                    showTimerColumn
                    showCalledBy
                    currentTime={currentTime}
                />
            </Section>

            {/* Completed */}
            <Section
                title="Completed"
                color={GREEN_COLOR}
                count={completed.length}
                selectedCount={selectedCompleted.size}
                onDelete={() => confirmBulkDelete(selectedCompleted, 'Completed')}
            >
                <LocateTable
                    items={completed}
                    selected={selectedCompleted}
                    onToggleSelect={(id) => toggleSelection(setSelectedCompleted, id)}
                    color={GREEN_COLOR}
                    showCalledBy
                    showTimerColumn={false}
                />
            </Section>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${alpha(RED_COLOR, 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Delete color="error" />
                        <Typography variant="h6" color="error">
                            Confirm Deletion
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{selectedForDeletion.size} item(s)</strong> from the <strong>{deletionSection}</strong> section?
                    </DialogContentText>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. All selected work orders will be permanently removed from the system.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={executeBulkDelete}
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        disabled={deleteBulkMutation.isPending}
                        sx={{ textTransform: 'none' }}
                    >
                        {deleteBulkMutation.isPending ? 'Deleting...' : `Delete ${selectedForDeletion.size} Item(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tag Dialog */}
            <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Tag color="primary" />
                        <Typography variant="h6">Tag as Locates Needed</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Work Order
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {selectedForTagging[0]?.workOrderNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedForTagging[0]?.customerName} • {selectedForTagging[0]?.street}
                            </Typography>
                        </Box>

                        <StyledTextField
                            label="Your Name"
                            value={tagForm.name}
                            onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                            fullWidth
                            required
                            size="small"
                            helperText="Auto-filled from your account"
                            InputProps={{
                                readOnly: !!userData.name,
                            }}
                        />

                        <StyledTextField
                            label="Your Email"
                            value={tagForm.email}
                            onChange={(e) => setTagForm({ ...tagForm, email: e.target.value })}
                            fullWidth
                            required
                            size="small"
                            type="email"
                            helperText="Auto-filled from your account"
                            InputProps={{
                                readOnly: !!userData.email,
                            }}
                        />

                        <StyledTextField
                            label="Tags"
                            value={tagForm.tags}
                            onChange={(e) => setTagForm({ ...tagForm, tags: e.target.value })}
                            fullWidth
                            size="small"
                            placeholder="Locates Needed, Additional notes..."
                            helperText="Separate multiple tags with commas"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setTagDialogOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTagSubmit}
                        variant="contained"
                        disabled={!tagForm.name.trim() || !tagForm.email.trim() || tagLocatesNeededMutation.isPending}
                        startIcon={<Tag />}
                        sx={{ bgcolor: PURPLE_COLOR, textTransform: 'none' }}
                    >
                        {tagLocatesNeededMutation.isPending ? 'Tagging...' : 'Tag Work Order'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Tag Dialog */}
            <Dialog open={bulkTagDialogOpen} onClose={() => setBulkTagDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Tag color="primary" />
                        <Typography variant="h6">Bulk Tag as Locates Needed</Typography>
                        <Chip label={`${selectedForTagging.length} items`} size="small" color="primary" />
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Selected Work Orders
                            </Typography>
                            <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #ddd', p: 1, borderRadius: 1 }}>
                                {selectedForTagging.map((item, index) => (
                                    <Typography key={index} variant="body2" sx={{ py: 0.5 }}>
                                        • {item.workOrderNumber}: {item.customerName}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>

                        <StyledTextField
                            label="Your Name"
                            value={tagForm.name}
                            onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                            fullWidth
                            required
                            size="small"
                            helperText="Auto-filled from your account"
                            InputProps={{
                                readOnly: !!userData.name,
                            }}
                        />

                        <StyledTextField
                            label="Your Email"
                            value={tagForm.email}
                            onChange={(e) => setTagForm({ ...tagForm, email: e.target.value })}
                            fullWidth
                            required
                            size="small"
                            type="email"
                            helperText="Auto-filled from your account"
                            InputProps={{
                                readOnly: !!userData.email,
                            }}
                        />

                        <StyledTextField
                            label="Tags"
                            value={tagForm.tags}
                            onChange={(e) => setTagForm({ ...tagForm, tags: e.target.value })}
                            fullWidth
                            size="small"
                            placeholder="Locates Needed, Additional notes..."
                            helperText="Separate multiple tags with commas"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setBulkTagDialogOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTagSubmit}
                        variant="contained"
                        disabled={!tagForm.name.trim() || !tagForm.email.trim() || bulkTagLocatesNeededMutation.isPending}
                        startIcon={<Tag />}
                        sx={{ bgcolor: PURPLE_COLOR, textTransform: 'none' }}
                    >
                        {bulkTagLocatesNeededMutation.isPending ? 'Tagging...' : `Tag ${selectedForTagging.length} Items`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// ── Section Component ──
const Section = ({
    title,
    color,
    count,
    selectedCount,
    onDelete,
    children,
    showTimer = false,
    additionalActions = null,
}) => (
    <Paper
        elevation={0}
        sx={{
            mb: 5,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(color, 0.3)}`,
        }}
    >
        <Box
            sx={{
                p: 1.2,
                bgcolor: alpha(color, 0.08),
                borderBottom: `3px solid ${color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                    sx={{ fontSize: '1rem' }}
                    fontWeight={600} color={color}>
                    {title}
                    <Chip size="small" label={count} sx={{ ml: 1 }} />
                </Typography>
                {showTimer && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            Real-time countdown active
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {additionalActions}
                {selectedCount > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={onDelete}
                        sx={{ textTransform: 'none' }}
                    >
                        Delete ({selectedCount})
                    </Button>
                )}
            </Box>
        </Box>
        {children}
    </Paper>
);

// ── LocateTable Component ──
const LocateTable = ({
    items,
    selected,
    onToggleSelect,
    onMarkCalled,
    onTag,
    color,
    showCallAction = false,
    showTagAction = false,
    showCalledBy = false,
    showTaggedBy = false,
    showTimerColumn = false,
    currentTime,
}) => (
    <TableContainer>
        <Table size="small">
            <TableHead>
                <TableRow sx={{ bgcolor: alpha(color, 0.06) }}>
                    <TableCell padding="checkbox" width={50}>Select</TableCell>
                    {showCallAction && <TableCell width={220}>Call Action</TableCell>}
                    {showTagAction && <TableCell width={100}>Tag</TableCell>}
                    {showTimerColumn && <TableCell width={180}>Time Remaining</TableCell>}
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Technician</TableCell>
                    {showCalledBy && <TableCell width={200}>Called By</TableCell>}
                    {showTaggedBy && <TableCell width={200}>Tagged By</TableCell>}
                </TableRow>
            </TableHead>
            <TableBody>
                {items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={
                            1 + // Select
                            (showCallAction ? 1 : 0) +
                            (showTagAction ? 1 : 0) +
                            (showTimerColumn ? 1 : 0) +
                            4 + // Customer, Address, Date, Technician
                            (showCalledBy ? 1 : 0) +
                            (showTaggedBy ? 1 : 0)
                        } align="center" sx={{ py: 8 }}>
                            <Typography color="text.secondary">No records found</Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    items.map(item => {
                        const isSelected = selected.has(item.id);
                        const addressLine = item.street || item.original || '—';
                        const location = [item.city, item.state, item.zip].filter(Boolean).join(', ');
                        const hasCheckmark = item.locatesCalled && item.calledByName;
                        const isManuallyTagged = item.manuallyTagged;

                        return (
                            <TableRow
                                key={item.id}
                                hover
                                sx={{
                                    bgcolor: isSelected ? alpha(color, 0.1) : 'inherit',
                                    borderLeft: isManuallyTagged ? `4px solid ${PURPLE_COLOR}` : 'none'
                                }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(item.id)}
                                        size="small"
                                    />
                                </TableCell>

                                {showCallAction && (
                                    <TableCell>
                                        {item.locatesCalled ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircle sx={{ color: RED_COLOR, fontSize: 18 }} />
                                                <Chip
                                                    label={item.callType || 'Called'}
                                                    size="small"
                                                    color={item.callType === 'EMERGENCY' ? 'error' : 'primary'}
                                                />
                                            </Box>
                                        ) : (
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => onMarkCalled(item.id, 'STANDARD')}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Standard
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => onMarkCalled(item.id, 'EMERGENCY')}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Emergency
                                                </Button>
                                            </Stack>
                                        )}
                                    </TableCell>
                                )}

                                {showTagAction && (
                                    <TableCell>
                                        {!item.manuallyTagged ? (
                                            <Tooltip title="Tag as Locates Needed">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onTag(item)}
                                                    sx={{
                                                        color: PURPLE_COLOR,
                                                        '&:hover': { bgcolor: alpha(PURPLE_COLOR, 0.1) }
                                                    }}
                                                >
                                                    <Tag fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title={item.tags}>
                                                {item.tags && (
                                                    <Chip
                                                        label={item.tags}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(PURPLE_COLOR, 0.1),
                                                            color: PURPLE_COLOR,
                                                            fontSize: '0.65rem',
                                                            height: 24
                                                        }}
                                                    />
                                                )}
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                )}

                                {showTimerColumn && (
                                    <TableCell>
                                        {item.timeRemainingText ? (
                                            <Tooltip title={item.timeRemainingDetail}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccessTime fontSize="small" sx={{ color: item.timeRemainingColor }} />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: item.timeRemainingColor,
                                                            fontWeight: item.timeRemainingText === 'EXPIRED' ? 'bold' : 'normal',
                                                            fontFamily: item.callType === 'EMERGENCY' ? 'monospace' : 'inherit'
                                                        }}
                                                    >
                                                        {item.timeRemainingText}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>
                                )}

                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        {hasCheckmark && (
                                            <Tooltip title={`Called by ${item.calledByName}`}>
                                                <CheckCircle sx={{ color: RED_COLOR, fontSize: 16, mt: 0.5 }} />
                                            </Tooltip>
                                        )}
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {item.customerName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                WO: {item.workOrderNumber}
                                            </Typography>
                                            {item.priorityName && item.priorityName !== 'Standard' && (
                                                <Chip
                                                    label={item.priorityName}
                                                    size="small"
                                                    sx={{
                                                        mt: 0.5,
                                                        backgroundColor: item.priorityColor || color,
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        height: 20
                                                    }}
                                                />
                                            )}

                                        </Box>
                                    </Box>
                                </TableCell>

                                <TableCell>
                                    <Typography variant="body2">{addressLine}</Typography>
                                    {location && (
                                        <Typography variant="caption" color="text.secondary">
                                            {location}
                                        </Typography>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Typography variant="caption">
                                            Requested: {formatDate(item.requestedDate)}
                                        </Typography>
                                        {item.calledAt && (
                                            <Typography variant="caption" color="primary">
                                                Called: {formatDate(item.calledAt)}
                                            </Typography>
                                        )}
                                        {item.completionDate && (
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {formatDate(item.completionDate)}
                                            </Typography>
                                        )}
                                    </Stack>
                                </TableCell>

                                <TableCell>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: color, fontSize: '0.85rem' }}>
                                            {item.techName?.charAt(0) || '?'}
                                        </Avatar>
                                        <Typography variant="body2">{item.techName}</Typography>
                                    </Stack>
                                </TableCell>

                                {showCalledBy && (
                                    <TableCell>
                                        {item.calledByName ? (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 0.5 }}>
                                                    <Person fontSize="small" sx={{ color: 'text.secondary' }} />
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {item.calledByName}
                                                    </Typography>
                                                </Box>
                                                {item.calledByEmail && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <Email fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.8rem' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.calledByEmail}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>
                                )}

                                {showTaggedBy && (
                                    <TableCell>
                                        {item.taggedByName ? (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Person fontSize="small" sx={{ color: PURPLE_COLOR }} />
                                                    <Typography variant="body2" color={PURPLE_COLOR} fontWeight={500}>
                                                        {item.taggedByName}
                                                    </Typography>
                                                </Box>
                                                {item.taggedByEmail && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <Email fontSize="small" sx={{ color: PURPLE_COLOR, fontSize: '0.8rem' }} />
                                                        <Typography variant="caption" color={PURPLE_COLOR}>
                                                            {item.taggedByEmail}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {item.manuallyTagged && (
                                                    <Chip
                                                        label="Manual Tag"
                                                        size="small"
                                                        sx={{
                                                            mt: 0.5,
                                                            backgroundColor: alpha(PURPLE_COLOR, 0.1),
                                                            color: PURPLE_COLOR,
                                                            fontSize: '0.6rem',
                                                            height: 18
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    </TableContainer>
);

export default Locates;