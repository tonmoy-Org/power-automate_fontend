import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
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
    CircularProgress,
    Switch,
    FormControlLabel,
    Tooltip,
    DialogContentText,
    alpha,
    TablePagination,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Search as SearchIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import GradientButton from '../../components/ui/GradientButton';
import OutlineButton from '../../components/ui/OutlineButton';
import StyledTextField from '../../components/ui/StyledTextField';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../auth/AuthProvider';

export const UserManagement = () => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const { user: currentUser } = useAuth();

    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark;
    const RED_COLOR = theme.palette.error.main;
    const RED_DARK = theme.palette.error.dark;
    const GREEN_COLOR = theme.palette.success.main;
    const TEXT_PRIMARY = theme.palette.text.primary;

    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToToggle, setUserToToggle] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'member',
        isActive: true,
    });

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await axiosInstance.get('/users');
            return response.data.users || response.data.data || response.data;
        },
    });

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.role?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredUsers, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const createUserMutation = useMutation({
        mutationFn: async (userData) => {
            const response = await axiosInstance.post('/users/register', userData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSuccess('User created successfully');
            setOpenDialog(false);
            resetForm();
            setPage(0);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to create user');
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.delete(`/users/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSuccess('User deleted successfully');
            setOpenDeleteDialog(false);
            setUserToDelete(null);
            if (paginatedUsers.length === 1 && page > 0) {
                setPage(page - 1);
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to delete user');
            setOpenDeleteDialog(false);
            setUserToDelete(null);
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, userData }) => {
            const response = await axiosInstance.put(`/users/${userId}`, userData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSuccess('User updated successfully');
            setOpenDialog(false);
            resetForm();
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to update user');
        },
    });

    const toggleUserStatusMutation = useMutation({
        mutationFn: async (userId) => {
            const response = await axiosInstance.patch(`/users/${userId}/toggle-status`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSuccess('User status updated successfully');
            setOpenStatusDialog(false);
            setUserToToggle(null);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to update user status');
            setOpenStatusDialog(false);
            setUserToToggle(null);
        },
    });

    const handleOpenDialog = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                role: user.role || 'member',
                isActive: user.isActive !== undefined ? user.isActive : true,
            });
        } else {
            resetForm();
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
        resetForm();
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            deleteUserMutation.mutate(userToDelete._id);
        }
    };

    const handleToggleStatusClick = (user) => {
        setUserToToggle(user);
        setOpenStatusDialog(true);
    };

    const handleToggleStatusConfirm = () => {
        if (userToToggle) {
            toggleUserStatusMutation.mutate(userToToggle._id);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'member',
            isActive: true,
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (e) => {
        setFormData(prev => ({ ...prev, isActive: e.target.checked }));
    };

    const handleSubmit = () => {
        if (selectedUser) {
            const updateData = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }
            updateUserMutation.mutate({ userId: selectedUser._id, userData: updateData });
        } else {
            createUserMutation.mutate(formData);
        }
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'superadmin':
                return {
                    backgroundColor: alpha(RED_COLOR, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                    color: RED_COLOR,
                    borderColor: RED_COLOR,
                };
            case 'member':
                return {
                    backgroundColor: alpha(BLUE_COLOR, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                    color: BLUE_COLOR,
                    borderColor: BLUE_COLOR,
                };
            case 'client':
                return {
                    backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                    color: GREEN_COLOR,
                    borderColor: GREEN_COLOR,
                };
            default:
                return {};
        }
    };

    const getStatusStyle = (isActive) => ({
        backgroundColor: alpha(isActive ? GREEN_COLOR : RED_COLOR, theme.palette.mode === 'dark' ? 0.2 : 0.1),
        color: isActive ? GREEN_COLOR : RED_COLOR,
        borderColor: isActive ? GREEN_COLOR : RED_COLOR,
    });

    const getStatusLabel = (isActive) => isActive ? 'Active' : 'Inactive';

    const isCurrentUser = (userId) => currentUser?.id === userId;

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
                <title>User Management | Power Automate</title>
            </Helmet>

            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
                <Box>
                    <Typography sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}>
                        User Management
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: TEXT_PRIMARY }}>
                        Manage users, assign roles, and control access
                    </Typography>
                </Box>
                <GradientButton
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                    onClick={() => handleOpenDialog()}
                    size="small"
                    sx={{ fontSize: '0.8rem', py: 0.6, px: 1.5, height: 36 }}
                    disabled={createUserMutation.isPending}
                >
                    Add User
                </GradientButton>
            </Box>

            <Box mb={3}>
                <StyledTextField
                    fullWidth
                    placeholder="Search users by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: TEXT_PRIMARY, fontSize: '0.9rem', opacity: 0.7 }} />,
                    }}
                    size="small"
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', color: TEXT_PRIMARY } }}
                />
            </Box>

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    overflow: 'auto',
                    minHeight: 400,
                }}
            >
                <Table size="medium">
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(BLUE_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05)
                        }}>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `2px solid ${BLUE_COLOR}`, fontSize: '0.85rem', py: 1.5 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Box py={3}>
                                        <PersonIcon sx={{ fontSize: 48, color: alpha(TEXT_PRIMARY, 0.2), mb: 2 }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                            {searchQuery ? 'No users found matching your search' : 'No users found. Add one to get started'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUsers.map((user) => {
                                const isOwnAccount = isCurrentUser(user._id);
                                return (
                                    <TableRow
                                        key={user._id}
                                        hover
                                        sx={{
                                            '&:hover': { backgroundColor: alpha(BLUE_COLOR, theme.palette.mode === 'dark' ? 0.05 : 0.03) },
                                            '&:last-child td': { borderBottom: 0 },
                                            opacity: (deleteUserMutation.isPending && userToDelete?._id === user._id) ? 0.5 : 1,
                                        }}
                                    >
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Box sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: `linear-gradient(135deg, ${BLUE_COLOR} 0%, ${BLUE_DARK} 100%)`,
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                }}>
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                                        {user.name}
                                                        {isOwnAccount && (
                                                            <Chip
                                                                label="You"
                                                                size="small"
                                                                sx={{
                                                                    ml: 1,
                                                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                                    color: BLUE_COLOR,
                                                                    fontSize: '0.65rem',
                                                                    height: 18,
                                                                }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: alpha(TEXT_PRIMARY, 0.7) }}>
                                                        ID: {user._id?.substring(0, 8)}...
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={user.role.toUpperCase()}
                                                size="small"
                                                sx={{
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                    height: 24,
                                                    ...getRoleStyle(user.role),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={getStatusLabel(user.isActive)}
                                                size="small"
                                                variant="outlined"
                                                icon={user.isActive ?
                                                    <CheckCircleIcon sx={{ fontSize: '0.75rem' }} /> :
                                                    <BlockIcon sx={{ fontSize: '0.75rem' }} />
                                                }
                                                sx={{
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                    height: 24,
                                                    ...getStatusStyle(user.isActive),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5 }}>
                                            <Tooltip title={isOwnAccount ? "Cannot edit your own account" : "Edit User"}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(user)}
                                                        disabled={isOwnAccount}
                                                        sx={{ color: BLUE_COLOR, fontSize: '0.9rem', mr: 0.5 }}
                                                    >
                                                        <EditIcon fontSize="inherit" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={isOwnAccount ? "Cannot change your own status" : (user.isActive ? "Deactivate User" : "Activate User")}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleStatusClick(user)}
                                                        disabled={isOwnAccount}
                                                        sx={{
                                                            color: user.isActive ? RED_COLOR : GREEN_COLOR,
                                                            fontSize: '0.9rem',
                                                            mr: 0.5,
                                                        }}
                                                    >
                                                        {user.isActive ?
                                                            <BlockIcon fontSize="inherit" /> :
                                                            <CheckCircleIcon fontSize="inherit" />
                                                        }
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={isOwnAccount ? "Cannot delete your own account" : "Delete User"}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={isOwnAccount}
                                                        sx={{ color: RED_COLOR, fontSize: '0.9rem' }}
                                                    >
                                                        <DeleteIcon fontSize="inherit" />
                                                    </IconButton>
                                                </span>
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
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.8rem',
                            color: TEXT_PRIMARY,
                        },
                    }}
                />
            </TableContainer>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
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
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <StyledTextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            size="small"
                            placeholder="Enter full name"
                        />
                        <StyledTextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            size="small"
                            placeholder="Enter email address"
                        />
                        <StyledTextField
                            fullWidth
                            label={selectedUser ? 'Password (leave blank to keep current)' : 'Password'}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            size="small"
                            placeholder={selectedUser ? 'Enter new password' : 'Enter password'}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: '0.85rem' }}>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                label="Role"
                                sx={{ fontSize: '0.85rem' }}
                            >
                                <MenuItem value="member" sx={{ fontSize: '0.85rem' }}>Member</MenuItem>
                                <MenuItem value="superadmin" sx={{ fontSize: '0.85rem' }}>Admin</MenuItem>
                                <MenuItem value="client" sx={{ fontSize: '0.85rem' }}>Client</MenuItem>
                            </Select>
                        </FormControl>
                        {selectedUser && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={handleSwitchChange}
                                        name="isActive"
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>
                                        Active
                                    </Typography>
                                }
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton
                        onClick={handleCloseDialog}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                        disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={
                            createUserMutation.isPending ||
                            updateUserMutation.isPending ||
                            !formData.name ||
                            !formData.email ||
                            (!selectedUser && !formData.password)
                        }
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                    >
                        {createUserMutation.isPending || updateUserMutation.isPending ? (
                            <CircularProgress size={18} sx={{ color: 'white' }} />
                        ) : (
                            selectedUser ? 'Update' : 'Create'
                        )}
                    </GradientButton>
                </DialogActions>
            </Dialog>

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
                        Are you sure you want to delete the user <strong>"{userToDelete?.name}"</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton
                        onClick={() => setOpenDeleteDialog(false)}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                        disabled={deleteUserMutation.isPending}
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
                        startIcon={deleteUserMutation.isPending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <DeleteIcon sx={{ fontSize: '0.9rem' }} />}
                        size="medium"
                        disabled={deleteUserMutation.isPending}
                    >
                        {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openStatusDialog}
                onClose={() => setOpenStatusDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{
                    color: userToToggle?.isActive ? RED_COLOR : GREEN_COLOR,
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2,
                    px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        {userToToggle?.isActive ?
                            <BlockIcon sx={{ fontSize: '1.1rem' }} /> :
                            <CheckCircleIcon sx={{ fontSize: '1.1rem' }} />
                        }
                        Confirm Status Change
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <DialogContentText sx={{ fontSize: '0.9rem', color: TEXT_PRIMARY }}>
                        Are you sure you want to {userToToggle?.isActive ? 'deactivate' : 'activate'}
                        the user <strong>"{userToToggle?.name}"</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <OutlineButton
                        onClick={() => setOpenStatusDialog(false)}
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                        disabled={toggleUserStatusMutation.isPending}
                    >
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        variant="contained"
                        onClick={handleToggleStatusConfirm}
                        disabled={toggleUserStatusMutation.isPending}
                        startIcon={toggleUserStatusMutation.isPending ?
                            <CircularProgress size={18} sx={{ color: 'white' }} /> :
                            (userToToggle?.isActive ? <BlockIcon sx={{ fontSize: '0.9rem' }} /> : <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />)
                        }
                        size="medium"
                        sx={{ fontSize: '0.85rem', px: 2 }}
                    >
                        {toggleUserStatusMutation.isPending ? 'Updating...' :
                            userToToggle?.isActive ? 'Deactivate' : 'Activate'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" sx={{
                    width: '100%',
                    borderRadius: 1,
                    backgroundColor: alpha(GREEN_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    borderLeft: `3px solid ${GREEN_COLOR}`,
                    '& .MuiAlert-icon': { color: GREEN_COLOR, fontSize: '1rem' },
                    '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                    color: TEXT_PRIMARY,
                    py: 0.5,
                    px: 2,
                }} elevation={4}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{success}</Typography>
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" sx={{
                    width: '100%',
                    borderRadius: 1,
                    backgroundColor: alpha(RED_COLOR, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    borderLeft: `3px solid ${RED_COLOR}`,
                    '& .MuiAlert-icon': { color: RED_COLOR, fontSize: '1rem' },
                    '& .MuiAlert-message': { fontSize: '0.85rem', py: 0.5 },
                    color: TEXT_PRIMARY,
                    py: 0.5,
                    px: 2,
                }} elevation={4}>
                    <Typography fontWeight={500} sx={{ fontSize: '0.85rem', color: TEXT_PRIMARY }}>{error}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
};