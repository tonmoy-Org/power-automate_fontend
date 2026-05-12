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
import logo from '../public/automate-logo-540x540-1.png';
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
  '&::-webkit-scrollbar': { display: 'none' },
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
  '&::-webkit-scrollbar': { display: 'none' },
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
  '&::-webkit-scrollbar': { display: 'none' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'transparent' },
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
          primary: { main: '#3964FE' },
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
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleDrawerMenuClick = (event) => setDrawerAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setDrawerAnchorEl(null);
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  const isRouteActive = (path) => {
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (path !== '/superadmin-dashboard' && path !== '/member-dashboard' && path !== '/client-dashboard' && currentPath.startsWith(path + '/')) return true;
    if (path === '/member-dashboard' && currentPath === '/member-dashboard' && path !== '/client-dashboard') return true;
    if (path !== '/superadmin-dashboard' && path !== '/member-dashboard' && path !== '/client-dashboard' && currentPath === path) return true;
    return false;
  };

  const getActiveStyles = (path) => {
    const isActive = isRouteActive(path);
    return isActive ? {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderLeft: `3px solid ${theme.palette.primary.main}`,
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    } : {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': { color: theme.palette.text.secondary },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.1),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': { color: theme.palette.text.primary },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    };
  };

  const getSubItemActiveStyles = (path) => {
    const isActive = isRouteActive(path);
    return isActive ? {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderLeft: `2px solid ${theme.palette.primary.main}`,
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0,
      my: 0.1,
    } : {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': { color: theme.palette.text.secondary },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.08),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': { color: theme.palette.text.primary },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0,
      my: 0.1,
    };
  };

  const getDialogTabActiveStyles = (isActive) => {
    return isActive ? {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderLeft: `3px solid ${theme.palette.primary.main}`,
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    } : {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': { color: theme.palette.text.secondary },
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.1),
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': { color: theme.palette.text.primary },
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
    if (isMobile) setOpen(false);
  };

  const handleTabChange = (index) => setTabValue(index);

  const toggleExpand = (itemText) => {
    setExpandedItems(prev => ({ ...prev, [itemText]: !prev[itemText] }));
  };

  const handleItemClick = (item) => {
    if (item.subItems?.length > 0 && open) {
      toggleExpand(item.text);
    } else if (item.path) {
      handleNavigation(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  const renderCollapsedTooltip = (item) => {
    const hasSubItems = item.subItems?.length > 0;
    return (
      <Box sx={{ py: 0.5, minWidth: 180 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: hasSubItems ? 0.5 : 0,
            cursor: 'pointer',
            p: 0.75,
            borderRadius: 1,
            '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) },
          }}
          onClick={() => {
            if (item.path) handleNavigation(item.path);
            else if (item.onClick) item.onClick();
          }}
        >
          <Box sx={{ color: theme.palette.primary.main }}>
            {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: theme.palette.text.primary, lineHeight: 1.3 }}>
              {item.text}
            </Typography>
          </Box>
        </Box>
        {hasSubItems && (
          <Box sx={{ mt: 0.5, borderTop: `1px solid ${theme.palette.divider}`, pt: 0.5 }}>
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
                    '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) },
                  }}
                  onClick={() => {
                    if (subItem.path) handleNavigation(subItem.path);
                    else if (subItem.onClick) subItem.onClick();
                  }}
                >
                  {subItem.icon && (
                    <Box sx={{ color: theme.palette.text.secondary }}>
                      {React.cloneElement(subItem.icon, { sx: { fontSize: 16 } })}
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.primary, lineHeight: 1.3, fontWeight: 500 }}>
                      {subItem.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {item.subItems.length > 5 && (
                <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1), textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: theme.palette.primary.main, lineHeight: 1.3 }}>
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
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: theme.palette.text.primary,
      '& .MuiListItemIcon-root': { color: 'inherit' },
      '& .MuiTypography-root': { color: 'inherit' },
      '& .MuiDivider-root': { borderColor: theme.palette.divider },
    }}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', width: '100%', px: open ? 2 : 1 }}>
          {open ? (
            <img src={logo} alt="Logo" style={{ width: '140px', height: 'auto', marginTop: 10 }} />
          ) : (
            <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="Logo" style={{ width: '30px', height: 'auto' }} />
            </Box>
          )}
        </Box>
      </DrawerHeader>

      <ScrollableBox sx={{ py: 0.5, my: 0.5 }}>
        {menuItems?.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {open && section.sectionName && (
              <Box sx={{ px: 2.5, py: 0.5, mb: 0.25 }}>
                <Typography variant="caption" sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                }}>
                  {section.sectionName}
                </Typography>
              </Box>
            )}
            <List sx={{ py: 0.25 }}>
              {section.items.map((item) => {
                const hasSubItems = item.subItems?.length > 0;
                const isExpanded = expandedItems[item.text];

                const mainButton = (
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    sx={[getActiveStyles(item.path), {
                      minHeight: 40,
                      flexDirection: open ? 'row' : 'column',
                      justifyContent: open ? 'flex-start' : 'center',
                      alignItems: 'center',
                      gap: open ? 1.5 : 0,
                      px: open ? 2 : 1,
                      py: open ? 1 : 0.75,
                      '& .MuiListItemIcon-root': {
                        minWidth: 0,
                        mr: open ? 1.5 : 0,
                        justifyContent: 'center',
                        mt: open ? 0.25 : 0,
                      },
                      '& .MuiListItemText-root': { m: 0 },
                      ...(hasSubItems && { pr: 1 }),
                    }]}
                  >
                    <ListItemIcon>
                      {React.cloneElement(item.icon, {
                        sx: { fontSize: 18, color: isRouteActive(item.path) ? theme.palette.primary.main : theme.palette.text.secondary },
                      })}
                    </ListItemIcon>
                    {open && (
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          lineHeight: 1.3,
                          color: 'inherit',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '0.01em',
                        }}>
                          {item.text}
                        </Typography>
                      </Box>
                    )}
                    {hasSubItems && open && (
                      <ListItemIcon sx={{ minWidth: 0, ml: 'auto', color: 'inherit', opacity: 0.7, mt: 0.25 }}>
                        {isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                      </ListItemIcon>
                    )}
                  </ListItemButton>
                );

                const wrappedButton = open ? mainButton : (
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
                          fontSize: '0.75rem',
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
                          '&:before': { border: `1px solid ${theme.palette.divider}` },
                        },
                      },
                    }}
                    PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
                  >
                    <span style={{ display: 'flex', width: '100%' }}>{mainButton}</span>
                  </Tooltip>
                );

                return (
                  <React.Fragment key={item.text}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      {wrappedButton}
                    </ListItem>
                    {hasSubItems && isExpanded && open && (
                      <Box sx={{ borderRadius: '0 0 6px 6px', ml: 3, mr: 0.5, mb: 0.25 }}>
                        <List sx={{ py: 0.25, pl: 0 }}>
                          {item.subItems.map((subItem) => (
                            <ListItem key={subItem.text} disablePadding sx={{ display: 'block' }}>
                              <ListItemButton
                                onClick={() => {
                                  if (subItem.path) handleNavigation(subItem.path);
                                  else if (subItem.onClick) subItem.onClick();
                                }}
                                sx={[getSubItemActiveStyles(subItem.path), {
                                  minHeight: 36,
                                  px: 2,
                                  py: 0.75,
                                  ml: 0.5,
                                  alignItems: 'center',
                                }]}
                              >
                                {subItem.icon && (
                                  <ListItemIcon sx={{ minWidth: 26, color: theme.palette.primary.main, opacity: 0.8, mt: 0.25 }}>
                                    {React.cloneElement(subItem.icon, { sx: { fontSize: 16, color: theme.palette.primary.main } })}
                                  </ListItemIcon>
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'inherit',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
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

      <Box sx={{ p: 1, flexShrink: 0 }}>
        {open ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5, mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600, fontSize: '0.8rem' }}>
                  {getInitials(user?.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: theme.palette.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email || user?.role || 'User'}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={handleDrawerMenuClick} sx={{ color: theme.palette.text.secondary, width: 28, height: 28 }}>
                <MoreVert sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Menu
              anchorEl={drawerAnchorEl}
              open={openDrawerMenu}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              PaperProps={{ sx: { mt: 1, ml: -1, minWidth: 150, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` } }}
            >
              <MenuItem onClick={handleProfile} sx={{ fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <PersonIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={handleSettings} sx={{ fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <SettingsIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} /> Settings
              </MenuItem>
              <Divider sx={{ borderColor: theme.palette.divider, my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#e53e3e', fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <LogoutIcon sx={{ fontSize: 18, color: '#e53e3e', mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip
              title={<Box sx={{ py: 0.5, minWidth: 150 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: theme.palette.text.primary, mb: 0.25, lineHeight: 1.3 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, lineHeight: 1.3 }}>
                  {user?.email || user?.role || 'User'}
                </Typography>
              </Box>}
              placement="right"
              arrow
              enterDelay={0}
              leaveDelay={100}
              componentsProps={{
                tooltip: { sx: { backgroundColor: theme.palette.background.paper, fontSize: '0.75rem', padding: '6px 8px', borderRadius: '6px', color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] } },
                arrow: { sx: { color: theme.palette.background.paper, '&:before': { border: `1px solid ${theme.palette.divider}` } } },
              }}
            >
              <IconButton onClick={handleDrawerMenuClick} sx={{ width: 38, height: 38, p: 0 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600, fontSize: '0.8rem' }}>
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={drawerAnchorEl}
              open={openDrawerMenu}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ sx: { mt: 0, ml: 1, minWidth: 150, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` } }}
            >
              <Box sx={{ px: 1, py: 0.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.3 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, lineHeight: 1.3 }}>
                  {user?.email || user?.role || 'User'}
                </Typography>
              </Box>
              <MenuItem onClick={handleProfile} sx={{ fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <PersonIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={handleSettings} sx={{ fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <SettingsIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} /> Settings
              </MenuItem>
              <Divider sx={{ borderColor: theme.palette.divider, my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#e53e3e', fontSize: '0.8rem', py: 0.5, minHeight: 32 }}>
                <LogoutIcon sx={{ fontSize: 18, color: '#e53e3e', mr: 1 }} /> Logout
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
              {['Name', 'Email', 'Role'].map((field) => (
                <TableRow key={field}>
                  <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>{field}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', py: 1.5 }}>
                    {user?.[field.toLowerCase()] || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
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
              size="small"
              value={mode}
              label="Theme Mode"
              onChange={(e) => setMode(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontSize: '0.9rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
              }}
            >
              {['light', 'dark', 'system'].map((m) => (
                <MenuItem key={m} value={m} sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      ),
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', backgroundColor: theme.palette.background.default }}>
        <CssBaseline />
        <AppBar position="fixed" open={open && !isMobile} sx={{ zIndex: theme.zIndex.drawer + 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', boxShadow: 0.5 }}>
          <Toolbar sx={{ minHeight: 56, px: { xs: 1.5, sm: 2.5 } }}>
            {isMobile ? (
              <IconButton color="inherit" aria-label="open drawer" onClick={handleDrawerToggle} edge="start" sx={{ mr: 1.5, color: theme.palette.primary.main }}>
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton onClick={handleDrawerToggle} edge="start" sx={{ marginLeft: open ? -2 : 4.5, marginRight: 1.5, width: 32, height: 32, background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`, color: theme.palette.primary.contrastText }}>
                {open ? (theme.direction === 'rtl' ? <ChevronRightIcon sx={{ fontSize: 20 }} /> : <ChevronLeftIcon sx={{ fontSize: 20 }} />) : (theme.direction === 'rtl' ? <ChevronLeftIcon sx={{ fontSize: 20 }} /> : <ChevronRightIcon sx={{ fontSize: 20 }} />)}
              </IconButton>
            )}
            <Box sx={{flex: 1, minWidth: 0}}></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                avatar={<Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600 }}>{getInitials(user?.name)}</Avatar>}
                label={user?.name}
                variant="outlined"
                onClick={handleMenuClick}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  color: theme.palette.text.primary,
                  height: 36,
                  cursor: 'pointer',
                  '& .MuiChip-label': { fontSize: '0.85rem', fontWeight: 500, px: 1, py: 0.5 },
                  '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
              <IconButton size="small" onClick={handleMenuClick} sx={{ display: { xs: 'flex', sm: 'none' }, color: theme.palette.text.secondary, width: 36, height: 36 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600 }}>
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              PaperProps={{ sx: { mt: 1.5, minWidth: 180, boxShadow: theme.shadows[3], border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper } }}
            >
              <MenuItem sx={{ py: 1.2, px: 2, borderBottom: `1px solid ${theme.palette.divider}` }} disabled>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.85rem' }}>{user?.name}</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>{user?.email}</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleProfile} sx={{ py: 0.8, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                <ListItemIcon><PersonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /></ListItemIcon> Profile
              </MenuItem>
              <MenuItem onClick={handleSettings} sx={{ py: 0.8, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /></ListItemIcon> Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 0.8, color: '#e53e3e', fontSize: '0.85rem' }}>
                <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#e53e3e', fontSize: 18 }} /></ListItemIcon> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {isMobile ? (
          <MuiDrawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true, disableScrollLock: true }}
            sx={{ '& .MuiDrawer-paper': { width: mobileDrawerWidth, backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.divider}`, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' } }}
          >
            {renderDrawerContent()}
          </MuiDrawer>
        ) : (
          <PermanentDrawer variant="permanent" open={open}>
            {renderDrawerContent()}
          </PermanentDrawer>
        )}

        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default, width: '100%', overflow: 'hidden' }}>
          <DrawerHeader />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: { xs: 1.2, sm: 1.8 }, px: { xs: 1, sm: 1.5 }, overflow: 'hidden' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
              <Box sx={{ flex: 1, p: { xs: 1.2, sm: 1.8 }, overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': { width: '6px', height: '6px' }, '&::-webkit-scrollbar-track': { background: alpha(theme.palette.background.default, 0.5), borderRadius: '3px' }, '&::-webkit-scrollbar-thumb': { background: theme.palette.action.disabled, borderRadius: '3px', '&:hover': { background: theme.palette.action.disabledBackground } }, scrollbarWidth: 'thin', scrollbarColor: `${theme.palette.action.disabled} ${alpha(theme.palette.background.default, 0.5)}` }}>
                {children}
              </Box>
            </Box>
          </Box>
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, pt: 1.2, px: { xs: 1.2, md: 0 } }}>
            <DashboardFooter />
          </Box>
        </Box>

        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fullScreen={isMobile}
          fullWidth
          maxWidth="md"
          PaperProps={{ sx: { minHeight: isMobile ? '100vh' : '70vh', maxHeight: isMobile ? '100vh' : '90vh', borderRadius: isMobile ? 0 : 2, backgroundColor: theme.palette.background.paper } }}
        >
          <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.1rem' }}>Settings</Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: theme.palette.text.secondary }}>
              <ChevronLeftIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
            <Box sx={{ width: isMobile ? '100%' : 200, borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, backgroundColor: isMobile ? theme.palette.background.paper : 'transparent', pt: isMobile ? 0 : 2 }}>
              <List sx={{ p: 1 }}>
                {dialogTabs.map((tab, index) => {
                  const isActive = tabValue === index;
                  return (
                    <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                      <ListItemButton onClick={() => handleTabChange(index)} sx={[getDialogTabActiveStyles(isActive), { minHeight: 44, px: 2, py: 0.8, '& .MuiListItemIcon-root': { minWidth: 34, mr: 1.5, justifyContent: 'center' } }]}>
                        <ListItemIcon>{React.cloneElement(tab.icon, { sx: { fontSize: 20, color: theme.palette.primary.main } })}</ListItemIcon>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.01em', color: isActive ? theme.palette.primary.main : theme.palette.text.primary }}>
                          {tab.label}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
            <Box sx={{ flex: 1, p: 2.5, overflowY: 'auto', backgroundColor: theme.palette.background.default, borderLeft: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, minHeight: isMobile ? '60vh' : 'auto' }}>
              {dialogTabs[tabValue].content}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}