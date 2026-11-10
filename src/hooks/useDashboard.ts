import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    getDashboardData,
    type DashboardData,
} from '../database/repositories/dashboardRepository';

type UseDashboardResult = {
    data: DashboardData | null;
    isLoading: boolean;
    error: string | null;
    refreshDashboard: () => Promise<void>;
};

export function useDashboard(): UseDashboardResult {
    const [data, setData] =
        useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] =
        useState(true);
    const [error, setError] =
        useState<string | null>(null);

    const refreshDashboard = useCallback(
        async () => {
            try {
                setIsLoading(true);
                setError(null);

                const result = getDashboardData();
                setData(result);
            } catch (err) {
                console.error(
                    'Failed to load dashboard:',
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load dashboard.',
                );
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        refreshDashboard();
    }, [refreshDashboard]);

    return {
        data,
        isLoading,
        error,
        refreshDashboard,
    };
}