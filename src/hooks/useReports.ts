import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getReportsSummary, ReportPeriod, ReportsSummary } from '../database/repositories/reportsRepository';



export type ReportRange = 'today' | 'week' | 'month';

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1,
    ).padStart(2, '0');
    const day = String(
        date.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getPeriod(
    range: ReportRange,
): ReportPeriod {
    const today = new Date();

    const endDate = formatDate(today);

    if (range === 'today') {
        return {
            startDate: endDate,
            endDate,
        };
    }

    if (range === 'week') {
        const start = new Date(today);
        const day = start.getDay();

        const daysSinceMonday =
            day === 0 ? 6 : day - 1;

        start.setDate(
            start.getDate() - daysSinceMonday,
        );

        return {
            startDate: formatDate(start),
            endDate,
        };
    }

    const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
    );

    return {
        startDate: formatDate(start),
        endDate,
    };
}

export function useReports(
    range: ReportRange = 'month',
) {
    const [data, setData] =
        useState<ReportsSummary | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadReports = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError(null);

                const period =
                    getPeriod(range);

                const summary =
                    await getReportsSummary(
                        period,
                    );

                setData(summary);
            } catch (err) {
                console.error(
                    'Failed to load reports:',
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load reports.',
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [range],
    );

    useFocusEffect(
        useCallback(() => {
            loadReports();
        }, [loadReports]),
    );

    const refresh = useCallback(
        () => loadReports(true),
        [loadReports],
    );

    return {
        data,
        loading,
        refreshing,
        error,
        refresh,
        period: getPeriod(range),
    };
}