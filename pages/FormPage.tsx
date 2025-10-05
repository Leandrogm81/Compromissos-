
import React, { useEffect, useState } from 'react';
import type { AppView } from '../App';
import { Page } from '../App';
import type { Reminder } from '../types';
import { useReminders } from '../hooks/useReminders';
import ReminderForm from '../components/ReminderForm';
import Layout from '../components/Layout';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormPageProps {
  setView: (view: AppView) => void;
  reminderId?: string;
}

const FormPage: React.FC<FormPageProps> = ({ setView, reminderId }) => {
  const [initialData, setInitialData] = useState<Reminder | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { addReminder, updateReminder, getReminderById } = useReminders();
  
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
