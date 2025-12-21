import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authApi } from '../features/auth/store/authApi';
import authReducer from '../features/auth/store/authSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth'], // Only persist auth state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(authApi.middleware),
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
