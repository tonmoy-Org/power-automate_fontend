import React, { useState } from 'react';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    AccountCircle as AccountIcon,
    Notifications as NotificationsIcon,
    HealthAndSafety as HealthIcon,
    Schedule as ScheduleIcon,
    TrendingUp as PerformanceIcon,
    History as HistoryIcon,
    Description as FormIcon,
    Visibility as ReviewIcon,
    CheckCircle as ApprovalIcon,
    Assessment as AssessmentIcon,
    DirectionsCar as VehicleIcon,
    Inventory as InventoryIcon,
    Map as LogisticsIcon,
    LocalShipping as DispatchIcon,
    RequestQuote as QuoteIcon,
    Contacts as LeadsIcon,
    LocationOn as LocateIcon,
    Search as LookupIcon,
    ListAlt as ChecklistIcon,
    Engineering as RepairIcon,
    Star as ScorecardIcon,
    Book as LibraryIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    // Sub-item icons
    Description as ReportIcon,
    Assessment as AssessmentReportIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';

export const ManagerMenuComponent = ({ onMenuItemClick }) => {
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
        // Dashboard & Overview
        {
            sectionName: 'Dashboard & Overview',
            items: [
                { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
                { text: 'Overview', icon: <AssessmentIcon />, path: '/manager-dashboard/overview' },
                { text: 'Notifications', icon: <NotificationsIcon />, path: '/manager-dashboard/notifications' },
            ]
        },

        // Dispatch & Logistics
        {
            sectionName: 'Dispatch & Logistics',
            items: [
                { text: 'Dispatch', icon: <DispatchIcon />, path: '/manager-dashboard/dispatch' },
                { text: 'Logistics Map', icon: <LogisticsIcon />, path: '/manager-dashboard/logistics' },
                { text: 'Locates', icon: <LocateIcon />, path: '/manager-dashboard/locates' },
            ]
        },

        // Reports & Compliance - Updated with collapsible health reports
        {
            sectionName: 'Reports & Compliance',
            items: [
                {
                    text: 'Health Department Reports',
                    icon: <HealthIcon />,
                    path: '#',
                    isExpandable: true,
                    sectionId: 'health-reports',
                    expandIcon: <ExpandMoreIcon />,
                    subItems: [
                        {
                            text: 'RME Reports',
                            icon: <ReportIcon />,
                            path: '/manager-dashboard/health-department-reports/rme'
                        },
                        {
                            text: 'RSS Reports',
                            icon: <AssessmentReportIcon />,
                            path: '/manager-dashboard/health-department-reports/rss'
                        },
                        {
                            text: 'TOS Reports',
                            icon: <TimelineIcon />,
                            path: '/manager-dashboard/health-department-reports/tos'
                        }
                    ]
                },
                { text: 'My Scorecard', icon: <ScorecardIcon />, path: '/manager-dashboard/my-scorecard' },
            ]
        },

        // Vehicles & Inventory
        {
            sectionName: 'Vehicles & Inventory',
            items: [
                { text: 'Vehicles & Tools', icon: <VehicleIcon />, path: '/manager-dashboard/vehicles' },
                { text: 'Inventory', icon: <InventoryIcon />, path: '/manager-dashboard/inventory' },
            ]
        },

        // Quotes & Leads
        {
            sectionName: 'Quotes & Leads',
            items: [
                { text: 'Quotes', icon: <QuoteIcon />, path: '/manager-dashboard/quotes' },
                { text: 'Leads', icon: <LeadsIcon />, path: '/manager-dashboard/leads' },
            ]
        },

        // Technician Management
        {
            sectionName: 'Technician Management',
            items: [
                { text: 'Technicians', icon: <PeopleIcon />, path: '/manager-dashboard/techs' },
                { text: 'Scheduling', icon: <ScheduleIcon />, path: '/manager-dashboard/techs/schedule' },
                { text: 'Performance', icon: <PerformanceIcon />, path: '/manager-dashboard/techs/performance' },
                { text: 'Tech History', icon: <HistoryIcon />, path: '/manager-dashboard/techs/history' },
            ]
        },

        // Installations & Repairs
        {
            sectionName: 'Installations & Repairs',
            items: [
                { text: 'Installation Checklists', icon: <ChecklistIcon />, path: '/manager-dashboard/installations' },
                { text: 'Tank Repairs', icon: <RepairIcon />, path: '/manager-dashboard/tank-repairs' },
            ]
        },

        // Forms & Compliance
        {
            sectionName: 'Forms & Compliance',
            items: [
                { text: 'Forms', icon: <FormIcon />, path: '/manager-dashboard/forms' },
                { text: 'Review Forms', icon: <ReviewIcon />, path: '/manager-dashboard/forms/review' },
                { text: 'Form Approval', icon: <ApprovalIcon />, path: '/manager-dashboard/forms/approval' },
            ]
        },

        // Tasks & Library
        {
            sectionName: 'Tasks & Resources',
            items: [
                { text: 'Tasks', icon: <AssignmentIcon />, path: '/manager-dashboard/tasks' },
                { text: 'Library', icon: <LibraryIcon />, path: '/manager-dashboard/library' },
                { text: 'Lookup', icon: <LookupIcon />, path: '/manager-dashboard/lookup' },
            ]
        },

        // Profile
        {
            sectionName: 'Profile',
            items: [
                { text: 'My Profile', icon: <AccountIcon />, path: '/manager-dashboard/profile' },
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