import React, { createContext, useState, useMemo, useContext } from 'react';
import type { Reminder } from '../types';

export enum Page {
  List,
  Form,
  Settings,
  Resolved,
  View,
}

export type AppView =
  | { page: Page.List }
  | { page: Page.Form, reminderId?: string, initialData?: Partial<Reminder> }
  | { page: Page.Settings }
  | { page: Page.Resolved }
  | { page: Page.View, reminderId: string };

interface NavigationContextType {
  view: AppView;
  setView: (view: AppView) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>({ page: Page.List });

  const goBack = () => {
    setView({ page: Page.List });
  };

  const value = useMemo(() => ({ view, setView, goBack }), [view]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};