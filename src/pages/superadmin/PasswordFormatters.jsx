import React, { useState, useEffect } from 'react';
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

const fetchPasswordFormatters = async ({ queryKey }) => {
    const [, page, limit, search] = queryKey;
    const params = new URLSearchParams({
        page: page + 1,
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

const initialFormData = {
    start_add: '',
    start_index: '',
    end_index: '',
    end_add: ''
};

export const PasswordFormatters = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const GREEN_COLOR = theme.palette.success.main;
    const GREEN_DARK = theme.palette.success.dark;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const TEXT_PRIMARY = theme.palette.text.primary;

    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedFormatter, setSelectedFormatter] = useState(null);
    const [formatterToDelete, setFormatterToDelete] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    const createMutation = useMutation({
        mutationFn: createPasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter created successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to create password formatter');
        }
    });

    const updateMutation = useMutation({
        mutationFn: updatePasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter updated successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to update password formatter');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePasswordFormatter,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Password formatter deleted successfully');
            setOpenDeleteDialog(false);
            setFormatterToDelete(null);
            if (formattersData?.data?.length === 1 && page > 0) {
                setPage(page - 1);
            }
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to delete password formatter');
        }
    });

    const formatters = formattersData?.data || [];
    const totalCount = formattersData?.pagination?.total || 0;

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedFormatter(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCopyFormatter = (formatter) => {
        const text = `${formatter.start_add ?? ''} → ${formatter.start_index ?? ''} → ${formatter.end_index ?? ''} → ${formatter.end_add ?? ''}`;
        navigator.clipboard.writeText(text);
        setSuccess('Formatter copied to clipboard');
    };

    const handleOpenDialog = (formatter = null) => {
        if (formatter) {
            setSelectedFormatter(formatter);
            setFormData({
                start_add: formatter.start_add ?? '',
                start_index: formatter.start_index ?? '',
                end_index: formatter.end_index ?? '',
                end_add: formatter.end_add ?? ''
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    const handleSubmit = () => {
        const apiData = {
            start_add: formData.start_add,
            start_index: formData.start_index === '' ? undefined : Number(formData.start_index),
            end_index: formData.end_index === '' ? undefined : Number(formData.end_index),
            end_add: formData.end_add
        };

        if (selectedFormatter) {
            updateMutation.mutate({ id: selectedFormatter._id, data: apiData });
        } else {
            createMutation.mutate(apiData);
        }
    };

    const handleDeleteClick = (formatter) => {
        setFormatterToDelete(formatter);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (formatterToDelete) {
            deleteMutation.mutate(formatterToDelete._id);
        }
    };

    if (isError) {
        return (
            <Box p={3} textAlign="center">
                <Alert severity="error">
                    Error loading password formatters: {queryError?.message || 'Unknown error'}
                </Alert>
                <Button variant="contained" onClick={() => refetch()} sx={{ mt: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Helmet>
                <title>Password Formatters | Power Automate</title>
            </Helmet>

            <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_COLOR} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
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
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }}
                        disabled={createMutation.isLoading}
                    >
                        Add Formatter
                    </GradientButton>
                </Box>
            </Box>

            <Box mb={3}>
                <StyledTextField
                    fullWidth
                    placeholder="Search by start_add or end_add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                />
            </Box>

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    overflow: 'auto',
                    position: 'relative',
                    minHeight: 400,
                }}
            >
                {isLoading && (
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
                )}

                <Table size="medium">
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05)
                        }}>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Start Add</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Start Index</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>End Index</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>End Add</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading && formatters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Box py={3}>
                                        <FormatIcon sx={{ fontSize: 48, color: alpha(TEXT_PRIMARY, 0.2), mb: 2 }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                            {debouncedSearch ? 'No password formatters found matching your search' : 'No password formatters found. Add one to get started'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            formatters.map((formatter) => (
                                <TableRow
                                    key={formatter._id}
                                    hover
                                    sx={{
                                        '&:hover': { backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.05 : 0.03) },
                                        '&:last-child td': { borderBottom: 0 },
                                        opacity: deleteMutation.isLoading && formatterToDelete?._id === formatter._id ? 0.5 : 1,
                                    }}
                                >
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Chip
                                            label={formatter.start_add ?? '—'}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                color: GREEN_COLOR,
                                                fontWeight: 500,
                                                fontSize: '0.75rem',
                                                height: 24,
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                            {formatter.start_index ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                            {formatter.end_index ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Chip
                                            label={formatter.end_add ?? '—'}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                color: GREEN_COLOR,
                                                fontWeight: 500,
                                                fontSize: '0.75rem',
                                                height: 24,
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Tooltip title="Copy formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyFormatter(formatter)}
                                                sx={{ color: GREEN_COLOR, fontSize: '0.9rem', mr: 0.5 }}
                                            >
                                                <CopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(formatter)}
                                                sx={{ color: GREEN_COLOR, fontSize: '0.9rem', mr: 0.5 }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                            >
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete formatter">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(formatter)}
                                                sx={{ color: RED_COLOR, fontSize: '0.9rem' }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading}
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
                            fontSize: '0.8rem',
                            color: TEXT_PRIMARY,
                        },
                        '& .MuiTablePagination-actions': { marginLeft: 2 },
                    }}
                />
            </TableContainer>

            {/* Create / Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => { setOpenDialog(false); resetForm(); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    color: TEXT_PRIMARY,
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2,
                    px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    {selectedFormatter ? 'Edit Password Formatter' : 'Add New Password Formatter'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Grid container spacing={2.5} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="Start Add"
                                name="start_add"
                                value={formData.start_add}
                                onChange={handleInputChange}
                                size="small"
                                placeholder="Enter start add"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="Start Index"
                                name="start_index"
                                value={formData.start_index}
                                onChange={handleInputChange}
                                size="small"
                                placeholder="Enter start index"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="End Index"
                                name="end_index"
                                value={formData.end_index}
                                onChange={handleInputChange}
                                size="small"
                                placeholder="Enter end index"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="End Add"
                                name="end_add"
                                value={formData.end_add}
                                onChange={handleInputChange}
                                size="small"
                                placeholder="Enter end add"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton
                        onClick={() => { setOpenDialog(false); resetForm(); }}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                    >
                        {createMutation.isLoading || updateMutation.isLoading ? (
                            <CircularProgress size={18} sx={{ color: 'white' }} />
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
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    color: RED_COLOR,
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2,
                    px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        Confirm Delete
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <DialogContentText sx={{ fontSize: '0.9rem', color: TEXT_PRIMARY }}>
                        Are you sure you want to delete formatter{' '}
                        <strong>"{formatterToDelete?.start_add ?? ''} → {formatterToDelete?.end_add ?? ''}"</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton
                        onClick={() => setOpenDeleteDialog(false)}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
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
                            padding: '6px 16px',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            '&:hover': { background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)` },
                        }}
                        onClick={handleDeleteConfirm}
                        startIcon={deleteMutation.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <DeleteIcon sx={{ fontSize: '0.9rem' }} />}
                        size="medium"
                        disabled={deleteMutation.isLoading}
                    >
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

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
                        backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                        borderLeft: `3px solid ${GREEN_COLOR}`,
                        '& .MuiAlert-icon': { color: GREEN_COLOR, fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 2,
                    }}
                    elevation={4}
                >
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{success}</Typography>
                </Alert>
            </Snackbar>

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
                        backgroundColor: alpha(RED_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                        borderLeft: `3px solid ${RED_COLOR}`,
                        '& .MuiAlert-icon': { color: RED_COLOR, fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 2,
                    }}
                    elevation={4}
                >
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PasswordFormatters;