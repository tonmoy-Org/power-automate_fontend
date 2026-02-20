import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
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
    Checkbox,
    ListItemText,
    OutlinedInput,
    FormHelperText,
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
    Phone as PhoneIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

// API functions
const fetchPhoneNumbers = async ({ queryKey }) => {
    const [, page, limit, search] = queryKey;
    const params = new URLSearchParams({
        page: page + 1,
        limit,
        search: search || ''
    });
    const response = await axiosInstance.get(`/phone-numbers?${params}`);
    return response.data;
};

const fetchPasswordFormatters = async () => {
    const response = await axiosInstance.get('/password-formatters/list');
    return response.data;
};

const createPhoneNumber = async (data) => {
    const response = await axiosInstance.post('/phone-numbers', data);
    return response.data;
};

const updatePhoneNumber = async ({ id, data }) => {
    const response = await axiosInstance.put(`/phone-numbers/${id}`, data);
    return response.data;
};

const deletePhoneNumber = async (id) => {
    const response = await axiosInstance.delete(`/phone-numbers/${id}`);
    return response.data;
};

// Initial form data
const initialFormData = {
    country_code: '',
    number: '',
    browser_reset_time: 10,
    password_formatter_ids: []
};

const matchFormatterToMaster = (embeddedFormatter, masterFormatters) => {
    return masterFormatters.find(
        (master) =>
            master.start_add === embeddedFormatter.start_add &&
            master.end_add === embeddedFormatter.end_add &&
            master.start_index === embeddedFormatter.start_index &&
            master.end_index === embeddedFormatter.end_index
    );
};

