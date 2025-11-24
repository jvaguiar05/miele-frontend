import { create } from 'zustand';

// ⚠️ TEMPORÁRIO: Este store está desabilitado até que as tabelas sejam criadas no Supabase
// Execute SUPABASE_SETUP.sql no Supabase Dashboard e depois descomente este código

export interface Annotation {
  id: string;
  user_id: string;
  entity_type: 'client' | 'perdcomp';
  entity_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export interface CreateAnnotationInput {
  entity_type: 'client' | 'perdcomp';
  entity_id: number;
  content: string;
}

interface AnnotationState {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  fetchAnnotations: (entityType: 'client' | 'perdcomp', entityId: number) => Promise<void>;
  createAnnotation: (input: CreateAnnotationInput) => Promise<void>;
  updateAnnotation: (id: string, content: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  isLoading: false,
  error: null,

  fetchAnnotations: async (entityType: 'client' | 'perdcomp', entityId: number) => {
    // Mock implementation - replace after running SQL
    set({ annotations: [], isLoading: false });
  },

  createAnnotation: async (input: CreateAnnotationInput) => {
    // Mock implementation - replace after running SQL
    console.warn('Annotations feature disabled until Supabase tables are created');
  },

  updateAnnotation: async (id: string, content: string) => {
    // Mock implementation - replace after running SQL
    console.warn('Annotations feature disabled until Supabase tables are created');
  },

  deleteAnnotation: async (id: string) => {
    // Mock implementation - replace after running SQL
    console.warn('Annotations feature disabled until Supabase tables are created');
  },
}));

/* 
===========================================
CÓDIGO COMPLETO (descomente após criar as tabelas no Supabase):
===========================================

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Annotation, CreateAnnotationInput } from '@/types/annotations';

interface AnnotationState {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  fetchAnnotations: (entityType: 'client' | 'perdcomp', entityId: number) => Promise<void>;
  createAnnotation: (input: CreateAnnotationInput) => Promise<void>;
  updateAnnotation: (id: string, content: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  isLoading: false,
  error: null,

  fetchAnnotations: async (entityType: 'client' | 'perdcomp', entityId: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('annotations')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ annotations: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createAnnotation: async (input: CreateAnnotationInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('annotations')
        .insert({
          user_id: user.id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          content: input.content,
        });

      if (error) throw error;

      await get().fetchAnnotations(input.entity_type, input.entity_id);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateAnnotation: async (id: string, content: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('annotations')
        .update({ content })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        annotations: state.annotations.map(a =>
          a.id === id ? { ...a, content, updated_at: new Date().toISOString() } : a
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteAnnotation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        annotations: state.annotations.filter(a => a.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));

*/
