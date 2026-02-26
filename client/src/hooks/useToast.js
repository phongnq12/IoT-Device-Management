import { useState, useEffect, useCallback } from 'react';

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    return { toast, showToast };
}
