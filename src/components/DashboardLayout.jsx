import React from 'react';
import { styled, useTheme, alpha } from '@mui/material/styles';
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
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import logo from '../public/logo.png';
import { ExpandLess, ExpandMore, Menu as MenuIcon } from '@mui/icons-material';
import DashboardFooter from './DashboardFooter';

const drawerWidth = 250;
const closedDrawerWidth = 70;
const mobileDrawerWidth = 250;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#1a365d',
  backgroundImage: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
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
  backgroundColor: '#1a365d',
  backgroundImage: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
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
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
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
  const theme = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  // Enhanced route matching logic
  const isRouteActive = (path) => {
    const currentPath = location.pathname;

    // Exact match
    if (currentPath === path) return true;

    // For nested routes
    if (path !== '/superadmin-dashboard' && path !== '/manager-dashboard' && path !== '/tech-dashboard' && currentPath.startsWith(path + '/')) {
      return true;
    }

    // Special handling for dashboard root
    if (path === '/manager-dashboard' && currentPath === '/manager-dashboard') {
      return true;
    }

    // For paths that are direct parent of current path
    if (path !== '/superadmin-dashboard' && path !== '/manager-dashboard' && path !== '/tech-dashboard' && currentPath === path) {
      return true;
    }

    return false;
  };

  const getActiveStyles = (path) => {
    const isActive = isRouteActive(path);

    if (isActive) {
      return {
        color: '#ffffff !important',
        backgroundColor: alpha('#ffffff', 0.15),
        borderLeft: '3px solid #63b3ed',
        '& .MuiListItemIcon-root': {
          color: '#ffffff',
        },
        '&:hover': {
          backgroundColor: alpha('#ffffff', 0.2),
          color: '#ffffff !important',
        },
        borderRadius: '0 6px 6px 0',
        transition: 'all 0.15s ease',
        mx: 0.5,
        my: 0.25,
      };
    }

    return {
      color: alpha('#ffffff', 0.85),
      backgroundColor: 'transparent',
      '& .MuiListItemIcon-root': {
        color: alpha('#ffffff', 0.85),
      },
      '&:hover': {
        backgroundColor: alpha('#ffffff', 0.1),
        color: '#ffffff',
        '& .MuiListItemIcon-root': {
          color: '#ffffff',
        },
      },
      borderRadius: '0 6px 6px 0',
      transition: 'all 0.15s ease',
      mx: 0.5,
      my: 0.25,
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const renderDrawerContent = () => (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      '& .MuiListItemIcon-root': {
        color: 'inherit',
      },
      '& .MuiTypography-root': {
        color: 'inherit',
      },
      '& .MuiDivider-root': {
        borderColor: alpha('#ffffff', 0.15),
      },
    }}>
      <DrawerHeader>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          width: '100%',
          px: open ? 2 : 1,
        }}>
          {open ? (
            <img
              src={logo}
              alt="Logo"
              style={{
                width: '160px',
                height: 'auto',
              }}
            />
          ) : (
            <Box sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: '32px',
                  height: 'auto',
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </Box>
          )}
        </Box>
      </DrawerHeader>

      <Divider sx={{
        borderColor: alpha('#ffffff', 0.15),
        my: 0.5,
      }} />

      <ScrollableBox sx={{ py: 0.5 }}>
        {menuItems?.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {/* Section Header - Only show when drawer is open */}
            {open && section.sectionName && (
              <Box sx={{
                px: 2.5,
                py: 1,
                mb: 0.5,
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#ffffff', 0.6),
                    fontSize: '0.7rem',
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
                const isExpandable = item.isExpandable;
                const isExpanded = item.expanded;

                const mainButton = (
                  <ListItemButton
                    onClick={item.onClick}
                    sx={[
                      getActiveStyles(item.path),
                      {
                        minHeight: 44,
                        flexDirection: open ? 'row' : 'column',
                        justifyContent: open ? 'flex-start' : 'center',
                        alignItems: 'center',
                        gap: open ? 1.5 : 0.25,
                        px: open ? 2.5 : 1.5,
                        py: open ? 0.75 : 1,
                        '& .MuiListItemIcon-root': {
                          minWidth: 0,
                          mr: open ? 1.5 : 0,
                          justifyContent: 'center',
                        },
                        '& .MuiListItemText-root': {
                          m: 0,
                        },
                      },
                      isExpandable && {
                        pr: 1.5,
                      }
                    ]}
                  >
                    <ListItemIcon>
                      {React.cloneElement(item.icon, {
                        sx: {
                          fontSize: 20,
                          color: 'inherit',
                        }
                      })}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={
                          <Typography sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            color: 'inherit',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '0.01em',
                          }}>
                            {item.text}
                          </Typography>
                        }
                      />
                    )}
                    {!open && (
                      <Typography sx={{
                        fontSize: '0.6rem',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        mt: 0.25,
                        textAlign: 'center',
                        color: 'inherit',
                        letterSpacing: '0.01em',
                      }}>
                        {item.text.split(' ').map(word => word.charAt(0)).join('')}
                      </Typography>
                    )}
                    {isExpandable && open && (
                      <ListItemIcon sx={{
                        minWidth: 0,
                        ml: 'auto',
                        color: 'inherit',
                        opacity: 0.7
                      }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </ListItemIcon>
                    )}
                  </ListItemButton>
                );

                // Wrap in tooltip for collapsed state
                const wrappedButton = open || !isMobile ? (
                  mainButton
                ) : (
                  <Tooltip
                    title={item.text}
                    placement="right"
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: '#2d3748',
                          fontSize: '0.8rem',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }
                      },
                      arrow: {
                        sx: {
                          color: '#2d3748',
                        }
                      }
                    }}
                  >
                    {mainButton}
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

                    {/* Sub-items */}
                    {isExpandable && isExpanded && item.subItems && open && (
                      <List sx={{
                        py: 0,
                        pl: 3.5,
                        backgroundColor: alpha('#000000', 0.1)
                      }}>
                        {item.subItems.map((subItem) => (
                          <ListItem
                            key={subItem.text}
                            disablePadding
                            sx={{
                              display: 'block',
                            }}
                          >
                            <ListItemButton
                              onClick={subItem.onClick}
                              sx={[
                                getActiveStyles(subItem.path),
                                {
                                  minHeight: 40,
                                  px: 2.5,
                                  py: 0.5,
                                  ml: 1,
                                  '&:hover': {
                                    backgroundColor: alpha('#ffffff', 0.1),
                                  },
                                  '& .MuiTypography-root': {
                                    fontSize: '0.8rem',
                                  }
                                }
                              ]}
                            >
                              {subItem.icon && (
                                <ListItemIcon sx={{
                                  minWidth: 30,
                                  color: 'inherit',
                                  opacity: 0.8
                                }}>
                                  {React.cloneElement(subItem.icon, {
                                    sx: { fontSize: 18 }
                                  })}
                                </ListItemIcon>
                              )}
                              <ListItemText
                                primary={
                                  <Typography sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 400,
                                    color: 'inherit',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {subItem.text}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </React.Fragment>
        ))}
      </ScrollableBox>

      {/* Logout button at bottom */}
      <Box sx={{
        p: 1.5,
        borderTop: `1px solid ${alpha('#ffffff', 0.15)}`,
        flexShrink: 0
      }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: alpha('#ffffff', 0.85),
            backgroundColor: 'transparent',
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.1),
              color: '#ffffff',
            },
            flexDirection: open ? 'row' : 'column',
            justifyContent: open ? 'flex-start' : 'center',
            alignItems: 'center',
            gap: open ? 1.5 : 0.25,
            px: open ? 2 : 1.5,
            py: 0.75,
            minHeight: 44,
          }}
        >
          <ListItemIcon sx={{
            minWidth: 0,
            mr: open ? 1.5 : 0,
            justifyContent: 'center',
            color: 'inherit',
          }}>
            <LogoutIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          {open && (
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                sx: {
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'inherit',
                  letterSpacing: '0.01em',
                }
              }}
            />
          )}
          {!open && (
            <Typography sx={{
              fontSize: '0.6rem',
              fontWeight: 500,
              mt: 0.25,
              textAlign: 'center',
              color: 'inherit',
              letterSpacing: '0.01em',
            }}>
              Out
            </Typography>
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
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
        <Toolbar sx={{
          minHeight: 56,
          px: { xs: 1.5, sm: 2.5 },
        }}>
          {!isMobile ? (
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              sx={{
                marginLeft: open ? -2 : 4.5,
                marginRight: 1.5,
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
                },
              }}
            >
              {open ? (
                theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />
              ) : (
                theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />
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
                color: '#3182ce',
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
                color: '#2d3748',
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Sterling Septic & Plumbing
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#718096',
                fontWeight: 400,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                letterSpacing: '0.01em',
              }}
            >
              {title || 'Dashboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              avatar={
                <Avatar sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.7rem',
                  bgcolor: '#3182ce',
                  color: '#ffffff',
                  fontWeight: 600,
                }}>
                  {getInitials(user?.name)}
                </Avatar>
              }
              label={user?.name}
              variant="outlined"
              sx={{
                borderColor: alpha('#3182ce', 0.2),
                backgroundColor: alpha('#3182ce', 0.04),
                color: '#2d3748',
                height: 36,
                '& .MuiChip-label': {
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  px: 1,
                  py: 0.5,
                },
                '&:hover': {
                  borderColor: '#3182ce',
                  backgroundColor: alpha('#3182ce', 0.08),
                },
                display: { xs: 'none', sm: 'flex' },
              }}
            />
            <IconButton
              onClick={handleLogout}
              title="Logout"
              sx={{
                color: '#718096',
                '&:hover': {
                  backgroundColor: alpha('#3182ce', 0.08),
                  color: '#3182ce',
                },
                width: 36,
                height: 36,
              }}
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
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
              backgroundImage: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
              borderRight: 'none',
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
          backgroundColor: '#f7fafc',
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
            p: { xs: 1.5, sm: 2 },
            pt: { xs: 1.5, sm: 2 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Scrollable content area with minimal scrollbar */}
            <Box
              sx={{
                flex: 1,
                p: { xs: 1.5, sm: 2 },
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f5f9',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e0',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#a0aec0',
                  },
                },
                // For Firefox
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f1f5f9',
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          borderTop: '1px solid rgba(0,0,0,0.04)',
          backgroundColor: '#ffffff',
          py: 1.5,
          px: { xs: 1.5, sm: 2 },
        }}>
          <DashboardFooter />
        </Box>
      </Box>
    </Box>
  );
}