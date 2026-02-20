import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert,
    Snackbar,
    alpha,
    TablePagination,
    useTheme,
    Grid,
    Tooltip,
    DialogContentText,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FormatListBulleted as FormatIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

// API functions
const fetchPasswordFormatters = async ({ queryKey }) => {
    const [, page, limit, search] = queryKey;
    const params = new URLSearchParams({
        page: page + 1, // API uses 1-based pagination
        limit,
        search: search || ''
    });
    const response = await axiosInstance.get(`/password-formatters?${params}`);
    return response.data;
};

const createPasswordFormatter = async (data) => {
    const response = await axiosInstance.post('/password-formatters', data);
    return response.data;
};

const updatePasswordFormatter = async ({ id, data }) => {
    const response = await axiosInstance.put(`/password-formatters/${id}`, data);
    return response.data;
};

const deletePasswordFormatter = async (id) => {
    const response = await axiosInstance.delete(`/password-formatters/${id}`);
    return response.data;
};

// Initial form data
const initialFormData = {
    start_add: '',
    start_index: 0,
    end_index: 100,
    end_add: ''
};

export const PasswordFormatters = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    // Theme colors
    const GREEN_COLOR = theme.palette.success.main;
    const GREEN_DARK = theme.palette.success.dark || theme.palette.success.main;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark || theme.palette.error.main;
    const GREY_COLOR = theme.palette.grey?.[500] || '#9e9e9e';
    const TEXT_PRIMARY = theme.palette.text.primary;

    // State for dialogs
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Selected items
    const [selectedFormatter, setSelectedFormatter] = useState(null);
    const [formatterToDelete, setFormatterToDelete] = useState(null);

    // Notifications
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Search and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Form data
    const [formData, setFormData] = useState(initialFormData);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0); // Reset to first page on search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch password formatters with React Query
    const {
        data: formattersData,
        isLoading,
        isError,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['passwordFormatters', page, rowsPerPage, debouncedSearch],
        queryFn: fetchPasswordFormatters,
        keepPreviousData: true,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createPasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter created successfully!');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to create password formatter');
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: updatePasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter updated successfully!');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to update password formatter');
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deletePasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter deleted successfully!');
            setOpenDeleteDialog(false);
            setFormatterToDelete(null);

            // Adjust page if current page becomes empty
            if (formattersData?.data?.length === 1 && page > 0) {
                setPage(page - 1);
            }
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to delete password formatter');
        }
    });

    // Get data from query response
    const formatters = formattersData?.data || [];
    const totalCount = formattersData?.pagination?.total || 0;

    // Handlers for pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedFormatter(null);
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle numeric fields
        if (name === 'start_index' || name === 'end_index') {
            const numValue = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Copy formatter details to clipboard
    const handleCopyFormatter = (formatter) => {
        const text = `${formatter.start_add} (${formatter.start_index}-${formatter.end_index}) → ${formatter.end_add}`;
        navigator.clipboard.writeText(text);
        setSuccess(`Formatter "${formatter.start_add} → ${formatter.end_add}" copied to clipboard!`);
        setTimeout(() => setSuccess(''), 2000);
    };

    // CRUD operations
    const handleOpenDialog = (formatter = null) => {
        if (formatter) {
            setSelectedFormatter(formatter);
            setFormData({
                start_add: formatter.start_add,
                start_index: formatter.start_index,
                end_index: formatter.end_index,
                end_add: formatter.end_add
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    const handleSubmit = () => {
        const apiData = {
            start_add: formData.start_add,
            start_index: formData.start_index,
            end_index: formData.end_index,
            end_add: formData.end_add
        };

        // Validate indices
        if (apiData.start_index > apiData.end_index) {
            setError('Start index must be less than or equal to end index');
            return;
        }

        if (selectedFormatter) {
            // Update existing formatter
            updateMutation.mutate({
                id: selectedFormatter.id || selectedFormatter._id,
                data: apiData
            });
        } else {
            // Create new formatter
            createMutation.mutate(apiData);
        }
    };

    const handleDeleteClick = (formatter) => {
        setFormatterToDelete(formatter);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (formatterToDelete) {
            deleteMutation.mutate(formatterToDelete.id || formatterToDelete._id);
        }
    };

    // Show error from query if any
    if (isError) {
        return (
            <Box p={3} textAlign="center">
                <Alert severity="error">
                    Error loading password formatters: {queryError?.message || 'Unknown error'}
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => refetch()}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Helmet>
                <title>Password Formatters | Power Automate</title>
                <meta name="description" content="SuperAdmin dashboard" />
            </Helmet>
            {/* Header with Search */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: { xs: 'block', lg: 'flex' } }} justifyContent="space-between" alignItems="center" mb={2}>
                    <Box mb={1}>
                        <Typography sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: '1.1rem',
                            background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_COLOR} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Password Formatters
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                            Manage password formatting rules for phone numbers
                        </Typography>
                    </Box>
                    <GradientButton
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => handleOpenDialog()}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5 }}
                        disabled={createMutation.isLoading}
                    >
                        Add Formatter
                    </GradientButton>
                </Box>

                {/* Search Bar */}
                <StyledTextField
                    fullWidth
                    placeholder="Search by start_add or end_add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{
                        '& .MuiInputBase-input': {
                            fontSize: '0.8rem',
                            color: TEXT_PRIMARY,
                        },
                    }}
                />
            </Box>

            {/* Formatters Table */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: 300,
                }}
            >
                {isLoading && (
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="rgba(255, 255, 255, 0.7)"
                        zIndex={1}
                    >
                        <CircularProgress />
                    </Box>
                )}

                <Table size="small">
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: theme.palette.mode === 'dark'
                                ? alpha(GREEN_COLOR, 0.1)
                                : alpha(GREEN_COLOR, 0.05),
                        }}>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${GREEN_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>Start Add</TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${GREEN_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>Start Index</TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${GREEN_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>End Index</TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${GREEN_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>End Add</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${GREEN_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading && formatters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <Box py={2}>
                                        <FormatIcon sx={{ fontSize: 32, color: alpha(TEXT_PRIMARY, 0.2), mb: 1.5 }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                                            {debouncedSearch ? 'No password formatters found matching your search.' : 'No password formatters found. Add one to get started.'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            formatters.map((formatter) => (
                                <TableRow
                                    key={formatter._id || formatter.id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? alpha(GREEN_COLOR, 0.05)
                                                : alpha(GREEN_COLOR, 0.03),
                                        },
                                        '&:last-child td': {
                                            borderBottom: 0,
                                        },
                                        opacity: deleteMutation.isLoading && (formatterToDelete?._id === formatter._id || formatterToDelete?.id === formatter.id) ? 0.5 : 1,
                                    }}
                                >
                                    <TableCell sx={{ py: 1 }}>
                                        <Chip
                                            label={formatter.start_add}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                color: GREEN_COLOR,
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>
                                            {formatter.start_index}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>
                                            {formatter.end_index}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Chip
                                            label={formatter.end_add}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                color: GREEN_COLOR,
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1 }}>
                                        <Tooltip title="Copy Formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyFormatter(formatter)}
                                                sx={{
                                                    color: GREEN_COLOR,
                                                    fontSize: '0.8rem',
                                                    '&:hover': {
                                                        backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                    },
                                                }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                            >
                                                <CopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(formatter)}
                                                sx={{
                                                    color: GREEN_COLOR,
                                                    fontSize: '0.8rem',
                                                    '&:hover': {
                                                        backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                    },
                                                }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                            >
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(formatter)}
                                                sx={{
                                                    color: RED_COLOR,
                                                    fontSize: '0.8rem',
                                                    '&:hover': {
                                                        backgroundColor: alpha(RED_COLOR, 0.1),
                                                    },
                                                }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading || formatter.isInUse}
                                            >
                                                <DeleteIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.75rem',
                            color: TEXT_PRIMARY,
                        },
                    }}
                    size="small"
                />
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => {
                    setOpenDialog(false);
                    resetForm();
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        p: 1,
                    }
                }}
            >
                <DialogTitle sx={{
                    color: TEXT_PRIMARY,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    py: 1.5,
                    px: 2,
                }}>
                    {selectedFormatter ? 'Edit Password Formatter' : 'Add New Password Formatter'}
                </DialogTitle>
                <DialogContent sx={{ px: 2, py: 1 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="Start Add"
                                name="start_add"
                                value={formData.start_add}
                                onChange={handleInputChange}
                                required
                                size="small"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.8rem',
                                        color: TEXT_PRIMARY,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="End Add"
                                name="end_add"
                                value={formData.end_add}
                                onChange={handleInputChange}
                                required
                                size="small"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.8rem',
                                        color: TEXT_PRIMARY,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="Start Index"
                                name="start_index"
                                type="number"
                                value={formData.start_index}
                                onChange={handleInputChange}
                                required
                                size="small"
                                InputProps={{ inputProps: { min: 0, max: 999 } }}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.8rem',
                                        color: TEXT_PRIMARY,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="End Index"
                                name="end_index"
                                type="number"
                                value={formData.end_index}
                                onChange={handleInputChange}
                                required
                                size="small"
                                InputProps={{ inputProps: { min: 0, max: 999 } }}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.8rem',
                                        color: TEXT_PRIMARY,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <OutlineButton
                        onClick={() => {
                            setOpenDialog(false);
                            resetForm();
                        }}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.4, px: 1.5 }}
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.start_add || !formData.end_add || createMutation.isLoading || updateMutation.isLoading}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.4, px: 1.5 }}
                    >
                        {createMutation.isLoading || updateMutation.isLoading ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : (
                            selectedFormatter ? 'Update' : 'Create'
                        )}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        p: 1,
                    }
                }}
            >
                <DialogTitle sx={{
                    pb: 1,
                    color: RED_COLOR,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    py: 1.5,
                    px: 2,
                }}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        Confirm Delete
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 2, py: 1 }}>
                    <Box py={0.5}>
                        <DialogContentText sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>
                            Are you sure you want to delete password formatter <strong>"{formatterToDelete?.start_add} → {formatterToDelete?.end_add}"</strong>?
                            {formatterToDelete?.isInUse && (
                                <Box component="span" display="block" mt={1} color={RED_COLOR}>
                                    Warning: This formatter is currently in use by phone numbers. Deleting it will remove it from all associated phone numbers.
                                </Box>
                            )}
                        </DialogContentText>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <OutlineButton
                        onClick={() => setOpenDeleteDialog(false)}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.4, px: 1.5 }}
                        disabled={deleteMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED_COLOR} 100%)`,
                            color: 'white',
                            borderRadius: 1,
                            padding: '4px 16px',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            textTransform: 'none',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)`,
                            },
                        }}
                        onClick={handleDeleteConfirm}
                        startIcon={deleteMutation.isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DeleteIcon sx={{ fontSize: '0.8rem' }} />}
                        size="small"
                        disabled={deleteMutation.isLoading}
                    >
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity="success"
                    sx={{
                        width: '100%',
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark'
                            ? alpha(GREEN_COLOR, 0.1)
                            : alpha(GREEN_COLOR, 0.05),
                        borderLeft: `3px solid ${GREEN_COLOR}`,
                        '& .MuiAlert-icon': {
                            color: GREEN_COLOR,
                            fontSize: '0.9rem',
                        },
                        '& .MuiAlert-message': {
                            fontSize: '0.8rem',
                            py: 0.5,
                        },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 1.5,
                    }}
                    elevation={4}
                >
                    <Typography fontWeight={500} sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>{success}</Typography>
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity="error"
                    sx={{
                        width: '100%',
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark'
                            ? alpha(RED_COLOR, 0.1)
                            : alpha(RED_COLOR, 0.05),
                        borderLeft: `3px solid ${RED_COLOR}`,
                        '& .MuiAlert-icon': {
                            color: RED_COLOR,
                            fontSize: '0.9rem',
                        },
                        '& .MuiAlert-message': {
                            fontSize: '0.8rem',
                            py: 0.5,
                        },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 1.5,
                    }}
                    elevation={4}
                >
                    <Typography fontWeight={500} sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PasswordFormatters;