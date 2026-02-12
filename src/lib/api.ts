// Configuration de l'API (production Vercel)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ucao-backend.vercel.app/api';

// Fonction utilitaire pour les appels API avec authentification
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthEndpoint = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register') || endpoint.startsWith('/auth/forgot-password') || endpoint.startsWith('/auth/reset-password');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
      ? options.headers as Record<string, string>
      : {}),
  };

  // Ne pas envoyer le token sur login/register pour éviter tout conflit
  if (token && !isAuthEndpoint) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// Fonctions d'authentification
export const auth = {
  login: async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    student_number?: string;
    institute?: string;
    niveau?: string;
    filiere?: string;
  }) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getUser: async () => {
    const res = await apiRequest('/auth/user');
    return res.json();
  },

  updateProfile: async (data: { name?: string; email?: string; phone?: string; address?: string }) => {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /** Affectations du formateur connecté (institut, semestre, année, cours). */
  getMyAssignments: async () => {
    const res = await apiRequest('/auth/assignments');
    return res.json();
  },

  /** Demande de réinitialisation du mot de passe (envoi email avec lien). */
  forgotPassword: async (email: string) => {
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  /** Réinitialisation du mot de passe avec le token reçu par email. */
  resetPassword: async (token: string, password: string) => {
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return res.json();
  },
};

/** Paramètres plateforme (semestre et année en cours) — lecture publique */
export const settings = {
  get: async (): Promise<{ current_semester: string; current_academic_year: number }> => {
    const res = await apiRequest('/settings');
    return res.json();
  },
};

/** Filières — lecture publique (formulaires inscription, cours, etc.) */
export const filieres = {
  get: async (institute?: string): Promise<{ _id: string; institut: string; name: string; order?: number }[]> => {
    const params = institute ? `?institute=${encodeURIComponent(institute)}` : '';
    const res = await apiRequest(`/filieres${params}`);
    return res.json();
  },
};

// Fonctions pour les cours
export const courses = {
  getAll: async (filters?: {
    filiere?: string;
    niveau?: string;
    institution?: string;
    search?: string;
    semester?: string;
    academic_year?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.filiere) params.append('filiere', filters.filiere);
    if (filters?.niveau) params.append('niveau', filters.niveau);
    if (filters?.institution) params.append('institution', filters.institution);
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.academic_year != null) params.append('academic_year', String(filters.academic_year));
    const query = params.toString();
    const res = await apiRequest(`/courses${query ? `?${query}` : ''}`);
    return res.json();
  },

  getMine: async (filters?: { search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    const query = params.toString();
    const res = await apiRequest(`/courses/mine${query ? `?${query}` : ''}`);
    return res.json();
  },

  getOne: async (id: string) => {
    const res = await apiRequest(`/courses/${id}`);
    return res.json();
  },

  create: async (data: Record<string, unknown>) => {
    const res = await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string) => {
    const res = await apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  uploadResource: async (courseId: string, file: File) => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'https://ucao-backend.vercel.app/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${url}/courses/${courseId}/resources`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    return res.json();
  },

  deleteResource: async (courseId: string, resourceId: string) => {
    const res = await apiRequest(`/courses/${courseId}/resources/${resourceId}`, {
      method: 'DELETE',
    });
    return res;
  },
};

// Fonctions pour les discussions
export const discussions = {
  getAll: async (opts?: { courseId?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (opts?.courseId) params.append('course_id', opts.courseId);
    if (opts?.search?.trim()) params.append('search', opts.search.trim());
    const query = params.toString();
    const res = await apiRequest(`/discussions${query ? `?${query}` : ''}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Impossible de charger les discussions.');
    }
    return data;
  },

  getOne: async (id: string) => {
    const res = await apiRequest(`/discussions/${id}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Discussion introuvable.');
    }
    return data;
  },

  create: async (data: { title: string; content: string; course_id?: string }) => {
    const res = await apiRequest('/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  addReply: async (discussionId: string, content: string) => {
    const res = await apiRequest(`/discussions/${discussionId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
};

// Fonctions pour les actualités (getAll/getOne publics ; create/update/delete avec token admin)
export const news = {
  getAll: async (params?: { status?: string; institut?: string; limit?: number; page?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.institut) search.set('institut', params.institut);
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.page != null) search.set('page', String(params.page));
    const q = search.toString();
    const res = await apiRequest(`/news${q ? `?${q}` : ''}`);
    return res.json();
  },

  getOne: async (id: string) => {
    const res = await apiRequest(`/news/${id}`);
    return res.json();
  },

  create: async (data: { title: string; content: string; status?: string; institut?: string }) => {
    const res = await apiRequest('/news', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la création');
    return out;
  },

  update: async (id: string, data: { title?: string; content?: string; status?: string; institut?: string }) => {
    const res = await apiRequest(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la mise à jour');
    return out;
  },

  delete: async (id: string) => {
    const res = await apiRequest(`/news/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || 'Erreur lors de la suppression');
    }
  },
};

// Guides (liste/détail publics ; CRUD admin via les mêmes routes avec token)
export const guides = {
  getAll: async (params?: { limit?: number; page?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.page != null) search.set('page', String(params.page));
    const q = search.toString();
    const res = await apiRequest(`/guides${q ? `?${q}` : ''}`);
    return res.json();
  },
  getOne: async (id: string) => {
    const res = await apiRequest(`/guides/${id}`);
    return res.json();
  },
  create: async (data: { title: string; content: string; status?: string; order?: number }) => {
    const res = await apiRequest('/guides', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la création');
    return out;
  },
  update: async (id: string, data: { title?: string; content?: string; status?: string; order?: number }) => {
    const res = await apiRequest(`/guides/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la mise à jour');
    return out;
  },
  delete: async (id: string) => {
    const res = await apiRequest(`/guides/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || 'Erreur lors de la suppression');
    }
  },
};

// Outils (liens utiles ; liste publique, CRUD admin)
export const outils = {
  getAll: async (params?: { limit?: number; page?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.page != null) search.set('page', String(params.page));
    const q = search.toString();
    const res = await apiRequest(`/outils${q ? `?${q}` : ''}`);
    return res.json();
  },
  create: async (data: { title: string; description?: string; url: string; order?: number }) => {
    const res = await apiRequest('/outils', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la création');
    return out;
  },
  update: async (id: string, data: { title?: string; description?: string; url?: string; order?: number }) => {
    const res = await apiRequest(`/outils/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error((out as { message?: string }).message || 'Erreur lors de la mise à jour');
    return out;
  },
  delete: async (id: string) => {
    const res = await apiRequest(`/outils/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || 'Erreur lors de la suppression');
    }
  },
};

// Fonctions pour les emplois du temps
export const timetables = {
  getAll: async (filters?: {
    institut?: string;
    filiere?: string;
    niveau?: string;
    day_of_week?: string;
    semester?: string;
    academic_year?: number;
    limit?: number;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.institut) params.append('institut', filters.institut);
    if (filters?.filiere) params.append('filiere', filters.filiere);
    if (filters?.niveau) params.append('niveau', filters.niveau);
    if (filters?.day_of_week) params.append('day_of_week', filters.day_of_week);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.academic_year != null) params.append('academic_year', String(filters.academic_year));
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/timetables${query ? `?${query}` : ''}`);
    return res.json();
  },

  create: async (data: Record<string, unknown>) => {
    const res = await apiRequest('/timetables', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiRequest(`/timetables/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  delete: async (id: string) => {
    const res = await apiRequest(`/timetables/${id}`, { method: 'DELETE' });
    return res;
  },
};

// Fonctions pour les calendriers d'évaluation (examens)
export const evaluationCalendars = {
  getAll: async (filters?: {
    institut?: string;
    filiere?: string;
    niveau?: string;
    course_id?: string;
    semester?: string;
    academic_year?: number;
    limit?: number;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.institut) params.append('institut', filters.institut);
    if (filters?.filiere) params.append('filiere', filters.filiere);
    if (filters?.niveau) params.append('niveau', filters.niveau);
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.academic_year != null) params.append('academic_year', String(filters.academic_year));
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/evaluation-calendars${query ? `?${query}` : ''}`);
    return res.json();
  },

  create: async (data: Record<string, unknown>) => {
    const res = await apiRequest('/evaluation-calendars', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiRequest(`/evaluation-calendars/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  delete: async (id: string) => {
    const res = await apiRequest(`/evaluation-calendars/${id}`, { method: 'DELETE' });
    return res;
  },
};

// Fonctions admin
export const admin = {
  getStats: async () => {
    const res = await apiRequest('/admin/stats');
    return res.json();
  },

  getCourses: async (filters?: { search?: string; institut?: string; semester?: string; academic_year?: number; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    if (filters?.institut && ['DGI', 'ISSJ', 'ISEG'].includes(filters.institut)) params.append('institut', filters.institut);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.academic_year != null) params.append('academic_year', String(filters.academic_year));
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/admin/courses${query ? `?${query}` : ''}`);
    return res.json();
  },

  getUsers: async (filters?: { search?: string; role?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    if (filters?.role) params.append('role', filters.role);
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/admin/users${query ? `?${query}` : ''}`);
    return res.json();
  },

  getUser: async (id: string) => {
    const res = await apiRequest(`/admin/users/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Utilisateur non trouvé');
    return data;
  },

  createUser: async (data: { name: string; email: string; password: string; role?: string; phone?: string; address?: string; institute?: string }) => {
    const res = await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  updateUser: async (id: string, data: { name?: string; email?: string; role?: string; filiere?: string; niveau?: string; institute?: string; student_number?: string; phone?: string; address?: string }) => {
    const res = await apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  deleteUser: async (id: string) => {
    const res = await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
    return res;
  },

  verifyStudentIdentity: async (id: string) => {
    const res = await apiRequest(`/admin/users/${id}/verify-identity`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Erreur lors de la confirmation.');
    return data;
  },

  getCategories: async (filters?: { search?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/admin/categories${query ? `?${query}` : ''}`);
    return res.json();
  },

  getCategory: async (id: string) => {
    const res = await apiRequest(`/admin/categories/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Catégorie non trouvée');
    return data;
  },

  createCategory: async (data: { name: string; description?: string; order?: number }) => {
    const res = await apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  updateCategory: async (id: string, data: { name?: string; description?: string; order?: number }) => {
    const res = await apiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  deleteCategory: async (id: string) => {
    const res = await apiRequest(`/admin/categories/${id}`, { method: 'DELETE' });
    return res;
  },

  getFilieres: async (filters?: { institute?: string; search?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.institute) params.append('institute', filters.institute);
    if (filters?.search?.trim()) params.append('search', filters.search.trim());
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/admin/filieres${query ? `?${query}` : ''}`);
    return res.json();
  },

  createFiliere: async (data: { institut: string; name: string; order?: number }) => {
    const res = await apiRequest('/admin/filieres', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  updateFiliere: async (id: string, data: { name?: string; order?: number }) => {
    const res = await apiRequest(`/admin/filieres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  deleteFiliere: async (id: string) => {
    const res = await apiRequest(`/admin/filieres/${id}`, { method: 'DELETE' });
    return res;
  },

  getInstructorAssignments: async (filters?: { institut?: string; semester?: string; academic_year?: number; user_id?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.institut) params.append('institut', filters.institut);
    if (filters?.semester) params.append('semester', filters.semester);
    if (filters?.academic_year != null) params.append('academic_year', String(filters.academic_year));
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.limit != null) params.append('limit', String(filters.limit));
    if (filters?.page != null) params.append('page', String(filters.page));
    const query = params.toString();
    const res = await apiRequest(`/admin/instructor-assignments${query ? `?${query}` : ''}`);
    return res.json();
  },

  createInstructorAssignment: async (data: { user_id: string; institut: string; semester: string; academic_year: number; course_id: string }) => {
    const res = await apiRequest('/admin/instructor-assignments', { method: 'POST', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la création');
    return out;
  },

  updateInstructorAssignment: async (id: string, data: { user_id?: string; institut?: string; semester?: string; academic_year?: number; course_id?: string }) => {
    const res = await apiRequest(`/admin/instructor-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },

  deleteInstructorAssignment: async (id: string) => {
    return apiRequest(`/admin/instructor-assignments/${id}`, { method: 'DELETE' });
  },

  getSettings: async (): Promise<{ current_semester: string; current_academic_year: number; max_upload_size_mb?: number }> => {
    const res = await apiRequest('/admin/settings');
    return res.json();
  },

  updateSettings: async (data: { current_semester?: string; current_academic_year?: number; max_upload_size_mb?: number }) => {
    const res = await apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.message || 'Erreur lors de la mise à jour');
    return out;
  },
};

