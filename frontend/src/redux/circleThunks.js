import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CIRCLE_API_ENDPOINT } from "@/utils/constant";

export const createCircle = createAsyncThunk(
    'family/createCircle',
    async ({ circleName, members }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${CIRCLE_API_ENDPOINT}/create`,
                { circleName, members },
                { withCredentials: true }
            );
            toast.success("Circle created successfully!");
            return response.data.circle; // Return the newly created circle
        }
        catch (error) {
            const message = error.response?.data?.message || 'Failed to create circle.';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const getUserCircles = createAsyncThunk(
    'family/getUserCircles',
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const { loaded, lastFetched } = state.circle || {};
            const TTL = 5 * 60 * 1000; // 5 minutes
            if (loaded && Date.now() - lastFetched < TTL) {
                return state.circle.items;
            }
            const response = await axios.get(
                `${CIRCLE_API_ENDPOINT}/`,
                { withCredentials: true }
            );
            return response.data.circles; // Return the list of circles
        }
        catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch circles.';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const updateCircleName = createAsyncThunk(
    'family/updateCircleName',
    async ({ id, circleName }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(
                `${CIRCLE_API_ENDPOINT}/${id}`,
                { circleName },
                { withCredentials: true }
            );
            return response.data.circle;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update circle.';
            return rejectWithValue(message);
        }
    }
);