export const PhoneNumbers = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    // Theme colors
    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark || theme.palette.error.main;
    const GREEN_COLOR = theme.palette.success.main;
    const TEXT_PRIMARY = theme.palette.text.primary;

    // State for dialogs
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Selected items
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

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
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch phone numbers with React Query
    const {
        data: phoneNumbersData,
        isLoading,
        isError,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['phoneNumbers', page, rowsPerPage, debouncedSearch],
        queryFn: fetchPhoneNumbers,
        keepPreviousData: true,
    });

    // Fetch password formatters for dropdown
    const {
        data: formattersData,
        isLoading: formattersLoading
    } = useQuery({
        queryKey: ['passwordFormatters'],
        queryFn: fetchPasswordFormatters,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createPhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number created successfully!');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to create phone number');
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: updatePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number updated successfully!');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to update phone number');
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deletePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number deleted successfully!');
            setOpenDeleteDialog(false);
            setItemToDelete(null);

            if (phoneNumbersData?.data?.length === 1 && page > 0) {
                setPage(page - 1);
            }
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to delete phone number');
        }
    });

    // Get data from query response
    const phoneNumbers = phoneNumbersData?.data || [];
    const totalCount = phoneNumbersData?.pagination?.total || 0;
    const passwordFormatters = formattersData?.data || [];

    // ─── FIX: Match embedded formatters to master list by content, not _id ──────
    const getSelectedFormatterIds = (phoneNumber) => {
        if (!phoneNumber?.password_formatters || !Array.isArray(phoneNumber.password_formatters)) {
            return [];
        }

        return phoneNumber.password_formatters
            .map((embeddedFormatter) => {
                const master = matchFormatterToMaster(embeddedFormatter, passwordFormatters);
                if (master) {
                    return String(master._id);
                }
                // Fallback: log unmatched so you can debug data mismatches
                console.warn('Could not match embedded formatter to master list:', embeddedFormatter);
                return null;
            })
            .filter(Boolean);
    };
    // ─────────────────────────────────────────────────────────────────────────────

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
        setSelectedNumber(null);
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle formatter selection with Select All functionality
    const handleFormatterSelectChange = (event) => {
        const { value } = event.target;

        if (value.includes('select-all')) {
            if (formData.password_formatter_ids.length === passwordFormatters.length) {
                setFormData(prev => ({ ...prev, password_formatter_ids: [] }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    password_formatter_ids: passwordFormatters.map(f => String(f._id))
                }));
            }
        } else {
            const selectedValues = Array.isArray(value)
                ? value.map(v => String(v))
                : value.split(',').map(v => String(v));
            setFormData(prev => ({
                ...prev,
                password_formatter_ids: selectedValues
            }));
        }
    };

    // Copy PA ID to clipboard
    const handleCopyPaId = (paId) => {
        navigator.clipboard.writeText(paId);
        setSuccess(`PA ID ${paId} copied to clipboard!`);
        setTimeout(() => setSuccess(''), 2000);
    };

    // CRUD operations
    const handleOpenDialog = (number = null) => {
        if (number) {
            setSelectedNumber(number);

            // Wait until formatters are loaded before computing selected IDs
            // If formatters aren't loaded yet, we'll set them after load (see useEffect below)
            const selectedIds = passwordFormatters.length > 0
                ? getSelectedFormatterIds(number)
                : [];

            setFormData({
                country_code: number.country_code,
                number: number.number,
                browser_reset_time: number.browser_reset_time,
                password_formatter_ids: selectedIds,
                // Temporarily store raw embedded formatters so we can recompute after load
                _pendingFormatters: passwordFormatters.length === 0 ? number.password_formatters : null,
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    // Once formatters load, resolve any pending formatter IDs
    useEffect(() => {
        if (
            passwordFormatters.length > 0 &&
            formData._pendingFormatters &&
            formData._pendingFormatters.length > 0
        ) {
            const resolvedIds = formData._pendingFormatters
                .map((ef) => {
                    const master = matchFormatterToMaster(ef, passwordFormatters);
                    return master ? String(master._id) : null;
                })
                .filter(Boolean);

            setFormData(prev => ({
                ...prev,
                password_formatter_ids: resolvedIds,
                _pendingFormatters: null,
            }));
        }
    }, [passwordFormatters, formData._pendingFormatters]);

    const handleSubmit = () => {
        const selectedFormatters = passwordFormatters
            .filter(f => formData.password_formatter_ids.includes(String(f._id)))
            .map(f => ({
                id: String(f._id),
                start_add: f.start_add,
                start_index: f.start_index,
                end_index: f.end_index,
                end_add: f.end_add
            }));

        const apiData = {
            country_code: formData.country_code,
            number: formData.number,
            browser_reset_time: formData.browser_reset_time,
            password_formatters: selectedFormatters
        };

        if (selectedNumber) {
            updateMutation.mutate({ id: selectedNumber._id, data: apiData });
        } else {
            createMutation.mutate(apiData);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete._id);
        }
    };

    // Helper functions
    const getStatusStyle = (isActive) => {
        if (isActive) {
            return {
                backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(GREEN_COLOR, 0.2)
                    : alpha(GREEN_COLOR, 0.1),
                color: GREEN_COLOR,
                borderColor: GREEN_COLOR,
            };
        } else {
            return {
                backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(RED_COLOR, 0.2)
                    : alpha(RED_COLOR, 0.1),
                color: RED_COLOR,
                borderColor: RED_COLOR,
            };
        }
    };

    const getStatusLabel = (isActive) => (isActive ? 'Active' : 'Inactive');

    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: 48 * 4.5 + 8,
                width: 250,
            },
        },
    };

    // Show error from query if any
    if (isError) {
        return (
            <Box p={3} textAlign="center">
                <Alert severity="error">
                    Error loading phone numbers: {queryError?.message || 'Unknown error'}
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
                <title> Phone Credentials | Power Automate</title>
                <meta name="description" content="SuperAdmin dashboard" />
            </Helmet>
            {/* Header */}
            <Box sx={{ display: { xs: 'block', lg: 'flex' } }} justifyContent="space-between" alignItems="center" mb={2}>
                <Box mb={1}>
                    <Typography sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '1.1rem',
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Phone Numbers Management
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                        Manage phone numbers, browser reset times, and password formatters
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
                    Add Phone Number
                </GradientButton>
            </Box>

            {/* Search Bar */}
            <Box mb={2}>
                <StyledTextField
                    fullWidth
                    placeholder="Search by PA ID, phone number, or country code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: TEXT_PRIMARY, fontSize: '0.9rem', opacity: 0.7 }} />,
                    }}
                    size="small"
                    sx={{
                        '& .MuiInputBase-input': {
                            fontSize: '0.8rem',
                            color: TEXT_PRIMARY,
                        },
                    }}
                />
            </Box>

            {/* Phone Numbers Table */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    overflow: 'hidden',
                    mb: 3,
                    position: 'relative',
                    minHeight: 400,
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
                                ? alpha(BLUE_COLOR, 0.1)
                                : alpha(BLUE_COLOR, 0.05),
                        }}>
                            {['PA ID', 'Country Code', 'Phone Number', 'Browser Reset', 'Password Formatters', 'Status'].map((header) => (
                                <TableCell key={header} sx={{
                                    fontWeight: 600,
                                    color: TEXT_PRIMARY,
                                    borderBottom: `2px solid ${BLUE_COLOR}`,
                                    fontSize: '0.8rem',
                                    py: 1,
                                }}>
                                    {header}
                                </TableCell>
                            ))}
                            <TableCell align="right" sx={{
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                borderBottom: `2px solid ${BLUE_COLOR}`,
                                fontSize: '0.8rem',
                                py: 1,
                            }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading && phoneNumbers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Box py={2}>
                                        <PhoneIcon sx={{ fontSize: 32, color: alpha(TEXT_PRIMARY, 0.2), mb: 1.5 }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                                            {debouncedSearch
                                                ? 'No phone numbers found matching your search.'
                                                : 'No phone numbers found. Add one to get started.'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            phoneNumbers.map((item) => (
                                <TableRow
                                    key={item._id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? alpha(BLUE_COLOR, 0.05)
                                                : alpha(BLUE_COLOR, 0.03),
                                        },
                                        '&:last-child td': { borderBottom: 0 },
                                        opacity: deleteMutation.isLoading && itemToDelete?._id === item._id ? 0.5 : 1,
                                    }}
                                >
                                    <TableCell sx={{ py: 1 }}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography variant="caption" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY, fontFamily: 'monospace', fontWeight: 500 }}>
                                                {item.pa_id}
                                            </Typography>
                                            <Tooltip title="Copy PA ID">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCopyPaId(item.pa_id)}
                                                    sx={{
                                                        color: BLUE_COLOR,
                                                        fontSize: '0.7rem',
                                                        p: 0.5,
                                                        '&:hover': { backgroundColor: alpha(BLUE_COLOR, 0.1) },
                                                    }}
                                                >
                                                    <CopyIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Chip
                                            label={item.country_code}
                                            size="small"
                                            sx={{
                                                backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                color: BLUE_COLOR,
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                            {item.number}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>
                                            {item.browser_reset_time}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                            {item.password_formatters?.map((formatter) => (
                                                <Tooltip
                                                    key={formatter._id}
                                                    title={`${formatter.start_add} (${formatter.start_index}–${formatter.end_index}) → ${formatter.end_add}`}
                                                >
                                                    <Chip
                                                        label={formatter.start_add}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                            color: GREEN_COLOR,
                                                            fontSize: '0.65rem',
                                                            height: 18,
                                                            '& .MuiChip-label': { px: 0.8 }
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))}
                                            {(!item.password_formatters || item.password_formatters.length === 0) && (
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.5), fontStyle: 'italic' }}>
                                                    No formatters
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Chip
                                            label={getStatusLabel(item.is_active)}
                                            size="small"
                                            variant="outlined"
                                            icon={item.is_active
                                                ? <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />
                                                : <BlockIcon sx={{ fontSize: '0.7rem' }} />
                                            }
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                ...getStatusStyle(item.is_active),
                                                '& .MuiChip-label': { px: 1 },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1 }}>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(item)}
                                                sx={{
                                                    color: BLUE_COLOR,
                                                    fontSize: '0.8rem',
                                                    '&:hover': { backgroundColor: alpha(BLUE_COLOR, 0.1) },
                                                }}
                                                disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                            >
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(item)}
                                                sx={{
                                                    color: RED_COLOR,
                                                    fontSize: '0.8rem',
                                                    '&:hover': { backgroundColor: alpha(RED_COLOR, 0.1) },
                                                }}
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
                onClose={() => { setOpenDialog(false); resetForm(); }}
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
                    {selectedNumber ? 'Edit Phone Number' : 'Add New Phone Number'}
                </DialogTitle>
                <DialogContent sx={{ px: 2, py: 1 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="Country Code"
                                name="country_code"
                                value={formData.country_code}
                                onChange={handleInputChange}
                                placeholder="+1"
                                required
                                size="small"
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', color: TEXT_PRIMARY } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                fullWidth
                                label="Phone Number"
                                name="number"
                                value={formData.number}
                                onChange={handleInputChange}
                                placeholder="1234567890"
                                required
                                size="small"
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', color: TEXT_PRIMARY } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <StyledTextField
                                fullWidth
                                label="Browser Reset Time (minutes)"
                                name="browser_reset_time"
                                type="number"
                                value={formData.browser_reset_time}
                                onChange={handleInputChange}
                                required
                                size="small"
                                InputProps={{ inputProps: { min: 1 } }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', color: TEXT_PRIMARY } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    sx={{
                                        fontSize: '0.8rem',
                                        color: TEXT_PRIMARY,
                                        '&.Mui-focused': { color: GREEN_COLOR },
                                    }}
                                >
                                    Password Formatters
                                </InputLabel>
                                <Select
                                    multiple
                                    value={formData.password_formatter_ids}
                                    onChange={handleFormatterSelectChange}
                                    input={<OutlinedInput label="Password Formatters" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const formatter = passwordFormatters.find(f => String(f._id) === value);
                                                return formatter ? (
                                                    <Chip
                                                        key={value}
                                                        label={`${formatter.start_add} → ${formatter.end_add}`}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                            color: GREEN_COLOR,
                                                            fontSize: '0.7rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        key={value}
                                                        label="Unknown"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: alpha(RED_COLOR, 0.1),
                                                            color: RED_COLOR,
                                                            fontSize: '0.7rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps}
                                    sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}
                                    disabled={formattersLoading}
                                >
                                    {/* Select All option */}
                                    {!formattersLoading && passwordFormatters.length > 0 && (
                                        <MenuItem value="select-all" sx={{ fontSize: '0.8rem' }}>
                                            <Checkbox
                                                checked={formData.password_formatter_ids.length === passwordFormatters.length}
                                                indeterminate={
                                                    formData.password_formatter_ids.length > 0 &&
                                                    formData.password_formatter_ids.length < passwordFormatters.length
                                                }
                                                size="small"
                                            />
                                            <ListItemText primary="Select All" />
                                        </MenuItem>
                                    )}

                                    {formattersLoading ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading formatters...
                                        </MenuItem>
                                    ) : (
                                        passwordFormatters.map((formatter) => {
                                            const formatterId = String(formatter._id);
                                            const isSelected = formData.password_formatter_ids.includes(formatterId);
                                            return (
                                                <MenuItem key={formatterId} value={formatterId} sx={{ fontSize: '0.8rem' }}>
                                                    <Checkbox checked={isSelected} size="small" />
                                                    <ListItemText
                                                        primary={`${formatter.start_add} → ${formatter.end_add}`}
                                                        secondary={`Index: ${formatter.start_index} – ${formatter.end_index}`}
                                                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                                                        secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                                    />
                                                </MenuItem>
                                            );
                                        })
                                    )}
                                </Select>
                                <FormHelperText sx={{ fontSize: '0.7rem', color: alpha(TEXT_PRIMARY, 0.7) }}>
                                    Select password formatters for this phone number
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <OutlineButton
                        onClick={() => { setOpenDialog(false); resetForm(); }}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.4, px: 1.5 }}
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.country_code || !formData.number || createMutation.isLoading || updateMutation.isLoading}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.4, px: 1.5 }}
                    >
                        {createMutation.isLoading || updateMutation.isLoading ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : (
                            selectedNumber ? 'Update' : 'Create'
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
                            Are you sure you want to delete phone number{' '}
                            <strong>"{itemToDelete?.pa_id} - {itemToDelete?.country_code} {itemToDelete?.number}"</strong>?
                            This action cannot be undone.
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
                        startIcon={
                            deleteMutation.isLoading
                                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                                : <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                        }
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
                        '& .MuiAlert-icon': { color: GREEN_COLOR, fontSize: '0.9rem' },
                        '& .MuiAlert-message': { fontSize: '0.8rem', py: 0.5 },
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
                        '& .MuiAlert-icon': { color: RED_COLOR, fontSize: '0.9rem' },
                        '& .MuiAlert-message': { fontSize: '0.8rem', py: 0.5 },
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

export default PhoneNumbers;
