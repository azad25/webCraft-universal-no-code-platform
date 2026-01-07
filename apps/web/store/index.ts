/**
 * Redux Store Configuration
 * Centralized state management with persistence and middleware
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { setupListeners } from '@reduxjs/toolkit/query'

// Import slices
import authReducer from './slices/authSlice'
import editorReducer from './slices/editorSlice'
import appReducer from './slices/appSlice'
import uiReducer from './slices/uiSlice'
import collaborationReducer from './slices/collaborationSlice'
import moduleReducer from './slices/moduleSlice'

// Import API slices
import { apiSlice } from './api/apiSlice'

// Persist configuration
const persistConfig = {
  key: 'webcraft',
  version: 1,
  storage,
  whitelist: ['auth', 'ui', 'modules'], // Persist auth, UI, and modules
  blacklist: ['editor', 'collaboration'] // Don't persist editor state
}

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  editor: editorReducer,
  app: appReducer,
  ui: uiReducer,
  collaboration: collaborationReducer,
  modules: moduleReducer,
  [apiSlice.reducerPath]: apiSlice.reducer
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['editor.elements', 'collaboration.cursors']
      },
      immutableCheck: {
        ignoredPaths: ['editor.history']
      }
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

// Create persistor
export const persistor = persistStore(store)

// Setup listeners for RTK Query
setupListeners(store.dispatch)

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector