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
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    Done as DoneIcon,
} from '@mui/icons-material';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import {
    fetchPhoneNumbers,
    fetchPasswordFormatters,
    createPhoneNumber,
    bulkCreatePhoneNumbers,
    updatePhoneNumber,
    deletePhoneNumber,
    bulkDeletePhoneNumbers,
    bulkUpdatePhoneNumberStatus
} from '../../api/phoneNumbers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';

const MAX_NUMBERS_PER_UPLOAD = 1000;
const INNER_PAGE_SIZE = 50;

const initialFormData = {
    country_code: '',
    numbers: '',
    password_formatter_ids: [],
    is_active: 'inactive',
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

const STATUS_ENUM = ['inactive', 'running', 'completed'];
const STATUS_COLORS = {
    inactive: { color: '#6B7280', icon: BlockIcon, label: 'Inactive' },
    running: { color: '#3B82F6', icon: PlayArrowIcon, label: 'Running' },
    completed: { color: '#10B981', icon: DoneIcon, label: 'Completed' },
};

const getStatusStyle = (status) => ({
    backgroundColor: alpha(STATUS_COLORS[status].color, 0.1),
    color: STATUS_COLORS[status].color,
    borderColor: STATUS_COLORS[status].color,
});

const getStatusLabel = (status) => STATUS_COLORS[status].label;
const getStatusIcon = (status) => STATUS_COLORS[status].icon;

function ConfirmDialog({ open, onClose, onConfirm, loading, title, titleColor, iconComponent, message, confirmLabel, confirmColor, confirmColorDark }) {
    const theme = useTheme();
    const TEXT = theme.palette.text.primary;

    // Handle iconComponent - it should be the constructor
    const IconComponent = iconComponent || DeleteIcon;

    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ color: titleColor, fontWeight: 600, fontSize: '0.95rem', py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <IconComponent sx={{ fontSize: '1.1rem' }} />
                    {title}
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <DialogContentText sx={{ fontSize: '0.875rem', color: TEXT, lineHeight: 1.6 }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                <OutlineButton onClick={onClose} size="medium" sx={{ fontSize: '0.82rem', px: 2 }} disabled={loading}>
                    Cancel
                </OutlineButton>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <IconComponent sx={{ fontSize: '0.9rem' }} />}
                    sx={{
                        background: `linear-gradient(135deg, ${confirmColorDark} 0%, ${confirmColor} 100%)`,
                        color: 'white',
                        borderRadius: '8px',
                        px: 2,
                        fontWeight: 500,
                        fontSize: '0.82rem',
                        textTransform: 'none',
                        '&:hover': { filter: 'brightness(1.1)' },
                        '&.Mui-disabled': { opacity: 0.65, color: 'white' }
                    }}>
                    {loading ? 'Processing…' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

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

function CountryCodeRow({
    group,
    globalSelectedRows,
    onGlobalSelectGroup,
    onEdit, onDelete, onDeleteGroup,
    theme, colors: { BLUE, RED, GREEN, TEXT },
    onSuccess, onError,
}) {
    const [open, setOpen] = useState(false);
    const [innerPage, setInnerPage] = useState(0);
    const [innerSelected, setInnerSelected] = useState([]);
    const [innerConfirmDialog, setInnerConfirmDialog] = useState({
        open: false,
        loading: false,
        type: null,
        targetStatus: null,
        confirmData: {}
    });

    const groupIds = group.items.map(i => i._id);

    useEffect(() => { setInnerPage(0); }, [group.country_code]);

    const pagedItems = group.items.slice(innerPage * INNER_PAGE_SIZE, (innerPage + 1) * INNER_PAGE_SIZE);
    const pagedIds = pagedItems.map(i => i._id);

    const innerSelectedOnPage = pagedIds.filter(id => innerSelected.includes(id));
    const innerAllOnPageSelected = pagedIds.length > 0 && innerSelectedOnPage.length === pagedIds.length;
    const innerSomeOnPageSelected = innerSelectedOnPage.length > 0 && !innerAllOnPageSelected;

    const globalSelectedInGroup = groupIds.filter(id => globalSelectedRows.includes(id));
    const globalAllSelected = groupIds.length > 0 && globalSelectedInGroup.length === groupIds.length;
    const globalSomeSelected = globalSelectedInGroup.length > 0 && !globalAllSelected;
    const hasGlobalChild = globalSelectedInGroup.length > 0;

    const statusCounts = {
        inactive: group.items.filter(i => i.is_active === 'inactive').length,
        running: group.items.filter(i => i.is_active === 'running').length,
        completed: group.items.filter(i => i.is_active === 'completed').length,
    };

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

    const handleInnerMarkStatus = (targetStatus) => {
        const toUpdate = group.items.filter(i => innerSelected.includes(i._id) && i.is_active !== targetStatus);
        const count = toUpdate.length;
        const statusLabel = getStatusLabel(targetStatus);
        const statusColor = STATUS_COLORS[targetStatus].color;
        const Icon = getStatusIcon(targetStatus);

        setInnerConfirmDialog({
            open: true,
            loading: false,
            type: 'status',
            targetStatus,
            confirmData: {
                title: `Mark as ${statusLabel}`,
                titleColor: statusColor,
                iconComponent: Icon,
                message: <>Are you sure you want to mark <strong>{count} phone number{count !== 1 ? 's' : ''}</strong> as <strong style={{ color: statusColor }}>{statusLabel}</strong>?</>,
                confirmLabel: `Mark ${count} as ${statusLabel}`,
                confirmColor: statusColor,
                confirmColorDark: statusColor,
                count,
            }
        });
    };

    const handleInnerDelete = () => {
        const count = innerSelected.length;
        setInnerConfirmDialog({
            open: true,
            loading: false,
            type: 'delete',
            confirmData: {
                title: 'Confirm Delete',
                titleColor: RED,
                iconComponent: DeleteIcon,
                message: <>Are you sure you want to delete <strong>{count} phone number{count !== 1 ? 's' : ''}</strong>? This action cannot be undone.</>,
                confirmLabel: `Delete ${count}`,
                confirmColor: RED,
                confirmColorDark: theme.palette.error.dark,
                count,
            }
        });
    };

    const closeInnerConfirm = () => {
        if (innerConfirmDialog.loading) return;
        setInnerConfirmDialog({ open: false, loading: false, type: null, targetStatus: null, confirmData: {} });
    };

    const confirmInnerAction = async () => {
        setInnerConfirmDialog(prev => ({ ...prev, loading: true }));

        try {
            if (innerConfirmDialog.type === 'status') {
                const result = await bulkUpdatePhoneNumberStatus(innerSelected, innerConfirmDialog.targetStatus);
                setInnerSelected([]);
                onSuccess(result.message);
            } else if (innerConfirmDialog.type === 'delete') {
                const result = await bulkDeletePhoneNumbers(innerSelected);
                setInnerSelected([]);
                onSuccess(result.message);
            }
            closeInnerConfirm();
        } catch (error) {
            const msg = error.response?.data?.message || 'Operation failed';
            onError(msg);
            closeInnerConfirm();
        } finally {
            window.__queryClient?.invalidateQueries(['phoneNumbers']);
        }
    };

    return (
        <>
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

                        {statusCounts.inactive > 0 && (
                            <Chip size="small" icon={<BlockIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${statusCounts.inactive} Inactive`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(STATUS_COLORS.inactive.color, 0.1), color: STATUS_COLORS.inactive.color, border: `1px solid ${alpha(STATUS_COLORS.inactive.color, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                        )}
                        {statusCounts.running > 0 && (
                            <Chip size="small" icon={<PlayArrowIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${statusCounts.running} Running`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(STATUS_COLORS.running.color, 0.1), color: STATUS_COLORS.running.color, border: `1px solid ${alpha(STATUS_COLORS.running.color, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                        )}
                        {statusCounts.completed > 0 && (
                            <Chip size="small" icon={<DoneIcon sx={{ fontSize: '0.65rem !important' }} />} label={`${statusCounts.completed} Completed`}
                                sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(STATUS_COLORS.completed.color, 0.1), color: STATUS_COLORS.completed.color, border: `1px solid ${alpha(STATUS_COLORS.completed.color, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
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

            <TableRow>
                <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ borderLeft: `3px solid ${alpha(BLUE, 0.2)}`, ml: 3 }}>

                            {innerSelected.length > 0 && (
                                <Box display="flex" alignItems="center" gap={1} px={2} py={0.8}
                                    sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.04), borderBottom: `1px solid ${alpha(BLUE, 0.12)}`, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: BLUE, fontWeight: 600 }}>
                                        {innerSelected.length} selected
                                    </Typography>
                                    <Box flex={1} />

                                    {STATUS_ENUM.map(status => {
                                        const selectedWithDifferentStatus = group.items.filter(i => innerSelected.includes(i._id) && i.is_active !== status).length;
                                        return selectedWithDifferentStatus > 0 ? (
                                            <Button key={status} size="small" variant="contained" disabled={innerConfirmDialog.loading}
                                                startIcon={innerConfirmDialog.loading ? <CircularProgress size={12} sx={{ color: 'white' }} /> : React.createElement(getStatusIcon(status), { sx: { fontSize: '0.8rem' } })}
                                                onClick={() => handleInnerMarkStatus(status)}
                                                sx={{ fontSize: '0.72rem', py: 0.3, px: 1, height: 26, textTransform: 'none', background: `linear-gradient(135deg, ${STATUS_COLORS[status].color} 0%, ${alpha(STATUS_COLORS[status].color, 0.7)} 100%)`, color: 'white', borderRadius: '6px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                                {getStatusLabel(status)} ({selectedWithDifferentStatus})
                                            </Button>
                                        ) : null;
                                    })}

                                    <Button size="small" variant="contained" disabled={innerConfirmDialog.loading}
                                        startIcon={innerConfirmDialog.loading ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <DeleteSweepIcon sx={{ fontSize: '0.8rem' }} />}
                                        onClick={handleInnerDelete}
                                        sx={{ fontSize: '0.72rem', py: 0.3, px: 1, height: 26, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${RED} 100%)`, color: 'white', borderRadius: '6px', '&:hover': { filter: 'brightness(1.1)' } }}>
                                        Delete ({innerSelected.length})
                                    </Button>
                                    <Button size="small" disabled={innerConfirmDialog.loading} onClick={() => setInnerSelected([])}
                                        sx={{ fontSize: '0.7rem', color: alpha(TEXT, 0.45), textTransform: 'none', minWidth: 0, px: 0.8 }}>
                                        Clear
                                    </Button>
                                </Box>
                            )}

                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.04 : 0.02) }}>
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
                                        {['Phone Number', 'Password Formatters', 'RDP ID', 'Status', 'Actions'].map((label, i) => (
                                            <TableCell key={label} align={i === 3 ? 'right' : 'left'}
                                                sx={{ py: 0.9, fontSize: '0.78rem', fontWeight: 700, color: TEXT, borderBottom: `1px solid ${alpha(BLUE, 0.18)}`, pl: i === 0 ? 2 : undefined, pr: i === 3 ? 1.5 : undefined }}>
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
                                                <TableCell sx={{ ...cellSx, pl: 2 }}>
                                                    <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: TEXT, letterSpacing: '0.02em' }}>{item.rdp_id ? item.rdp_id : '-'}</Typography>
                                                </TableCell>
                                                <TableCell sx={cellSx}>
                                                    <Chip label={getStatusLabel(item.is_active)} size="small" variant="outlined"
                                                        icon={React.createElement(getStatusIcon(item.is_active), { sx: { fontSize: '0.72rem !important' } })}
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

            <ConfirmDialog
                open={innerConfirmDialog.open}
                onClose={closeInnerConfirm}
                onConfirm={confirmInnerAction}
                loading={innerConfirmDialog.loading}
                title={innerConfirmDialog.confirmData.title}
                titleColor={innerConfirmDialog.confirmData.titleColor}
                iconComponent={innerConfirmDialog.confirmData.iconComponent}
                message={innerConfirmDialog.confirmData.message}
                confirmLabel={innerConfirmDialog.confirmData.confirmLabel}
                confirmColor={innerConfirmDialog.confirmData.confirmColor}
                confirmColorDark={innerConfirmDialog.confirmData.confirmColorDark}
            />
        </>
    );
}

export const PhoneNumbers = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    useEffect(() => { window.__queryClient = queryClient; }, [queryClient]);

    const BLUE = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark;
    const RED = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const GREEN = theme.palette.success.main;
    const GREEN_DARK = theme.palette.success.dark;
    const TEXT = theme.palette.text.primary;
    const colors = { BLUE, RED, GREEN, TEXT };

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [globalSelectedRows, setGlobalSelectedRows] = useState([]);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [bulkUploadState, setBulkUploadState] = useState(null);
    const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
    const [duplicateNumbers, setDuplicateNumbers] = useState([]);

    const CONFIRM_DEFAULT = {
        open: false,
        loading: false,
        title: '',
        titleColor: RED,
        iconComponent: DeleteIcon,
        message: '',
        confirmLabel: '',
        confirmColor: RED,
        confirmColorDark: RED_DARK,
        onConfirm: null,
    };
    const [confirmDialog, setConfirmDialog] = useState(CONFIRM_DEFAULT);

    const closeConfirm = () => {
        if (confirmDialog.loading) return;
        setConfirmDialog(CONFIRM_DEFAULT);
    };
    const openConfirm = (cfg) => setConfirmDialog({ ...CONFIRM_DEFAULT, open: true, ...cfg });

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { setGlobalSelectedRows([]); }, [page, rowsPerPage, debouncedSearch, statusFilter]);

    const { data: phoneNumbersData, isLoading, isError, error: queryError, refetch } = useQuery({
        queryKey: ['phoneNumbers', page, rowsPerPage, debouncedSearch],
        queryFn: () => fetchPhoneNumbers({ page, limit: rowsPerPage, search: debouncedSearch }),
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
            setSuccess(data.message || 'Phone number created successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (err) => {
            const m = err.response?.data?.message || 'Failed to create phone number';
            setError(m);
        },
    });

    const bulkCreateMutation = useMutation({
        mutationFn: bulkCreatePhoneNumbers,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message);
            setOpenDialog(false);
            resetForm();
        },
        onError: (err) => {
            const response = err.response?.data;
            if (response?.existingNumbers) {
                setError(`Numbers already exist: ${response.existingNumbers.join(', ')}`);
            } else if (response?.duplicates) {
                setError(`Duplicate numbers in request: ${response.duplicates.join(', ')}`);
            } else {
                setError(response?.message || 'Failed to create phone numbers');
            }
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
            closeConfirm();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to delete phone number');
            closeConfirm();
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeletePhoneNumbers,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message);
            setGlobalSelectedRows([]);
            closeConfirm();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to delete phone numbers');
            closeConfirm();
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: ({ ids, status }) => bulkUpdatePhoneNumberStatus(ids, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['phoneNumbers']);
            setSuccess(data.message);
            setGlobalSelectedRows([]);
            closeConfirm();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to update status');
            closeConfirm();
        },
    });

    const allPhoneNumbers = phoneNumbersData?.data || [];
    const passwordFormatters = formattersData?.data || [];

    const filteredNumbers = statusFilter === 'all'
        ? allPhoneNumbers
        : allPhoneNumbers.filter(item => item.is_active === statusFilter);

    const groupedNumbers = groupByCountryCode(filteredNumbers);
    const paginatedGroups = groupedNumbers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const allVisibleIds = filteredNumbers.map(item => item._id);
    const globalAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => globalSelectedRows.includes(id));
    const globalSomeSelected = globalSelectedRows.length > 0 && !globalAllSelected;

    const globalSelectedItems = useMemo(
        () => allPhoneNumbers.filter(n => globalSelectedRows.includes(n._id)),
        [allPhoneNumbers, globalSelectedRows]
    );
    const statusSelectedCounts = {
        inactive: globalSelectedItems.filter(n => n.is_active === 'inactive').length,
        running: globalSelectedItems.filter(n => n.is_active === 'running').length,
        completed: globalSelectedItems.filter(n => n.is_active === 'completed').length,
    };

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
        setBulkUploadState(null);
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
                password_formatter_ids: passwordFormatters.length > 0 ? getSelectedFormatterIds(number) : [],
                is_active: number.is_active || 'inactive',
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
            title: 'Confirm Delete',
            titleColor: RED,
            iconComponent: DeleteIcon,
            message: <>Are you sure you want to delete <strong>"{item.country_code} {item.number}"</strong>? This action cannot be undone.</>,
            confirmLabel: 'Delete',
            confirmColor: RED,
            confirmColorDark: RED_DARK,
            onConfirm: () => {
                deleteMutation.mutate(item._id);
            },
        });
    };

    const handleDeleteGroupClick = (group) => {
        openConfirm({
            title: 'Delete Group',
            titleColor: RED,
            iconComponent: DeleteSweepIcon,
            message: <>Are you sure you want to delete all <strong>{group.items.length} number{group.items.length !== 1 ? 's' : ''}</strong> under <strong>{group.country_code}</strong>? This cannot be undone.</>,
            confirmLabel: `Delete ${group.items.length} Numbers`,
            confirmColor: RED,
            confirmColorDark: RED_DARK,
            onConfirm: () => {
                const ids = group.items.map(i => i._id);
                bulkDeleteMutation.mutate(ids);
            },
        });
    };

    const handleBulkDeleteClick = () => {
        const count = globalSelectedRows.length;
        openConfirm({
            title: 'Confirm Bulk Delete',
            titleColor: RED,
            iconComponent: DeleteSweepIcon,
            message: <>Are you sure you want to delete <strong>{count} phone number{count > 1 ? 's' : ''}</strong>? This cannot be undone.</>,
            confirmLabel: `Delete ${count}`,
            confirmColor: RED,
            confirmColorDark: RED_DARK,
            onConfirm: () => {
                bulkDeleteMutation.mutate(globalSelectedRows);
            },
        });
    };

    const handleBulkStatusClick = (targetStatus) => {
        const toUpdate = globalSelectedItems.filter(n => n.is_active !== targetStatus);
        const count = toUpdate.length;
        const statusLabel = getStatusLabel(targetStatus);
        const statusColor = STATUS_COLORS[targetStatus].color;
        const Icon = getStatusIcon(targetStatus);
        openConfirm({
            title: `Mark as ${statusLabel}`,
            titleColor: statusColor,
            iconComponent: Icon,
            message: <>Are you sure you want to mark <strong>{count} phone number{count !== 1 ? 's' : ''}</strong> as <strong style={{ color: statusColor }}>{statusLabel}</strong>?</>,
            confirmLabel: `Mark ${count} as ${statusLabel}`,
            confirmColor: statusColor,
            confirmColorDark: statusColor,
            onConfirm: () => {
                bulkStatusMutation.mutate({
                    ids: toUpdate.map(item => item._id),
                    status: targetStatus
                });
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
                    password_formatters: selectedFormatters,
                    is_active: formData.is_active,
                },
            });
        } else {
            const nums = parseNumbers(formData.numbers);
            if (nums.length === 0) { setError('Please enter at least one phone number'); return; }
            if (duplicateNumbers.length > 0) { setError(`Remove duplicates first: ${duplicateNumbers.join(', ')}`); return; }
            if (nums.length > MAX_NUMBERS_PER_UPLOAD) { setError(`Max ${MAX_NUMBERS_PER_UPLOAD} numbers at once. You entered ${nums.length}.`); return; }

            if (nums.length > 1) {
                bulkCreateMutation.mutate({
                    country_code: formData.country_code,
                    numbers: nums,
                    password_formatters: selectedFormatters,
                });
            } else {
                createMutation.mutate({
                    country_code: formData.country_code,
                    number: nums[0],
                    password_formatters: selectedFormatters,
                });
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

    const parsedCount = parseNumbers(formData.numbers).length;
    const { warnings: validationWarnings } = !selectedNumber && formData.numbers
        ? validateNumbersInput(formData.numbers)
        : { warnings: [] };

    const isMutating = createMutation.isLoading || updateMutation.isLoading || bulkCreateMutation.isLoading;
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
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>Error loading phone numbers: {queryError?.message || 'Unknown error'}</Alert>
            <Button variant="contained" onClick={() => refetch()}>Retry</Button>
        </Box>
    );

    return (
        <Box>
            <Helmet><title>Phone Numbers | Power Automate</title></Helmet>

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
                    <GradientButton variant="contained" startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />} onClick={() => handleOpenDialog()} size="small"
                        sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }} disabled={isMutating}>
                        Add Phone Numbers
                    </GradientButton>
                </Box>
            </Box>

            {globalSelectedRows.length > 0 && (
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5} px={2} py={1}
                    sx={{ borderRadius: 1.5, backgroundColor: alpha(BLUE, theme.palette.mode === 'dark' ? 0.1 : 0.05), border: `1px solid ${alpha(BLUE, 0.2)}`, flexWrap: 'wrap' }}>
                    <CheckCircleIcon sx={{ fontSize: '0.9rem', color: BLUE }} />
                    <Typography sx={{ fontSize: '0.8rem', color: BLUE, fontWeight: 600 }}>
                        {globalSelectedRows.length} number{globalSelectedRows.length !== 1 ? 's' : ''} selected for global bulk operations
                    </Typography>
                    {Object.entries(statusSelectedCounts).map(([status, count]) => count > 0 ? (
                        <Chip key={status} size="small" icon={React.createElement(getStatusIcon(status), { sx: { fontSize: '0.65rem !important' } })} label={`${count} ${getStatusLabel(status).toLowerCase()}`}
                            sx={{ height: 20, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: alpha(STATUS_COLORS[status].color, 0.1), color: STATUS_COLORS[status].color, border: `1px solid ${alpha(STATUS_COLORS[status].color, 0.3)}`, '& .MuiChip-label': { px: 0.7 }, '& .MuiChip-icon': { ml: 0.5 } }} />
                    ) : null)}
                    <Box flex={1} />
                    <Button size="small" onClick={() => setGlobalSelectedRows([])}
                        sx={{ fontSize: '0.75rem', color: alpha(TEXT, 0.5), textTransform: 'none', minWidth: 0, px: 1 }}>
                        Clear selection
                    </Button>
                </Box>
            )}

            <Box mb={2.5} display="flex" gap={1.5} alignItems="center">
                <StyledTextField fullWidth placeholder="Search by phone number or country code…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: '0.9rem', color: alpha(TEXT, 0.4) }} /> }}
                    size="small" sx={{ '& .MuiInputBase-input': { fontSize: '0.83rem', color: TEXT } }} />
                <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                    <InputLabel sx={{ fontSize: '0.83rem' }}>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setPage(0); setGlobalSelectedRows([]); }} sx={{ fontSize: '0.83rem' }}>
                        <MenuItem value="all" sx={{ fontSize: '0.83rem' }}>All</MenuItem>
                        {STATUS_ENUM.map(status => (
                            <MenuItem key={status} value={status} sx={{ fontSize: '0.83rem' }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {React.createElement(getStatusIcon(status), { sx: { fontSize: '0.85rem', color: STATUS_COLORS[status].color } })}
                                    {getStatusLabel(status)}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

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

            <Dialog open={openDialog} onClose={() => { if (bulkUploadState) return; setOpenDialog(false); resetForm(); }} maxWidth="md" PaperProps={{ sx: { borderRadius: 2.5, height: '100%' } }}>
                <DialogTitle sx={{ color: TEXT, fontWeight: 600, fontSize: '0.95rem', py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    {selectedNumber ? 'Edit Phone Number' : 'Add Phone Numbers'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 12 }}>
                            <StyledTextField fullWidth label="Country Code" name="country_code" value={formData.country_code} onChange={handleInputChange} placeholder="+91" size="small" required />
                        </Grid>
                        {selectedNumber && (
                            <Grid size={{ xs: 12, md: 12 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select value={formData.is_active} label="Status" onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value }))} sx={{ fontSize: '0.83rem' }}>
                                        {STATUS_ENUM.map(status => (
                                            <MenuItem key={status} value={status} sx={{ fontSize: '0.83rem' }}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {React.createElement(getStatusIcon(status), { sx: { fontSize: '0.85rem', color: STATUS_COLORS[status].color } })}
                                                    {getStatusLabel(status)}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
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
                                label={selectedNumber ? 'Phone Number' : bulkCreateMutation.isLoading ? `Creating ${parsedCount} numbers...` : `Phone Numbers (one per line)${parsedCount > 0 ? ` — ${parsedCount} detected` : ''}`}
                                name="numbers" value={formData.numbers} onChange={handleInputChange} disabled={bulkCreateMutation.isLoading}
                                placeholder={selectedNumber ? '919026935664' : `919026935664\n919026935652\n919026033412`}
                                multiline minRows={selectedNumber ? 1 : 5} maxRows={12} size="small"
                                error={validationWarnings.length > 0 || duplicateNumbers.length > 0}
                                required={!selectedNumber}
                                helperText={!selectedNumber && !bulkCreateMutation.isLoading && (
                                    <>
                                        {duplicateNumbers.length > 0 && <span style={{ color: RED, display: 'block', marginBottom: '4px' }}>Duplicate numbers found: {duplicateNumbers.join(', ')}</span>}
                                        {validationWarnings.map((w, i) => <span key={i} style={{ color: RED, display: 'block' }}>{w}</span>)}
                                        {parsedCount > 0 && parsedCount <= MAX_NUMBERS_PER_UPLOAD && duplicateNumbers.length === 0 && <span style={{ color: GREEN, display: 'block' }}>✓ Ready to upload {parsedCount} number{parsedCount > 1 ? 's' : ''}</span>}
                                    </>
                                )}
                                inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.83rem' } }} />
                        </Grid>

                        {!selectedNumber && !bulkCreateMutation.isLoading && duplicateNumbers.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <DuplicateNumbersWarning duplicates={duplicateNumbers} onRemoveAll={removeDuplicates} onKeepAll={() => setDuplicateNumbers([])} />
                            </Grid>
                        )}

                        {bulkCreateMutation.isLoading && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 2, mt: 0.5 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>Creating {parsedCount} numbers...</Typography>
                                        <CircularProgress size={20} />
                                    </Box>
                                    <LinearProgress sx={{ height: 6, borderRadius: 3, backgroundColor: alpha(BLUE, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: BLUE } }} />
                                </Box>
                            </Grid>
                        )}

                        {!selectedNumber && !bulkCreateMutation.isLoading && bulkUploadErrors.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <BulkUploadErrorDetails errors={bulkUploadErrors} onRetry={() => setBulkUploadErrors([])} onClear={() => { setBulkUploadErrors([]); setFormData(prev => ({ ...prev, numbers: '' })); }} />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    <OutlineButton onClick={() => { setOpenDialog(false); resetForm(); }} size="medium" sx={{ fontSize: '0.82rem', px: 2 }} disabled={isMutating}>Cancel</OutlineButton>
                    <GradientButton onClick={handleSubmit} variant="contained"
                        disabled={!formData.country_code || !formData.numbers.trim() || isMutating || validationWarnings.length > 0 || duplicateNumbers.length > 0}
                        size="medium" sx={{ fontSize: '0.82rem', px: 2, minWidth: 120 }}>
                        {bulkCreateMutation.isLoading ? (
                            <Box display="flex" alignItems="center" gap={1}><CircularProgress size={14} sx={{ color: 'white' }} /><span>Creating...</span></Box>
                        ) : isMutating ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                        ) : selectedNumber ? 'Update'
                            : bulkUploadErrors.length > 0 ? `Retry ${bulkUploadErrors.length} Failed`
                                : parsedCount > 1 ? `Create ${parsedCount} Numbers`
                                    : 'Create'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                loading={confirmDialog.loading}
                title={confirmDialog.title}
                titleColor={confirmDialog.titleColor}
                iconComponent={confirmDialog.iconComponent}
                message={confirmDialog.message}
                confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor}
                confirmColorDark={confirmDialog.confirmColorDark}
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