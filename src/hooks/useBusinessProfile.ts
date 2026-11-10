import { useCallback, useEffect, useState } from 'react';

import {
    getBusinessSettings,
    updateBusinessProfile,
    updateInvoiceSettings,
    type UpdateBusinessProfileInput,
    type UpdateInvoiceSettingsInput,
} from '../database/repositories/businessSettingsRepository';
import type { BusinessSettings } from '../database/types';

export function useBusinessProfile() {
    const [business, setBusiness] = useState<BusinessSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadBusiness = useCallback(() => {
        try {
            setError(null);
            setBusiness(getBusinessSettings());
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load business profile.',
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveBusiness = useCallback(
        (input: UpdateBusinessProfileInput) => {
            try {
                setIsSaving(true);
                setError(null);

                const updated = updateBusinessProfile(input);
                setBusiness(updated);

                return updated;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Unable to save business profile.';

                setError(message);
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    const saveInvoiceSettings = useCallback(
  (input: UpdateInvoiceSettingsInput) => {
    try {
      setIsSaving(true);
      setError(null);

      const updated = updateInvoiceSettings(input);
      setBusiness(updated);

      return updated;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save invoice settings.';

      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  },
  [],
);

    useEffect(() => {
        loadBusiness();
    }, [loadBusiness]);

    return {
        business,
        isLoading,
        isSaving,
        error,
        refreshBusiness: loadBusiness,
        saveBusiness,
        saveInvoiceSettings
    };
}