import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserProfile } from "@/lib/types";

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: UserProfile | null;
};

const initialState: AuthState = {
  hydrated: false,
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
    },
    clearSession(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { clearSession, setHydrated, setToken, setUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
