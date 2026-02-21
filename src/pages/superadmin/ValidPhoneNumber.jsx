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
        params: { limit: 1000 }
    });
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
};

// Delete each credential by its own MongoDB _id
const deleteCredentialsByIds = async (ids) => {
    await Promise.all(ids.map((id) => axiosInstance.delete(`/phone-credentials/${id}`)));
};

const groupByPaId = (credentials) => {
    return credentials.reduce((groups, credential) => {
        const paId = credential.pa_id;
        if (!groups[paId]) groups[paId] = [];
        groups[paId].push(credential);
        return groups;
    }, {});
};

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

const generateTypeContent = (credentials, type) => {
    return credentials
        .filter((cred) => cred.type === type)
        .map((cred) => `${cred.phone}:${cred.password}`)
        .join('\n');
};

const generateAllContent = (credentials, types) => {
    return types
        .map((type) => {
            const lines = generateTypeContent(credentials, type);
            return lines ? `=== Type ${type} ===\n${lines}` : null;
        })
        .filter(Boolean)
        .join('\n\n');
};

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
    const [deleteTarget, setDeleteTarget] = useState(null); // { paId, ids, count }

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
            setSuccess(`All credentials for ${deleteTarget?.paId} deleted successfully`);
            setDeleteTarget(null);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to delete credentials');
            setDeleteTarget(null);
        }
    });

    const uniqueTypes = useMemo(() => {
        if (!credentials || credentials.length === 0) return ['A', 'B', 'C'];
        return [...new Set(credentials.map((cred) => cred.type))].sort();
    }, [credentials]);

    const filteredAndGroupedCredentials = useMemo(() => {
        if (!credentials) return {};
        let filtered = credentials;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = credentials.filter(
                (cred) =>
                    cred.pa_id?.toLowerCase().includes(query) ||
                    cred.phone?.toLowerCase().includes(query) ||
                    cred.type?.toLowerCase().includes(query)
            );
        }
        return groupByPaId(filtered);
    }, [credentials, searchQuery]);

    const allEntries = Object.entries(filteredAndGroupedCredentials);
    const totalPages = Math.ceil(allEntries.length / CARDS_PER_PAGE);
    const paginatedEntries = allEntries.slice(
        (page - 1) * CARDS_PER_PAGE,
        page * CARDS_PER_PAGE
    );

    const handlePageChange = (_, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleDownload = (paCredentials, type) => {
        try {
            const content = generateTypeContent(paCredentials, type);
            if (content) {
                const paId = paCredentials[0]?.pa_id || 'unknown';
                downloadTxtFile(content, `${paId}_type_${type}.txt`);
                setSuccess(`Downloaded Type ${type} credentials for PA ID: ${paId}`);
            }
        } catch (err) {
            setError('Failed to download file');
        }
    };

    const handleDownloadAll = (paCredentials) => {
        try {
            const paId = paCredentials[0]?.pa_id || 'unknown';
            const content = generateAllContent(paCredentials, uniqueTypes);
            if (content) {
                downloadTxtFile(content, `${paId}_all_credentials.txt`);
                setSuccess(`Downloaded all credentials for PA ID: ${paId}`);
            } else {
                setError('No credentials to download');
            }
        } catch (err) {
            setError('Failed to download file');
        }
    };

    // Collect all _id values from the card and store them for confirmation
    const handleDeleteCard = (paId, paCredentials) => {
        const ids = paCredentials.map((c) => c._id);
        setDeleteTarget({ paId, ids, count: ids.length });
    };

    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.ids);
        }
    };

    const getTypeColor = (type, hasType) => {
        if (!hasType) return GREY_COLOR;
        switch (type) {
            case 'A': return GREEN_COLOR;
            case 'B': return BLUE_COLOR;
            case 'C': return WARNING_COLOR;
            default: return BLUE_COLOR;
        }
    };

    const getTypeBackground = (type, hasType) => {
        if (!hasType) return alpha(GREY_COLOR, 0.1);
        switch (type) {
            case 'A': return alpha(GREEN_COLOR, 0.1);
            case 'B': return alpha(BLUE_COLOR, 0.1);
            case 'C': return alpha(WARNING_COLOR, 0.1);
            default: return alpha(BLUE_COLOR, 0.1);
        }
    };

    const getTypeBorder = (type, hasType) => {
        if (!hasType) return alpha(GREY_COLOR, 0.2);
        switch (type) {
            case 'A': return alpha(GREEN_COLOR, 0.3);
            case 'B': return alpha(BLUE_COLOR, 0.3);
            case 'C': return alpha(WARNING_COLOR, 0.3);
            default: return alpha(BLUE_COLOR, 0.3);
        }
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
                <Typography sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    background: `linear-gradient(135deg, ${WARNING_DARK} 0%, ${WARNING_COLOR} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Valid Phone & Password
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                    Manage and download phone credentials grouped by PA ID
                </Typography>
            </Box>

            <Box mb={3}>
                <StyledTextField
                    placeholder="Search by PA ID, phone, or type..."
                    value={searchQuery}
                    onChange={handleSearch}
                    size="small"
                    fullWidth
                    sx={{
                        '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY },
                    }}
                />
            </Box>

            {!hasData ? (
                <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                    {searchQuery
                        ? 'No credentials found matching your search'
                        : 'No credentials available'}
                </Alert>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {paginatedEntries.map(([paId, paCredentials]) => {
                            const isDeleting = deleteMutation.isLoading && deleteTarget?.paId === paId;
                            return (
                                <Grid item xs={12} sm={6} md={6} key={paId}>
                                    <Card
                                        elevation={2}
                                        sx={{
                                            height: '100%',
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.divider}`,
                                            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                                            opacity: isDeleting ? 0.5 : 1,
                                            '&:hover': {
                                                boxShadow: `0 4px 10px ${alpha(WARNING_COLOR, 0.15)}`,
                                            },
                                        }}
                                    >
                                        <CardHeader
                                            title={
                                                <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                                                    PA ID: {paId}
                                                </Typography>
                                            }
                                            subheader={
                                                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT_PRIMARY, 0.7) }}>
                                                    {paCredentials.length} credential{paCredentials.length !== 1 ? 's' : ''}
                                                </Typography>
                                            }
                                            action={
                                                <Box display="flex" alignItems="center" gap={0.5} pr={0.5} pt={0.5}>
                                                    <Tooltip title="Download all credentials">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDownloadAll(paCredentials)}
                                                            sx={{
                                                                color: WARNING_COLOR,
                                                                p: 0.75,
                                                                '&:hover': { backgroundColor: alpha(WARNING_COLOR, 0.1) },
                                                            }}
                                                        >
                                                            <DownloadAllIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete all credentials for this PA">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteCard(paId, paCredentials)}
                                                            disabled={deleteMutation.isLoading}
                                                            sx={{
                                                                color: RED_COLOR,
                                                                p: 0.75,
                                                                '&:hover': { backgroundColor: alpha(RED_COLOR, 0.1) },
                                                            }}
                                                        >
                                                            {isDeleting
                                                                ? <CircularProgress size={16} sx={{ color: RED_COLOR }} />
                                                                : <DeleteIcon sx={{ fontSize: 18 }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            }
                                            sx={{ pb: 0.5, px: 2, pt: 1.5 }}
                                        />

                                        <CardContent sx={{ pt: 0, px: 2, pb: 1.5 }}>
                                            {uniqueTypes.map((type, index) => {
                                                const typeCredentials = paCredentials.filter(
                                                    (cred) => cred.type === type
                                                );
                                                const hasType = typeCredentials.length > 0;
                                                const typeColor = getTypeColor(type, hasType);
                                                const typeBg = getTypeBackground(type, hasType);
                                                const typeBorder = getTypeBorder(type, hasType);

                                                return (
                                                    <Box key={type}>
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="space-between"
                                                            py={0.75}
                                                        >
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Chip
                                                                    label={`Type ${type}`}
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: '0.7rem',
                                                                        height: 22,
                                                                        backgroundColor: typeBg,
                                                                        color: typeColor,
                                                                        border: `1px solid ${typeBorder}`,
                                                                        fontWeight: 500,
                                                                    }}
                                                                />
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        fontSize: '0.75rem',
                                                                        color: hasType ? TEXT_PRIMARY : alpha(TEXT_PRIMARY, 0.5)
                                                                    }}
                                                                >
                                                                    {hasType
                                                                        ? `${typeCredentials.length} credential${typeCredentials.length !== 1 ? 's' : ''}`
                                                                        : 'No credentials'}
                                                                </Typography>
                                                            </Box>

                                                            {hasType && (
                                                                <Tooltip title={`Download Type ${type}`}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDownload(paCredentials, type)}
                                                                        sx={{
                                                                            color: typeColor,
                                                                            p: 0.5,
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(typeColor, 0.1),
                                                                            },
                                                                        }}
                                                                    >
                                                                        <DownloadIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>

                                                        {index < uniqueTypes.length - 1 && (
                                                            <Divider sx={{ opacity: 0.5 }} />
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

                    <Box mt={2} display="flex" justifyContent="center">
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(TEXT_PRIMARY, 0.7) }}>
                            Showing {(page - 1) * CARDS_PER_PAGE + 1}–
                            {Math.min(page * CARDS_PER_PAGE, allEntries.length)} of{' '}
                            {allEntries.length} PA ID{allEntries.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteTarget}
                onClose={() => !deleteMutation.isLoading && setDeleteTarget(null)}
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
                        Are you sure you want to delete all{' '}
                        <strong>{deleteTarget?.count} credential{deleteTarget?.count !== 1 ? 's' : ''}</strong>{' '}
                        for <strong>{deleteTarget?.paId}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
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
                            deleteMutation.isLoading
                                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                                : <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        }
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
                    >
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete All'}
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
}