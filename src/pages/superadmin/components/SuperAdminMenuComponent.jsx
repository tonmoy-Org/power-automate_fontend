import React, { useState } from 'react';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    LocationOn as LocationIcon,
    HealthAndSafety as HealthIcon,
    Description as FormIcon,
    Notifications as NotificationIcon,
    NotificationsActive as ReminderIcon,
    Assignment as ReportIcon,
    History as HistoryIcon,
    Storage as SystemIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    // Sub-item icons for health reports
    Description as RMEReportIcon,
    Assessment as RSSReportIcon,
    Timeline as TOSReportIcon
} from '@mui/icons-material';

export const SuperAdminMenuComponent = ({ onMenuItemClick }) => {
    const [expandedSections, setExpandedSections] = useState({
        'health-reports': false
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const menuItems = [
        // Main Section
        {
            sectionName: 'Main',
            items: [
                {
                    text: 'Dashboard',
                    icon: <DashboardIcon />,
                    path: '/superadmin-dashboard'
                },
                {
                    text: 'Users',
                    icon: <PeopleIcon />,
                    path: '/superadmin-dashboard/users'
                },
            ]
        },

        // System & Configuration Section - Updated with collapsible health reports
        {
            sectionName: 'System & Configuration',
            items: [
                {
                    text: 'Locations',
                    icon: <LocationIcon />,
                    path: '/superadmin-dashboard/locations'
                },
                {
                    text: 'Health Department Report Tracking',
                    icon: <HealthIcon />,
                    path: '#',
                    isExpandable: true,
                    sectionId: 'health-reports',
                    subItems: [
                        {
                            text: 'RME Reports',
                            icon: <RMEReportIcon />,
                            path: '/superadmin-dashboard/health-department-report-tracking/rme'
                        },
                        {
                            text: 'RSS Reports',
                            icon: <RSSReportIcon />,
                            path: '/superadmin-dashboard/health-department-report-tracking/rss'
                        },
                        {
                            text: 'TOS Reports',
                            icon: <TOSReportIcon />,
                            path: '/superadmin-dashboard/health-department-report-tracking/tos'
                        }
                    ]
                },
                {
                    text: 'Forms',
                    icon: <FormIcon />,
                    path: '/superadmin-dashboard/forms'
                },
                {
                    text: 'Company Notifications',
                    icon: <NotificationIcon />,
                    path: '/superadmin-dashboard/company-notifications'
                },
                {
                    text: 'Reminders',
                    icon: <ReminderIcon />,
                    path: '/superadmin-dashboard/reminders'
                },
            ]
        },

        // Reports & Logs Section
        {
            sectionName: 'Reports & Logs',
            items: [
                {
                    text: 'Audit Logs',
                    icon: <HistoryIcon />,
                    path: '/superadmin-dashboard/audit-logs'
                },
                {
                    text: 'System Reports',
                    icon: <SystemIcon />,
                    path: '/superadmin-dashboard/system-reports'
                },
                {
                    text: 'Activity History',
                    icon: <ReportIcon />,
                    path: '/superadmin-dashboard/activity-history'
                },
            ]
        },

        // Profile Section
        {
            sectionName: 'Profile',
            items: [
                {
                    text: 'My Profile',
                    icon: <AccountIcon />,
                    path: '/superadmin-dashboard/profile'
                },
            ]
        },
    ];

    // Process menu items to add click handlers
    const processedMenuItems = menuItems.map(section => {
        const processedItems = section.items.map(item => {
            if (item.isExpandable) {
                return {
                    ...item,
                    onClick: () => toggleSection(item.sectionId),
                    expanded: expandedSections[item.sectionId] || false,
                    expandIcon: expandedSections[item.sectionId] ? <ExpandLessIcon /> : <ExpandMoreIcon />,
                    subItems: item.subItems.map(subItem => ({
                        ...subItem,
                        onClick: () => onMenuItemClick(subItem.path)
                    }))
                };
            }
            return {
                ...item,
                onClick: () => onMenuItemClick(item.path)
            };
        });

        return {
            ...section,
            items: processedItems
        };
    });

    return processedMenuItems;
};