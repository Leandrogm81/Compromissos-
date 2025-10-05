
import { useState, useEffect, useCallback } from 'react';
import { getSubscription, subscribeUser, unsubscribeUser } from '../services/notificationService';

export const usePushManager = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    setIsLoading(true);
    const sub = await getSubscription();
    setSubscription(sub);
    setIsSubscribed(!!sub);
    setPermission(Notification.permission);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if ('permissions' in navigator) {
        navigator.permissions.query({name: 'notifications'}).then(permissionStatus => {
            checkSubscription();
            permissionStatus.onchange = () => {
                setPermission(permissionStatus.state);
                checkSubscription();
            };
        });
    } else {
        checkSubscription();
    }
  }, [checkSubscription]);

  const subscribe = async () => {
    setIsLoading(true);
    const result = await Notification.requestPermission();
    if (result === 'granted') {
        const sub = await subscribeUser();
        setSubscription(sub);
        setIsSubscribed(!!sub);
    }
    setPermission(result);
    setIsLoading(false);
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    await unsubscribeUser();
    setSubscription(null);
    setIsSubscribed(false);
    setIsLoading(false);
  };

  return { isSubscribed, subscription, permission, isLoading, subscribe, unsubscribe };
};
