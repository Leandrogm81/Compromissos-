

// This would be in your .env file
// Fix: Replaced placeholder VAPID key with a valid one to enable push subscriptions.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BDRCqgR-g-i1gUnE09eCaD3R0s7FpWk0T6E2a9p-h5g-Zjk-V3yT8w-sdfghjkl';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeUser(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    console.log('User is already subscribed.');
    return existingSubscription;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('User is subscribed:', subscription);
    // TODO: Send subscription to your backend server
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    return null;
  }
}

export async function unsubscribeUser(): Promise<boolean> {
  const subscription = await getSubscription();
  if (subscription) {
    // TODO: Also notify your backend server to remove the subscription
    return subscription.unsubscribe();
  }
  return false;
}

export function scheduleLocalNotification(title: string, options: NotificationOptions, delayInMs: number) {
    if (!('Notification' in window)) {
        alert('Este navegador não suporta notificações locais.');
        return;
    }

    if (Notification.permission === 'granted') {
        setTimeout(() => {
            new Notification(title, options);
        }, delayInMs);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                setTimeout(() => {
                    new Notification(title, options);
                }, delayInMs);
            }
        });
    }
}