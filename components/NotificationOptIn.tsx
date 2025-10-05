
import React from 'react';
import { usePushManager } from '../hooks/usePushManager';
import { Bell, BellOff, Loader2 } from 'lucide-react';

const NotificationOptIn: React.FC = () => {
  const { isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushManager();

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="animate-spin" size={16} />
          <span>Verificando...</span>
        </div>
      );
    }
    
    if (permission === 'denied') {
      return <p className="text-sm text-red-600 dark:text-red-400">As notificações estão bloqueadas nas configurações do seu navegador.</p>
    }

    if (isSubscribed) {
      return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-green-700 dark:text-green-400">Notificações ativadas.</p>
            <button onClick={handleToggleSubscription} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                <BellOff size={16} /> Desativar
            </button>
        </div>
      );
    }

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Receba alertas para seus lembretes.</p>
            <button onClick={handleToggleSubscription} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                <Bell size={16} /> Ativar Notificações
            </button>
        </div>
    );
  };
  
  return (
    <div>
        {renderContent()}
    </div>
  );
};

export default NotificationOptIn;
