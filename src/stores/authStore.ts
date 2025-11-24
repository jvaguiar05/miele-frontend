import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

interface UserRole {
  role: 'admin' | 'user' | 'moderator';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsTestUser: () => void;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      roles: [],
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,

      signUp: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true });
        try {
          const redirectUrl = `${window.location.origin}/`;
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`,
              }
            }
          });

          if (error) throw error;

          // Role is automatically assigned via trigger in database
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
          });

          // Fetch profile and roles
          await get().getCurrentUser();
          
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInAsTestUser: () => {
        // Temporary test user - bypasses authentication
        const testUser = {
          id: 'test-user-123',
          email: 'teste@miele.com',
          app_metadata: {},
          user_metadata: {
            full_name: 'Usuário Teste',
            first_name: 'Usuário',
            last_name: 'Teste'
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated',
          updated_at: new Date().toISOString(),
        } as User;

        const testSession = {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: testUser,
        } as Session;

        set({
          user: testUser,
          session: testSession,
          profile: {
            id: testUser.id,
            full_name: 'Usuário Teste',
            avatar_url: null,
            phone: null,
          },
          roles: [],
          isAuthenticated: true,
          isAdmin: false,
        });
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            profile: null,
            roles: [],
            isAuthenticated: false,
            isAdmin: false,
          });
        } catch (error) {
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            set({
              user: null,
              profile: null,
              roles: [],
              isAuthenticated: false,
              isAdmin: false,
            });
            return;
          }

          // Fetch profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // Fetch user roles from Supabase
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const isAdmin = roles?.some(r => r.role === 'admin') || false;

          set({
            user,
            profile: profile || {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: null,
              phone: null,
            },
            roles: roles || [],
            isAuthenticated: true,
            isAdmin,
          });
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      },

      updateProfile: async (data: Partial<Profile>) => {
        const { user } = get();
        if (!user) throw new Error('No user logged in');

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

          if (error) throw error;
          await get().getCurrentUser();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initialize: () => {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            set({
              session,
              user: session?.user ?? null,
              isAuthenticated: !!session,
            });

            // Defer profile/roles fetch to avoid deadlock
            if (session?.user) {
              setTimeout(() => {
                get().getCurrentUser();
              }, 0);
            } else {
              set({
                profile: null,
                roles: [],
                isAdmin: false,
              });
            }
          }
        );

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
          set({
            session,
            user: session?.user ?? null,
            isAuthenticated: !!session,
          });

          if (session?.user) {
            setTimeout(() => {
              get().getCurrentUser();
            }, 0);
          }
        });

        return () => subscription.unsubscribe();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
