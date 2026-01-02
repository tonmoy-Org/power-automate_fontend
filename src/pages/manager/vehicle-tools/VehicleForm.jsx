import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    FormHelperText,
    IconButton,
    Box,
    Typography,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import GradientButton from '../../../components/ui/GradientButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';

const VEHICLE_TYPES = [
    'Pump Truck',
    'Service Truck',
    'Vacuum Truck',
    'Jet Truck',
    'Pickup Truck',
    'Trailer',
];

const PUMP_TYPES = [
    'Vacuum Pump',
    'High Pressure Jet',
    'Centrifugal Pump',
    'Diaphragm Pump',
    'Submersible Pump',
];

const CAPACITY_UNITS = ['Gallons', 'Liters', 'Cubic Feet'];

const VehicleForm = ({ open, onClose, vehicle, technicians }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        truckNumber: '',
        licensePlate: '',
        vin: '',
        vehicleType: 'Service Truck',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: '',
        capacityUnit: 'Gallons',
        pumpType: '',
        assignedTechnicianId: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (vehicle) {
            setFormData({
                truckNumber: vehicle.truckNumber || '',
                licensePlate: vehicle.licensePlate || '',
                vin: vehicle.vin || '',
                vehicleType: vehicle.vehicleType || 'Service Truck',
                make: vehicle.make || '',
                model: vehicle.model || '',
                year: vehicle.year || new Date().getFullYear(),
                capacity: vehicle.capacity || '',
                capacityUnit: vehicle.capacityUnit || 'Gallons',
                pumpType: vehicle.pumpType || '',
                assignedTechnicianId: vehicle.assignedTechnicianId || '',
                notes: vehicle.notes || '',
            });
        } else {
            resetForm();
        }
    }, [vehicle]);

    const resetForm = () => {
        setFormData({
            truckNumber: '',
            licensePlate: '',
            vin: '',
            vehicleType: 'Service Truck',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            capacity: '',
            capacityUnit: 'Gallons',
            pumpType: '',
            assignedTechnicianId: '',
            notes: '',
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.truckNumber.trim()) {
            newErrors.truckNumber = 'Truck number is required';
        }

        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = 'License plate is required';
        }

        if (!formData.vehicleType) {
            newErrors.vehicleType = 'Vehicle type is required';
        }

        if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
            newErrors.year = 'Invalid year';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await axiosInstance.post('/vehicles', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to create vehicle:', error);
            setErrors({ submit: error.response?.data?.message || 'Failed to save vehicle' });
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await axiosInstance.put(`/vehicles/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to update vehicle:', error);
            setErrors({ submit: error.response?.data?.message || 'Failed to update vehicle' });
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        // For new vehicle creation
        if (!vehicle) {
            // Submit only the form data (removed createdBy and createdAt)
            createMutation.mutate(formData);
        } else {
            // For updates
            updateMutation.mutate({
                id: vehicle._id,
                data: formData
            });
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{
                pb: 2,
                background: `linear-gradient(135deg, ${BLUE_COLOR} 0%, ${BLUE_DARK} 100%)`,
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                <IconButton
                    onClick={handleClose}
                    sx={{ color: 'white' }}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Truck Number *"
                            name="truckNumber"
                            value={formData.truckNumber}
                            onChange={handleInputChange}
                            error={!!errors.truckNumber}
                            helperText={errors.truckNumber}
                            size="small"
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="License Plate *"
                            name="licensePlate"
                            value={formData.licensePlate}
                            onChange={handleInputChange}
                            error={!!errors.licensePlate}
                            helperText={errors.licensePlate}
                            size="small"
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="VIN (Optional)"
                            name="vin"
                            value={formData.vin}
                            onChange={handleInputChange}
                            size="small"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth size="small" error={!!errors.vehicleType}>
                            <InputLabel>Vehicle Type *</InputLabel>
                            <Select
                                name="vehicleType"
                                value={formData.vehicleType}
                                onChange={handleInputChange}
                                label="Vehicle Type *"
                            >
                                {VEHICLE_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.vehicleType && (
                                <FormHelperText>{errors.vehicleType}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Make"
                            name="make"
                            value={formData.make}
                            onChange={handleInputChange}
                            size="small"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Model"
                            name="model"
                            value={formData.model}
                            onChange={handleInputChange}
                            size="small"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Year"
                            name="year"
                            type="number"
                            value={formData.year}
                            onChange={handleInputChange}
                            error={!!errors.year}
                            helperText={errors.year}
                            size="small"
                            inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                        />
                    </Grid>

                    {/* Capacity fields - only show for pump trucks */}
                    {(formData.vehicleType.includes('Pump') || formData.vehicleType.includes('Vacuum') || formData.vehicleType.includes('Jet')) && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Capacity"
                                    name="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                            <Box sx={{ ml: 1, color: 'text.secondary' }}>
                                                {formData.capacityUnit}
                                            </Box>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Capacity Unit</InputLabel>
                                    <Select
                                        name="capacityUnit"
                                        value={formData.capacityUnit}
                                        onChange={handleInputChange}
                                        label="Capacity Unit"
                                    >
                                        {CAPACITY_UNITS.map(unit => (
                                            <MenuItem key={unit} value={unit}>
                                                {unit}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pump Type</InputLabel>
                                    <Select
                                        name="pumpType"
                                        value={formData.pumpType}
                                        onChange={handleInputChange}
                                        label="Pump Type"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {PUMP_TYPES.map(type => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Assign to Technician (Optional)</InputLabel>
                            <Select
                                name="assignedTechnicianId"
                                value={formData.assignedTechnicianId}
                                onChange={handleInputChange}
                                label="Assign to Technician (Optional)"
                            >
                                <MenuItem value="">
                                    <em>Unassigned</em>
                                </MenuItem>
                                {technicians?.map(tech => (
                                    <MenuItem key={tech._id} value={tech._id}>
                                        {tech.name} {tech.employeeId ? `(${tech.employeeId})` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                            size="small"
                        />
                    </Grid>

                    {errors.submit && (
                        <Grid size={{ xs: 12 }}>
                            <Chip
                                label={errors.submit}
                                color="error"
                                size="small"
                                sx={{ width: '100%', justifyContent: 'center' }}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <OutlineButton onClick={handleClose}>
                    Cancel
                </OutlineButton>
                <GradientButton
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Create Vehicle'}
                </GradientButton>
            </DialogActions>
        </Dialog>
    );
};

export default VehicleForm;