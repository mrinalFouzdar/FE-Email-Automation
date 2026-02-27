import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { projectService, Project, ProjectClient } from '../../services/project.service';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

const ProjectManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [clients, setClients] = useState<ProjectClient[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientPriority, setNewClientPriority] = useState(2); // Medium default

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            fetchProjects(selectedUserId);
            setSelectedProjectId(null);
            setClients([]);
        }
    }, [selectedUserId]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchClients(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            // Filter out admins from the list
            const regularUsers = (response.data.data || []).filter((u: User) => u.role !== 'admin');
            setUsers(regularUsers);

            // Auto-select first user if available
            if (regularUsers.length > 0) {
                setSelectedUserId(regularUsers[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async (userId: number) => {
        try {
            const data = await projectService.getProjects(userId);
            setProjects(data.data || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            toast.error('Failed to load projects');
        }
    };

    const fetchClients = async (projectId: number) => {
        try {
            const data = await projectService.getProjectClients(projectId);
            setClients(data.data || []);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            toast.error('Failed to load clients');
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newProjectName.trim()) return;

        try {
            setIsSubmitting(true);
            await projectService.createProject({
                user_id: selectedUserId,
                name: newProjectName,
                description: newProjectDesc
            });
            toast.success('Project created successfully');
            setNewProjectName('');
            setNewProjectDesc('');
            fetchProjects(selectedUserId);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId || !newClientEmail.trim()) return;

        try {
            setIsSubmitting(true);
            await projectService.addProjectClient({
                project_id: selectedProjectId,
                email: newClientEmail,
                priority: newClientPriority
            });
            toast.success('Client added successfully');
            setNewClientEmail('');
            fetchClients(selectedProjectId);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add client');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!window.confirm('Are you sure you want to delete this project? All associated client email mappings will be lost.')) return;

        try {
            await projectService.deleteProject(projectId);
            toast.success('Project deleted');
            if (selectedProjectId === projectId) {
                setSelectedProjectId(null);
                setClients([]);
            }
            fetchProjects(selectedUserId!);
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const handleRemoveClient = async (email: string) => {
        try {
            await projectService.removeProjectClient(selectedProjectId!, email);
            toast.success('Client removed');
            fetchClients(selectedProjectId!);
        } catch (error) {
            toast.error('Failed to remove client');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading management interface...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Project & Client Management</h1>
                <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <span className="text-sm font-semibold text-gray-500">Select User:</span>
                    <select
                        className="bg-gray-50 border-none rounded-lg text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                    >
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Projects Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Projects</h2>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                {projects.length} Total
                            </span>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleCreateProject} className="mb-6 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Project Name"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Description (Optional)"
                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                    />
                                    <button
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {projects.length === 0 ? (
                                    <p className="text-center text-gray-500 py-10 italic">No projects created yet for this user.</p>
                                ) : (
                                    projects.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedProjectId(p.id)}
                                            className={`group p-4 rounded-2xl border transition-all cursor-pointer ${selectedProjectId === p.id
                                                ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200'
                                                : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                                                    {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full min-h-[600px] flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {selectedProjectId
                                    ? `Clients for "${projects.find(p => p.id === selectedProjectId)?.name}"`
                                    : 'Select a project to manage clients'
                                }
                            </h2>
                        </div>

                        {selectedProjectId ? (
                            <div className="p-6 flex-1 flex flex-col">
                                <form onSubmit={handleAddClient} className="mb-8 space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Client Email</label>
                                            <input
                                                type="email"
                                                placeholder="client@example.com"
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={newClientEmail}
                                                onChange={(e) => setNewClientEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 ml-1">Priority</label>
                                            <select
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={newClientPriority}
                                                onChange={(e) => setNewClientPriority(parseInt(e.target.value))}
                                            >
                                                <option value={3}>High Priority 🔥</option>
                                                <option value={2}>Medium Priority ⚡</option>
                                                <option value={1}>Low Priority ❄️</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                                    >
                                        <span>➕ Add Client Mapping</span>
                                    </button>
                                </form>

                                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                    {clients.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="text-4xl mb-4">📧</div>
                                            <p className="text-gray-500">No client emails mapped to this project yet.</p>
                                        </div>
                                    ) : (
                                        clients.map(c => (
                                            <div key={c.id} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-3 h-3 rounded-full ${c.priority === 3 ? 'bg-red-500 animate-pulse' :
                                                        c.priority === 2 ? 'bg-yellow-500' : 'bg-blue-400'
                                                        }`}></div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{c.email}</p>
                                                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                                            {c.priority === 3 ? 'High Priority' :
                                                                c.priority === 2 ? 'Medium Priority' : 'Low Priority'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveClient(c.email)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-gray-400">
                                <div className="text-6xl mb-6">📁</div>
                                <p className="text-lg">Select a project from the list on the left to see and manage its client email mappings.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagement;
