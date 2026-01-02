import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Tooltip,
    alpha,
    TablePagination,
} from '@mui/material';
import {
    Person as PersonIcon,
    Search as SearchIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import StyledTextField from '../../components/ui/StyledTextField';
import { Helmet } from 'react-helmet-async';

// Define color constants
const BLUE_COLOR = '#76AADA';
const BLUE_LIGHT = '#A8C9E9';
const BLUE_DARK = '#5A8FC8';
const RED_COLOR = '#ef4444';
const RED_DARK = '#dc2626';
const GREEN_COLOR = '#10b981';
const GREEN_DARK = '#059669';

export const TechUserManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['tech-users'],
        queryFn: async () => {
            const response = await axiosInstance.get('/users/tech');
            return response.data.data || response.data.users || response.data;
        },
    });

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    // Pagination logic
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredUsers, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getRoleStyle = (role) => {
        return {
            backgroundColor: alpha(GREEN_COLOR, 0.1),
            color: GREEN_DARK,
            borderColor: GREEN_COLOR,
        };
    };

    const getStatusStyle = (isActive) => {
        if (isActive) {
            return {
                backgroundColor: alpha(GREEN_COLOR, 0.1),
                color: GREEN_DARK,
                borderColor: GREEN_COLOR,
            };
        } else {
            return {
                backgroundColor: alpha(RED_COLOR, 0.1),
                color: RED_DARK,
                borderColor: RED_COLOR,
            };
        }
    };

    const getStatusLabel = (isActive) => {
        return isActive ? 'Active' : 'Inactive';
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress sx={{ color: BLUE_COLOR }} />
            </Box>
        );
    }

    return (
        <Box>
            <Helmet>
                <title>Tech Users | Sterling Septic & Plumbing LLC</title>
                <meta name="description" content="View all tech users" />
            </Helmet>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: 20,
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Tech Users
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View all technical users in the system
                    </Typography>
                </Box>
            </Box>

            {/* Search Bar */}
            <Box mb={3}>
                <StyledTextField
                    fullWidth
                    placeholder="Search tech users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: BLUE_COLOR }} />,
                    }}
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                                borderColor: BLUE_COLOR,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: BLUE_COLOR,
                            },
                        },
                    }}
                />
            </Box>

            <TableContainer
                component={Paper}
                elevation={1}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha('#000', 0.08)}`,
                    overflow: 'hidden',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(BLUE_COLOR, 0.05),
                        }}>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: BLUE_DARK,
                                borderBottom: `2px solid ${BLUE_COLOR}`,
                            }}>
                                Name
                            </TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: BLUE_DARK,
                                borderBottom: `2px solid ${BLUE_COLOR}`,
                            }}>
                                Email
                            </TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: BLUE_DARK,
                                borderBottom: `2px solid ${BLUE_COLOR}`,
                            }}>
                                Role
                            </TableCell>
                            <TableCell sx={{
                                fontWeight: 600,
                                color: BLUE_DARK,
                                borderBottom: `2px solid ${BLUE_COLOR}`,
                            }}>
                                Status
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Box py={4}>
                                        <PersonIcon sx={{ fontSize: 48, color: alpha('#000', 0.1), mb: 2 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery ? 'No tech users found matching your search.' : 'No tech users found.'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUsers.map((user) => (
                                <TableRow
                                    key={user._id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: alpha(BLUE_COLOR, 0.03),
                                        },
                                        '&:last-child td': {
                                            borderBottom: 0,
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Box sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, ${BLUE_COLOR} 100%)`,
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                            }}>
                                                {user.name?.charAt(0).toUpperCase()}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {user._id?.substring(0, 8)}...
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label="TECH"
                                            size="small"
                                            sx={{
                                                fontWeight: 500,
                                                ...getRoleStyle(user.role),
                                                '& .MuiChip-label': {
                                                    px: 1.5,
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(user.isActive)}
                                            size="small"
                                            variant="outlined"
                                            icon={user.isActive ?
                                                <CheckCircleIcon sx={{ fontSize: 16 }} /> :
                                                <BlockIcon sx={{ fontSize: 16 }} />
                                            }
                                            sx={{
                                                fontWeight: 500,
                                                ...getStatusStyle(user.isActive),
                                                '& .MuiChip-label': {
                                                    px: 1.5,
                                                },
                                            }}
                                        />
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
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid ${alpha('#000', 0.1)}`,
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                        },
                        '& .MuiTablePagination-actions': {
                            '& .MuiIconButton-root': {
                                '&:hover': {
                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                },
                            },
                        },
                        '& .MuiSelect-select': {
                            padding: '6px 32px 6px 12px',
                        },
                    }}
                />
            </TableContainer>
        </Box>
    );
};