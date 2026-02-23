import React, { useState, useEffect, useMemo } from 'react';
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
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import axiosInstance from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

const MAX_NUMBERS_PER_UPLOAD = 100;
const INNER_PAGE_SIZE = 50;

// ─── API ──────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initialFormData = {
    country_code: '', numbers: '', browser_reset_time: '',
    password_formatter_ids: [], is_active: false,
};

const matchFormatterToMaster = (embedded, masters) =>
    masters.find(m =>
        m.start_add === embedded.start_add && m.end_add === embedded.end_add &&
        m.start_index === embedded.start_index && m.end_index === embedded.end_index
    );

const formatFormatterLabel = (f) =>
    `${f.start_add ?? ''} → ${f.start_index ?? ''} → ${f.end_index ?? ''} → ${f.end_add ?? ''}`;

const parseNumbers = (raw) => raw.split('\n').map(l => l.trim()).filter(Boolean);

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

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, loading, title, titleColor, icon: Icon, message, confirmLabel, confirmColor, confirmColorDark }) {
    const theme = useTheme();
    const TEXT = theme.palette.text.primary;
    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ color: titleColor, fontWeight: 600, fontSize: '0.95rem', py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box display="flex" alignItems="center" gap={1}><Icon sx={{ fontSize: '1.1rem' }} />{title}</Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <DialogContentText sx={{ fontSize: '0.875rem', color: TEXT, lineHeight: 1.6 }}>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                <OutlineButton onClick={onClose} size="medium" sx={{ fontSize: '0.82rem', px: 2 }} disabled={loading}>Cancel</OutlineButton>
                <Button variant="contained" onClick={onConfirm} disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Icon sx={{ fontSize: '0.9rem' }} />}
                    sx={{ background: `linear-gradient(135deg, ${confirmColorDark} 0%, ${confirmColor} 100%)`, color: 'white', borderRadius: '8px', px: 2, fontWeight: 500, fontSize: '0.82rem', textTransform: 'none', '&:hover': { filter: 'brightness(1.1)' }, '&.Mui-disabled': { opacity: 0.65, color: 'white' } }}>
                    {loading ? 'Processing…' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── DuplicateNumbersWarning ──────────────────────────────────────────────────
function DuplicateNumbersWarning({ duplicates, onRemoveAll, onKeepAll }) {
    const theme = useTheme();
    const W = theme.palette.warning.main;
    const TEXT = theme.palette.text.primary;
    return (
        <Accordion sx={{ mt: 2, border: `1px solid ${alpha(W, 0.3)}`, borderRadius: '8px !important', '&:before': { display: 'none' }, overflow: 'hidden', backgroundColor: alpha(W, 0.02) }} elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: W }} />} sx={{ backgroundColor: alpha(W, 0.06), borderBottom: `1px solid ${alpha(W, 0.2)}`, minHeight: 48, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <WarningIcon sx={{ color: W, fontSize: '1.1rem' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: W }}>{duplicates.length} Duplicate Number{duplicates.length > 1 ? 's' : ''} Found</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                    <Box display="flex" flexWrap="wrap" gap={0.8}>
                        {duplicates.map((num, idx) => (
                            <Chip key={idx} label={num} size="small" sx={{ fontFamily: 'monospace', backgroundColor: alpha(W, 0.08), border: `1px solid ${alpha(W, 0.3)}`, color: TEXT, fontSize: '0.75rem', height: 26, '& .MuiChip-label': { px: 1.2 } }} />
                        ))}
                    </Box>
                </Box>
                <Box display="flex" gap={1} justifyContent="flex-end">
                    <OutlineButton size="small" onClick={onRemoveAll} sx={{ fontSize: '0.75rem', py: 0.5 }}>Remove All Duplicates</OutlineButton>
                    <GradientButton size="small" onClick={onKeepAll} sx={{ fontSize: '0.75rem', py: 0.5 }}>Keep All (Will Fail)</GradientButton>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

// ─── BulkUploadErrorDetails ───────────────────────────────────────────────────
function BulkUploadErrorDetails({ errors, onRetry, onClear }) {
    const theme = useTheme();
    const RED = theme.palette.error.main;
    const TEXT = theme.palette.text.primary;
    return (
        <Box sx={{ border: `1px solid ${alpha(RED, 0.4)}`, borderRadius: 1.5, overflow: 'hidden', mt: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, backgroundColor: alpha(RED, 0.06), borderBottom: `1px solid ${alpha(RED, 0.2)}` }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <BlockIcon sx={{ fontSize: '0.9rem', color: RED }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: RED }}>Upload Failed: {errors.length} error{errors.length > 1 ? 's' : ''}</Typography>
                </Box>
                <Tooltip title="Clear errors"><IconButton size="small" onClick={onClear} sx={{ color: alpha(TEXT, 0.4) }}><DeleteIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            </Box>
            <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                {errors.map((error, index) => (
                    <Box key={index} sx={{ p: 1.5, borderBottom: index < errors.length - 1 ? `1px solid ${alpha(RED, 0.1)}` : 'none', backgroundColor: index % 2 === 0 ? alpha(RED, 0.02) : 'transparent' }}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: TEXT, minWidth: 100 }}>{error.number}</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: RED, flex: 1 }}>{error.message}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${alpha(RED, 0.15)}`, backgroundColor: alpha(RED, 0.03) }}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                    <OutlineButton size="small" onClick={onClear} sx={{ fontSize: '0.75rem' }}>Clear All</OutlineButton>
                    <GradientButton size="small" onClick={onRetry} sx={{ fontSize: '0.75rem' }}>Retry Failed Numbers</GradientButton>
                </Box>
            </Box>
        </Box>
    );
}

// ─── CountryCodeRow ───────────────────────────────────────────────────────────
// Two independent selection systems:
//   1. OUTER checkbox (group header) → globalSelectedRows (for top-level bulk ops)
//   2. INNER checkbox (each number row) → innerSelected (for row-level actions within group)
function CountryCodeRow({
    group,
    globalSelectedRows,
    onGlobalSelectGroup,
    onEdit, onDelete, onDeleteGroup,
    theme, colors: { BLUE, RED, GREEN, TEXT },
    getStatusStyle, getStatusLabel,
    onSuccess, onError,
}) {
    const [open, setOpen] = useState(false);
    const [innerPage, setInnerPage] = useState(0);
    const [innerSelected, setInnerSelected] = useState([]);
    const [innerActionLoading, setInnerActionLoading] = useState(false);

    const groupIds = group.items.map(i => i._id);

    useEffect(() => { setInnerPage(0); }, [group.country_code]);

    // Paginated slice
    const pagedItems = group.items.slice(innerPage * INNER_PAGE_SIZE, (innerPage + 1) * INNER_PAGE_SIZE);
    const pagedIds   = pagedItems.map(i => i._id);

    // Inner selection (page-scoped select-all)
    const innerSelectedOnPage    = pagedIds.filter(id => innerSelected.includes(id));
    const innerAllOnPageSelected = pagedIds.length > 0 && innerSelectedOnPage.length === pagedIds.length;
    const innerSomeOnPageSelected = innerSelectedOnPage.length > 0 && !innerAllOnPageSelected;

    // Global selection (group-level)
    const globalSelectedInGroup = groupIds.filter(id => globalSelectedRows.includes(id));
    const globalAllSelected  = groupIds.length > 0 && globalSelectedInGroup.length === groupIds.length;
    const globalSomeSelected = globalSelectedInGroup.length > 0 && !globalAllSelected;
    const hasGlobalChild     = globalSelectedInGroup.length > 0;

    const activeCount   = group.items.filter(i =>  i.is_active).length;
    const inactiveCount = group.items.length - activeCount;

    // Inner stats
    const innerActiveSelected   = group.items.filter(i => innerSelected.includes(i._id) &&  i.is_active).length;
    const innerInactiveSelected = group.items.filter(i => innerSelected.includes(i._id) && !i.is_active).length;

    const handleRowClick = (e) => {
        if (e.target.closest('input[type="checkbox"]') || e.target.closest('button') ||
            e.target.closest('.MuiCheckbox-root') || e.target.closest('.MuiIconButton-root')) return;
        setOpen(o => !o);
    };

    const handleInnerSelectAllPage = () => {
        if (innerAllOnPageSelected) {
            setInnerSelected(prev => prev.filter(id => !pagedIds.includes(id)));
        } else {
            setInnerSelected(prev => [...new Set([...prev, ...pagedIds])]);
        }
    };

    const handleInnerSelectRow = (id) =>
        setInnerSelected(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

    // Inner bulk actions
    const buildUpdatePayload = (item, is_active) => ({
        id: item._id,
        data: {
            country_code: item.country_code,
            number: item.number,
            browser_reset_time: item.browser_reset_time,
            password_formatters: item.password_formatters?.map(f => ({
                id: String(f._id), start_add: f.start_add,
                start_index: f.start_index, end_index: f.end_index, end_add: f.end_add,
            })) ?? [],
            is_active,
        },
    });

    const handleInnerMarkStatus = async (targetStatus) => {
        const toUpdate = group.items.filter(i => innerSelected.includes(i._id) && i.is_active !== targetStatus);
        setInnerActionLoading(true);
        const results = await Promise.allSettled(toUpdate.map(item => updatePhoneNumber(buildUpdatePayload(item, targetStatus))));
        const ok  = results.filter(r => r.status === 'fulfilled').length;
        const bad = results.filter(r => r.status === 'rejected').length;
        setInnerSelected([]);
        setInnerActionLoading(false);
        window.__queryClient?.invalidateQueries(['phoneNumbers']);
        bad === 0
            ? onSuccess(`${ok} number${ok !== 1 ? 's' : ''} marked as ${targetStatus ? 'active' : 'inactive'}`)
            : onError(`${ok} updated, ${bad} failed`);
    };

    const handleInnerDelete = async () => {
        const toDelete = [...innerSelected];
        setInnerActionLoading(true);
        const results = await Promise.allSettled(toDelete.map(id => deletePhoneNumber(id)));
        const ok  = results.filter(r => r.status === 'fulfilled').length;
        const bad = results.filter(r => r.status === 'rejected').length;
        setInnerSelected([]);
        setInnerActionLoading(false);
        window.__queryClient?.invalidateQueries(['phoneNumbers']);
        bad === 0
            ? onSuccess(`${ok} number${ok !== 1 ? 's' : ''} deleted`)
            : onError(`${ok} deleted, ${bad} failed`);
    };

    return (
        <>
            {/* ── Group header row ── */}
            <TableRow onClick={handleRowClick} sx={{
                cursor: 'pointer',
                backgroundColor: hasGlobalChild
                    ? alpha(BLUE, theme.palette.mode === 'dark' ? 0.18 : 0.1)
                    : alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                '&:hover': { backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.22 : 0.13) },
                borderLeft: hasGlobalChild ? `3px solid ${BLUE}` : '3px solid transparent',
                transition: 'background-color 0.15s ease, border-left 0.15s ease',
                userSelect: 'none',
            }}>
                {/* OUTER checkbox → global selection */}
                <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Select group for global bulk operations" placement="top">
                        <Checkbox size="small" checked={globalAllSelected} indeterminate={globalSomeSelected}
                            onChange={e => { e.stopPropagation(); onGlobalSelectGroup(groupIds, globalAllSelected); }} />
                    </Tooltip>
                </TableCell>

                <TableCell sx={{ py: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                            sx={{ p: 0.3, color: alpha(TEXT, 0.5) }}>
                            {open ? <KeyboardArrowUpIcon sx={{ fontSize: '1rem' }} /> : <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />}
                        </IconButton>

                        <Chip label={group.country_code} size="small" sx={{ backgroundColor: alpha(BLUE, 0.12), color: BLUE, fontWeight: 700, fontSize: '0.78rem', height: 24, borderRadius: '6px' }} />

                        <Chip size="small" label={`${group.items.length} Total`} sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(TEXT, 0.08), color: TEXT, border: `1px solid ${alpha(TEXT, 0.2)}`, '& .MuiChip-label': { px: 0.7 } }} />

                        {activeCount > 0 && (
                            <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${activeCount} Active`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(GREEN, 0.1), color: GREEN, border: `1px solid ${alpha(GREEN, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                        )}
                        {inactiveCount > 0 && (
                            <Chip size="small" icon={<BlockIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${inactiveCount} Inactive`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(RED, 0.08), color: RED, border: `1px solid ${alpha(RED, 0.25)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                        )}
                        {hasGlobalChild && (
                            <Chip size="small" label={`${globalSelectedInGroup.length} in bulk`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(BLUE, 0.15), color: BLUE, border: `1px solid ${alpha(BLUE, 0.35)}`, '& .MuiChip-label': { px: 0.7 } }} />
                        )}
                    </Box>
                </TableCell>

                <TableCell colSpan={3} />

                <TableCell align="right" sx={{ pr: 1.5, py: 0.8 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title={`Delete all ${group.items.length} numbers in ${group.country_code}`} placement="top">
                        <IconButton size="small" onClick={() => onDeleteGroup(group)}
                            sx={{ color: RED, width: 28, height: 28, '&:hover': { backgroundColor: alpha(RED, 0.1) } }}>
                            <DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>

            {/* ── Expanded inner numbers table ── */}
            <TableRow>
                <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ borderLeft: `3px solid ${alpha(BLUE, 0.2)}`, ml: 3 }}>

                            {/* ── Inner selection action bar ── */}
                            {innerSelected.length > 0 && (
                                <Box display="flex" alignItems="center" gap={1} px={2} py={0.8}
                                    sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.04), borderBottom: `1px solid ${alpha(BLUE, 0.12)}`, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: BLUE, fontWeight: 600 }}>
                                        {innerSelected.length} selected
                                    </Typography>
                                    {innerActiveSelected > 0 && (
                                        <Chip size="small" label={`${innerActiveSelected} active`}
                                            sx={{ height: 18, borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, backgroundColor: alpha(GREEN, 0.1), color: GREEN, border: `1px solid ${alpha(GREEN, 0.3)}`, '& .MuiChip-label': { px: 0.6 } }} />
                                    )}
                                    {innerInactiveSelected > 0 && (
                                        <Chip size="small" label={`${innerInactiveSelected} inactive`}
                                            sx={{ height: 18, borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, backgroundColor: alpha(RED, 0.08), color: RED, border: `1px solid ${alpha(RED, 0.25)}`, '& .MuiChip-label': { px: 0.6 } }} />
                                    )}
                                    <Box flex={1} />

                                    {innerInactiveSelected > 0 && (
                                        <Button size="small" variant="contained" disabled={innerActionLoading}
                                            startIcon={innerActionLoading ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <ToggleOnIcon sx={{ fontSize: '0.8rem' }} />}
                                            onClick={() => handleInnerMarkStatus(true)}
                                            sx={{ fontSize: '0.72rem', py: 0.3, px: 1, height: 26, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${GREEN} 100%)`, color: 'white', borderRadius: '6px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                            Mark Active ({innerInactiveSelected})
                                        </Button>
                                    )}
                                    {innerActiveSelected > 0 && (
                                        <Button size="small" variant="contained" disabled={innerActionLoading}
                                            startIcon={innerActionLoading ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <ToggleOffIcon sx={{ fontSize: '0.8rem' }} />}
                                            onClick={() => handleInnerMarkStatus(false)}
                                            sx={{ fontSize: '0.72rem', py: 0.3, px: 1, height: 26, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`, color: 'white', borderRadius: '6px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                            Mark Inactive ({innerActiveSelected})
                                        </Button>
                                    )}
                                    <Button size="small" variant="contained" disabled={innerActionLoading}
                                        startIcon={innerActionLoading ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <DeleteSweepIcon sx={{ fontSize: '0.8rem' }} />}
                                        onClick={handleInnerDelete}
                                        sx={{ fontSize: '0.72rem', py: 0.3, px: 1, height: 26, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${RED} 100%)`, color: 'white', borderRadius: '6px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                        Delete ({innerSelected.length})
                                    </Button>
                                    <Button size="small" disabled={innerActionLoading} onClick={() => setInnerSelected([])}
                                        sx={{ fontSize: '0.7rem', color: alpha(TEXT, 0.45), textTransform: 'none', minWidth: 0, px: 0.8 }}>
                                        Clear
                                    </Button>
                                </Box>
                            )}

                            {/* ── Inner table header ── */}
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.04 : 0.02) }}>
                                        {/* INNER checkbox → inner selection only */}
                                        <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48, py: 0.8, borderBottom: `1px solid ${alpha(BLUE, 0.18)}` }}>
                                            <Tooltip title="Select all on this page" placement="top">
                                                <Checkbox size="small"
                                                    checked={innerAllOnPageSelected}
                                                    indeterminate={innerSomeOnPageSelected}
                                                    onChange={handleInnerSelectAllPage}
                                                    disabled={pagedIds.length === 0}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        {['Phone Number', 'Browser Reset', 'Password Formatters', 'Status', 'Actions'].map((label, i) => (
                                            <TableCell key={label} align={i === 4 ? 'right' : 'left'}
                                                sx={{ py: 0.9, fontSize: '0.78rem', fontWeight: 700, color: TEXT, borderBottom: `1px solid ${alpha(BLUE, 0.18)}`, pl: i === 0 ? 2 : undefined, pr: i === 4 ? 1.5 : undefined }}>
                                                {label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedItems.map(item => {
                                        const isInner = innerSelected.includes(item._id);
                                        return (
                                            <TableRow key={item._id} hover selected={isInner}
                                                sx={{ transition: 'background-color 0.15s ease', '&.Mui-selected': { backgroundColor: alpha(BLUE, 0.05) }, '&.Mui-selected:hover': { backgroundColor: alpha(BLUE, 0.08) } }}>
                                                <TableCell padding="checkbox" sx={{ pl: 1.5, width: 48 }}>
                                                    <Checkbox size="small" checked={isInner} onChange={() => handleInnerSelectRow(item._id)} />
                                                </TableCell>
                                                <TableCell sx={{ ...cellSx, pl: 2 }}>
                                                    <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: TEXT, letterSpacing: '0.02em' }}>{item.number}</Typography>
                                                </TableCell>
                                                <TableCell sx={cellSx}>
                                                    {item.browser_reset_time
                                                        ? <Typography sx={{ fontSize: '0.82rem', color: TEXT }}>{item.browser_reset_time}</Typography>
                                                        : <Typography sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.35), fontStyle: 'italic' }}>—</Typography>}
                                                </TableCell>
                                                <TableCell sx={cellSx}>
                                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                                        {item.password_formatters?.length > 0
                                                            ? item.password_formatters.map(f => (
                                                                <Tooltip key={f._id} title={formatFormatterLabel(f)}>
                                                                    <Chip label={formatFormatterLabel(f)} size="small" sx={{ backgroundColor: alpha(GREEN, 0.1), color: GREEN, fontSize: '0.68rem', height: 22, borderRadius: '4px', '& .MuiChip-label': { px: 0.8 } }} />
                                                                </Tooltip>
                                                            ))
                                                            : <Typography sx={{ fontSize: '0.73rem', color: alpha(TEXT, 0.35), fontStyle: 'italic' }}>No formatters</Typography>
                                                        }
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={cellSx}>
                                                    <Chip label={getStatusLabel(item.is_active)} size="small" variant="outlined"
                                                        icon={item.is_active ? <CheckCircleIcon sx={{ fontSize: '0.72rem !important' }} /> : <BlockIcon sx={{ fontSize: '0.72rem !important' }} />}
                                                        sx={{ height: 22, borderRadius: '4px', fontWeight: 500, fontSize: '0.72rem', ...getStatusStyle(item.is_active), '& .MuiChip-label': { px: 0.8 } }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ ...cellSx, pr: 1.5 }}>
                                                    <Tooltip title="Edit" placement="top">
                                                        <IconButton size="small" onClick={() => onEdit(item)}
                                                            sx={{ color: BLUE, mr: 0.3, width: 28, height: 28, '&:hover': { backgroundColor: alpha(BLUE, 0.1) } }}>
                                                            <EditIcon sx={{ fontSize: '0.85rem' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete" placement="top">
                                                        <IconButton size="small" onClick={() => onDelete(item)}
                                                            sx={{ color: RED, width: 28, height: 28, '&:hover': { backgroundColor: alpha(RED, 0.1) } }}>
                                                            <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {/* ── Inner pagination (only if > 50 items) ── */}
                            {group.items.length > INNER_PAGE_SIZE && (
                                <Box sx={{ borderTop: `1px solid ${alpha(BLUE, 0.12)}`, backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.03 : 0.01) }}>
                                    <TablePagination
                                        component="div"
                                        count={group.items.length}
                                        page={innerPage}
                                        rowsPerPage={INNER_PAGE_SIZE}
                                        rowsPerPageOptions={[INNER_PAGE_SIZE]}
                                        onPageChange={(_, p) => { setInnerPage(p); setInnerSelected([]); }}
                                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count} numbers`}
                                        sx={{
                                            '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem', color: alpha(TEXT, 0.55) },
                                            '& .MuiTablePagination-selectLabel': { display: 'none' },
                                            '& .MuiTablePagination-toolbar': { minHeight: 40, pl: 1.5 },
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const PhoneNumbers = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    // Expose queryClient for inner row actions
    useEffect(() => { window.__queryClient = queryClient; }, [queryClient]);

    const BLUE        = theme.palette.primary.main;
    const BLUE_DARK   = theme.palette.primary.dark;
    const RED         = theme.palette.error.main;
    const RED_DARK    = theme.palette.error.dark;
    const GREEN       = theme.palette.success.main;
    const GREEN_DARK  = theme.palette.success.dark;
    const ORANGE      = theme.palette.warning.main;
    const ORANGE_DARK = theme.palette.warning.dark;
    const TEXT        = theme.palette.text.primary;
    const colors      = { BLUE, RED, GREEN, TEXT };

    const [openDialog,          setOpenDialog]          = useState(false);
    const [selectedNumber,      setSelectedNumber]      = useState(null);
    const [globalSelectedRows,  setGlobalSelectedRows]  = useState([]);
    const [success,             setSuccess]             = useState('');
    const [error,               setError]               = useState('');
    const [searchQuery,         setSearchQuery]         = useState('');
    const [statusFilter,        setStatusFilter]        = useState('all');
    const [page,                setPage]                = useState(0);
    const [rowsPerPage,         setRowsPerPage]         = useState(10);
    const [debouncedSearch,     setDebouncedSearch]     = useState('');
    const [formData,            setFormData]            = useState(initialFormData);
    const [bulkUploadState,     setBulkUploadState]     = useState(null);
    const [bulkUploadErrors,    setBulkUploadErrors]    = useState([]);
    const [duplicateNumbers,    setDuplicateNumbers]    = useState([]);

    const CONFIRM_DEFAULT = {
        open: false, loading: false, title: '', titleColor: RED,
        icon: DeleteIcon, message: '', confirmLabel: '',
        confirmColor: RED, confirmColorDark: RED_DARK, onConfirm: null,
    };
    const [confirmDialog, setConfirmDialog] = useState(CONFIRM_DEFAULT);

    const closeConfirm      = () => { if (confirmDialog.loading) return; setConfirmDialog(CONFIRM_DEFAULT); };
    const openConfirm       = (cfg) => setConfirmDialog({ ...CONFIRM_DEFAULT, open: true, ...cfg });
    const setConfirmLoading = (v) => setConfirmDialog(d => ({ ...d, loading: v }));

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { setGlobalSelectedRows([]); }, [page, rowsPerPage, debouncedSearch, statusFilter]);

    const { data: phoneNumbersData, isLoading, isError, error: queryError, refetch } = useQuery({
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
        onSuccess: (data) => { queryClient.invalidateQueries(['phoneNumbers']); setSuccess(data.message || 'Phone number(s) created successfully'); },
        onError: (err) => { const m = err.response?.data?.message || 'Failed to create phone number'; return Promise.reject({ message: m, number: err.config?.data?.number }); },
    });

    const updateMutation = useMutation({
        mutationFn: updatePhoneNumber,
        onSuccess: (data) => { queryClient.invalidateQueries(['phoneNumbers']); setSuccess(data.message || 'Phone number updated successfully'); setOpenDialog(false); resetForm(); },
        onError: (err) => { setError(err.response?.data?.message || 'Failed to update phone number'); },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePhoneNumber,
        onSuccess: (data) => { queryClient.invalidateQueries(['phoneNumbers']); setSuccess(data.message || 'Phone number deleted successfully'); closeConfirm(); },
        onError: (err) => { setError(err.response?.data?.message || 'Failed to delete phone number'); setConfirmLoading(false); },
    });

    const allPhoneNumbers    = phoneNumbersData?.data || [];
    const passwordFormatters = formattersData?.data  || [];

    const filteredNumbers = statusFilter === 'all'
        ? allPhoneNumbers
        : allPhoneNumbers.filter(item => statusFilter === 'active' ? item.is_active : !item.is_active);

    const groupedNumbers  = groupByCountryCode(filteredNumbers);
    const paginatedGroups = groupedNumbers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const allVisibleIds      = filteredNumbers.map(item => item._id);
    const globalAllSelected  = allVisibleIds.length > 0 && allVisibleIds.every(id => globalSelectedRows.includes(id));
    const globalSomeSelected = globalSelectedRows.length > 0 && !globalAllSelected;

    const globalSelectedItems = useMemo(
        () => allPhoneNumbers.filter(n => globalSelectedRows.includes(n._id)),
        [allPhoneNumbers, globalSelectedRows]
    );
    const activeSelectedCount   = globalSelectedItems.filter(n =>  n.is_active).length;
    const inactiveSelectedCount = globalSelectedItems.filter(n => !n.is_active).length;
    const showMarkInactive = globalSelectedRows.length > 0 && activeSelectedCount   > 0;
    const showMarkActive   = globalSelectedRows.length > 0 && inactiveSelectedCount > 0;

    const handleSelectAllVisible = () => {
        if (globalAllSelected) {
            setGlobalSelectedRows(prev => prev.filter(id => !allVisibleIds.includes(id)));
        } else {
            setGlobalSelectedRows(prev => [...new Set([...prev, ...allVisibleIds])]);
        }
    };

    const handleSelectGroupAll = (groupIds, groupAllSelected) => {
        if (groupAllSelected) {
            setGlobalSelectedRows(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            setGlobalSelectedRows(prev => [...new Set([...prev, ...groupIds])]);
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedNumber(null);
        setBulkUploadErrors([]);
        setDuplicateNumbers([]);
    };

    const checkForDuplicates = (numbers) => {
        const seen = new Set(), dups = new Set();
        numbers.forEach(n => seen.has(n) ? dups.add(n) : seen.add(n));
        return Array.from(dups);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'numbers' && !selectedNumber)
            setDuplicateNumbers(checkForDuplicates(parseNumbers(value)));
    };

    const handleFormatterSelectChange = (event) => {
        const { value } = event.target;
        if (value.includes('select-all')) {
            const allIds = passwordFormatters.map(f => String(f._id));
            setFormData(prev => ({ ...prev, password_formatter_ids: prev.password_formatter_ids.length === allIds.length ? [] : allIds }));
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

    const removeDuplicates = () => {
        const uniqueNums = [...new Set(parseNumbers(formData.numbers))];
        setFormData(prev => ({ ...prev, numbers: uniqueNums.join('\n') }));
        setDuplicateNumbers([]);
        setSuccess('Duplicates removed successfully');
    };

    const handleDeleteClick = (item) => {
        openConfirm({
            title: 'Confirm Delete', titleColor: RED, icon: DeleteIcon,
            message: (<>Are you sure you want to delete <strong>"{item.country_code} {item.number}"</strong>? This action cannot be undone.</>),
            confirmLabel: 'Delete', confirmColor: RED, confirmColorDark: RED_DARK,
            onConfirm: () => { setConfirmLoading(true); deleteMutation.mutate(item._id); },
        });
    };

    const handleDeleteGroupClick = (group) => {
        openConfirm({
            title: 'Delete Group', titleColor: RED, icon: DeleteSweepIcon,
            message: (<>Are you sure you want to delete all <strong>{group.items.length} number{group.items.length !== 1 ? 's' : ''}</strong> under <strong>{group.country_code}</strong>? This cannot be undone.</>),
            confirmLabel: `Delete ${group.items.length} Numbers`, confirmColor: RED, confirmColorDark: RED_DARK,
            onConfirm: async () => {
                setConfirmLoading(true);
                const results = await Promise.allSettled(group.items.map(i => deletePhoneNumber(i._id)));
                const ok  = results.filter(r => r.status === 'fulfilled').length;
                const bad = results.filter(r => r.status === 'rejected').length;
                queryClient.invalidateQueries(['phoneNumbers']);
                setConfirmDialog(CONFIRM_DEFAULT);
                bad === 0 ? setSuccess(`${ok} phone number${ok > 1 ? 's' : ''} deleted`) : setError(`${ok} deleted, ${bad} failed`);
            },
        });
    };

    const handleBulkDeleteClick = () => {
        const count = globalSelectedRows.length;
        openConfirm({
            title: 'Confirm Bulk Delete', titleColor: RED, icon: DeleteSweepIcon,
            message: (<>Are you sure you want to delete <strong>{count} phone number{count > 1 ? 's' : ''}</strong>? This cannot be undone.</>),
            confirmLabel: `Delete ${count}`, confirmColor: RED, confirmColorDark: RED_DARK,
            onConfirm: async () => {
                setConfirmLoading(true);
                const results = await Promise.allSettled(globalSelectedRows.map(id => deletePhoneNumber(id)));
                const ok  = results.filter(r => r.status === 'fulfilled').length;
                const bad = results.filter(r => r.status === 'rejected').length;
                setGlobalSelectedRows([]);
                queryClient.invalidateQueries(['phoneNumbers']);
                setConfirmDialog(CONFIRM_DEFAULT);
                bad === 0 ? setSuccess(`${ok} phone number${ok > 1 ? 's' : ''} deleted`) : setError(`${ok} deleted, ${bad} failed`);
            },
        });
    };

    const handleBulkStatusClick = (targetStatus) => {
        const toUpdate = globalSelectedItems.filter(n => n.is_active !== targetStatus);
        const count = toUpdate.length;
        const statusLabel = targetStatus ? 'Active' : 'Inactive';
        const COLOR = targetStatus ? GREEN : ORANGE;
        const COLOR_DARK = targetStatus ? GREEN_DARK : ORANGE_DARK;
        const Icon = targetStatus ? ToggleOnIcon : ToggleOffIcon;
        openConfirm({
            title: `Mark as ${statusLabel}`, titleColor: COLOR, icon: Icon,
            message: (<>Are you sure you want to mark <strong>{count} phone number{count !== 1 ? 's' : ''}</strong> as <strong style={{ color: COLOR }}>{statusLabel}</strong>?</>),
            confirmLabel: `Mark ${count} as ${statusLabel}`, confirmColor: COLOR, confirmColorDark: COLOR_DARK,
            onConfirm: async () => {
                setConfirmLoading(true);
                const results = await Promise.allSettled(toUpdate.map(item =>
                    updatePhoneNumber({
                        id: item._id,
                        data: {
                            country_code: item.country_code, number: item.number,
                            browser_reset_time: item.browser_reset_time,
                            password_formatters: item.password_formatters?.map(f => ({ id: String(f._id), start_add: f.start_add, start_index: f.start_index, end_index: f.end_index, end_add: f.end_add })) ?? [],
                            is_active: targetStatus,
                        },
                    })
                ));
                const ok  = results.filter(r => r.status === 'fulfilled').length;
                const bad = results.filter(r => r.status === 'rejected').length;
                setGlobalSelectedRows([]);
                queryClient.invalidateQueries(['phoneNumbers']);
                setConfirmDialog(CONFIRM_DEFAULT);
                bad === 0 ? setSuccess(`${ok} number${ok !== 1 ? 's' : ''} marked as ${statusLabel.toLowerCase()}`) : setError(`${ok} updated, ${bad} failed`);
            },
        });
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
            if (nums.length === 0)                    { setError('Please enter at least one phone number'); return; }
            if (duplicateNumbers.length > 0)          { setError(`Remove duplicates first: ${duplicateNumbers.join(', ')}`); return; }
            if (nums.length > MAX_NUMBERS_PER_UPLOAD) { setError(`Max ${MAX_NUMBERS_PER_UPLOAD} numbers at once. You entered ${nums.length}.`); return; }

            setBulkUploadState({ total: nums.length, done: 0 });
            setBulkUploadErrors([]);
            const errors = []; let succeeded = 0;

            for (const num of nums) {
                try {
                    await createMutation.mutateAsync({
                        country_code: formData.country_code, number: num,
                        browser_reset_time: formData.browser_reset_time === '' ? undefined : Number(formData.browser_reset_time),
                        password_formatters: selectedFormatters,
                    });
                    succeeded++;
                } catch (err) {
                    errors.push({ number: num, message: err.message || 'Failed to create phone number' });
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
                setFormData(prev => ({ ...prev, numbers: errors.map(e => e.number).join('\n') }));
                setError(`${succeeded} succeeded, ${errors.length} failed. See details below.`);
            }
        }
    };

    const validateNumbersInput = (numbers) => {
        const nums = parseNumbers(numbers);
        const warnings = [];
        if (nums.length > MAX_NUMBERS_PER_UPLOAD)
            warnings.push(`Maximum ${MAX_NUMBERS_PER_UPLOAD} numbers allowed. You have ${nums.length}.`);
        return { warnings };
    };

    const getStatusStyle = (isActive) => ({
        backgroundColor: alpha(isActive ? GREEN : RED, 0.1),
        color: isActive ? GREEN : RED,
        borderColor: isActive ? GREEN : RED,
    });
    const getStatusLabel = (isActive) => isActive ? 'Active' : 'Inactive';

    const parsedCount = parseNumbers(formData.numbers).length;
    const { warnings: validationWarnings } = !selectedNumber && formData.numbers
        ? validateNumbersInput(formData.numbers)
        : { warnings: [] };

    const isMutating = createMutation.isLoading || updateMutation.isLoading;
    const MenuProps  = { PaperProps: { style: { maxHeight: 220, width: 260 } } };

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
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>Error loading phone numbers: {queryError?.message || 'Unknown error'}</Alert>
            <Button variant="contained" onClick={() => refetch()}>Retry</Button>
        </Box>
    );

    return (
        <Box>
            <Helmet><title>Phone Numbers | Power Automate</title></Helmet>

            {/* ── Page header ── */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={globalSelectedRows.length > 0 ? 1.5 : 3}>
                <Box>
                    <Typography sx={{ fontWeight: 700, mb: 0.4, fontSize: { xs: '1rem', sm: '1.1rem' }, background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Phone Numbers
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.55) }}>
                        Manage phone numbers and password formatters
                    </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    {showMarkInactive && (
                        <Tooltip title={`Mark ${activeSelectedCount} active number${activeSelectedCount !== 1 ? 's' : ''} as Inactive`} placement="bottom">
                            <Button variant="contained" size="small" startIcon={<ToggleOffIcon sx={{ fontSize: '1rem' }} />} onClick={() => handleBulkStatusClick(false)}
                                sx={{ background: `linear-gradient(135deg, ${ORANGE_DARK} 0%, ${ORANGE} 100%)`, color: 'white', fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36, textTransform: 'none', fontWeight: 500, borderRadius: '8px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                Mark Inactive ({activeSelectedCount})
                            </Button>
                        </Tooltip>
                    )}
                    {showMarkActive && (
                        <Tooltip title={`Mark ${inactiveSelectedCount} inactive number${inactiveSelectedCount !== 1 ? 's' : ''} as Active`} placement="bottom">
                            <Button variant="contained" size="small" startIcon={<ToggleOnIcon sx={{ fontSize: '1rem' }} />} onClick={() => handleBulkStatusClick(true)}
                                sx={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`, color: 'white', fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36, textTransform: 'none', fontWeight: 500, borderRadius: '8px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                Mark Active ({inactiveSelectedCount})
                            </Button>
                        </Tooltip>
                    )}
                    {globalSelectedRows.length > 0 && (
                        <Button variant="contained" size="small" startIcon={<DeleteSweepIcon sx={{ fontSize: '0.9rem' }} />} onClick={handleBulkDeleteClick}
                            sx={{ background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED} 100%)`, color: 'white', fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36, textTransform: 'none', fontWeight: 500, borderRadius: '8px', '&:hover': { background: `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)` } }}>
                            Delete ({globalSelectedRows.length})
                        </Button>
                    )}
                    <GradientButton variant="contained" startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />} onClick={() => handleOpenDialog()} size="small"
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }} disabled={createMutation.isLoading}>
                        Add Phone Numbers
                    </GradientButton>
                </Box>
            </Box>

            {/* ── Global selection info bar ── */}
            {globalSelectedRows.length > 0 && (
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5} px={2} py={1}
                    sx={{ borderRadius: 1.5, backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.05), border: `1px solid ${alpha(BLUE, 0.2)}`, flexWrap: 'wrap' }}>
                    <CheckCircleIcon sx={{ fontSize: '0.9rem', color: BLUE }} />
                    <Typography sx={{ fontSize: '0.8rem', color: BLUE, fontWeight: 600 }}>
                        {globalSelectedRows.length} number{globalSelectedRows.length !== 1 ? 's' : ''} selected for global bulk operations
                    </Typography>
                    {activeSelectedCount > 0 && (
                        <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${activeSelectedCount} active`}
                            sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(GREEN, 0.1), color: GREEN, border: `1px solid ${alpha(GREEN, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                    )}
                    {inactiveSelectedCount > 0 && (
                        <Chip size="small" icon={<BlockIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${inactiveSelectedCount} inactive`}
                            sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(RED, 0.08), color: RED, border: `1px solid ${alpha(RED, 0.25)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                    )}
                    <Box flex={1} />
                    <Button size="small" onClick={() => setGlobalSelectedRows([])}
                        sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.5), textTransform: 'none', minWidth: 0, px: 1 }}>
                        Clear selection
                    </Button>
                </Box>
            )}

            {/* ── Filters ── */}
            <Box mb={2.5} display="flex" gap={1.5} alignItems="center">
                <StyledTextField fullWidth placeholder="Search by phone number or country code…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: '0.9rem', color: alpha(TEXT, 0.4) }} /> }}
                    size="small" sx={{ '& .MuiInputBase-input': { fontSize: '0.83rem', color: TEXT } }} />
                <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                    <InputLabel sx={{ fontSize: '0.83rem' }}>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setPage(0); setGlobalSelectedRows([]); }} sx={{ fontSize: '0.83rem' }}>
                        <MenuItem value="all" sx={{ fontSize: '0.83rem' }}>All</MenuItem>
                        <MenuItem value="active" sx={{ fontSize: '0.83rem' }}><Box display="flex" alignItems="center" gap={1}><CheckCircleIcon sx={{ fontSize: '0.85rem', color: GREEN }} /> Active</Box></MenuItem>
                        <MenuItem value="inactive" sx={{ fontSize: '0.83rem' }}><Box display="flex" alignItems="center" gap={1}><BlockIcon sx={{ fontSize: '0.85rem', color: RED }} /> Inactive</Box></MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* ── Main Table ── */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, overflow: 'auto', mb: 3, position: 'relative', minHeight: 380 }}>
                {isLoading && (
                    <Box position="absolute" top={0} left={0} right={0} bottom={0} display="flex" alignItems="center" justifyContent="center" bgcolor="rgba(255,255,255,0.7)" zIndex={1}>
                        <CircularProgress />
                    </Box>
                )}
                <Table size="medium">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.08 : 0.04) }}>
                            <TableCell padding="checkbox" sx={{ pl: 1.5, borderBottom: `2px solid ${alpha(BLUE, 0.5)}` }}>
                                <Tooltip title="Select all for global bulk operations" placement="top">
                                    <Checkbox size="small" checked={globalAllSelected} indeterminate={globalSomeSelected} onChange={handleSelectAllVisible} disabled={filteredNumbers.length === 0} />
                                </Tooltip>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT, fontSize: '0.82rem', py: 1.3, borderBottom: `2px solid ${alpha(BLUE, 0.5)}` }}>
                                Country Code
                                <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 400, color: alpha(TEXT, 0.4), ml: 1 }}>
                                    — outer ☐ = global bulk · inner ☐ = row actions
                                </Typography>
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
                                        {debouncedSearch || statusFilter !== 'all' ? 'No phone numbers found matching your filters' : 'No phone numbers yet. Add one to get started.'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedGroups.map(group => (
                                <CountryCodeRow
                                    key={group.country_code}
                                    group={group}
                                    globalSelectedRows={globalSelectedRows}
                                    onGlobalSelectGroup={handleSelectGroupAll}
                                    onEdit={handleOpenDialog}
                                    onDelete={handleDeleteClick}
                                    onDeleteGroup={handleDeleteGroupClick}
                                    theme={theme}
                                    colors={colors}
                                    getStatusStyle={getStatusStyle}
                                    getStatusLabel={getStatusLabel}
                                    onSuccess={setSuccess}
                                    onError={setError}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={groupedNumbers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Country codes per page:"
                    sx={{ borderTop: `1px solid ${theme.palette.divider}`, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.78rem', color: alpha(TEXT, 0.6) } }}
                />
            </TableContainer>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={openDialog} onClose={() => { if (bulkUploadState) return; setOpenDialog(false); resetForm(); }} maxWidth="md" PaperProps={{ sx: { borderRadius: 2.5, height: '100%' } }}>
                <DialogTitle sx={{ color: TEXT, fontWeight: 600, fontSize: '0.95rem', py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    {selectedNumber ? 'Edit Phone Number' : 'Add Phone Numbers'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField fullWidth label="Country Code" name="country_code" value={formData.country_code} onChange={handleInputChange} placeholder="+91" size="small" required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StyledTextField fullWidth label="Browser Reset" name="browser_reset_time" value={formData.browser_reset_time} onChange={handleInputChange} placeholder="Browser Reset Value" size="small" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Password Formatters</InputLabel>
                                <Select multiple value={formData.password_formatter_ids} onChange={handleFormatterSelectChange} input={<OutlinedInput label="Password Formatters" />}
                                    renderValue={(selected) => (
                                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                                            {selected.map(val => {
                                                const f = passwordFormatters.find(x => String(x._id) === val);
                                                return f
                                                    ? <Chip key={val} label={formatFormatterLabel(f)} size="small" sx={{ backgroundColor: alpha(GREEN, 0.1), color: GREEN, fontSize: '0.68rem', height: 22, borderRadius: '4px' }} />
                                                    : <Chip key={val} label="Unknown" size="small" sx={{ backgroundColor: alpha(RED, 0.1), color: RED, fontSize: '0.68rem', height: 22, borderRadius: '4px' }} />;
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps} disabled={formattersLoading}>
                                    {!formattersLoading && passwordFormatters.length > 0 && (
                                        <MenuItem value="select-all" sx={{ fontSize: '0.83rem' }}>
                                            <Checkbox size="small" checked={formData.password_formatter_ids.length === passwordFormatters.length} indeterminate={formData.password_formatter_ids.length > 0 && formData.password_formatter_ids.length < passwordFormatters.length} />
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
                                label={selectedNumber ? 'Phone Number' : bulkUploadState ? `Uploading… ${bulkUploadState.done}/${bulkUploadState.total}` : `Phone Numbers (one per line)${parsedCount > 0 ? ` — ${parsedCount} detected` : ''}`}
                                name="numbers" value={formData.numbers} onChange={handleInputChange} disabled={!!bulkUploadState}
                                placeholder={selectedNumber ? '919026935664' : `919026935664\n919026935652\n919026033412`}
                                multiline minRows={selectedNumber ? 1 : 5} maxRows={12} size="small"
                                error={validationWarnings.length > 0 || duplicateNumbers.length > 0}
                                required={!selectedNumber}
                                helperText={!selectedNumber && !bulkUploadState && (
                                    <>
                                        {duplicateNumbers.length > 0 && <span style={{ color: RED, display: 'block', marginBottom: '4px' }}>Duplicate numbers found: {duplicateNumbers.join(', ')}</span>}
                                        {validationWarnings.map((w, i) => <span key={i} style={{ color: RED, display: 'block' }}>{w}</span>)}
                                        {parsedCount > 0 && parsedCount <= MAX_NUMBERS_PER_UPLOAD && duplicateNumbers.length === 0 && <span style={{ color: GREEN, display: 'block' }}>✓ Ready to upload {parsedCount} number{parsedCount > 1 ? 's' : ''}</span>}
                                    </>
                                )}
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.83rem' } }} />
                        </Grid>

                        {!selectedNumber && !bulkUploadState && duplicateNumbers.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <DuplicateNumbersWarning duplicates={duplicateNumbers} onRemoveAll={removeDuplicates} onKeepAll={() => setDuplicateNumbers([])} />
                            </Grid>
                        )}

                        {!selectedNumber && bulkUploadState && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 2, mt: 0.5 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>Uploading numbers…</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.5) }}>{bulkUploadState.done} / {bulkUploadState.total}</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={bulkUploadState.total > 0 ? (bulkUploadState.done / bulkUploadState.total) * 100 : 0}
                                        sx={{ height: 6, borderRadius: 3, mb: 1.5, backgroundColor: alpha(BLUE, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: BLUE } }} />
                                </Box>
                            </Grid>
                        )}

                        {!selectedNumber && !bulkUploadState && bulkUploadErrors.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <BulkUploadErrorDetails errors={bulkUploadErrors} onRetry={() => setBulkUploadErrors([])} onClear={() => { setBulkUploadErrors([]); setFormData(prev => ({ ...prev, numbers: '' })); }} />
                            </Grid>
                        )}

                        {selectedNumber && (
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, px: 2, py: 1.3 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.83rem', fontWeight: 500, color: TEXT }}>Active Status</Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.73rem', color: alpha(TEXT, 0.5) }}>Toggle whether this phone number is active</Typography>
                                    </Box>
                                    <Chip label={formData.is_active ? 'Active' : 'Inactive'} size="small" variant="outlined"
                                        icon={formData.is_active ? <CheckCircleIcon sx={{ fontSize: '0.72rem !important' }} /> : <BlockIcon sx={{ fontSize: '0.72rem !important' }} />}
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        sx={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.72rem', height: 26, borderRadius: '6px', ...getStatusStyle(formData.is_active), '& .MuiChip-label': { px: 0.9 }, transition: 'all 0.15s ease' }} />
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    <OutlineButton onClick={() => { setOpenDialog(false); resetForm(); }} size="medium" sx={{ fontSize: '0.82rem', px: 2 }} disabled={isMutating || !!bulkUploadState}>Cancel</OutlineButton>
                    <GradientButton onClick={handleSubmit} variant="contained"
                        disabled={!formData.country_code || !formData.numbers.trim() || isMutating || !!bulkUploadState || validationWarnings.length > 0 || duplicateNumbers.length > 0}
                        size="medium" sx={{ fontSize: '0.82rem', px: 2, minWidth: 120 }}>
                        {bulkUploadState ? (
                            <Box display="flex" alignItems="center" gap={1}><CircularProgress size={14} sx={{ color: 'white' }} /><span>Uploading…</span></Box>
                        ) : isMutating ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : selectedNumber ? 'Update'
                          : bulkUploadErrors.length > 0 ? `Retry ${bulkUploadErrors.length} Failed`
                          : parsedCount > 1 ? `Create ${parsedCount} Numbers`
                          : 'Create'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* ── Confirm dialog ── */}
            <ConfirmDialog
                open={confirmDialog.open} onClose={closeConfirm} onConfirm={confirmDialog.onConfirm}
                loading={confirmDialog.loading} title={confirmDialog.title} titleColor={confirmDialog.titleColor}
                icon={confirmDialog.icon} message={confirmDialog.message} confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor} confirmColorDark={confirmDialog.confirmColorDark}
            />

            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" elevation={4} sx={snackbarBaseSx(GREEN)}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.82rem', color: TEXT }}>{success}</Typography>
                </Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" elevation={4} sx={snackbarBaseSx(RED)}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.82rem', color: TEXT }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PhoneNumbers;