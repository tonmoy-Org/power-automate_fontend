import React, { useState, useEffect } from 'react';
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
    DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

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

const initialFormData = {
    country_code: '',
    number: '',
    browser_reset_time: '',
    password_formatter_ids: [],
    is_active: false
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

const formatFormatterLabel = (formatter) =>
    `${formatter.start_add ?? ''} → ${formatter.start_index ?? ''} → ${formatter.end_index ?? ''} → ${formatter.end_add ?? ''}`;

export const PhoneNumbers = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const GREEN_COLOR = theme.palette.success.main;
    const TEXT_PRIMARY = theme.palette.text.primary;

    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
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

    // Clear selected rows when page/search/filter changes
    useEffect(() => {
        setSelectedRows([]);
    }, [page, rowsPerPage, debouncedSearch, statusFilter]);

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

    const {
        data: formattersData,
        isLoading: formattersLoading
    } = useQuery({
        queryKey: ['passwordFormatters'],
        queryFn: fetchPasswordFormatters,
    });

    const createMutation = useMutation({
        mutationFn: createPhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number created successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to create phone number');
        }
    });

    const updateMutation = useMutation({
        mutationFn: updatePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number updated successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to update phone number');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number deleted successfully');
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

    const [bulkDeleting, setBulkDeleting] = useState(false);

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        let successCount = 0;
        let failCount = 0;
        for (const id of selectedRows) {
            try {
                await deletePhoneNumber(id);
                successCount++;
            } catch {
                failCount++;
            }
        }
        setBulkDeleting(false);
        setOpenBulkDeleteDialog(false);
        setSelectedRows([]);
        queryClient.invalidateQueries(['phoneNumbers']);
        if (failCount === 0) {
            setSuccess(`${successCount} phone number${successCount > 1 ? 's' : ''} deleted successfully`);
        } else {
            setError(`${successCount} deleted, ${failCount} failed`);
        }
    };

    const allPhoneNumbers = phoneNumbersData?.data || [];
    const totalCount = phoneNumbersData?.pagination?.total || 0;
    const passwordFormatters = formattersData?.data || [];

    // Client-side filter by status
    const phoneNumbers = statusFilter === 'all'
        ? allPhoneNumbers
        : allPhoneNumbers.filter(item =>
            statusFilter === 'active' ? item.is_active : !item.is_active
        );

    // Select all only across visible (filtered) rows
    const allVisibleIds = phoneNumbers.map(item => item._id);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedRows.includes(id));
    const someSelected = selectedRows.length > 0 && !allSelected;

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedRows(prev => prev.filter(id => !allVisibleIds.includes(id)));
        } else {
            setSelectedRows(prev => [...new Set([...prev, ...allVisibleIds])]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const getSelectedFormatterIds = (phoneNumber) => {
        if (!phoneNumber?.password_formatters || !Array.isArray(phoneNumber.password_formatters)) {
            return [];
        }
        return phoneNumber.password_formatters
            .map((embeddedFormatter) => {
                const master = matchFormatterToMaster(embeddedFormatter, passwordFormatters);
                return master ? String(master._id) : null;
            })
            .filter(Boolean);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedNumber(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
            setFormData(prev => ({ ...prev, password_formatter_ids: selectedValues }));
        }
    };

    const handleCopyPaId = (paId) => {
        navigator.clipboard.writeText(paId);
        setSuccess(`PA ID ${paId} copied to clipboard`);
    };

    const handleOpenDialog = (number = null) => {
        if (number) {
            setSelectedNumber(number);
            const selectedIds = passwordFormatters.length > 0
                ? getSelectedFormatterIds(number)
                : [];
            setFormData({
                country_code: number.country_code || '',
                number: number.number || '',
                browser_reset_time: number.browser_reset_time || '',
                password_formatter_ids: selectedIds,
                is_active: number.is_active || false,
                _pendingFormatters: passwordFormatters.length === 0 ? number.password_formatters : null,
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

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
            browser_reset_time: formData.browser_reset_time === '' ? undefined : Number(formData.browser_reset_time),
            password_formatters: selectedFormatters,
            ...(selectedNumber && { is_active: formData.is_active })
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

    const getStatusStyle = (isActive) => ({
        backgroundColor: alpha(isActive ? GREEN_COLOR : RED_COLOR, 0.1),
        color: isActive ? GREEN_COLOR : RED_COLOR,
        borderColor: isActive ? GREEN_COLOR : RED_COLOR,
    });

    const getStatusLabel = (isActive) => isActive ? 'Active' : 'Inactive';

    const MenuProps = {
        PaperProps: { style: { maxHeight: 48 * 4.5 + 8, width: 250 } }
    };

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
                <title>Phone Numbers | Power Automate</title>
            </Helmet>

            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
                <Box>
                    <Typography sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Phone Numbers
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                        Manage phone numbers and password formatters
                    </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                    {selectedRows.length > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />}
                            onClick={() => setOpenBulkDeleteDialog(true)}
                            sx={{
                                background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED_COLOR} 100%)`,
                                color: 'white',
                                fontSize: '0.8rem',
                                py: 0.6,
                                px: 1.5,
                                height: 36,
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)` },
                            }}
                        >
                            Delete ({selectedRows.length})
                        </Button>
                    )}
                    <GradientButton
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => handleOpenDialog()}
                        size="small"
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }}
                        disabled={createMutation.isLoading}
                    >
                        Add Phone Number
                    </GradientButton>
                </Box>
            </Box>

            {/* Search + Status Filter */}
            <Box mb={3} display="flex" gap={2} alignItems="center">
                <StyledTextField
                    fullWidth
                    placeholder="Search by PA ID, phone number, or country code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: TEXT_PRIMARY, fontSize: '0.9rem', opacity: 0.7 }} />,
                    }}
                    size="small"
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                />
                <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                    <InputLabel sx={{ fontSize: '0.85rem' }}>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                            setSelectedRows([]);
                        }}
                        sx={{ fontSize: '0.85rem' }}
                    >
                        <MenuItem value="all" sx={{ fontSize: '0.85rem' }}>All</MenuItem>
                        <MenuItem value="active" sx={{ fontSize: '0.85rem' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: GREEN_COLOR }} />
                                Active
                            </Box>
                        </MenuItem>
                        <MenuItem value="inactive" sx={{ fontSize: '0.85rem' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <BlockIcon sx={{ fontSize: '0.85rem', color: RED_COLOR }} />
                                Inactive
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    overflow: 'auto',
                    mb: 3,
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
                            backgroundColor: alpha(BLUE_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05)
                        }}>
                            {/* Select all checkbox */}
                            <TableCell padding="checkbox" sx={{ borderBottom: `2px solid ${BLUE_COLOR}`, pl: 1.5 }}>
                                <Checkbox
                                    size="small"
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onChange={handleSelectAll}
                                    disabled={phoneNumbers.length === 0}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>PA ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Country Code</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Phone Number</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Browser Reset</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Password Formatters</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading && phoneNumbers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Box py={3}>
                                        <PhoneIcon sx={{ fontSize: 48, color: alpha(TEXT_PRIMARY, 0.2), mb: 2 }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                            {debouncedSearch || statusFilter !== 'all'
                                                ? 'No phone numbers found matching your filters'
                                                : 'No phone numbers found. Add one to get started'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            phoneNumbers.map((item) => {
                                const isRowSelected = selectedRows.includes(item._id);
                                return (
                                    <TableRow
                                        key={item._id}
                                        hover
                                        selected={isRowSelected}
                                        sx={{
                                            '&:hover': { backgroundColor: alpha(BLUE_COLOR, theme.palette.mode === 'dark' ? 0.05 : 0.03) },
                                            '&.Mui-selected': { backgroundColor: alpha(BLUE_COLOR, 0.06) },
                                            '&:last-child td': { borderBottom: 0 },
                                            opacity: deleteMutation.isLoading && itemToDelete?._id === item._id ? 0.5 : 1,
                                        }}
                                    >
                                        <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                                            <Checkbox
                                                size="small"
                                                checked={isRowSelected}
                                                onChange={() => handleSelectRow(item._id)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY, fontFamily: 'monospace', fontWeight: 500 }}>
                                                    {item.pa_id}
                                                </Typography>
                                                <Tooltip title="Copy PA ID">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyPaId(item.pa_id)}
                                                        sx={{ color: BLUE_COLOR, fontSize: '0.8rem', p: 0.5 }}
                                                    >
                                                        <CopyIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={item.country_code}
                                                size="small"
                                                sx={{ backgroundColor: alpha(BLUE_COLOR, 0.1), color: BLUE_COLOR, fontWeight: 500, fontSize: '0.75rem', height: 24 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                                {item.number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                                {item.browser_reset_time}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box display="flex" gap={0.5} flexWrap="wrap">
                                                {item.password_formatters?.map((formatter) => (
                                                    <Tooltip key={formatter._id} title={formatFormatterLabel(formatter)}>
                                                        <Chip
                                                            label={formatFormatterLabel(formatter)}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                                color: GREEN_COLOR,
                                                                fontSize: '0.7rem',
                                                                height: 24,
                                                                '& .MuiChip-label': { px: 1 }
                                                            }}
                                                        />
                                                    </Tooltip>
                                                ))}
                                                {(!item.password_formatters || item.password_formatters.length === 0) && (
                                                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT_PRIMARY, 0.5), fontStyle: 'italic' }}>
                                                        No formatters
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={getStatusLabel(item.is_active)}
                                                size="small"
                                                variant="outlined"
                                                icon={item.is_active
                                                    ? <CheckCircleIcon sx={{ fontSize: '0.75rem' }} />
                                                    : <BlockIcon sx={{ fontSize: '0.75rem' }} />
                                                }
                                                sx={{
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                    height: 24,
                                                    ...getStatusStyle(item.is_active),
                                                    '& .MuiChip-label': { px: 1 },
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(item)}
                                                    sx={{ color: BLUE_COLOR, fontSize: '0.9rem', mr: 0.5 }}
                                                    disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                                >
                                                    <EditIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteClick(item)}
                                                    sx={{ color: RED_COLOR, fontSize: '0.9rem' }}
                                                    disabled={updateMutation.isLoading || deleteMutation.isLoading}
                                                >
                                                    <DeleteIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
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
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: TEXT_PRIMARY }
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
                    {selectedNumber ? 'Edit Phone Number' : 'Add New Phone Number'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Grid container spacing={2.5} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="Country Code"
                                name="country_code"
                                value={formData.country_code}
                                onChange={handleInputChange}
                                placeholder="+1"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="Phone Number"
                                name="number"
                                value={formData.number}
                                onChange={handleInputChange}
                                placeholder="1234567890"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField
                                fullWidth
                                label="Browser Reset"
                                name="browser_reset_time"
                                value={formData.browser_reset_time}
                                onChange={handleInputChange}
                                placeholder="Browser Reset Value"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Password Formatters</InputLabel>
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
                                                        label={formatFormatterLabel(formatter)}
                                                        size="small"
                                                        sx={{ backgroundColor: alpha(GREEN_COLOR, 0.1), color: GREEN_COLOR, fontSize: '0.7rem', height: 24 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        key={value}
                                                        label="Unknown"
                                                        size="small"
                                                        sx={{ backgroundColor: alpha(RED_COLOR, 0.1), color: RED_COLOR, fontSize: '0.7rem', height: 24 }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps}
                                    disabled={formattersLoading}
                                >
                                    {!formattersLoading && passwordFormatters.length > 0 && (
                                        <MenuItem value="select-all" sx={{ fontSize: '0.85rem' }}>
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
                                                <MenuItem key={formatterId} value={formatterId} sx={{ fontSize: '0.85rem' }}>
                                                    <Checkbox checked={isSelected} size="small" />
                                                    <ListItemText
                                                        primary={formatFormatterLabel(formatter)}
                                                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                                                    />
                                                </MenuItem>
                                            );
                                        })
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Active toggle — only shown when editing */}
                        {selectedNumber && (
                            <Grid size={{ xs: 12 }}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 1,
                                        px: 2,
                                        py: 1.2,
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: TEXT_PRIMARY }}>
                                            Active Status
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT_PRIMARY, 0.6) }}>
                                            Toggle whether this phone number is active
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={formData.is_active ? 'Active' : 'Inactive'}
                                        size="small"
                                        variant="outlined"
                                        icon={formData.is_active
                                            ? <CheckCircleIcon sx={{ fontSize: '0.75rem' }} />
                                            : <BlockIcon sx={{ fontSize: '0.75rem' }} />
                                        }
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            fontSize: '0.75rem',
                                            height: 28,
                                            ...getStatusStyle(formData.is_active),
                                            '& .MuiChip-label': { px: 1 },
                                            transition: 'all 0.2s ease',
                                            '&:hover': { opacity: 0.85 }
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}
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
                        disabled={!formData.country_code || !formData.number || createMutation.isLoading || updateMutation.isLoading}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                    >
                        {createMutation.isLoading || updateMutation.isLoading ? (
                            <CircularProgress size={18} sx={{ color: 'white' }} />
                        ) : (
                            selectedNumber ? 'Update' : 'Create'
                        )}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Single Delete Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    color: RED_COLOR, fontWeight: 600, fontSize: '1rem', py: 2, px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        Confirm Delete
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <DialogContentText sx={{ fontSize: '0.9rem', color: TEXT_PRIMARY }}>
                        Are you sure you want to delete phone number{' '}
                        <strong>"{itemToDelete?.pa_id} - {itemToDelete?.country_code} {itemToDelete?.number}"</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton onClick={() => setOpenDeleteDialog(false)} size="medium" sx={{ fontSize: '0.85rem', px: 2 }} disabled={deleteMutation.isLoading}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED_COLOR} 100%)`,
                            color: 'white', borderRadius: 1, padding: '6px 16px', fontWeight: 500,
                            fontSize: '0.85rem', textTransform: 'none',
                            '&:hover': { background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)` },
                        }}
                        onClick={handleDeleteConfirm}
                        startIcon={deleteMutation.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <DeleteIcon sx={{ fontSize: '0.9rem' }} />}
                        disabled={deleteMutation.isLoading}
                    >
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog
                open={openBulkDeleteDialog}
                onClose={() => setOpenBulkDeleteDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    color: RED_COLOR, fontWeight: 600, fontSize: '1rem', py: 2, px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <DeleteSweepIcon sx={{ fontSize: '1.1rem' }} />
                        Confirm Bulk Delete
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <DialogContentText sx={{ fontSize: '0.9rem', color: TEXT_PRIMARY }}>
                        Are you sure you want to delete{' '}
                        <strong>{selectedRows.length} phone number{selectedRows.length > 1 ? 's' : ''}</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton onClick={() => setOpenBulkDeleteDialog(false)} size="medium" sx={{ fontSize: '0.85rem', px: 2 }} disabled={bulkDeleting}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED_COLOR} 100%)`,
                            color: 'white', borderRadius: 1, padding: '6px 16px', fontWeight: 500,
                            fontSize: '0.85rem', textTransform: 'none',
                            '&:hover': { background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)` },
                        }}
                        onClick={handleBulkDelete}
                        startIcon={bulkDeleting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />}
                        disabled={bulkDeleting}
                    >
                        {bulkDeleting ? 'Deleting...' : `Delete ${selectedRows.length}`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" sx={{
                    width: '100%', borderRadius: 1,
                    backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    borderLeft: `3px solid ${GREEN_COLOR}`,
                    '& .MuiAlert-icon': { color: GREEN_COLOR, fontSize: '1rem' },
                    '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                    color: TEXT_PRIMARY, py: 0.5, px: 2,
                }} elevation={4}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{success}</Typography>
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" sx={{
                    width: '100%', borderRadius: 1,
                    backgroundColor: alpha(RED_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    borderLeft: `3px solid ${RED_COLOR}`,
                    '& .MuiAlert-icon': { color: RED_COLOR, fontSize: '1rem' },
                    '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                    color: TEXT_PRIMARY, py: 0.5, px: 2,
                }} elevation={4}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PhoneNumbers;