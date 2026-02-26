import axiosInstance from './axios';

export const fetchPhoneNumbers = async () => {
    const { data } = await axiosInstance.get(`/phone-numbers`);
    return data;
};

export const fetchPasswordFormatters = async () => {
    const { data } = await axiosInstance.get('/password-formatters/list');
    return data;
};

export const createPhoneNumber = async (data) => {
    const { data: res } = await axiosInstance.post('/phone-numbers', data);
    return res;
};

export const bulkCreatePhoneNumbers = async (data) => {
    const { data: res } = await axiosInstance.post('/phone-numbers/bulk', data);
    return res;
};

export const updatePhoneNumber = async ({ id, data }) => {
    const { data: res } = await axiosInstance.put(`/phone-numbers/${id}`, data);
    return res;
};

export const deletePhoneNumber = async (id) => {
    const { data } = await axiosInstance.delete(`/phone-numbers/${id}`);
    console.log(data);
    return data;
};

export const bulkDeletePhoneNumbers = async (ids) => {
    const { data } = await axiosInstance.delete('/phone-numbers/bulk', { data: { ids } });
    console.log(data);
    return data;
};

export const bulkUpdatePhoneNumberStatus = async (ids, status) => {
    const { data } = await axiosInstance.patch('/phone-numbers/bulk/status', { ids, is_active: status });
    console.log(data);
    return data;
};