import axios from 'axios';
import { FAMILY_API_ENDPOINT } from '@/utils/constant';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';


export const fetchMemories = createAsyncThunk(
    'memories/fetch',
    async ({ searchTerm, filters, circleId, sort = 'desc' }, { rejectWithValue }) => {
        try {
            const { member, ...restFilters } = filters || {};
            const response = await axios.get(`${FAMILY_API_ENDPOINT}/memories`, {
                params: {
                    search: searchTerm,
                    ...restFilters,
                    ...(member && member !== 'all' ? { member: member } : {}),
                    circleId,
                    sort,
                },
                withCredentials: true,
            });
            return response.data.memories;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch memories");
        }
    }
);



export const createMemory = createAsyncThunk(
    'memories/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${FAMILY_API_ENDPOINT}/memories/create`, formData, {
                headers: {
                    // The browser will set the correct Content-Type with boundary for multipart/form-data
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });
            toast.success(response.data?.message || "Memory created successfully!");
            return response.data.memory;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create memory.';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

