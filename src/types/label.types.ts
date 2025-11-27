export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
  is_system: boolean;
  created_by_user_id?: number;
  created_at: string;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
  description?: string;
}
