import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import toast from 'react-hot-toast';

export const useImageAiRules = () => {
  const rules = useLiveQuery(() => db.imageAiRules.toArray(), []);

  const addRule = async (name: string, instructions: string) => {
    if (!name.trim() || !instructions.trim()) {
      toast.error('O nome e as instruções da regra não podem estar vazios.');
      return;
    }
    try {
      await db.imageAiRules.add({ name, instructions });
      toast.success(`Regra "${name}" salva com sucesso!`);
    } catch (error) {
      console.error('Failed to add AI rule:', error);
      toast.error('Falha ao salvar a regra.');
    }
  };

  const deleteRule = async (id: number) => {
    try {
      await db.imageAiRules.delete(id);
      toast.success('Regra excluída com sucesso.');
    } catch (error) {
      console.error('Failed to delete AI rule:', error);
      toast.error('Falha ao excluir a regra.');
    }
  };

  return { rules, addRule, deleteRule };
};
