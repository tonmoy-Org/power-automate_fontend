import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
    Collapse,
    Autocomplete,
    TextField,
    LinearProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FormatListBulleted as FormatIcon,
    ContentCopy as CopyIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';



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

const bulkCreatePasswordFormatters = async (items) => {
    const response = await axiosInstance.post('/password-formatters/bulk', { items });
    return response.data;
};

const bulkDeletePasswordFormatters = async (ids) => {
    const response = await axiosInstance.delete('/password-formatters/bulk', { data: { ids } });
    return response.data;
};

const initialFormData = {
    start_add: '',
    start_index: '',
    end_index: '',
    end_add: '',
    country_code: ''
};

const initialRowData = { start_add: '', start_index: '', end_index: '', end_add: '' };


const INNER_PAGE_SIZE = 30;

const CountryCodeRow = memo(({
    countryCode,
    items,
    globalStartIndex,
    onEdit,
    onDelete,
    onCopy,
    theme,
    colors: { GREEN_COLOR, GREEN_DARK, RED_COLOR, TEXT_PRIMARY },
    groupIndex,
    selectedRows,
    handleSelectRow,
    handleSelectGroup,
}) => {
    const [open, setOpen] = useState(false);
    const [innerPage, setInnerPage] = useState(0);

    const pagedItems = items.slice(innerPage * INNER_PAGE_SIZE, (innerPage + 1) * INNER_PAGE_SIZE);
    const totalInnerPages = Math.ceil(items.length / INNER_PAGE_SIZE);

    return (
        <>
            <TableRow
                sx={{
                    cursor: 'pointer',
                    backgroundColor: alpha(GREEN_COLOR, open ? 0.12 : 0.05),
                    '&:hover': { backgroundColor: alpha(GREEN_COLOR, open ? 0.15 : 0.08) },
                    borderLeft: open ? `4px solid ${GREEN_COLOR}` : '4px solid transparent',
                    transition: 'all 0.2s ease',
                }}
            >
                <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        size="small"
                        checked={items.length > 0 && items.every(i => selectedRows.includes(i._id))}
                        indeterminate={items.some(i => selectedRows.includes(i._id)) && !items.every(i => selectedRows.includes(i._id))}
                        onChange={() => handleSelectGroup(items.map(i => i._id), items.every(i => selectedRows.includes(i._id)))}
                        sx={{ color: alpha(GREEN_COLOR, 0.6), '&.Mui-checked': { color: GREEN_COLOR } }}
                    />
                </TableCell>
                <TableCell sx={{ py: 1, width: 40 }} onClick={() => setOpen(!open)}>
                    <IconButton size="small" sx={{ color: GREEN_COLOR }}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ py: 1, width: 60 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_PRIMARY, fontSize: '0.8rem' }}>
                        {groupIndex + 1}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN_DARK, fontSize: '0.9rem' }}>
                            {countryCode}
                        </Typography>
                        <Chip
                            label={`${items.length} Formatter${items.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                color: GREEN_DARK,
                                borderRadius: '4px'
                            }}
                        />
                    </Box>
                </TableCell>
                <TableCell colSpan={5} />
            </TableRow>

            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{
                            borderLeft: `3px solid ${alpha(GREEN_COLOR, 0.2)}`,
                            ml: 4,
                            mb: 1,
                            mr: 1,
                            backgroundColor: alpha(GREEN_COLOR, 0.02),
                            borderRadius: '0 0 8px 8px',
                            overflow: 'hidden'
                        }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: alpha(GREEN_COLOR, 0.03) }}>
                                        <TableCell padding="checkbox" sx={{ pl: 2, borderBottom: `1px solid ${alpha(GREEN_COLOR, 0.1)}`, width: 40 }} />
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1, width: 80 }}>Serial</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1 }}>Start Add</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1 }}>Start Index</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1 }}>End Index</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1 }}>End Add</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), py: 1 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedItems.map((formatter, idx) => {
                                        const serialNumber = innerPage * INNER_PAGE_SIZE + idx + 1;
                                        return (
                                            <TableRow
                                                key={formatter._id}
                                                hover
                                                sx={{ '&:hover': { backgroundColor: alpha(GREEN_COLOR, 0.04) } }}
                                            >
                                                <TableCell padding="checkbox" sx={{ pl: 2, borderBottom: `1px solid ${alpha(GREEN_COLOR, 0.05)}` }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={selectedRows.includes(formatter._id)}
                                                        onChange={() => handleSelectRow(formatter._id)}
                                                        sx={{ color: alpha(GREEN_COLOR, 0.4), '&.Mui-checked': { color: GREEN_COLOR } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 1, borderBottom: `1px solid ${alpha(GREEN_COLOR, 0.05)}` }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY }}>
                                                        {serialNumber}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Chip label={formatter.start_add ?? '—'} size="small"
                                                        sx={{ backgroundColor: alpha(GREEN_COLOR, 0.08), color: GREEN_DARK, fontWeight: 500, fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }} />
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                                        {formatter.start_index ?? '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                                                        {formatter.end_index ?? '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Chip label={formatter.end_add ?? '—'} size="small"
                                                        sx={{ backgroundColor: alpha(GREEN_COLOR, 0.08), color: GREEN_DARK, fontWeight: 500, fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1 }}>
                                                    <Box display="flex" justifyContent="flex-end">
                                                        <Tooltip title="Copy formatter">
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onCopy(formatter); }} sx={{ color: GREEN_COLOR, p: 0.5 }}>
                                                                <CopyIcon sx={{ fontSize: '1rem' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit formatter">
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(formatter); }} sx={{ color: GREEN_COLOR, p: 0.5 }}>
                                                                <EditIcon sx={{ fontSize: '1rem' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete formatter">
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(formatter); }} sx={{ color: RED_COLOR, p: 0.5 }}>
                                                                <DeleteIcon sx={{ fontSize: '1rem' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {totalInnerPages > 1 && (
                                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1} px={2} py={0.8}
                                    sx={{ borderTop: `1px solid ${alpha(GREEN_COLOR, 0.12)}` }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.55) }}>
                                        {innerPage * INNER_PAGE_SIZE + 1}–{Math.min((innerPage + 1) * INNER_PAGE_SIZE, items.length)} of {items.length}
                                    </Typography>
                                    <IconButton size="small" disabled={innerPage === 0} onClick={() => setInnerPage(p => p - 1)}
                                        sx={{ width: 24, height: 24, color: GREEN_COLOR, '&.Mui-disabled': { opacity: 0.3 } }}>
                                        <KeyboardArrowUpIcon sx={{ fontSize: '1rem', transform: 'rotate(-90deg)' }} />
                                    </IconButton>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_PRIMARY }}>
                                        {innerPage + 1} / {totalInnerPages}
                                    </Typography>
                                    <IconButton size="small" disabled={innerPage >= totalInnerPages - 1} onClick={() => setInnerPage(p => p + 1)}
                                        sx={{ width: 24, height: 24, color: GREEN_COLOR, '&.Mui-disabled': { opacity: 0.3 } }}>
                                        <KeyboardArrowDownIcon sx={{ fontSize: '1rem', transform: 'rotate(-90deg)' }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
});

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
    const [outerPage, setOuterPage] = useState(0);
    const [rowsPerPage] = useState(10);
    const [countryFilter, setCountryFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedCountry, setDebouncedCountry] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [selectedRows, setSelectedRows] = useState([]);
    // Bulk-add state
    const [dialogCountryCode, setDialogCountryCode] = useState('');
    const [currentRow, setCurrentRow] = useState(initialRowData);
    const [pendingRows, setPendingRows] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setDebouncedCountry(countryFilter);
            setOuterPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, countryFilter]);

    const {
        data: formattersData,
        isLoading,
        isError,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['passwordFormatters', debouncedSearch, debouncedCountry],
        queryFn: async ({ queryKey }) => {
            const [, search, country_code] = queryKey;
            const params = new URLSearchParams({
                page: 1,
                limit: 9999, // fetch all, paginate groups client-side
                search: search || '',
                country_code: country_code || ''
            });
            const response = await axiosInstance.get(`/password-formatters?${params}`);
            return response.data;
        },
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

    const bulkCreateMutation = useMutation({
        mutationFn: bulkCreatePasswordFormatters,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['passwordFormatters']);
            setSuccess(data.message || 'Formatters created successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to create formatters');
        }
    });

    const updateMutation = useMutation({
        mutationFn: updatePasswordFormatter,
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: ['passwordFormatters'] });
            const previousData = queryClient.getQueryData(['passwordFormatters', debouncedSearch, debouncedCountry]);
            if (previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], (old) => ({
                    ...old,
                    data: old.data.map(f => f._id === newData.id ? { ...f, ...newData.data } : f)
                }));
            }
            return { previousData };
        },
        onSuccess: (data) => {
            setSuccess(data.message || 'Password formatter updated successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (error, newData, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], context.previousData);
            }
            setError(error.response?.data?.message || 'Failed to update password formatter');
        },
        onSettled: () => {
            queryClient.invalidateQueries(['passwordFormatters']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePasswordFormatter,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['passwordFormatters'] });
            const previousData = queryClient.getQueryData(['passwordFormatters', debouncedSearch, debouncedCountry]);
            if (previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], (old) => ({
                    ...old,
                    data: old.data.filter(f => f._id !== id)
                }));
            }
            return { previousData };
        },
        onSuccess: (data) => {
            setSuccess(data.message || 'Password formatter deleted successfully');
            setOpenDeleteDialog(false);
            setFormatterToDelete(null);
        },
        onError: (error, id, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], context.previousData);
            }
            setError(error.response?.data?.message || 'Failed to delete password formatter');
            setOpenDeleteDialog(false);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['passwordFormatters']);
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeletePasswordFormatters,
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['passwordFormatters'] });
            const previousData = queryClient.getQueryData(['passwordFormatters', debouncedSearch, debouncedCountry]);
            if (previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], (old) => ({
                    ...old,
                    data: old.data.filter(f => !ids.includes(f._id))
                }));
            }
            return { previousData };
        },
        onSuccess: (data) => {
            setSuccess(data.message || 'Password formatters deleted successfully');
            setOpenDeleteDialog(false);
            setSelectedRows([]);
        },
        onError: (error, ids, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['passwordFormatters', debouncedSearch, debouncedCountry], context.previousData);
            }
            setError(error.response?.data?.message || 'Failed to delete password formatters');
            setOpenDeleteDialog(false);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['passwordFormatters']);
        }
    });

    const allFormatters = useMemo(() => formattersData?.data || [], [formattersData]);
    const allVisibleIds = useMemo(() => allFormatters.map(f => f._id), [allFormatters]);

    const handleSelectRow = useCallback((id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    }, []);

    const handleSelectGroup = useCallback((groupIds, isSelected) => {
        if (isSelected) {
            setSelectedRows(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            setSelectedRows(prev => [...new Set([...prev, ...groupIds])]);
        }
    }, []);

    const handleSelectAll = () => {
        if (selectedRows.length === allVisibleIds.length && allVisibleIds.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(allVisibleIds);
        }
    };

    const formatters = useMemo(() => formattersData?.data || [], [formattersData]);
    const totalCount = useMemo(() => formattersData?.pagination?.total || 0, [formattersData]);

    // Group formatters by country code
    const groupedFormatters = useMemo(() => formatters.reduce((acc, formatter) => {
        const code = formatter.country_code || 'Unspecified';
        if (!acc[code]) acc[code] = [];
        acc[code].push(formatter);
        return acc;
    }, {}), [formatters]);

    // Sort grouped keys so 'Unspecified' or numbers appear consistently
    const sortedGroupKeys = useMemo(() => Object.keys(groupedFormatters).sort((a, b) => {
        if (a === 'Unspecified') return 1;
        if (b === 'Unspecified') return -1;
        return a.localeCompare(b);
    }), [groupedFormatters]);

    // Paginate the groups (10 groups per outer page)
    const pagedGroupKeys = useMemo(() =>
        sortedGroupKeys.slice(outerPage * rowsPerPage, (outerPage + 1) * rowsPerPage)
    , [sortedGroupKeys, outerPage, rowsPerPage]);

    const handleChangePage = (event, newPage) => setOuterPage(newPage);
    const handleChangeRowsPerPage = () => {}; // fixed at 10 groups

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedFormatter(null);
        setDialogCountryCode('');
        setCurrentRow(initialRowData);
        setPendingRows([]);
    };

    // Existing country codes for autocomplete
    const existingCountryCodes = useMemo(() =>
        [...new Set(allFormatters.map(f => f.country_code).filter(Boolean))].sort()
    , [allFormatters]);

    const handleAddRow = () => {
        if (!currentRow.start_add && !currentRow.end_add) return;
        setPendingRows(prev => [...prev, { ...currentRow }]);
        setCurrentRow(initialRowData);
    };

    const handleRemovePendingRow = (idx) => {
        setPendingRows(prev => prev.filter((_, i) => i !== idx));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCopyFormatter = useCallback((formatter) => {
        const text = `${formatter.start_add ?? ''} → ${formatter.start_index ?? ''} → ${formatter.end_index ?? ''} → ${formatter.end_add ?? ''}`;
        navigator.clipboard.writeText(text);
        setSuccess('Formatter copied to clipboard');
    }, []);

    const handleOpenDialog = useCallback((formatter = null) => {
        if (formatter) {
            setSelectedFormatter(formatter);
            setFormData({
                start_add: formatter.start_add ?? '',
                start_index: formatter.start_index ?? '',
                end_index: formatter.end_index ?? '',
                end_add: formatter.end_add ?? '',
                country_code: formatter.country_code ?? ''
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    }, [resetForm]);

    const handleSubmit = () => {
        if (selectedFormatter) {
            // Edit mode — single update
            const apiData = {
                start_add: formData.start_add,
                start_index: formData.start_index === '' ? undefined : Number(formData.start_index),
                end_index: formData.end_index === '' ? undefined : Number(formData.end_index),
                end_add: formData.end_add,
                country_code: formData.country_code
            };
            updateMutation.mutate({ id: selectedFormatter._id, data: apiData });
        } else {
            // Bulk-add mode — save all pending rows
            const allRows = pendingRows.length > 0
                ? pendingRows
                : [currentRow]; // allow saving current row even if not explicitly added
            const items = allRows.map(r => ({
                start_add: r.start_add,
                start_index: r.start_index === '' ? undefined : Number(r.start_index),
                end_index: r.end_index === '' ? undefined : Number(r.end_index),
                end_add: r.end_add,
                country_code: dialogCountryCode
            }));
            if (items.length === 1) {
                createMutation.mutate(items[0]);
            } else {
                bulkCreateMutation.mutate(items);
            }
        }
    };

    const handleDeleteClick = useCallback((formatter) => {
        setFormatterToDelete(formatter);
        setOpenDeleteDialog(true);
    }, []);

    const handleDeleteConfirm = () => {
        if (formatterToDelete) {
            deleteMutation.mutate(formatterToDelete._id);
        } else if (selectedRows.length > 0) {
            bulkDeleteMutation.mutate(selectedRows);
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

            {selectedRows.length > 0 && (
                <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    mb={2.5}
                    px={2}
                    py={1}
                    sx={{
                        borderRadius: 1.5,
                        backgroundColor: alpha(GREEN_COLOR, 0.05),
                        border: `1px solid ${alpha(GREEN_COLOR, 0.2)}`,
                        flexWrap: 'wrap',
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: '0.9rem', color: GREEN_COLOR }} />
                    <Typography sx={{ fontSize: '0.8rem', color: GREEN_COLOR, fontWeight: 600 }}>
                        {selectedRows.length} formatter{selectedRows.length !== 1 ? 's' : ''} selected
                    </Typography>
                    <Box flex={1} />
                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon sx={{ fontSize: '0.8rem' }} />}
                        onClick={() => {
                            setFormatterToDelete(null);
                            setOpenDeleteDialog(true);
                        }}
                        sx={{
                            fontSize: '0.75rem',
                            py: 0.4,
                            px: 1.2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '6px',
                            backgroundColor: RED_COLOR,
                            '&:hover': { backgroundColor: RED_DARK },
                        }}
                    >
                        Delete Selected
                    </Button>
                </Box>
            )}

            <Box mb={3} display="flex" gap={2}>
                <Box sx={{ flexGrow: 1 }}>
                    <StyledTextField
                        fullWidth
                        placeholder="Search by start_add or end_add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                    />
                </Box>
                <Box sx={{ width: 200 }}>
                    <StyledTextField
                        fullWidth
                        placeholder="Filter by Country Code..."
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        size="small"
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                    />
                </Box>
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
                {isLoading && !formattersData && (
                    <LinearProgress
                        sx={{
                            borderRadius: '1.5px 1.5px 0 0',
                            height: 3,
                            backgroundColor: alpha(GREEN_COLOR, 0.1),
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: GREEN_COLOR,
                                borderRadius: '1.5px',
                            },
                        }}
                    />
                )}

                <Table size="medium">
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05)
                        }}>
                            <TableCell padding="checkbox" sx={{ pl: 2, borderBottom: `2px solid ${GREEN_COLOR}`, py: 1.5 }}>
                                <Checkbox
                                    size="small"
                                    checked={allVisibleIds.length > 0 && selectedRows.length === allVisibleIds.length}
                                    indeterminate={selectedRows.length > 0 && selectedRows.length < allVisibleIds.length}
                                    onChange={handleSelectAll}
                                    sx={{ color: alpha(GREEN_COLOR, 0.6), '&.Mui-checked': { color: GREEN_COLOR } }}
                                />
                            </TableCell>
                            <TableCell sx={{ width: 40, borderBottom: `2px solid ${GREEN_COLOR}`, py: 1.5 }} />
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5, width: '60px' }}>Serial</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${GREEN_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Country Code</TableCell>
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
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Box py={3}>
                                        <FormatIcon sx={{ fontSize: 48, color: alpha(TEXT_PRIMARY, 0.2), mb: 2 }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                            {debouncedSearch || debouncedCountry ? 'No password formatters found matching your search' : 'No password formatters found. Add one to get started'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagedGroupKeys.map((countryCode) => {
                                // Global group index across all pages
                                const groupIdx = sortedGroupKeys.indexOf(countryCode);

                                return (
                                    <CountryCodeRow
                                        key={countryCode}
                                        countryCode={countryCode}
                                        items={groupedFormatters[countryCode]}
                                        globalStartIndex={0}
                                        onEdit={handleOpenDialog}
                                        onDelete={handleDeleteClick}
                                        onCopy={handleCopyFormatter}
                                        theme={theme}
                                        colors={{ GREEN_COLOR, GREEN_DARK, RED_COLOR, TEXT_PRIMARY }}
                                        groupIndex={groupIdx}
                                        selectedRows={selectedRows}
                                        handleSelectRow={handleSelectRow}
                                        handleSelectGroup={handleSelectGroup}
                                    />
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    rowsPerPageOptions={[10]}
                    component="div"
                    count={sortedGroupKeys.length}
                    rowsPerPage={rowsPerPage}
                    page={outerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count} groups`}
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
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    py: 1.5,
                    px: 3,
                    background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_COLOR} 100%)`,
                    color: '#fff',
                }}>
                    {selectedFormatter ? 'Edit Password Formatter' : 'Add Password Formatters'}
                </DialogTitle>

                {(createMutation.isLoading || bulkCreateMutation.isLoading || updateMutation.isLoading) && (
                    <LinearProgress sx={{ height: 2, backgroundColor: alpha(GREEN_COLOR, 0.2), '& .MuiLinearProgress-bar': { backgroundColor: GREEN_COLOR } }} />
                )}

                <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                    {selectedFormatter ? (
                        /* ─── EDIT MODE: single row ─── */
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 12 }}>
                                <StyledTextField fullWidth label="Country Code" name="country_code"
                                    value={formData.country_code} onChange={handleInputChange}
                                    size="small" placeholder="e.g. 91" />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <StyledTextField fullWidth label="Start Add" name="start_add"
                                    value={formData.start_add} onChange={handleInputChange} size="small" />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <StyledTextField fullWidth label="Start Index" name="start_index"
                                    value={formData.start_index} onChange={handleInputChange} size="small" type="number" />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <StyledTextField fullWidth label="End Index" name="end_index"
                                    value={formData.end_index} onChange={handleInputChange} size="small" type="number" />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <StyledTextField fullWidth label="End Add" name="end_add"
                                    value={formData.end_add} onChange={handleInputChange} size="small" />
                            </Grid>
                        </Grid>
                    ) : (
                        /* ─── ADD MODE: bulk multi-row ─── */
                        <Box>
                            {/* Country Code Autocomplete */}
                            <Box my={2.5}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Country Code
                                </Typography>
                                <Autocomplete
                                    freeSolo
                                    options={existingCountryCodes}
                                    value={dialogCountryCode}
                                    onInputChange={(_, val) => setDialogCountryCode(val)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            placeholder="Select or type country code (e.g. 91)"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                    fontSize: '0.85rem',
                                                    '& fieldset': { borderColor: alpha(GREEN_COLOR, 0.35) },
                                                    '&:hover fieldset': { borderColor: GREEN_COLOR },
                                                    '&.Mui-focused fieldset': { borderColor: GREEN_COLOR },
                                                },
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} sx={{ fontSize: '0.85rem', py: 0.5 }}>
                                            <Chip label={option} size="small" sx={{ backgroundColor: alpha(GREEN_COLOR, 0.1), color: GREEN_DARK, fontSize: '0.75rem', height: 20, mr: 1 }} />
                                            {option}
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* Input row */}
                            <Box mb={1.5}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: alpha(TEXT_PRIMARY, 0.6), mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Formatter Row
                                </Typography>
                                <Box display="flex" gap={1} alignItems="center">
                                    <StyledTextField size="small" label="Start Add" value={currentRow.start_add}
                                        onChange={e => setCurrentRow(r => ({ ...r, start_add: e.target.value }))}
                                        sx={{ flex: 2 }} />
                                    <StyledTextField size="small" label="Start Index" type="text" value={currentRow.start_index}
                                        onChange={e => setCurrentRow(r => ({ ...r, start_index: e.target.value }))}
                                        sx={{ flex: 1 }} />
                                    <StyledTextField size="small" label="End Index" type="text" value={currentRow.end_index}
                                        onChange={e => setCurrentRow(r => ({ ...r, end_index: e.target.value }))}
                                        sx={{ flex: 1 }} />
                                    <StyledTextField size="small" label="End Add" value={currentRow.end_add}
                                        onChange={e => setCurrentRow(r => ({ ...r, end_add: e.target.value }))}
                                        sx={{ flex: 2 }} />
                                    <Tooltip title="Add to list">
                                        <span>
                                            <Button
                                                variant="contained"
                                                onClick={handleAddRow}
                                                disabled={!currentRow.start_add && !currentRow.end_add}
                                                sx={{
                                                    minWidth: 40, height: 38, px: 1.5, flexShrink: 0,
                                                    backgroundColor: GREEN_COLOR,
                                                    '&:hover': { backgroundColor: GREEN_DARK },
                                                    borderRadius: 1.5,
                                                }}
                                            >
                                                <AddIcon sx={{ fontSize: '1.1rem' }} />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Pending rows preview */}
                            {pendingRows.length > 0 && (
                                <Box sx={{ border: `1px solid ${alpha(GREEN_COLOR, 0.25)}`, borderRadius: 1.5, overflow: 'hidden', mt: 2 }}>
                                    <Box px={2} py={0.8} sx={{ backgroundColor: alpha(GREEN_COLOR, 0.05), borderBottom: `1px solid ${alpha(GREEN_COLOR, 0.15)}` }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: GREEN_DARK }}>
                                            {pendingRows.length} formatter{pendingRows.length !== 1 ? 's' : ''} queued — will be saved together
                                        </Typography>
                                    </Box>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: alpha(GREEN_COLOR, 0.03) }}>
                                                <TableCell sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.5), py: 0.8, width: 36 }}>#</TableCell>
                                                <TableCell sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.5), py: 0.8 }}>Start Add</TableCell>
                                                <TableCell sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.5), py: 0.8 }}>Start Idx</TableCell>
                                                <TableCell sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.5), py: 0.8 }}>End Idx</TableCell>
                                                <TableCell sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.5), py: 0.8 }}>End Add</TableCell>
                                                <TableCell sx={{ py: 0.8, width: 36 }} />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingRows.map((row, idx) => (
                                                <TableRow key={idx} hover sx={{ '&:hover': { backgroundColor: alpha(GREEN_COLOR, 0.03) } }}>
                                                    <TableCell sx={{ fontSize: '0.78rem', py: 0.7, color: alpha(TEXT_PRIMARY, 0.5) }}>{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.start_add || '—'} size="small" sx={{ height: 18, fontSize: '0.7rem', backgroundColor: alpha(GREEN_COLOR, 0.08), color: GREEN_DARK, fontFamily: 'monospace' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem', py: 0.7, fontFamily: 'monospace' }}>{row.start_index || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem', py: 0.7, fontFamily: 'monospace' }}>{row.end_index || '—'}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.end_add || '—'} size="small" sx={{ height: 18, fontSize: '0.7rem', backgroundColor: alpha(GREEN_COLOR, 0.08), color: GREEN_DARK, fontFamily: 'monospace' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ py: 0.7 }}>
                                                        <IconButton size="small" onClick={() => handleRemovePendingRow(idx)} sx={{ color: RED_COLOR, p: 0.3 }}>
                                                            <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    {!selectedFormatter && pendingRows.length > 0 && (
                        <Typography sx={{ flex: 1, fontSize: '0.78rem', color: alpha(TEXT_PRIMARY, 0.5) }}>
                            {pendingRows.length} formatter{pendingRows.length !== 1 ? 's' : ''} ready to save
                        </Typography>
                    )}
                    <OutlineButton
                        onClick={() => { setOpenDialog(false); resetForm(); }}
                        size="small"
                        sx={{ fontSize: '0.83rem', px: 2 }}
                        disabled={createMutation.isLoading || updateMutation.isLoading || bulkCreateMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={createMutation.isLoading || updateMutation.isLoading || bulkCreateMutation.isLoading || (!selectedFormatter && pendingRows.length === 0 && !currentRow.start_add && !currentRow.end_add)}
                        size="small"
                        sx={{ fontSize: '0.83rem', px: 2.5, backgroundColor: GREEN_COLOR, '&:hover': { backgroundColor: GREEN_DARK } }}
                    >
                        {(createMutation.isLoading || updateMutation.isLoading || bulkCreateMutation.isLoading) ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : selectedFormatter ? 'Update' : `Save${pendingRows.length > 1 ? ` All (${pendingRows.length})` : ''}`}
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