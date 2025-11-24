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
