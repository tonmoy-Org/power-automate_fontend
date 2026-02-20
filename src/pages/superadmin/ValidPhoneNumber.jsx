import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
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
} from '@mui/material';
import {
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import StyledTextField from '../../components/ui/StyledTextField';
import { Helmet } from 'react-helmet-async';

const CARDS_PER_PAGE = 9;

const fetchPhoneCredentials = async () => {
    const response = await axiosInstance.get('/phone-credentials');
    return response.data;
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

export default function ValidPhoneNumber() {
    const theme = useTheme();

    const BLUE_COLOR = theme.palette.primary.main;
    const RED_COLOR = theme.palette.error.main;
    const GREEN_COLOR = theme.palette.success.main;
    const WARNING_COLOR = theme.palette.warning.main;
    const WARNING_DARK = theme.palette.warning.dark;
    const TEXT_PRIMARY = theme.palette.text.primary;
    const GREY_COLOR = theme.palette.grey[500];

    const [searchQuery, setSearchQuery] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);

    const {
        data: credentials,
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['phoneCredentials'],
        queryFn: fetchPhoneCredentials,
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

    const getTypeColor = (type, hasType) => {
        if (!hasType) return GREY_COLOR;
        switch (type) {
            case 'A':
                return GREEN_COLOR;
            case 'B':
                return BLUE_COLOR;
            case 'C':
                return WARNING_COLOR;
            default:
                return BLUE_COLOR;
        }
    };

    const getTypeBackground = (type, hasType) => {
        if (!hasType) return alpha(GREY_COLOR, 0.1);
        switch (type) {
            case 'A':
                return alpha(GREEN_COLOR, 0.1);
            case 'B':
                return alpha(BLUE_COLOR, 0.1);
            case 'C':
                return alpha(WARNING_COLOR, 0.1);
            default:
                return alpha(BLUE_COLOR, 0.1);
        }
    };

    const getTypeBorder = (type, hasType) => {
        if (!hasType) return alpha(GREY_COLOR, 0.2);
        switch (type) {
            case 'A':
                return alpha(GREEN_COLOR, 0.3);
            case 'B':
                return alpha(BLUE_COLOR, 0.3);
            case 'C':
                return alpha(WARNING_COLOR, 0.3);
            default:
                return alpha(BLUE_COLOR, 0.3);
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
                        {paginatedEntries.map(([paId, paCredentials]) => (
                            <Grid item xs={12} sm={6} md={6} key={paId}>
                                <Card
                                    elevation={2}
                                    sx={{
                                        height: '100%',
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
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
                                                                        fontSize: '0.85rem',
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
                        ))}
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
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '0.85rem',
                                    },
                                }}
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