import { useAppDispatch } from '@/store';
import { addToast as addToastAction } from '@/store/slices/uiSlice';

// Custom hook for toast notifications
export const useToast = () => {
  const dispatch = useAppDispatch();
  
  return {
    success: (title: string, message?: string) => 
      dispatch(addToastAction({ type: 'success', title, message })),
    error: (title: string, message?: string) => 
      dispatch(addToastAction({ type: 'error', title, message })),
    info: (title: string, message?: string) => 
      dispatch(addToastAction({ type: 'info', title, message })),
    warning: (title: string, message?: string) => 
      dispatch(addToastAction({ type: 'warning', title, message })),
  };
};

// Legacy compatibility with sonner
export const toast = {
  success: (message: string) => console.log('Use useToast hook instead'),
  error: (message: string) => console.log('Use useToast hook instead'),
  info: (message: string) => console.log('Use useToast hook instead'),
  warning: (message: string) => console.log('Use useToast hook instead'),
};