import React from 'react';
import { styled, alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import logo from '../public/logo.svg';
import { ExpandLess, ExpandMore, Menu as MenuIcon, MoreVert } from '@mui/icons-material';
import DashboardFooter from './DashboardFooter';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const drawerWidth = 240;
const closedDrawerWidth = 68;
const mobileDrawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
});

const closedMixin = (theme) => ({
  width: closedDrawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 0.5),
  minHeight: 56,
  flexShrink: 0,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  boxShadow: theme.shadows[1],
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Permanent drawer for desktop
const PermanentDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open
      ? {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      }
      : {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      }),
  })
);

const ScrollableBox = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'transparent',
  },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
});

export default function DashboardLayout({ children, title, menuItems }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [open, setOpen] = React.useState(!isMobile);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerAnchorEl, setDrawerAnchorEl] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [mode, setMode] = React.useState('system');
  const [expandedItems, setExpandedItems] = React.useState({});

  const effectiveMode = mode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : mode;

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: effectiveMode,
          primary: {
            main: '#3964FE',
          },
          background: {
            default: effectiveMode === 'dark' ? '#121212' : '#f8fafc',
            paper: effectiveMode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: effectiveMode === 'dark' ? '#ffffff' : '#0F1115',
            secondary: effectiveMode === 'dark' ? '#b0b0b0' : '#718096',
          },
          divider: effectiveMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
      }),
    [effectiveMode]
  );

  const openMenu = Boolean(anchorEl);
  const openDrawerMenu = Boolean(drawerAnchorEl);

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDrawerMenuClick = (event) => {
    setDrawerAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDrawerAnchorEl(null);
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  // Enhanced route matching logic
  const isRouteActive = (path) => {
    const currentPath = location.pathname;

    // Exact match
    if (currentPath === path) return true;

    // For nested routes
    if (path !== '/superadmin-dashboard' && path !== '/member-dashboard' && path !== '/client-dashboard' && currentPath.startsWith(path + '/')) {
      return true;
    }

    // Special handling for dashboard root
    if (path === '/member-dashboard' && currentPath === '/member-dashboard' && path !== '/client-dashboard') {
      return true;
    }

    // For paths that are direct parent of current path
    if (path !== '/superadmin-dashboard' && path !== '/member-dashboard' && path !== '/client-dashboard' && currentPath === path) {
      return true;
    }

    return false;
  };

  const getActiveStyles = (path) => {
    const isActive = isRouteActive(path);

    if (isActive) {
      return {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
        },
        borderRadius: '0 6px 6px 0',
        transition: 'all 0.15s ease',
        mx: 0.5,
        my: 0.25,
      };
    }

    return {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': {
        color: theme.palette.text.secondary,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.1),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
          color: theme.palette.text.primary,
        },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    };
  };

  const getSubItemActiveStyles = (path) => {
    const isActive = isRouteActive(path);

    if (isActive) {
      return {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderLeft: `2px solid ${theme.palette.primary.main}`,
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
        },
        borderRadius: '0 6px 6px 0',
        transition: 'all 0.15s ease',
        mx: 0,
        my: 0.1,
      };
    }

    return {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': {
        color: theme.palette.text.secondary,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.08),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
          color: theme.palette.text.primary,
        },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0,
      my: 0.1,
    };
  };

  const getDialogTabActiveStyles = (isActive) => {
    if (isActive) {
      return {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
        },
        borderRadius: '0 6px 6px 0',
        transition: 'all 0.15s ease',
        mx: 0.5,
        my: 0.25,
      };
    }

    return {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': {
        color: theme.palette.text.secondary,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.1),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
          color: theme.palette.text.primary,
        },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    };
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    setTabValue(0);
    setModalOpen(true);
  };

  const handleSettings = () => {
    handleMenuClose();
    setTabValue(1);
    setModalOpen(true);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleTabChange = (index) => {
    setTabValue(index);
  };

  const toggleExpand = (itemText) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleItemClick = (item) => {
    // If item has subItems and is expandable, toggle expansion
    if (item.subItems && item.subItems.length > 0 && open) {
      toggleExpand(item.text);
    } else if (item.path) {
      // If it's a regular item with a path, navigate
      handleNavigation(item.path);
    } else if (item.onClick) {
      // If it has a custom onClick handler
      item.onClick();
    }
  };

  // Render enhanced tooltip content for collapsed drawer items
  const renderCollapsedTooltip = (item) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <Box sx={{ py: 0.5, minWidth: 180 }}>
        {/* Main item with clickable link */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: hasSubItems ? 0.5 : 0,
            cursor: 'pointer',
            p: 0.75,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
            }
          }}
          onClick={() => {
            if (item.path) {
              handleNavigation(item.path);
            } else if (item.onClick) {
              item.onClick();
            }
          }}
        >
          <Box sx={{ color: theme.palette.primary.main }}>
            {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: theme.palette.text.primary, lineHeight: 1.2 }}>
              {item.text}
            </Typography>
          </Box>
        </Box>

        {/* Sub items if they exist */}
        {hasSubItems && (
          <Box sx={{
            mt: 0.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 0.5
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {item.subItems.slice(0, 5).map((subItem, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    }
                  }}
                  onClick={() => {
                    if (subItem.path) {
                      handleNavigation(subItem.path);
                    } else if (subItem.onClick) {
                      subItem.onClick();
                    }
                  }}
                >
                  {subItem.icon && (
                    <Box sx={{ color: theme.palette.text.secondary }}>
                      {React.cloneElement(subItem.icon, { sx: { fontSize: 14 } })}
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, lineHeight: 1.2, fontWeight: 500 }}>
                      {subItem.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {item.subItems.length > 5 && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.primary.main, lineHeight: 1.2 }}>
                    +{item.subItems.length - 5} more
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderDrawerContent = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
          color: 'inherit',
        },
        '& .MuiTypography-root': {
          color: 'inherit',
        },
        '& .MuiDivider-root': {
          borderColor: theme.palette.divider,
        },
      }}
    >
      <DrawerHeader>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            width: '100%',
            px: open ? 2 : 1,
          }}
        >
          {open ? (
            <img
              src={logo}
              alt="Logo"
              style={{
                width: '150px',
                height: 'auto',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: '30px',
                  height: 'auto',
                }}
              />
            </Box>
          )}
        </Box>
      </DrawerHeader>

      <ScrollableBox sx={{ py: 0.5, my: 0.5 }}>
        {menuItems?.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {/* Section Header - Only show when drawer is open */}
            {open && section.sectionName && (
              <Box
                sx={{
                  px: 2.5,
                  py: 0.5,
                  mb: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                  }}
                >
                  {section.sectionName}
                </Typography>
              </Box>
            )}

            {/* Section Items */}
            <List sx={{ py: 0.25 }}>
              {section.items.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems[item.text];

                const mainButton = (
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    sx={[
                      getActiveStyles(item.path),
                      {
                        minHeight: 36,
                        flexDirection: open ? 'row' : 'column',
                        justifyContent: open ? 'flex-start' : 'center',
                        alignItems: 'center',
                        gap: open ? 1.5 : 0,
                        px: open ? 2 : 1,
                        py: open ? 0.75 : 0.5,
                        '& .MuiListItemIcon-root': {
                          minWidth: 0,
                          mr: open ? 1.5 : 0,
                          justifyContent: 'center',
                          mt: open ? 0.25 : 0,
                        },
                        '& .MuiListItemText-root': {
                          m: 0,
                        },
                      },
                      hasSubItems && {
                        pr: 1,
                      },
                    ]}
                  >
                    <ListItemIcon>
                      {React.cloneElement(item.icon, {
                        sx: {
                          fontSize: 16,
                          color: isRouteActive(item.path)
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        },
                      })}
                    </ListItemIcon>
                    {open && (
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            color: 'inherit',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '0.01em',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </Box>
                    )}
                    {hasSubItems && open && (
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          ml: 'auto',
                          color: 'inherit',
                          opacity: 0.7,
                          mt: 0.25,
                        }}
                      >
                        {isExpanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                      </ListItemIcon>
                    )}
                  </ListItemButton>
                );

                // Wrap in tooltip for collapsed state
                const wrappedButton = open ? (
                  mainButton
                ) : (
                  <Tooltip
                    title={renderCollapsedTooltip(item)}
                    placement="right"
                    arrow
                    enterDelay={0}
                    leaveDelay={100}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(5px)',
                          boxShadow: 0.5,
                          transition: 'all 0.3s ease',
                          fontSize: '0.7rem',
                          padding: '8px',
                          borderRadius: '8px',
                          color: theme.palette.text.primary,
                          border: `1px solid ${theme.palette.divider}`,
                          maxWidth: 240,
                          cursor: 'default',
                        },
                      },
                      arrow: {
                        sx: {
                          color: theme.palette.background.paper,
                          '&:before': {
                            border: `1px solid ${theme.palette.divider}`,
                          },
                        },
                      },
                    }}
                    PopperProps={{
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 8],
                          },
                        },
                      ],
                    }}
                  >
                    <span style={{ display: 'flex', width: '100%' }}>
                      {mainButton}
                    </span>
                  </Tooltip>
                );

                return (
                  <React.Fragment key={item.text}>
                    <ListItem
                      disablePadding
                      sx={{
                        display: 'block',
                      }}
                    >
                      {wrappedButton}
                    </ListItem>

                    {/* Sub-items in expanded drawer */}
                    {hasSubItems && isExpanded && open && (
                      <Box
                        sx={{
                          borderRadius: '0 0 6px 6px',
                          ml: 3,
                          mr: 0.5,
                          mb: 0.25,
                        }}
                      >
                        <List
                          sx={{
                            py: 0.25,
                            pl: 0,
                          }}
                        >
                          {item.subItems.map((subItem) => (
                            <ListItem
                              key={subItem.text}
                              disablePadding
                              sx={{
                                display: 'block',
                              }}
                            >
                              <ListItemButton
                                onClick={() => {
                                  if (subItem.path) {
                                    handleNavigation(subItem.path);
                                  } else if (subItem.onClick) {
                                    subItem.onClick();
                                  }
                                }}
                                sx={[
                                  getSubItemActiveStyles(subItem.path),
                                  {
                                    minHeight: 36,
                                    px: 2,
                                    py: 0.5,
                                    ml: 0.5,
                                    alignItems: 'center',
                                  },
                                ]}
                              >
                                {subItem.icon && (
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 26,
                                      color: theme.palette.primary.main,
                                      opacity: 0.8,
                                      mt: 0.25,
                                    }}
                                  >
                                    {React.cloneElement(subItem.icon, {
                                      sx: { fontSize: 14, color: theme.palette.primary.main, },
                                    })}
                                  </ListItemIcon>
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      fontSize: '0.72rem',
                                      fontWeight: 500,
                                      color: 'inherit',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {subItem.text}
                                  </Typography>
                                </Box>
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </React.Fragment>
        ))}
      </ScrollableBox>

      {/* User info and logout button at bottom */}
      <Box
        sx={{
          p: 1,
          flexShrink: 0,
        }}
      >
        {open ? (
          // Expanded view with user info and menu
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 0.5,
                mb: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'User'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      color: theme.palette.text.secondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || user?.role || 'User'}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={handleDrawerMenuClick}
                sx={{
                  color: theme.palette.text.secondary,
                  width: 26,
                  height: 26,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <MoreVert sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Menu
              anchorEl={drawerAnchorEl}
              open={openDrawerMenu}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  ml: -1,
                  minWidth: 150,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.75rem',
                    py: 0.5,
                    minHeight: 32,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 16,
                      color: theme.palette.text.secondary,
                      mr: 1,
                    },
                  },
                },
              }}
            >
              <MenuItem onClick={handleProfile}>
                <PersonIcon />
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <SettingsIcon />
                Settings
              </MenuItem>
              <Divider sx={{ borderColor: theme.palette.divider, my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#e53e3e' }}>
                <LogoutIcon />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          // Collapsed view - only avatar with menu
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip
              title={
                <Box sx={{ py: 0.5, minWidth: 150 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: theme.palette.text.primary, mb: 0.25, lineHeight: 1.2 }}>
                    {user?.name || 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, lineHeight: 1.2 }}>
                    {user?.email || user?.role || 'User'}
                  </Typography>
                </Box>
              }
              placement="right"
              arrow
              enterDelay={0}
              leaveDelay={100}
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: theme.palette.background.paper,
                    fontSize: '0.7rem',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.shadows[3],
                  },
                },
                arrow: {
                  sx: {
                    color: theme.palette.background.paper,
                    '&:before': {
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  },
                },
              }}
            >
              <IconButton
                onClick={handleDrawerMenuClick}
                sx={{
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={drawerAnchorEl}
              open={openDrawerMenu}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  mt: 0,
                  ml: 1,
                  minWidth: 150,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.75rem',
                    py: 0.5,
                    minHeight: 32,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 16,
                      color: theme.palette.text.secondary,
                      mr: 1,
                    },
                  },
                },
              }}
            >
              <Box sx={{ px: 1, py: 0.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, lineHeight: 1.2 }}>
                  {user?.email || user?.role || 'User'}
                </Typography>
              </Box>
              <MenuItem onClick={handleProfile}>
                <PersonIcon />
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <SettingsIcon />
                Settings
              </MenuItem>
              <Divider sx={{ borderColor: theme.palette.divider, my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#e53e3e' }}>
                <LogoutIcon />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
    </Box>
  );

  const dialogTabs = [
    {
      label: 'Profile',
      icon: <PersonIcon />,
      content: (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.9rem', py: 1.5 }}>Attribute</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.9rem', py: 1.5 }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>Name</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>{user?.name || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>Email</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>{user?.email || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>Role</TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>{user?.role || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ),
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      content: (
        <Box>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>Theme Mode</InputLabel>
            <Select
              size='small'
              value={mode}
              label="Theme Mode"
              onChange={(e) => setMode(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontSize: '0.9rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <MenuItem value="light" sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>Light</MenuItem>
              <MenuItem value="dark" sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>Dark</MenuItem>
              <MenuItem value="system" sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>System</MenuItem>
            </Select>
          </FormControl>
        </Box>
      ),
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CssBaseline />

        {/* AppBar */}
        <AppBar
          position="fixed"
          open={open && !isMobile}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: 0.5,
            transition: 'all 0.3s ease',
          }}
        >
          <Toolbar
            sx={{
              minHeight: 56,
              px: { xs: 1.5, sm: 2.5 },
            }}
          >
            {!isMobile ? (
              <IconButton
                onClick={handleDrawerToggle}
                edge="start"
                sx={{
                  marginLeft: open ? -2 : 4.5,
                  marginRight: 1.5,
                  width: 32,
                  height: 32,
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  },
                }}
              >
                {open ? (
                  theme.direction === 'rtl' ? <ChevronRightIcon sx={{ fontSize: 20 }} /> : <ChevronLeftIcon sx={{ fontSize: 20 }} />
                ) : (
                  theme.direction === 'rtl' ? <ChevronLeftIcon sx={{ fontSize: 20 }} /> : <ChevronRightIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            ) : (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                sx={{
                  mr: 1.5,
                  color: theme.palette.primary.main,
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                Power Automate Dashboard
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  fontSize: { xs: '0.75rem', sm: '0.78rem' },
                  letterSpacing: '0.01em',
                }}
              >
                {title || 'Dashboard'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                avatar={
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: '0.7rem',
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(user?.name)}
                  </Avatar>
                }
                label={user?.name}
                variant="outlined"
                onClick={handleMenuClick}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  color: theme.palette.text.primary,
                  height: 34,
                  cursor: 'pointer',
                  '& .MuiChip-label': {
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    px: 1,
                    py: 0.5,
                  },
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                  },
                  width: 34,
                  height: 34,
                }}
              >
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: '0.7rem',
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                  boxShadow: theme.shadows[3],
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                },
              }}
            >
              <MenuItem sx={{ py: 1.2, px: 2, borderBottom: `1px solid ${theme.palette.divider}` }} disabled>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleProfile} sx={{ py: 0.8, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings} sx={{ py: 0.8, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 0.8, color: '#e53e3e', fontSize: '0.85rem' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: '#e53e3e', fontSize: 18 }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        {isMobile ? (
          <MuiDrawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{
              keepMounted: true,
              disableScrollLock: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: mobileDrawerWidth,
                backgroundColor: theme.palette.background.paper,
                borderRight: `1px solid ${theme.palette.divider}`,
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              },
            }}
          >
            {renderDrawerContent()}
          </MuiDrawer>
        ) : (
          <PermanentDrawer variant="permanent" open={open}>
            {renderDrawerContent()}
          </PermanentDrawer>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <DrawerHeader />

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              py: { xs: 1.2, sm: 1.8 },
              px: { xs: 1, sm: 1.5 },
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              {/* Scrollable content area with minimal scrollbar */}
              <Box
                sx={{
                  flex: 1,
                  p: { xs: 1.2, sm: 1.8 },
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: alpha(theme.palette.background.default, 0.5),
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.palette.action.disabled,
                    borderRadius: '3px',
                    '&:hover': {
                      background: theme.palette.action.disabledBackground,
                    },
                  },
                  // For Firefox
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${theme.palette.action.disabled} ${alpha(theme.palette.background.default, 0.5)}`,
                }}
              >
                {children}
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              pt: 1.2,
              px: { xs: 1.2, md: 0 },
            }}
          >
            <DashboardFooter />
          </Box>
        </Box>

        {/* Modal for Profile and Settings */}
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fullScreen={isMobile}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              minHeight: isMobile ? '100vh' : '70vh',
              maxHeight: isMobile ? '100vh' : '90vh',
              borderRadius: isMobile ? 0 : 2,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.1rem' }}>
              Settings
            </Typography>
            <IconButton
              onClick={() => setModalOpen(false)}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  color: theme.palette.text.primary,
                },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
            {/* Left-side tabs */}
            <Box
              sx={{
                width: isMobile ? '100%' : 200,
                borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                backgroundColor: isMobile ? theme.palette.background.paper : 'transparent',
                pt: isMobile ? 0 : 2,
              }}
            >
              <List sx={{ p: 1 }}>
                {dialogTabs.map((tab, index) => {
                  const isActive = tabValue === index;
                  const activeStyles = getDialogTabActiveStyles(isActive);

                  return (
                    <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => handleTabChange(index)}
                        sx={[
                          {
                            minHeight: 42,
                            px: 2,
                            py: 0.7,
                            '& .MuiListItemIcon-root': {
                              minWidth: 34,
                              mr: 1.5,
                              justifyContent: 'center',
                            },
                          },
                          activeStyles,
                        ]}
                      >
                        <ListItemIcon>
                          {React.cloneElement(tab.icon, {
                            sx: {
                              fontSize: 19,
                              color: theme.palette.primary.main,
                            },
                          })}
                        </ListItemIcon>
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '0.01em',
                            color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                          }}
                        >
                          {tab.label}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            {/* Tab content */}
            <Box
              sx={{
                flex: 1,
                p: 2.5,
                overflowY: 'auto',
                backgroundColor: theme.palette.background.default,
                borderLeft: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                minHeight: isMobile ? '60vh' : 'auto',
              }}
            >
              {dialogTabs[tabValue].content}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}