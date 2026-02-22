import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Chip,
    Alert,
    Snackbar,
    alpha,
    useTheme,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Tooltip,
    Divider,
    Pagination,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Delete as DeleteIcon,
    DownloadForOffline as DownloadAllIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import StyledTextField from '../../components/ui/StyledTextField';
import OutlineButton from '../../components/ui/OutlineButton';
import { Helmet } from 'react-helmet-async';

const CARDS_PER_PAGE = 9;

const fetchPhoneCredentials = async () => {
    const response = await axiosInstance.get('/phone-credentials', {
        headers: { 'Cache-Control': 'no-cache' },
        params: { limit: 1000 },
    });
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
};

const deleteCredentialsByIds = async (ids) => {
    await Promise.all(ids.map((id) => axiosInstance.delete(`/phone-credentials/${id}`)));
};

const groupByCountryCode = (credentials) =>
    credentials.reduce((groups, credential) => {
        const countryCode = credential.country_code;
        if (!groups[countryCode]) groups[countryCode] = [];
        groups[countryCode].push(credential);
        return groups;
    }, {});

const downloadTxtFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const generateTypeContent = (credentials, type) =>
    credentials
        .filter((cred) => cred.type === type)
        .map((cred) => `${cred.phone}:${cred.password}`)
        .join('\n');

const generateAllContent = (credentials, types) =>
    types
        .map((type) => {
            const lines = generateTypeContent(credentials, type);
            return lines ? `=== Type ${type} ===\n${lines}` : null;
        })
        .filter(Boolean)
        .join('\n\n');

