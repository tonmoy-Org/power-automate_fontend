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
    Collapse,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Phone as PhoneIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon,
    DeleteSweep as DeleteSweepIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    ExpandMore as ExpandMoreIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

const MAX_NUMBERS_PER_UPLOAD = 100;

// Fetch ALL numbers (no server-side pagination) so we can group + paginate by country code client-side
const fetchPhoneNumbers = async ({ queryKey }) => {
    const [, , , search] = queryKey;
    const params = new URLSearchParams({ page: 1, limit: 9999, search: search || '' });
    const { data } = await axiosInstance.get(`/phone-numbers?${params}`);
    return data;
};

const fetchPasswordFormatters = async () => {
    const { data } = await axiosInstance.get('/password-formatters/list');
    return data;
};

const createPhoneNumber = async (data) => {
    const { data: res } = await axiosInstance.post('/phone-numbers', data);
    return res;
};

const updatePhoneNumber = async ({ id, data }) => {
    const { data: res } = await axiosInstance.put(`/phone-numbers/${id}`, data);
    return res;
};

const deletePhoneNumber = async (id) => {
    const { data } = await axiosInstance.delete(`/phone-numbers/${id}`);
    return data;
};

const initialFormData = {
    country_code: '',
    numbers: '',
    browser_reset_time: '',
    password_formatter_ids: [],
    is_active: false,
};

const matchFormatterToMaster = (embedded, masters) =>
    masters.find(m =>
        m.start_add === embedded.start_add &&
        m.end_add === embedded.end_add &&
        m.start_index === embedded.start_index &&
        m.end_index === embedded.end_index
    );

const formatFormatterLabel = (f) =>
    `${f.start_add ?? ''} → ${f.start_index ?? ''} → ${f.end_index ?? ''} → ${f.end_add ?? ''}`;

const parseNumbers = (raw) =>
    raw.split('\n').map(l => l.trim()).filter(Boolean);

const groupByCountryCode = (items) => {
    const map = {};
    for (const item of items) {
        const cc = item.country_code || 'Unknown';
        if (!map[cc]) map[cc] = [];
        map[cc].push(item);
    }
    return Object.entries(map).map(([country_code, items]) => ({ country_code, items }));
};

const cellSx = { fontSize: '0.82rem', py: 1.2 };

