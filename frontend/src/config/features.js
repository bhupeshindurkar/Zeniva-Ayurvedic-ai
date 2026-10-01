import { useState, useEffect } from 'react';

/**
 * ZENIVA AI - Modular Feature Flag System
 * Controls visibility of Hospital ERP & Pharmacy Operations across the platform.
 * Controlled directly by the Super Admin via an interactive ON/OFF toggle switch.
 */

export const isHospitalErpEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('zeniva_hospital_erp_enabled');
    if (val !== null) return val === 'true';
  } catch (e) {}
  return false; // Default is OFF as requested
};

export const setHospitalErpEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('zeniva_hospital_erp_enabled', enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('zeniva_erp_toggle_changed', { detail: { enabled } }));
  } catch (e) {}
};

// React Hook to make any component reactive to ERP ON/OFF toggle in real-time
export const useHospitalErp = () => {
  const [enabled, setEnabled] = useState(isHospitalErpEnabled);

  useEffect(() => {
    const handleToggle = (e) => {
      if (e?.detail?.enabled !== undefined) {
        setEnabled(e.detail.enabled);
      } else {
        setEnabled(isHospitalErpEnabled());
      }
    };
    window.addEventListener('zeniva_erp_toggle_changed', handleToggle);
    window.addEventListener('storage', handleToggle);
    return () => {
      window.removeEventListener('zeniva_erp_toggle_changed', handleToggle);
      window.removeEventListener('storage', handleToggle);
    };
  }, []);

  const toggle = (val) => {
    const nextVal = typeof val === 'boolean' ? val : !enabled;
    setHospitalErpEnabled(nextVal);
    setEnabled(nextVal);
    return nextVal;
  };

  return [enabled, toggle];
};
