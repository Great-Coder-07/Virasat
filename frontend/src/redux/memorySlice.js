import { createSlice } from '@reduxjs/toolkit';
import { createMemory, fetchMemories } from './memoryThunks';

const memorySlice = createSlice({
    name: 'memories',
    initialState: {
        items: [],
        loading: false,
        error: null,
        loaded: false,
        currentQueryKey: null,
        currentQuery: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMemories.pending, (state, action) => {
                state.loading = true;
                const key = JSON.stringify(action.meta?.arg || {});
                // Clear items on query change to avoid stale/flicker
                if (state.currentQueryKey !== key) {
                    state.items = [];
                    state.currentQueryKey = key;
                    state.currentQuery = action.meta?.arg || null;
                    state.loaded = false;
                }
            })
            .addCase(fetchMemories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.loaded = true;
            })
            .addCase(fetchMemories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.loaded = false;
            })
            .addCase(createMemory.pending, (state) => {
                state.loading = true;
            })
            .addCase(createMemory.fulfilled, (state, action) => {
                state.loading = false;
                const m = action.payload;
                // Only add to current list if it matches the active query context
                const q = state.currentQuery || {};
                const isArchive = q.circleId === 'null' || q.circleId == null;
                const memIsArchive = m.circleId == null;
                if ((isArchive && memIsArchive) || (!isArchive && q.circleId === String(m.circleId))) {
                    state.items.unshift(m);
                }
            })
            .addCase(createMemory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default memorySlice.reducer;
