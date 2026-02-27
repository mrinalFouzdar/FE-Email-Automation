import api from './api';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectClient {
  id: number;
  project_id: number;
  email: string;
  priority: number;
  created_at: string;
}

export const projectService = {
  /**
   * Get all projects for a user
   */
  getProjects: async (userId: number) => {
    const response = await api.get(`/projects?userId=${userId}`);
    return response.data;
  },

  /**
   * Create a new project
   */
  createProject: async (data: { user_id: number; name: string; description?: string }) => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  /**
   * Delete a project
   */
  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  /**
   * Get clients for a project
   */
  getProjectClients: async (projectId: number) => {
    const response = await api.get(`/projects/${projectId}/clients`);
    return response.data;
  },

  /**
   * Add a client to a project
   */
  addProjectClient: async (data: { project_id: number; email: string; priority: number }) => {
    const response = await api.post('/projects/clients', data);
    return response.data;
  },

  /**
   * Remove a client from a project
   */
  removeProjectClient: async (projectId: number, email: string) => {
    const response = await api.delete(`/projects/${projectId}/clients/${email}`);
    return response.data;
  },
};
