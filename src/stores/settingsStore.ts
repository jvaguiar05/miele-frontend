import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashboardFilter = 'today' | 'week' | 'month';
export type NotificationPreference = 'all' | 'important' | 'none';

interface SettingsState {
  // Dashboard settings
  dashboardFilter: DashboardFilter;
  setDashboardFilter: (filter: DashboardFilter) => void;
  
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationPreference: NotificationPreference;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setNotificationPreference: (preference: NotificationPreference) => void;
  
  // System status
  systemStatus: {
    database: 'online' | 'offline' | 'checking';
    api: 'online' | 'offline' | 'checking';
    lastChecked: Date | null;
  };
  checkSystemStatus: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Dashboard settings
      dashboardFilter: 'today',
      setDashboardFilter: (filter) => set({ dashboardFilter: filter }),
      
      // Notification settings
      emailNotifications: true,
      pushNotifications: false,
      notificationPreference: 'important',
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setNotificationPreference: (preference) => set({ notificationPreference: preference }),
      
      // System status
      systemStatus: {
        database: 'checking',
        api: 'checking',
        lastChecked: null,
      },
      
      checkSystemStatus: async () => {
        set({
          systemStatus: {
            database: 'checking',
            api: 'checking',
            lastChecked: null,
          }
        });
        
        try {
          // Simulate API health check
          const apiResponse = await fetch('/api/health', { method: 'HEAD' }).catch(() => null);
          const apiStatus = apiResponse?.ok ? 'online' : 'offline';
          
          // Simulate database check
          const dbStatus = 'online'; // In production, this would be a real check
          
          set({
            systemStatus: {
              database: dbStatus,
              api: apiStatus,
              lastChecked: new Date(),
            }
          });
        } catch (error) {
          set({
            systemStatus: {
              database: 'offline',
              api: 'offline',
              lastChecked: new Date(),
            }
          });
        }
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        dashboardFilter: state.dashboardFilter,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
        notificationPreference: state.notificationPreference,
      }),
    }
  )
);