export default function ValidPhoneNumber() {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const BLUE_COLOR = theme.palette.primary.main;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const GREEN_COLOR = theme.palette.success.main;
    const WARNING_COLOR = theme.palette.warning.main;
    const WARNING_DARK = theme.palette.warning.dark;
    const TEXT_PRIMARY = theme.palette.text.primary;
    const GREY_COLOR = theme.palette.grey[500];

    const [searchQuery, setSearchQuery] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const {
        data: credentials = [],
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['phoneCredentials'],
        queryFn: fetchPhoneCredentials,
        staleTime: 0,
        cacheTime: 0,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCredentialsByIds,
        onSuccess: () => {
            queryClient.invalidateQueries(['phoneCredentials']);
            setSuccess(`All credentials for ${deleteTarget?.countryCode} deleted successfully`);
            setDeleteTarget(null);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to delete credentials');
            setDeleteTarget(null);
        },
    });

    const uniqueTypes = useMemo(() => {
        if (!credentials.length) return ['A', 'B', 'C'];
        return [...new Set(credentials.map((c) => c.type))].sort();
    }, [credentials]);

    const typeSummary = useMemo(
        () =>
            uniqueTypes.map((type) => ({
                type,
                count: credentials.filter((c) => c.type === type).length,
            })),
        [credentials, uniqueTypes]
    );

    const filteredAndGroupedCredentials = useMemo(() => {
        let filtered = credentials;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = credentials.filter(
                (cred) =>
                    cred.country_code?.toLowerCase().includes(query) ||
                    cred.phone?.toLowerCase().includes(query) ||
                    cred.type?.toLowerCase().includes(query)
            );
        }
        return groupByCountryCode(filtered);
    }, [credentials, searchQuery]);

    const allEntries = Object.entries(filteredAndGroupedCredentials);
    const totalPages = Math.ceil(allEntries.length / CARDS_PER_PAGE);
    const paginatedEntries = allEntries.slice(
        (page - 1) * CARDS_PER_PAGE,
        page * CARDS_PER_PAGE
    );

    const getTypeColor = (hasType) => {
        if (!hasType) return GREY_COLOR;
        return BLUE_COLOR;
    };

    const getTypeBackground = (hasType) => alpha(getTypeColor(hasType), 0.1);
    const getTypeBorder = (hasType) => alpha(getTypeColor(hasType), 0.25);

    const handlePageChange = (_, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleDownload = (countryCredentials, type) => {
        try {
            const content = generateTypeContent(countryCredentials, type);
            if (!content) { setError(`No Type ${type} credentials to download`); return; }
            const countryCode = countryCredentials[0]?.country_code || 'unknown';
            downloadTxtFile(content, `${countryCode}_type_${type}.txt`);
            setSuccess(`Downloaded Type ${type} credentials for Country Code: ${countryCode}`);
        } catch {
            setError('Failed to download file');
        }
    };

    const handleDownloadAll = (countryCredentials) => {
        try {
            const countryCode = countryCredentials[0]?.country_code || 'unknown';
            const content = generateAllContent(countryCredentials, uniqueTypes);
            if (!content) { setError('No credentials to download'); return; }
            downloadTxtFile(content, `${countryCode}_all_credentials.txt`);
            setSuccess(`Downloaded all credentials for Country Code: ${countryCode}`);
        } catch {
            setError('Failed to download file');
        }
    };

    const handleDownloadTypeAll = (type) => {
        try {
            const content = generateTypeContent(credentials, type);
            if (!content) { setError(`No Type ${type} credentials to download`); return; }
            downloadTxtFile(content, `all_type_${type}_credentials.txt`);
            setSuccess(`Downloaded all Type ${type} credentials`);
        } catch {
            setError('Failed to download file');
        }
    };

    const handleDownloadAllCredentials = () => {
        try {
            const content = generateAllContent(credentials, uniqueTypes);
            if (!content) { setError('No credentials to download'); return; }
            downloadTxtFile(content, `all_credentials_${new Date().toISOString().split('T')[0]}.txt`);
            setSuccess(`Downloaded all credentials (${credentials.length} total)`);
        } catch {
            setError('Failed to download file');
        }
    };

    const handleDeleteCard = (countryCode, countryCredentials) => {
        const ids = countryCredentials.map((c) => c._id);
        setDeleteTarget({ countryCode, ids, count: ids.length });
    };

    const handleDeleteConfirm = () => {
        if (deleteTarget) deleteMutation.mutate(deleteTarget.ids);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (queryError) {
        return (
            <Box p={3} textAlign="center">
                <Alert severity="error">
                    Error loading credentials: {queryError?.message || 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    const hasData = paginatedEntries.length > 0;

    return (
        <Box>
            <Helmet>
                <title>Valid Phone & Password | Power Automate</title>
            </Helmet>

            <Box sx={{ mb: 3 }}>
                <Typography
                    sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: { xs: '1rem', sm: '1.15rem' },
                        background: `linear-gradient(135deg, ${WARNING_DARK} 0%, ${WARNING_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Valid Phone & Password
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT_PRIMARY, 0.6) }}>
                    Manage and download phone credentials grouped by Country Code
                </Typography>
            </Box>

            <Box mb={2.5}>
                <StyledTextField
                    placeholder="Search by Country Code, phone, or type…"
                    value={searchQuery}
                    onChange={handleSearch}
                    size="small"
                    fullWidth
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                />
            </Box>

            {credentials.length > 0 && (
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {typeSummary.map(({ type, count }) => {
                        const color = getTypeColor(count > 0);
                        const bg = getTypeBackground(count > 0);
                        const border = getTypeBorder(count > 0);

                        return (
                            <Grid item xs="auto" key={type}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        minWidth: 130,
                                        border: `1px solid ${border}`,
                                        borderRadius: 2,
                                        background: bg,
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: `0 2px 10px ${alpha(color, 0.25)}` },
                                    }}
                                >
                                    <CardContent sx={{ py: 1.25, px: 2, '&:last-child': { pb: 1.25 } }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip
                                                    label={type}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        backgroundColor: alpha(color, 0.15),
                                                        color,
                                                        border: `1px solid ${border}`,
                                                        fontWeight: 700,
                                                    }}
                                                />
                                                <Typography
                                                    fontWeight={700}
                                                    sx={{ fontSize: '1rem', color, lineHeight: 1 }}
                                                >
                                                    {count}
                                                </Typography>
                                            </Box>

                                            <Tooltip title={`Download all Type ${type}`}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadTypeAll(type)}
                                                        disabled={count === 0}
                                                        sx={{
                                                            color: count > 0 ? color : GREY_COLOR,
                                                            p: 0.5,
                                                            '&:hover': { backgroundColor: alpha(color, 0.15) },
                                                        }}
                                                    >
                                                        <DownloadAllIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {credentials.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Card
                        elevation={0}
                        sx={{
                            background: `linear-gradient(135deg, ${alpha(GREEN_COLOR, 0.05)} 0%, ${alpha(BLUE_COLOR, 0.1)} 100%)`,
                            border: `1px solid ${alpha(WARNING_COLOR, 0.2)}`,
                            borderRadius: 2,
                        }}
                    >
                        <Box sx={{ p: 2 }} display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        color: WARNING_COLOR,
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    All Valid Phone & Password
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        backgroundColor: alpha(WARNING_COLOR, 0.1),
                                        borderRadius: 1.5,
                                        px: 1,
                                        py: 0.25,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: alpha(TEXT_PRIMARY, 0.7) }}>
                                        Total:
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: WARNING_COLOR }}>
                                        {credentials.length}
                                    </Typography>
                                </Box>
                            </Box>
                            <Tooltip title="Download all credentials">
                                <IconButton
                                    size="small"
                                    onClick={handleDownloadAllCredentials}
                                    sx={{
                                        color: WARNING_COLOR,
                                        backgroundColor: alpha(WARNING_COLOR, 0.1),
                                        '&:hover': { backgroundColor: alpha(WARNING_COLOR, 0.2) },
                                    }}
                                >
                                    <DownloadAllIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Card>
                </Box>
            )}

            {!hasData ? (
                <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                    {searchQuery
                        ? 'No credentials found matching your search.'
                        : 'No credentials available.'}
                </Alert>
            ) : (
                <>
                    <Grid container spacing={2.5}>
                        {paginatedEntries.map(([countryCode, countryCredentials]) => {
                            const isDeleting =
                                deleteMutation.isLoading && deleteTarget?.countryCode === countryCode;

                            return (
                                <Grid item xs={12} sm={6} md={6} key={countryCode}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.divider}`,
                                            transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.2s',
                                            opacity: isDeleting ? 0.5 : 1,
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 18px ${alpha(WARNING_COLOR, 0.12)}`,
                                            },
                                        }}
                                    >
                                        <CardHeader
                                            title={
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={700}
                                                    sx={{ fontSize: '0.9rem', letterSpacing: '0.01em' }}
                                                >
                                                    Country Code: {countryCode}
                                                </Typography>
                                            }
                                            action={
                                                <Box display="flex" alignItems="center" sx={{ ml: 5 }}>
                                                    <Tooltip title="Download all credentials">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDownloadAll(countryCredentials)}
                                                            sx={{
                                                                color: WARNING_COLOR,
                                                                p: 0.75,
                                                                '&:hover': { backgroundColor: alpha(WARNING_COLOR, 0.1) },
                                                            }}
                                                        >
                                                            <DownloadAllIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete all credentials for this Country Code">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteCard(countryCode, countryCredentials)}
                                                            disabled={deleteMutation.isLoading}
                                                            sx={{
                                                                color: RED_COLOR,
                                                                p: 0.75,
                                                                '&:hover': { backgroundColor: alpha(RED_COLOR, 0.1) },
                                                            }}
                                                        >
                                                            {isDeleting ? (
                                                                <CircularProgress size={16} sx={{ color: RED_COLOR }} />
                                                            ) : (
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            }
                                            sx={{ pb: 0.5, px: 2, pt: 1.5 }}
                                        />

                                        <CardContent sx={{ pt: 0.5, px: 2, pb: 1.5 }}>
                                            {uniqueTypes
                                                .filter((type) =>
                                                    countryCredentials.some((cred) => cred.type === type)
                                                )
                                                .map((type, index, arr) => {
                                                    const typeCredentials = countryCredentials.filter(
                                                        (cred) => cred.type === type
                                                    );
                                                    const typeColor = getTypeColor(true);
                                                    const typeBg = getTypeBackground(true);
                                                    const typeBorder = getTypeBorder(true);
                                                    const typeCount = typeCredentials.length;

                                                    return (
                                                        <Box key={type}>
                                                            <Box
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="space-between"
                                                                py={0.75}
                                                                px={1}
                                                                sx={{
                                                                    borderRadius: 1.5,
                                                                    backgroundColor: alpha(typeColor, 0.05),
                                                                    border: `1px solid ${alpha(typeColor, 0.1)}`,
                                                                    my: 0.5,
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Chip
                                                                        label={type}
                                                                        size="small"
                                                                        sx={{
                                                                            fontSize: '0.68rem',
                                                                            height: 20,
                                                                            backgroundColor: typeBg,
                                                                            color: typeColor,
                                                                            border: `1px solid ${typeBorder}`,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    />
                                                                    <Box
                                                                        sx={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            minWidth: 28,
                                                                            height: 22,
                                                                            borderRadius: '6px',
                                                                            backgroundColor: alpha(typeColor, 0.15),
                                                                            border: `1px solid ${alpha(typeColor, 0.3)}`,
                                                                            px: 0.75,
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            fontWeight={700}
                                                                            sx={{ fontSize: '0.75rem', color: typeColor, lineHeight: 1 }}
                                                                        >
                                                                            {typeCount}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                <Tooltip title={`Download Type ${type}`}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDownload(countryCredentials, type)}
                                                                        sx={{
                                                                            color: typeColor,
                                                                            p: 0.5,
                                                                            '&:hover': { backgroundColor: alpha(typeColor, 0.12) },
                                                                        }}
                                                                    >
                                                                        <DownloadIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>

                                                            {index < arr.length - 1 && (
                                                                <Divider sx={{ opacity: 0.25, my: 0.25 }} />
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                                showFirstButton
                                showLastButton
                                sx={{ '& .MuiPaginationItem-root': { fontSize: '0.85rem' } }}
                            />
                        </Box>
                    )}

                    <Box mt={1.5} display="flex" justifyContent="center">
                        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: alpha(TEXT_PRIMARY, 0.55) }}>
                            Showing {(page - 1) * CARDS_PER_PAGE + 1}–
                            {Math.min(page * CARDS_PER_PAGE, allEntries.length)} of{' '}
                            {allEntries.length} Country Code{allEntries.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </>
            )}

            <Dialog
                open={!!deleteTarget}
                onClose={() => !deleteMutation.isLoading && setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2.5 } }}
            >
                <DialogTitle
                    sx={{
                        color: RED_COLOR,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2,
                        px: 3,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                        Confirm Delete
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <DialogContentText sx={{ fontSize: '0.875rem', color: TEXT_PRIMARY }}>
                        Are you sure you want to delete all{' '}
                        <strong>
                            {deleteTarget?.count} credential
                            {deleteTarget?.count !== 1 ? 's' : ''}
                        </strong>{' '}
                        for <strong>Country Code {deleteTarget?.countryCode}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    <OutlineButton
                        onClick={() => setDeleteTarget(null)}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                        disabled={deleteMutation.isLoading}
                    >
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        onClick={handleDeleteConfirm}
                        disabled={deleteMutation.isLoading}
                        startIcon={
                            deleteMutation.isLoading ? (
                                <CircularProgress size={15} sx={{ color: 'white' }} />
                            ) : (
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                            )
                        }
                        sx={{
                            background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED_COLOR} 100%)`,
                            color: 'white',
                            borderRadius: 1.5,
                            px: 2.5,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${RED_COLOR} 0%, #b91c1c 100%)`,
                            },
                        }}
                    >
                        {deleteMutation.isLoading ? 'Deleting…' : 'Delete All'}
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
                    elevation={4}
                    sx={{
                        width: '100%',
                        borderRadius: 1.5,
                        backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.06),
                        borderLeft: `3px solid ${GREEN_COLOR}`,
                        '& .MuiAlert-icon': { color: GREEN_COLOR, fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 2,
                    }}
                >
                    <Typography fontWeight={600} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                        {success}
                    </Typography>
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
                    elevation={4}
                    sx={{
                        width: '100%',
                        borderRadius: 1.5,
                        backgroundColor: alpha(RED_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.06),
                        borderLeft: `3px solid ${RED_COLOR}`,
                        '& .MuiAlert-icon': { color: RED_COLOR, fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                        color: TEXT_PRIMARY,
                        py: 0.5,
                        px: 2,
                    }}
                >
                    <Typography fontWeight={600} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                        {error}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}