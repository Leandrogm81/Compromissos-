

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '../services/notificationService';

export const usePushManager = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissionState = useCallback(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkPermissionState();
    // For browsers that support it, listen for changes in the permission status.
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
        // Handle both Chromium (onchange) and Firefox (addEventListener)
        const handleChange = () => checkPermissionState();
        try {
            permissionStatus.onchange = handleChange;
        } catch (e) {
            // Fallback for older browsers
            permissionStatus.addEventListener('change', handleChange);
        }
      });
    }
  }, [checkPermissionState]);

  const request = async () => {
    setIsLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setIsLoading(false);
  };

  return { permission, isLoading, request };
};
