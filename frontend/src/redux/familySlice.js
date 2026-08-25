import { createSlice } from '@reduxjs/toolkit';
import { createFamily, getFamilyDetails, acceptInvite } from './familyThunks'; // Import from thunks file
import { loginUser } from './authThunks';      // Import from thunks file



const familySlice = createSlice({
    name: 'family',
    initialState: {
        familyData: null,
        loading: false,
        isFamily: false,
        loaded: false,
        lastFetched: 0,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            // 1. Add cases for the createFamily lifecycle
            .addCase(loginUser.fulfilled, (state, action) => {
                const { family } = action.payload;
                state.isFamily = action.payload.isFamily || false;
                state.familyData = action.payload.family || null;
                state.loaded = true;
                state.lastFetched = Date.now();
            })

            .addCase(createFamily.fulfilled, (state, action) => {
                state.isFamily = true;
                state.familyData = action.payload;
                state.loading = false;
                state.loaded = true;
                state.lastFetched = Date.now();
            })
            // This part will now work correctly
            // Add pending/rejected cases for robustness
            .addCase(createFamily.pending, (state) => {
                state.loading = true;
            })
            .addCase(createFamily.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle getFamilyDetails actions
            .addCase(getFamilyDetails.pending, (state) => {
                state.loading = true;
            })
            .addCase(getFamilyDetails.fulfilled, (state, action) => {
                state.loading = false;
                const newData = action.payload;
                if (newData) {
                    state.familyData = newData;
                    state.isFamily = true;
                    state.loaded = true;
                    state.lastFetched = Date.now();
                } else {
                    state.familyData = null;
                    state.isFamily = false;
                    state.loaded = true;
                    state.lastFetched = Date.now();
                }
            })

            .addCase(getFamilyDetails.rejected, (state) => {
                state.loading = false;
                state.isFamily = false;
                state.familyData = null;
                state.loaded = false;
            })
            // 2. Add cases for the acceptInvite lifecycle
            .addCase(acceptInvite.pending, (state) => {
                state.loading = true;
            })
            .addCase(acceptInvite.fulfilled, (state, action) => {
                state.loading = false;
                state.isFamily = true;
                state.familyData = action.payload.family; // Store the new family's data
            })
            .addCase(acceptInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default familySlice.reducer;