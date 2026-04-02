import toast from 'react-hot-toast';

const originalToast = {
    base: toast,
    success: toast.success,
    error: toast.error,
    loading: toast.loading,
    custom: toast.custom,
};

const toText = (message) => {
    if (typeof message === 'string') return message;
    if (typeof message === 'number') return String(message);
    return '';
};

const isAllowedToastMessage = (message) => {
    const text = toText(message).toLowerCase();
    if (!text) return false;

    const isOtpToast = text.includes('otp');
    const isLoginSuccessToast = text.includes('login successful');
    return isOtpToast || isLoginSuccessToast;
};

export const installToastGuard = () => {
    const guardedBaseToast = (message, ...rest) => {
        if (!isAllowedToastMessage(message)) return null;
        return originalToast.base(message, ...rest);
    };

    Object.assign(guardedBaseToast, originalToast.base);
    toast.success = (message, ...rest) => {
        if (!isAllowedToastMessage(message)) return null;
        return originalToast.success(message, ...rest);
    };
    toast.error = () => null;
    toast.loading = () => null;
    toast.custom = () => null;

    return guardedBaseToast;
};

