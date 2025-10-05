import React, { useEffect, useState } from 'react';
import type { AppView } from '../App';
import { Page } from '../App';
import type { Reminder } from '../types';
import { useReminders } from '../hooks/useReminders';
import ReminderForm from '../components/ReminderForm';
import Layout from '../components/Layout';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePushManager } from '../hooks/usePushManager';

interface FormPageProps {
  setView: (view: AppView) => void;
  reminderId?: string;
}

const FormPage: React.FC<FormPageProps> = ({ setView, reminderId }) => {
  const [initialData, setInitialData] = useState<Reminder | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { addReminder, updateReminder, getReminderById } = useReminders();
  const { permission, request: requestNotifications } = usePushManager();
  
  const isEditing = !!reminderId;

  useEffect(() => {
    if (isEditing) {
      const id = parseInt(reminderId, 10);
      getReminderById(id).then(reminder => {
        setInitialData(reminder);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderId, isEditing]);

  const handleSubmit = async (formData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      if (isEditing && initialData?.id) {
        await updateReminder(initialData.id, formData);
        toast.success('Lembrete atualizado!');
      } else {
        await addReminder(formData);
        toast.success('Lembrete criado!');
        
        // After creating a reminder, if permission hasn't been asked or granted/denied,
        // prompt the user to enable notifications.
        const hasBeenAsked = localStorage.getItem('hasBeenAskedForNotifications');
        if (permission === 'default' && !hasBeenAsked) {
            localStorage.setItem('hasBeenAskedForNotifications', 'true');
            toast(
                (t) => (
                  <div className="flex flex-col items-center gap-3 p-2">
                    <span className="text-center">Deseja receber notificações para este lembrete?</span>
                    <div className="flex gap-4">
                      <button
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md shadow-sm hover:bg-slate-200"
                        onClick={() => toast.dismiss(t.id)}
                      >
                        Agora não
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700"
                        onClick={async () => {
                          await requestNotifications();
                          toast.dismiss(t.id);
                        }}
                      >
                        Sim, ativar
                      </button>
                    </div>
                  </div>
                ),
                {
                  duration: 10000, // Keep the toast longer
                }
              );
        }
      }
      setView({ page: Page.List });
    } catch (error) {
      toast.error('Falha ao salvar o lembrete.');
      console.error(error);
    }
  };

  return (
    <Layout
      title={isEditing ? 'Editar Lembrete' : 'Novo Lembrete'}
      setView={setView}
      showBackButton={true}
    >
        <div className="p-4">
            {isLoading ? (
                <p>Carregando...</p>
            ) : (
                <ReminderForm
                    onSubmit={handleSubmit}
                    initialData={initialData}
                    onCancel={() => setView({ page: Page.List })}
                />
            )}
        </div>
    </Layout>
  );
};

export default FormPage;