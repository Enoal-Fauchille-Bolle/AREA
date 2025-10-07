const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'auth_token';

export const areasApi = {
  async getAreas(): Promise<Area[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getArea(id: number): Promise<Area> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async createArea(areaData: { component_action_id: number; component_reaction_id: number; name: string; description?: string; is_active: boolean }): Promise<Area> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(areaData),
    });

    return handleResponse(response);
  },

  async createAreaWithParameters(areaData: { component_action_id: number; component_reaction_id: number; name: string; description?: string; is_active: boolean }, parameters: { [parameterName: string]: string }): Promise<Area> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas/create-with-parameters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        area: areaData,
        parameters: parameters
      }),
    });

    return handleResponse(response);
  },

  async updateArea(
    id: number,
    areaData: Partial<CreateAreaRequest>,
  ): Promise<Area> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(areaData),
    });

    return handleResponse(response);
  },

  async deleteArea(id: number): Promise<void> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete area: HTTP ${response.status}`);
    }
  },
};

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
  last_connection?: string;
}

export interface Area {
  id: number;
  user_id: number;
  component_action_id: number;
  component_reaction_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  triggered_count: number;
}

export interface CreateAreaRequest {
  component_action_id: number;
  component_reaction_id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  icon_path: string | null;
  requires_auth: boolean;
  is_active: boolean;
}

export type ComponentType = 'action' | 'reaction';

export interface Component {
  id: number;
  service_id: number;
  type: ComponentType;
  name: string;
  description: string | null;
  is_active: boolean;
  webhook_endpoint: string | null;
  polling_interval: number | null;
  service?: Service;
}

export type VariableKind = 'parameter' | 'return_value';
export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'json';

export interface Variable {
  id: number;
  component_id: number;
  name: string;
  description: string | null;
  kind: VariableKind;
  type: VariableType;
  nullable: boolean;
  placeholder: string | null;
  validation_regex: string | null;
  display_order: number;
  component?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface AreaParameter {
  area_id: number;
  variable_id: number;
  value: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = 'Network error or invalid response';
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const servicesApi = {
  async getServices(): Promise<Service[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getService(id: number): Promise<Service> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const componentsApi = {
  async getComponents(): Promise<Component[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/components`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getComponent(id: number): Promise<Component> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/components/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getComponentsByService(serviceId: number): Promise<Component[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/components/service/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getActionComponents(): Promise<Component[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/components/actions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getReactionComponents(): Promise<Component[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/components/reactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const variablesApi = {
  async getVariablesByComponent(componentId: number): Promise<Variable[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/variables/component/${componentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getInputVariablesByComponent(componentId: number): Promise<Variable[]> {
    console.log('API: Getting input variables for component ID:', componentId);
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/variables/component/${componentId}/inputs`;
    console.log('API: Fetching from URL:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await handleResponse(response);
    console.log('API: Variables result:', result);
    return result;
  },
};

export const areaParametersApi = {
  async createAreaParameter(parameterData: { area_id: number; variable_id: number; value: string }): Promise<AreaParameter> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/area-parameters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parameterData),
    });

    return handleResponse(response);
  },

  async getParametersByArea(areaId: number): Promise<AreaParameter[]> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/area-parameters?area_id=${areaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const authApi = {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting registration with:', {
        email: userData.email,
        username: userData.username,
        password: '[HIDDEN]',
      });
      console.log('API URL:', `${API_BASE_URL}/auth/register`);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);
      console.log(
        'Response headers:',
        Object.fromEntries(response.headers.entries()),
      );

      return handleResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return handleResponse(response);
  },

  async getProfile(): Promise<UserProfile> {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log('Fetching user profile...');
      console.log('API URL:', `${API_BASE_URL}/auth/me`);
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Profile response status:', response.status);
      return handleResponse(response);
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },
};

export const tokenService = {
  setToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  },

  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to remove token from localStorage:', error);
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!(token && token.length > 0);
  },

  isValidToken(token: string | null): boolean {
    if (!token) return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  },
};
