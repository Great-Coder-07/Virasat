import { createSlice } from '@reduxjs/toolkit';
import { createMemory, fetchMemories } from './memoryThunks';

const memorySlice = createSlice({
    name: 'memories',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMemories.pending, (state) => {
                state.loading = state.items.length === 0;
                state.error = null;
            })
            .addCase(fetchMemories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchMemories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createMemory.pending, (state) => {
                state.loading = true;
            })
            .addCase(createMemory.fulfilled, (state, action) => {
                state.loading = false;
                // Add the new memory to the beginning of the items array
                state.items.unshift(action.payload);
            })
            .addCase(createMemory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default memorySlice.reducer;