function CountryCodeRow({
    group, selectedRows, onSelectAll, onSelectRow, onEdit, onDelete, onDeleteGroup,
    deletingId, theme, colors: { BLUE, RED, GREEN, TEXT },
    getStatusStyle, getStatusLabel, initiallyOpen = false,
}) {
    const [open, setOpen] = useState(initiallyOpen);
    const groupIds = group.items.map(i => i._id);
    const allSelected = groupIds.length > 0 && groupIds.every(id => selectedRows.includes(id));
    const someSelected = selectedRows.some(id => groupIds.includes(id)) && !allSelected;

    return (
        <>
            <TableRow sx={{
                backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                '&:hover': { backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.15 : 0.08) },
            }}>
                <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48 }}>
                    <Checkbox size="small" checked={allSelected} indeterminate={someSelected}
                        onChange={() => onSelectAll(groupIds, allSelected)} />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" onClick={() => setOpen(o => !o)}
                            sx={{ p: 0.3, color: alpha(TEXT, 0.5) }}>
                            {open
                                ? <KeyboardArrowUpIcon sx={{ fontSize: '1rem' }} />
                                : <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />}
                        </IconButton>
                        <Chip label={group.country_code} size="small" sx={{
                            backgroundColor: alpha(BLUE, 0.12),
                            color: BLUE,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            height: 24,
                            borderRadius: '6px',
                        }} />
                        <Typography variant="caption" sx={{ color: alpha(TEXT, 0.6), fontSize: '0.78rem', ml: 1 }}>
                            {group.items.length} number{group.items.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell colSpan={3} />
                <TableCell align="right" sx={{ pr: 1.5, py: 0.8 }}>
                    <Tooltip title={`Delete all ${group.items.length} number${group.items.length !== 1 ? 's' : ''} in ${group.country_code}`} placement="top">
                        <IconButton size="small" onClick={() => onDeleteGroup(group)}
                            sx={{ color: RED, width: 28, height: 28, '&:hover': { backgroundColor: alpha(RED, 0.1) } }}>
                            <DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.04 : 0.02) }}>
                                    <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48, py: 0.8, borderBottom: `1px solid ${alpha(BLUE, 0.2)}` }} />
                                    {['Phone Number', 'Browser Reset', 'Password Formatters', 'Status', 'Actions'].map((label, i) => (
                                        <TableCell key={label} align={i === 4 ? 'right' : 'left'}
                                            sx={{
                                                py: 0.9, fontSize: '0.78rem', fontWeight: 700,
                                                color: TEXT,
                                                borderBottom: `1px solid ${alpha(BLUE, 0.2)}`,
                                                pl: i === 0 ? 5.5 : undefined,
                                                pr: i === 4 ? 1.5 : undefined,
                                            }}>
                                            {label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {group.items.map(item => {
                                    const isSelected = selectedRows.includes(item._id);
                                    return (
                                        <TableRow key={item._id} hover selected={isSelected}
                                            sx={{
                                                opacity: deletingId === item._id ? 0.4 : 1,
                                                transition: 'opacity 0.2s',
                                                '&.Mui-selected': { backgroundColor: alpha(BLUE, 0.05) },
                                            }}>
                                            <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48 }}>
                                                <Checkbox size="small" checked={isSelected}
                                                    onChange={() => onSelectRow(item._id)} />
                                            </TableCell>
                                            <TableCell sx={{ ...cellSx, pl: 5.5 }}>
                                                <Typography sx={{
                                                    fontSize: '0.82rem', fontFamily: 'monospace',
                                                    color: TEXT, letterSpacing: '0.02em',
                                                }}>
                                                    {item.number}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={cellSx}>
                                                {item.browser_reset_time
                                                    ? <Typography sx={{ fontSize: '0.82rem', color: TEXT }}>{item.browser_reset_time}</Typography>
                                                    : <Typography sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.35), fontStyle: 'italic' }}>—</Typography>
                                                }
                                            </TableCell>
                                            <TableCell sx={cellSx}>
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {item.password_formatters?.length > 0
                                                        ? item.password_formatters.map(f => (
                                                            <Tooltip key={f._id} title={formatFormatterLabel(f)}>
                                                                <Chip label={formatFormatterLabel(f)} size="small" sx={{
                                                                    backgroundColor: alpha(GREEN, 0.1),
                                                                    color: GREEN, fontSize: '0.68rem',
                                                                    height: 22, borderRadius: '4px',
                                                                    '& .MuiChip-label': { px: 0.8 },
                                                                }} />
                                                            </Tooltip>
                                                        ))
                                                        : <Typography sx={{ fontSize: '0.73rem', color: alpha(TEXT, 0.35), fontStyle: 'italic' }}>
                                                            No formatters
                                                        </Typography>
                                                    }
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={cellSx}>
                                                <Chip
                                                    label={getStatusLabel(item.is_active)}
                                                    size="small"
                                                    variant="outlined"
                                                    icon={item.is_active
                                                        ? <CheckCircleIcon sx={{ fontSize: '0.72rem !important' }} />
                                                        : <BlockIcon sx={{ fontSize: '0.72rem !important' }} />}
                                                    sx={{
                                                        height: 22, borderRadius: '4px',
                                                        fontWeight: 500, fontSize: '0.72rem',
                                                        ...getStatusStyle(item.is_active),
                                                        '& .MuiChip-label': { px: 0.8 },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ ...cellSx, pr: 1.5 }}>
                                                <Tooltip title="Edit" placement="top">
                                                    <IconButton size="small" onClick={() => onEdit(item)}
                                                        sx={{
                                                            color: BLUE, mr: 0.3,
                                                            width: 28, height: 28,
                                                            '&:hover': { backgroundColor: alpha(BLUE, 0.1) },
                                                        }}>
                                                        <EditIcon sx={{ fontSize: '0.85rem' }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete" placement="top">
                                                    <IconButton size="small" onClick={() => onDelete(item)}
                                                        sx={{
                                                            color: RED,
                                                            width: 28, height: 28,
                                                            '&:hover': { backgroundColor: alpha(RED, 0.1) },
                                                        }}>
                                                        <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

function DeleteConfirmDialog({ open, onClose, onConfirm, loading, title, icon: Icon, message, confirmLabel }) {
    const theme = useTheme();
    const RED = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const TEXT = theme.palette.text.primary;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{
                color: RED, fontWeight: 600, fontSize: '0.95rem',
                py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}`,
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ fontSize: '1.1rem' }} />
                    {title}
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <DialogContentText sx={{ fontSize: '0.875rem', color: TEXT, lineHeight: 1.6 }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                <OutlineButton onClick={onClose} size="medium"
                    sx={{ fontSize: '0.82rem', px: 2 }} disabled={loading}>
                    Cancel
                </OutlineButton>
                <Button variant="contained" onClick={onConfirm} disabled={loading}
                    startIcon={loading
                        ? <CircularProgress size={16} sx={{ color: 'white' }} />
                        : <Icon sx={{ fontSize: '0.9rem' }} />}
                    sx={{
                        background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED} 100%)`,
                        color: 'white', borderRadius: '8px', px: 2,
                        fontWeight: 500, fontSize: '0.82rem', textTransform: 'none',
                        '&:hover': { background: `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)` },
                    }}>
                    {loading ? 'Deleting…' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DuplicateNumbersWarning({ duplicates, onRemoveAll, onKeepAll }) {
    const theme = useTheme();
    const WARNING_COLOR = theme.palette.warning.main;
    const TEXT = theme.palette.text.primary;

    return (
        <Accordion
            sx={{
                mt: 2,
                border: `1px solid ${alpha(WARNING_COLOR, 0.3)}`,
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
                backgroundColor: alpha(WARNING_COLOR, 0.02),
            }}
            elevation={0}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: WARNING_COLOR }} />}
                sx={{
                    backgroundColor: alpha(WARNING_COLOR, 0.06),
                    borderBottom: `1px solid ${alpha(WARNING_COLOR, 0.2)}`,
                    minHeight: 48,
                    '& .MuiAccordionSummary-content': { my: 0.5 },
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5}>
                    <WarningIcon sx={{ color: WARNING_COLOR, fontSize: '1.1rem' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: WARNING_COLOR }}>
                        {duplicates.length} Duplicate Number{duplicates.length > 1 ? 's' : ''} Found
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                    <Box display="flex" flexWrap="wrap" gap={0.8}>
                        {duplicates.map((num, idx) => (
                            <Chip
                                key={idx}
                                label={num}
                                size="small"
                                sx={{
                                    fontFamily: 'monospace',
                                    backgroundColor: alpha(WARNING_COLOR, 0.08),
                                    border: `1px solid ${alpha(WARNING_COLOR, 0.3)}`,
                                    color: TEXT,
                                    fontSize: '0.75rem',
                                    height: 26,
                                    '& .MuiChip-label': { px: 1.2 },
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Box display="flex" gap={1} justifyContent="flex-end">
                    <OutlineButton
                        size="small"
                        onClick={onRemoveAll}
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                    >
                        Remove All Duplicates
                    </OutlineButton>
                    <GradientButton
                        size="small"
                        onClick={onKeepAll}
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                    >
                        Keep All (Will Fail)
                    </GradientButton>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

function BulkUploadErrorDetails({ errors, onRetry, onClear }) {
    const theme = useTheme();
    const RED = theme.palette.error.main;
    const TEXT = theme.palette.text.primary;

    return (
        <Box sx={{
            border: `1px solid ${alpha(RED, 0.4)}`,
            borderRadius: 1.5,
            overflow: 'hidden',
            mt: 2,
        }}>
            <Box display="flex" alignItems="center" justifyContent="space-between"
                sx={{ px: 2, py: 1.5, backgroundColor: alpha(RED, 0.06), borderBottom: `1px solid ${alpha(RED, 0.2)}` }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <BlockIcon sx={{ fontSize: '0.9rem', color: RED }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: RED }}>
                        Upload Failed: {errors.length} error{errors.length > 1 ? 's' : ''}
                    </Typography>
                </Box>
                <Tooltip title="Clear errors">
                    <IconButton size="small" onClick={onClear} sx={{ color: alpha(TEXT, 0.4) }}>
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                {errors.map((error, index) => (
                    <Box
                        key={index}
                        sx={{
                            p: 1.5,
                            borderBottom: index < errors.length - 1 ? `1px solid ${alpha(RED, 0.1)}` : 'none',
                            backgroundColor: index % 2 === 0 ? alpha(RED, 0.02) : 'transparent',
                        }}
                    >
                        <Box display="flex" alignItems="flex-start" gap={1}>
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: TEXT,
                                    minWidth: 100,
                                }}
                            >
                                {error.number}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '0.78rem',
                                    color: RED,
                                    flex: 1,
                                }}
                            >
                                {error.message}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${alpha(RED, 0.15)}`, backgroundColor: alpha(RED, 0.03) }}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                    <OutlineButton size="small" onClick={onClear} sx={{ fontSize: '0.75rem' }}>
                        Clear All
                    </OutlineButton>
                    <GradientButton size="small" onClick={onRetry} sx={{ fontSize: '0.75rem' }}>
                        Retry Failed Numbers
                    </GradientButton>
                </Box>
            </Box>
        </Box>
    );
}

export const PhoneNumbers = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const BLUE = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark;
    const RED = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const GREEN = theme.palette.success.main;
    const TEXT = theme.palette.text.primary;
    const colors = { BLUE, RED, GREEN, TEXT };

    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkUploadState, setBulkUploadState] = useState(null);
    const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
    const [duplicateNumbers, setDuplicateNumbers] = useState([]);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [openGroupDeleteDialog, setOpenGroupDeleteDialog] = useState(false);
    const [groupDeleting, setGroupDeleting] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { setSelectedRows([]); }, [page, rowsPerPage, debouncedSearch, statusFilter]);

    const {
        data: phoneNumbersData, isLoading, isError, error: queryError, refetch,
    } = useQuery({
        queryKey: ['phoneNumbers', page, rowsPerPage, debouncedSearch],
        queryFn: fetchPhoneNumbers,
        keepPreviousData: true,
    });

    const { data: formattersData, isLoading: formattersLoading } = useQuery({
        queryKey: ['passwordFormatters'],
        queryFn: fetchPasswordFormatters,
    });

    const createMutation = useMutation({
        mutationFn: createPhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number(s) created successfully');
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || 'Failed to create phone number';
            return Promise.reject({ message: errorMessage, number: err.config?.data?.number });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updatePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number updated successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to update phone number');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePhoneNumber,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message || 'Phone number deleted successfully');
            setOpenDeleteDialog(false);
            setItemToDelete(null);
        },
        onError: (err) => setError(err.response?.data?.message || 'Failed to delete phone number'),
    });

    const handleDeleteGroupClick = (group) => { setGroupToDelete(group); setOpenGroupDeleteDialog(true); };

    const handleGroupDeleteConfirm = async () => {
        if (!groupToDelete) return;
        setGroupDeleting(true);
        const results = await Promise.allSettled(groupToDelete.items.map(item => deletePhoneNumber(item._id)));
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        setGroupDeleting(false);
        setOpenGroupDeleteDialog(false);
        setGroupToDelete(null);
        queryClient.invalidateQueries(['phoneNumbers']);
        failed === 0
            ? setSuccess(`${succeeded} phone number${succeeded > 1 ? 's' : ''} deleted successfully`)
            : setError(`${succeeded} deleted, ${failed} failed`);
    };

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        const results = await Promise.allSettled(selectedRows.map(id => deletePhoneNumber(id)));
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        setBulkDeleting(false);
        setOpenBulkDeleteDialog(false);
        setSelectedRows([]);
        queryClient.invalidateQueries(['phoneNumbers']);
        failed === 0
            ? setSuccess(`${succeeded} phone number${succeeded > 1 ? 's' : ''} deleted successfully`)
            : setError(`${succeeded} deleted, ${failed} failed`);
    };

    const allPhoneNumbers = phoneNumbersData?.data || [];

    const passwordFormatters = formattersData?.data || [];

    // Filter by status client-side
    const filteredNumbers = statusFilter === 'all'
        ? allPhoneNumbers
        : allPhoneNumbers.filter(item => statusFilter === 'active' ? item.is_active : !item.is_active);

    // Group by country code
    const groupedNumbers = groupByCountryCode(filteredNumbers);

    // Paginate groups (not individual numbers)
    const paginatedGroups = groupedNumbers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const allVisibleIds = filteredNumbers.map(item => item._id);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedRows.includes(id));
    const someSelected = selectedRows.length > 0 && !allSelected;

    const handleSelectAllVisible = () => allSelected
        ? setSelectedRows(prev => prev.filter(id => !allVisibleIds.includes(id)))
        : setSelectedRows(prev => [...new Set([...prev, ...allVisibleIds])]);

    const handleSelectGroupAll = (groupIds, groupAllSelected) => groupAllSelected
        ? setSelectedRows(prev => prev.filter(id => !groupIds.includes(id)))
        : setSelectedRows(prev => [...new Set([...prev, ...groupIds])]);

    const handleSelectRow = (id) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedNumber(null);
        setBulkUploadErrors([]);
        setDuplicateNumbers([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'numbers' && !selectedNumber) {
            const nums = parseNumbers(value);
            const duplicates = checkForDuplicates(nums);
            setDuplicateNumbers(duplicates);
        }
    };

    const handleFormatterSelectChange = (event) => {
        const { value } = event.target;
        if (value.includes('select-all')) {
            const allIds = passwordFormatters.map(f => String(f._id));
            setFormData(prev => ({
                ...prev,
                password_formatter_ids: prev.password_formatter_ids.length === allIds.length ? [] : allIds,
            }));
        } else {
            const vals = Array.isArray(value) ? value.map(String) : value.split(',').map(String);
            setFormData(prev => ({ ...prev, password_formatter_ids: vals }));
        }
    };

    const getSelectedFormatterIds = (phoneNumber) => {
        if (!Array.isArray(phoneNumber?.password_formatters)) return [];
        return phoneNumber.password_formatters
            .map(ef => { const m = matchFormatterToMaster(ef, passwordFormatters); return m ? String(m._id) : null; })
            .filter(Boolean);
    };

    const handleOpenDialog = (number = null) => {
        if (number) {
            setSelectedNumber(number);
            setFormData({
                country_code: number.country_code || '',
                numbers: number.number || '',
                browser_reset_time: number.browser_reset_time || '',
                password_formatter_ids: passwordFormatters.length > 0 ? getSelectedFormatterIds(number) : [],
                is_active: number.is_active || false,
                _pendingFormatters: passwordFormatters.length === 0 ? number.password_formatters : null,
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    useEffect(() => {
        if (passwordFormatters.length > 0 && formData._pendingFormatters?.length > 0) {
            const resolved = formData._pendingFormatters
                .map(ef => { const m = matchFormatterToMaster(ef, passwordFormatters); return m ? String(m._id) : null; })
                .filter(Boolean);
            setFormData(prev => ({ ...prev, password_formatter_ids: resolved, _pendingFormatters: null }));
        }
    }, [passwordFormatters, formData._pendingFormatters]);

    const checkForDuplicates = (numbers) => {
        const seen = new Set();
        const duplicates = new Set();
        numbers.forEach(num => {
            if (seen.has(num)) duplicates.add(num);
            else seen.add(num);
        });
        return Array.from(duplicates);
    };

    const removeDuplicates = () => {
        const nums = parseNumbers(formData.numbers);
        const uniqueNums = [...new Set(nums)];
        setFormData(prev => ({ ...prev, numbers: uniqueNums.join('\n') }));
        setDuplicateNumbers([]);
        setSuccess('Duplicates removed successfully');
    };

    const handleSubmit = async () => {
        const selectedFormatters = passwordFormatters
            .filter(f => formData.password_formatter_ids.includes(String(f._id)))
            .map(f => ({ id: String(f._id), start_add: f.start_add, start_index: f.start_index, end_index: f.end_index, end_add: f.end_add }));

        if (selectedNumber) {
            updateMutation.mutate({
                id: selectedNumber._id,
                data: {
                    country_code: formData.country_code,
                    number: formData.numbers.trim(),
                    browser_reset_time: formData.browser_reset_time === '' ? undefined : Number(formData.browser_reset_time),
                    password_formatters: selectedFormatters,
                    is_active: formData.is_active,
                },
            });
        } else {
            const nums = parseNumbers(formData.numbers);
            if (nums.length === 0) { setError('Please enter at least one phone number'); return; }

            if (duplicateNumbers.length > 0) {
                setError(`Please remove duplicate numbers before uploading. Found: ${duplicateNumbers.join(', ')}`);
                return;
            }

            if (nums.length > MAX_NUMBERS_PER_UPLOAD) {
                setError(`Maximum ${MAX_NUMBERS_PER_UPLOAD} numbers can be uploaded at once. You entered ${nums.length} numbers.`);
                return;
            }

            setBulkUploadState({ total: nums.length, done: 0 });
            setBulkUploadErrors([]);

            const errors = [];
            let succeeded = 0;

            for (const num of nums) {
                try {
                    await createMutation.mutateAsync({
                        country_code: formData.country_code,
                        number: num,
                        browser_reset_time: formData.browser_reset_time === '' ? undefined : Number(formData.browser_reset_time),
                        password_formatters: selectedFormatters,
                    });
                    succeeded++;
                } catch (err) {
                    errors.push({
                        number: num,
                        message: err.message || 'Failed to create phone number'
                    });
                }
                setBulkUploadState(prev => ({ ...prev, done: prev.done + 1 }));
            }

            setBulkUploadState(null);
            queryClient.invalidateQueries(['phoneNumbers']);

            if (errors.length === 0) {
                setSuccess(`${succeeded} phone number${succeeded > 1 ? 's' : ''} created successfully`);
                setOpenDialog(false);
                resetForm();
            } else {
                setBulkUploadErrors(errors);
                const failedNumbers = errors.map(e => e.number);
                setFormData(prev => ({ ...prev, numbers: failedNumbers.join('\n') }));
                setError(`${succeeded} succeeded, ${errors.length} failed. See details below.`);
            }
        }
    };

    const handleRetryFailed = () => { setBulkUploadErrors([]); };

    const handleClearErrors = () => {
        setBulkUploadErrors([]);
        setFormData(prev => ({ ...prev, numbers: '' }));
    };

    const validateNumbersInput = (numbers) => {
        const nums = parseNumbers(numbers);
        const duplicates = checkForDuplicates(nums);
        const warnings = [];
        if (nums.length > MAX_NUMBERS_PER_UPLOAD) {
            warnings.push(`Maximum ${MAX_NUMBERS_PER_UPLOAD} numbers allowed. You have ${nums.length} numbers.`);
        }
        return { warnings, duplicates };
    };

    const handleDeleteClick = (item) => { setItemToDelete(item); setOpenDeleteDialog(true); };
    const handleDeleteConfirm = () => { if (itemToDelete) deleteMutation.mutate(itemToDelete._id); };

    const getStatusStyle = (isActive) => ({
        backgroundColor: alpha(isActive ? GREEN : RED, 0.1),
        color: isActive ? GREEN : RED,
        borderColor: isActive ? GREEN : RED,
    });
    const getStatusLabel = (isActive) => isActive ? 'Active' : 'Inactive';

    const parsedCount = parseNumbers(formData.numbers).length;
    const { warnings: validationWarnings, duplicates: currentDuplicates } = !selectedNumber && formData.numbers
        ? validateNumbersInput(formData.numbers)
        : { warnings: [], duplicates: [] };

    const isMutating = createMutation.isLoading || updateMutation.isLoading;
    const MenuProps = { PaperProps: { style: { maxHeight: 220, width: 260 } } };

    const snackbarBaseSx = (color) => ({
        width: '100%', borderRadius: '10px',
        backgroundColor: alpha(color, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        borderLeft: `3px solid ${color}`,
        '& .MuiAlert-icon': { color, fontSize: '1rem' },
        '& .MuiAlert-message': { fontSize: '0.82rem', py: 0.3 },
        color: TEXT, py: 0.5, px: 2,
    });

    if (isError) return (
        <Box p={4} textAlign="center">
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                Error loading phone numbers: {queryError?.message || 'Unknown error'}
            </Alert>
            <Button variant="contained" onClick={() => refetch()}>Retry</Button>
        </Box>
    );

    return (
        <Box>
            <Helmet><title>Phone Numbers | Power Automate</title></Helmet>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start"
                flexWrap="wrap" gap={2} mb={3}>
                <Box>
                    <Typography sx={{
                        fontWeight: 700, mb: 0.4, fontSize: { xs: '1rem', sm: '1.1rem' },
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Phone Numbers
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.55) }}>
                        Manage phone numbers and password formatters
                    </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                    {selectedRows.length > 0 && (
                        <Button variant="contained" size="small"
                            startIcon={<DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />}
                            onClick={() => setOpenBulkDeleteDialog(true)}
                            sx={{
                                background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED} 100%)`,
                                color: 'white', fontSize: '0.8rem', py: 0.6, px: 1.5,
                                height: 36, textTransform: 'none', fontWeight: 500, borderRadius: '8px',
                                '&:hover': { background: `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)` },
                            }}>
                            Delete ({selectedRows.length})
                        </Button>
                    )}
                    <GradientButton variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => handleOpenDialog()} size="small"
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }}
                        disabled={createMutation.isLoading}>
                        Add Phone Numbers
                    </GradientButton>
                </Box>
            </Box>

            <Box mb={2.5} display="flex" gap={1.5} alignItems="center">
                <StyledTextField fullWidth placeholder="Search by phone number or country code…"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, fontSize: '0.9rem', color: alpha(TEXT, 0.4) }} />,
                    }}
                    size="small"
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.83rem', color: TEXT } }} />
                <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                    <InputLabel sx={{ fontSize: '0.83rem' }}>Status</InputLabel>
                    <Select value={statusFilter} label="Status"
                        onChange={e => { setStatusFilter(e.target.value); setPage(0); setSelectedRows([]); }}
                        sx={{ fontSize: '0.83rem' }}>
                        <MenuItem value="all" sx={{ fontSize: '0.83rem' }}>All</MenuItem>
                        <MenuItem value="active" sx={{ fontSize: '0.83rem' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: GREEN }} /> Active
                            </Box>
                        </MenuItem>
                        <MenuItem value="inactive" sx={{ fontSize: '0.83rem' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <BlockIcon sx={{ fontSize: '0.85rem', color: RED }} /> Inactive
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 2, border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                overflow: 'auto', mb: 3, position: 'relative', minHeight: 380,
            }}>
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
                        <TableRow sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.08 : 0.04) }}>
                            <TableCell padding="checkbox" sx={{ pl: 1.5, borderBottom: `2px solid ${alpha(BLUE, 0.5)}` }}>
                                <Checkbox size="small" checked={allSelected} indeterminate={someSelected}
                                    onChange={handleSelectAllVisible} disabled={filteredNumbers.length === 0} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT, fontSize: '0.82rem', py: 1.3, borderBottom: `2px solid ${alpha(BLUE, 0.5)}` }}>
                                Country Code
                            </TableCell>
                            <TableCell colSpan={5} sx={{ borderBottom: `2px solid ${alpha(BLUE, 0.5)}` }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isLoading && filteredNumbers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <PhoneIcon sx={{ fontSize: 40, color: alpha(TEXT, 0.15), mb: 1.5, display: 'block', mx: 'auto' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.83rem', color: alpha(TEXT, 0.45) }}>
                                        {debouncedSearch || statusFilter !== 'all'
                                            ? 'No phone numbers found matching your filters'
                                            : 'No phone numbers yet. Add one to get started.'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            // ✅ Paginate by country code groups — each group = 1 page row
                            paginatedGroups.map(group => (
                                <CountryCodeRow
                                    key={group.country_code}
                                    group={group}
                                    selectedRows={selectedRows}
                                    onSelectAll={handleSelectGroupAll}
                                    onSelectRow={handleSelectRow}
                                    onEdit={handleOpenDialog}
                                    onDelete={handleDeleteClick}
                                    onDeleteGroup={handleDeleteGroupClick}
                                    deletingId={deleteMutation.isLoading ? itemToDelete?._id : null}
                                    theme={theme}
                                    colors={colors}
                                    getStatusStyle={getStatusStyle}
                                    getStatusLabel={getStatusLabel}
                                    initiallyOpen={false}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* ✅ Pagination counts country code groups, not individual numbers */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={groupedNumbers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Country codes per page:"
                    sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
                            { fontSize: '0.78rem', color: alpha(TEXT, 0.6) },
                    }}
                />
            </TableContainer>

            {/* Add / Edit Dialog */}
            <Dialog open={openDialog}
                onClose={() => { if (bulkUploadState) return; setOpenDialog(false); resetForm(); }}
                maxWidth="md"
                PaperProps={{ sx: { borderRadius: 2.5, height: '100%' } }}>
                <DialogTitle sx={{
                    color: TEXT, fontWeight: 600, fontSize: '0.95rem',
                    py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                    {selectedNumber ? 'Edit Phone Number' : 'Add Phone Numbers'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField fullWidth label="Country Code" name="country_code"
                                value={formData.country_code} onChange={handleInputChange}
                                placeholder="+91" size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField fullWidth label="Browser Reset" name="browser_reset_time"
                                value={formData.browser_reset_time} onChange={handleInputChange}
                                placeholder="Browser Reset Value" size="small" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Password Formatters</InputLabel>
                                <Select multiple value={formData.password_formatter_ids}
                                    onChange={handleFormatterSelectChange}
                                    input={<OutlinedInput label="Password Formatters" />}
                                    renderValue={(selected) => (
                                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                                            {selected.map(val => {
                                                const f = passwordFormatters.find(x => String(x._id) === val);
                                                return f
                                                    ? <Chip key={val} label={formatFormatterLabel(f)} size="small"
                                                        sx={{ backgroundColor: alpha(GREEN, 0.1), color: GREEN, fontSize: '0.68rem', height: 22, borderRadius: '4px' }} />
                                                    : <Chip key={val} label="Unknown" size="small"
                                                        sx={{ backgroundColor: alpha(RED, 0.1), color: RED, fontSize: '0.68rem', height: 22, borderRadius: '4px' }} />;
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps} disabled={formattersLoading}>
                                    {!formattersLoading && passwordFormatters.length > 0 && (
                                        <MenuItem value="select-all" sx={{ fontSize: '0.83rem' }}>
                                            <Checkbox size="small"
                                                checked={formData.password_formatter_ids.length === passwordFormatters.length}
                                                indeterminate={formData.password_formatter_ids.length > 0 && formData.password_formatter_ids.length < passwordFormatters.length} />
                                            <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.83rem' }} />
                                        </MenuItem>
                                    )}
                                    {formattersLoading
                                        ? <MenuItem disabled><CircularProgress size={18} sx={{ mr: 1 }} /> Loading…</MenuItem>
                                        : passwordFormatters.map(f => {
                                            const id = String(f._id);
                                            return (
                                                <MenuItem key={id} value={id} sx={{ fontSize: '0.83rem' }}>
                                                    <Checkbox size="small" checked={formData.password_formatter_ids.includes(id)} />
                                                    <ListItemText primary={formatFormatterLabel(f)} primaryTypographyProps={{ fontSize: '0.83rem' }} />
                                                </MenuItem>
                                            );
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <StyledTextField fullWidth
                                label={selectedNumber
                                    ? 'Phone Number'
                                    : bulkUploadState
                                        ? `Uploading… ${bulkUploadState.done}/${bulkUploadState.total}`
                                        : `Phone Numbers (one per line)${parsedCount > 0 ? ` — ${parsedCount} detected` : ''}`}
                                name="numbers"
                                value={formData.numbers}
                                onChange={handleInputChange}
                                disabled={!!bulkUploadState}
                                placeholder={selectedNumber
                                    ? '919026935664'
                                    : `919026935664\n919026935652\n919026033412`}
                                multiline minRows={selectedNumber ? 1 : 5} maxRows={12}
                                size="small"
                                error={validationWarnings.length > 0 || duplicateNumbers.length > 0}
                                required={!selectedNumber}
                                helperText={
                                    !selectedNumber && !bulkUploadState && (
                                        <>
                                            {duplicateNumbers.length > 0 && (
                                                <span style={{ color: RED, display: 'block', marginBottom: '4px' }}>
                                                    Duplicate numbers found: {duplicateNumbers.join(', ')}
                                                </span>
                                            )}
                                            {validationWarnings.map((warning, index) => (
                                                <span key={index} style={{ color: RED, display: 'block' }}>{warning}</span>
                                            ))}
                                            {parsedCount > 0 && parsedCount <= MAX_NUMBERS_PER_UPLOAD && duplicateNumbers.length === 0 && (
                                                <span style={{ color: GREEN, display: 'block' }}>
                                                    ✓ Ready to upload {parsedCount} number{parsedCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </>
                                    )
                                }
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.83rem' } }} />
                        </Grid>

                        {!selectedNumber && !bulkUploadState && duplicateNumbers.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <DuplicateNumbersWarning
                                    duplicates={duplicateNumbers}
                                    onRemoveAll={removeDuplicates}
                                    onKeepAll={() => setDuplicateNumbers([])}
                                />
                            </Grid>
                        )}

                        {!selectedNumber && bulkUploadState && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 2, mt: 0.5 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>
                                            Uploading numbers…
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.5) }}>
                                            {bulkUploadState.done} / {bulkUploadState.total}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={bulkUploadState.total > 0 ? (bulkUploadState.done / bulkUploadState.total) * 100 : 0}
                                        sx={{
                                            height: 6, borderRadius: 3, mb: 1.5,
                                            backgroundColor: alpha(BLUE, 0.12),
                                            '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: BLUE },
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}

                        {!selectedNumber && !bulkUploadState && bulkUploadErrors.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <BulkUploadErrorDetails
                                    errors={bulkUploadErrors}
                                    onRetry={handleRetryFailed}
                                    onClear={handleClearErrors}
                                />
                            </Grid>
                        )}

                        {selectedNumber && (
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between"
                                    sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, px: 2, py: 1.3 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.83rem', fontWeight: 500, color: TEXT }}>
                                            Active Status
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.73rem', color: alpha(TEXT, 0.5) }}>
                                            Toggle whether this phone number is active
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={formData.is_active ? 'Active' : 'Inactive'}
                                        size="small" variant="outlined"
                                        icon={formData.is_active
                                            ? <CheckCircleIcon sx={{ fontSize: '0.72rem !important' }} />
                                            : <BlockIcon sx={{ fontSize: '0.72rem !important' }} />}
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        sx={{
                                            cursor: 'pointer', fontWeight: 500, fontSize: '0.72rem',
                                            height: 26, borderRadius: '6px',
                                            ...getStatusStyle(formData.is_active),
                                            '& .MuiChip-label': { px: 0.9 },
                                            transition: 'all 0.15s ease',
                                        }} />
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    <OutlineButton onClick={() => { setOpenDialog(false); resetForm(); }}
                        size="medium" sx={{ fontSize: '0.82rem', px: 2 }} disabled={isMutating || !!bulkUploadState}>
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={
                            !formData.country_code ||
                            !formData.numbers.trim() ||
                            isMutating ||
                            !!bulkUploadState ||
                            validationWarnings.length > 0 ||
                            duplicateNumbers.length > 0
                        }
                        size="medium"
                        sx={{ fontSize: '0.82rem', px: 2, minWidth: 120 }}
                    >
                        {bulkUploadState ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={14} sx={{ color: 'white' }} />
                                <span>Uploading…</span>
                            </Box>
                        ) : isMutating ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : selectedNumber ? (
                            'Update'
                        ) : bulkUploadErrors.length > 0 ? (
                            `Retry ${bulkUploadErrors.length} Failed`
                        ) : parsedCount > 1 ? (
                            `Create ${parsedCount} Numbers`
                        ) : (
                            'Create'
                        )}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Delete Group Dialog */}
            <DeleteConfirmDialog
                open={openGroupDeleteDialog} onClose={() => setOpenGroupDeleteDialog(false)}
                onConfirm={handleGroupDeleteConfirm} loading={groupDeleting}
                title="Delete Group" icon={DeleteSweepIcon}
                message={<>Are you sure you want to delete all <strong>{groupToDelete?.items?.length} number{groupToDelete?.items?.length !== 1 ? 's' : ''}</strong> under country code <strong>{groupToDelete?.country_code}</strong>? This action cannot be undone.</>}
                confirmLabel={`Delete ${groupToDelete?.items?.length ?? ''} Numbers`} />

            {/* Delete Single Dialog */}
            <DeleteConfirmDialog
                open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}
                onConfirm={handleDeleteConfirm} loading={deleteMutation.isLoading}
                title="Confirm Delete" icon={DeleteIcon}
                message={<>Are you sure you want to delete <strong>"{itemToDelete?.country_code} {itemToDelete?.number}"</strong>? This action cannot be undone.</>}
                confirmLabel="Delete" />

            {/* Bulk Delete Dialog */}
            <DeleteConfirmDialog
                open={openBulkDeleteDialog} onClose={() => setOpenBulkDeleteDialog(false)}
                onConfirm={handleBulkDelete} loading={bulkDeleting}
                title="Confirm Bulk Delete" icon={DeleteSweepIcon}
                message={<>Are you sure you want to delete <strong>{selectedRows.length} phone number{selectedRows.length > 1 ? 's' : ''}</strong>? This action cannot be undone.</>}
                confirmLabel={`Delete ${selectedRows.length}`} />

            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" elevation={4} sx={snackbarBaseSx(GREEN)}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.82rem', color: TEXT }}>{success}</Typography>
                </Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" elevation={4} sx={snackbarBaseSx(RED)}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.82rem', color: TEXT }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PhoneNumbers;