import axiosInstance from './axios';

export const fetchIndianNumbers = async () => {
    const { data } = await axiosInstance.get(`/indian-numbers`);
    return data;
};

export const fetchPasswordFormatters = async () => {
    const { data } = await axiosInstance.get('/password-formatters/list');
    return data;
};

export const createIndianNumber = async (data) => {
    const { data: res } = await axiosInstance.post('/indian-numbers', data);
    return res;
};

export const bulkCreateIndianNumbers = async (data) => {
    const { data: res } = await axiosInstance.post('/indian-numbers/bulk', data);
    return res;
};

export const updateIndianNumber = async ({ id, data }) => {
    const { data: res } = await axiosInstance.put(`/indian-numbers/${id}`, data);
    return res;
};

export const deleteIndianNumber = async (id) => {
    const { data } = await axiosInstance.delete(`/indian-numbers/${id}`);
    return data;
};

export const bulkDeleteIndianNumbers = async (ids) => {
    const { data } = await axiosInstance.delete('/indian-numbers/bulk', { data: { ids } });
    return data;
};

export const bulkUpdateIndianNumberStatus = async (ids, status) => {
    const { data } = await axiosInstance.patch('/indian-numbers/bulk/status', { ids, is_active: status });
    return data;
};

export const bulkUpdateIndianNumbers = async (ids, updateData) => {
    const { data } = await axiosInstance.patch('/indian-numbers/bulk', { ids, data: updateData });
    return data;
};