/**
 * Zeniva AI - Super Admin Authentication & Cross-Device Security Service
 * Ensures Admin Master Password changes sync in real-time across Supabase Cloud,
 * Mobile browsers, Laptops, and Local Backend API.
 */

import { supabase } from './supabase';
import { apiFetch } from './api';

export const DEFAULT_MASTER_PASSWORDS = [
  'admin@zeniva2026',
  'zeniva2026',
  'bhupesh@123',
  '2027',
  '8766903403'
];

const STORAGE_KEY = 'zeniva_admin_security_config';
const CLOUD_VAULT_RECORD_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Get locally cached admin security config for instantaneous zero-latency checks
 */
export const getCachedAdminConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading cached admin config:', e);
  }
  return {
    custom_password: null,
    updated_at: null,
    updated_by: 'Bhupesh Indurkar (Super Admin)'
  };
};

/**
 * Fetch the latest Admin Security Credentials directly from Supabase Cloud
 * Checks the cloud ledger (accessible by all mobile phones, laptops, and web sessions)
 */
export const fetchAdminSecurityConfig = async () => {
  try {
    // 1. Primary Cloud Ledger: Read from cloud record
    const { data: cloudData, error: cloudErr } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('id', CLOUD_VAULT_RECORD_ID)
      .maybeSingle();

    if (cloudData && cloudData.review_notes) {
      try {
        const parsed = JSON.parse(cloudData.review_notes);
        if (parsed && (parsed.custom_password || parsed.password)) {
          const config = {
            custom_password: (parsed.custom_password || parsed.password).toString().trim(),
            updated_at: parsed.updated_at || cloudData.created_at,
            updated_by: parsed.updated_by || 'Bhupesh Indurkar (Super Admin)',
            updated_device: parsed.updated_device || 'Cloud Synchronized'
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
          return config;
        }
      } catch (pErr) {}
    }

    // 2. Secondary fallback: system_broadcasts
    const { data: sbData } = await supabase
      .from('system_broadcasts')
      .select('*')
      .eq('key', 'admin_security_config')
      .maybeSingle();

    if (sbData && sbData.description) {
      try {
        const parsedSb = JSON.parse(sbData.description);
        if (parsedSb && (parsedSb.custom_password || parsedSb.password)) {
          const config = {
            custom_password: (parsedSb.custom_password || parsedSb.password).toString().trim(),
            updated_at: parsedSb.updated_at || sbData.published_at,
            updated_by: parsedSb.updated_by || 'Bhupesh Indurkar (Super Admin)',
            updated_device: 'Cloud Synchronized'
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
          return config;
        }
      } catch (pErr2) {}
    }
  } catch (err) {
    console.warn('Remote admin config fetch notice:', err);
  }

  // Fallback to local cache
  return getCachedAdminConfig();
};

/**
 * Verify an entered password/PIN against active cloud and fallback credentials
 */
export const verifyAdminPassword = async (enteredInput) => {
  const clean = (enteredInput || '').toString().trim();
  if (!clean) return false;

  // 1. Fetch latest directly from cloud
  const activeConfig = await fetchAdminSecurityConfig();

  // 2. If a custom password is set in the cloud, ONLY that custom password is accepted!
  // All old PINs/passwords (including 2027) will be strictly rejected.
  if (activeConfig.custom_password && activeConfig.custom_password.trim().length > 0) {
    return clean === activeConfig.custom_password.trim();
  }

  // 3. If no custom password was ever set yet, allow initial default setup keys
  return DEFAULT_MASTER_PASSWORDS.includes(clean);
};

/**
 * Synchronously verify using local cache (when async isn't available)
 */
export const verifyAdminPasswordSync = (enteredInput) => {
  const clean = (enteredInput || '').toString().trim();
  if (!clean) return false;

  const cached = getCachedAdminConfig();
  if (cached.custom_password && cached.custom_password.trim().length > 0) {
    return clean === cached.custom_password.trim();
  }

  return DEFAULT_MASTER_PASSWORDS.includes(clean);
};

/**
 * Update Super Admin Master Password across Supabase Cloud, Local Storage, and Backend API
 */
export const updateAdminPassword = async ({
  currentPassword,
  newPassword,
  actor = 'Bhupesh Indurkar (Super Admin)'
}) => {
  const cleanCurrent = (currentPassword || '').toString().trim();
  const cleanNew = (newPassword || '').toString().trim();

  if (!cleanNew) {
    throw new Error('New admin password cannot be empty.');
  }

  if (cleanNew.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  // Verify current password first (can be current custom password or master setup PIN)
  const activeConfig = await fetchAdminSecurityConfig();
  let isCurrentValid = false;
  if (activeConfig.custom_password && activeConfig.custom_password.trim().length > 0) {
    isCurrentValid = (cleanCurrent === activeConfig.custom_password.trim()) || DEFAULT_MASTER_PASSWORDS.includes(cleanCurrent);
  } else {
    isCurrentValid = DEFAULT_MASTER_PASSWORDS.includes(cleanCurrent);
  }

  if (!isCurrentValid) {
    throw new Error('Current Admin Password / PIN is incorrect. Authorization denied.');
  }

  const timestamp = new Date().toISOString();
  const device = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device';

  const configPayload = {
    custom_password: cleanNew,
    updated_at: timestamp,
    updated_by: actor,
    updated_device: device,
    version: Date.now()
  };

  // 1. Persist to Supabase Cloud Database (Universal Multi-Device Sync for Mobile & Laptop)
  let cloudSaved = false;
  try {
    const { error: cloudErr } = await supabase
      .from('doctor_reviews')
      .upsert({
        id: CLOUD_VAULT_RECORD_ID,
        patient_name: 'admin_security_config',
        doctor_name: actor,
        review_notes: JSON.stringify(configPayload),
        status: 'pending_doctor_review'
      });

    if (!cloudErr) {
      cloudSaved = true;
    } else {
      console.warn('Primary cloud ledger write note:', cloudErr.message);
    }
  } catch (cErr) {
    console.warn('Primary cloud sync error:', cErr);
  }

  // 2. Also try secondary table if available
  try {
    await supabase.from('system_broadcasts').upsert({
      key: 'admin_security_config',
      enabled: true,
      title: 'Super Admin Master Security Credentials',
      sanskrit: 'प्रशासकीय सुरक्षा विन्यास',
      duration: 'Universal Cloud Sync',
      url: '',
      description: JSON.stringify(configPayload),
      published_at: timestamp
    }, { onConflict: 'key' }).catch(() => {});
  } catch (sbErr) {}

  // 3. Persist to Local Storage Cache on current device
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configPayload));
  } catch (lsErr) {
    console.warn('Local storage write error:', lsErr);
  }

  // 4. Notify Python Backend (if running locally or hosted)
  try {
    await apiFetch('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: cleanCurrent,
        new_password: cleanNew,
        actor
      })
    }).catch(() => {});
  } catch (apiErr) {}

  // 5. Dispatch live event so active UI components update reactively
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zeniva_admin_security_updated', {
      detail: configPayload
    }));
  }

  return {
    success: true,
    cloudSaved,
    config: configPayload,
    message: cloudSaved 
      ? 'Admin password successfully updated and synchronized across all devices (Mobile & Laptop) via Supabase Cloud!'
      : 'Admin password updated in local security ledger and ready for cloud sync.'
  };
};
