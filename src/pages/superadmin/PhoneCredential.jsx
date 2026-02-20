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
} from '@mui/material';
import {
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import StyledTextField from '../../components/ui/StyledTextField';
import { Helmet } from 'react-helmet-async';

const CARDS_PER_PAGE = 9;

// API function
const fetchPhoneCredentials = async () => {
    const response = await axiosInstance.get('/phone-credentials');
    return response.data;
};

// Group credentials by pa_id
const groupByPaId = (credentials) => {
    return credentials.reduce((groups, credential) => {
        const paId = credential.pa_id;
        if (!groups[paId]) groups[paId] = [];
        groups[paId].push(credential);
        return groups;
    }, {});
};

// Download text file
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

// Generate phone:password content for specific type
const generateTypeContent = (credentials, type) => {
    return credentials
        .filter((cred) => cred.type === type)
        .map((cred) => `${cred.phone}:${cred.password}`)
        .join('\n');
};

export default function PhoneCredential() {
    const theme = useTheme();

    // Theme colors
    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark || theme.palette.error.main;
    const GREEN_COLOR = theme.palette.success.main;
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

    const statistics = useMemo(() => {
        if (!credentials) return { totalPaIds: 0, totalCredentials: 0, typeCounts: {} };
        const totalCredentials = credentials.length;
        const totalPaIds = Object.keys(groupByPaId(credentials)).length;
        const typeCounts = uniqueTypes.reduce((acc, type) => {
            acc[type] = credentials.filter((cred) => cred.type === type).length;
            return acc;
        }, {});
        return { totalPaIds, totalCredentials, typeCounts };
    }, [credentials, uniqueTypes]);

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

    // Paginated entries
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

    // Reset to page 1 when search changes
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

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography>Loading credentials...</Typography>
            </Box>
        );
    }

    if (queryError) {
        return (
            <Alert severity="error">
                Error loading credentials: {queryError?.message || 'Unknown error'}
            </Alert>
        );
    }

    const hasData = paginatedEntries.length > 0;

    return (
        <Box sx={{ p: 0.5 }}>
            <Helmet>
                <title> Phone Credentials | Power Automate</title>
                <meta name="description" content="SuperAdmin dashboard" />
            </Helmet>
            {/* Header */}
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
                    Phone Credentials
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                    Manage and download phone credentials grouped by PA ID
                </Typography>
            </Box>
            {/* Search */}
            <Box mb={3}>
                <StyledTextField
                    placeholder="Search by PA ID, phone, or type..."
                    value={searchQuery}
                    onChange={handleSearch}
                    size="small"
                    fullWidth
                    sx={{
                        maxWidth: 400,
                        '& .MuiInputBase-input': {
                            fontSize: '0.8rem',
                            color: TEXT_PRIMARY,
                        },
                    }}
                />
            </Box>

            {/* Cards Grid */}
            {!hasData ? (
                <Alert severity="info">
                    {searchQuery
                        ? 'No credentials found matching your search.'
                        : 'No credentials available.'}
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
                                        borderRadius: 3,
                                        border: `1px solid ${alpha(BLUE_COLOR, 0.15)}`,
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': {
                                            boxShadow: `0 4px 10px ${alpha(BLUE_COLOR, 0.15)}`,
                                        },
                                    }}
                                >
                                    <CardHeader
                                        title={
                                            <Typography variant="subtitle1" fontWeight={600} noWrap>
                                                ID: {paId}
                                            </Typography>
                                        }
                                        subheader={
                                            <Typography variant="body2" color="text.secondary">
                                                {paCredentials.length} credential
                                                {paCredentials.length !== 1 ? 's' : ''}
                                            </Typography>
                                        }
                                        sx={{ pb: 1 }}
                                    />

                                    <CardContent sx={{ pt: 0 }}>
                                        {uniqueTypes.map((type, index) => {
                                            const typeCredentials = paCredentials.filter(
                                                (cred) => cred.type === type
                                            );
                                            const hasType = typeCredentials.length > 0;

                                            return (
                                                <Box key={type}>
                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        py={1}
                                                    >
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Chip
                                                                label={`Type: ${type}`}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.75rem',
                                                                    height: 24,
                                                                    backgroundColor: hasType
                                                                        ? alpha(GREEN_COLOR, 0.1)
                                                                        : alpha(GREY_COLOR, 0.1),
                                                                    color: hasType ? GREEN_COLOR : GREY_COLOR,
                                                                    border: `1px solid ${hasType
                                                                        ? alpha(GREEN_COLOR, 0.3)
                                                                        : alpha(GREY_COLOR, 0.2)
                                                                        }`,
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                color={hasType ? 'text.secondary' : GREY_COLOR}
                                                            >
                                                                {hasType
                                                                    ? `${typeCredentials.length} credential${typeCredentials.length !== 1 ? 's' : ''}`
                                                                    : 'No credentials'}
                                                            </Typography>
                                                        </Box>

                                                        {hasType && (
                                                            <Box display="flex" gap={0.5}>
                                                                <Tooltip title={`Download Type ${type}`}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() =>
                                                                            handleDownload(paCredentials, type)
                                                                        }
                                                                        sx={{
                                                                            color: GREEN_COLOR,
                                                                            p: 0.75,
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                                            },
                                                                        }}
                                                                    >
                                                                        <DownloadIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
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

                    {/* Pagination */}
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
                            />
                        </Box>
                    )}

                    <Box mt={1} display="flex" justifyContent="center">
                        <Typography variant="caption" color="text.secondary">
                            Showing {(page - 1) * CARDS_PER_PAGE + 1}–
                            {Math.min(page * CARDS_PER_PAGE, allEntries.length)} of{' '}
                            {allEntries.length} PA IDs
                        </Typography>
                    </Box>
                </>
            )}

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}