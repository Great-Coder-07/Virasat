import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FAMILY_API_ENDPOINT } from '@/utils/constant';

export const createFamily = createAsyncThunk(
    'family/create',
    async ({ familyName, description }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${FAMILY_API_ENDPOINT}/create`, // Ensure this endpoint is correct
                { familyName, description },
                { withCredentials: true }
            );
            toast.success("Family created successfully!");
            return response.data.family;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create family.';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const getFamilyDetails = createAsyncThunk(
    'family/getDetails',
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const { loaded, lastFetched } = state.family || {};
            // 5-minute TTL to reduce unnecessary requests
            const TTL = 5 * 60 * 1000;
            if (loaded && Date.now() - lastFetched < TTL) {
                // Skip network call, return current data
                return state.family.familyData;
            }
            const response = await axios.get(`${FAMILY_API_ENDPOINT}/get-details`, {
                withCredentials: true,
            });
            return response.data.family; // The family object from the backend
        } catch (error) {
            // It's okay if this fails silently if the user has no family yet
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch family details');
        }
    }
);

export const acceptInvite = createAsyncThunk(
    'family/acceptInvite',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${FAMILY_API_ENDPOINT}/accept-invite`,
                { token },
                { withCredentials: true }
            );
            toast.success(response.data.message);
            return response.data.family; // Return the family data on success
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to accept invite.';

            toast.error(message);

            return rejectWithValue(message);
        }
    }
);


