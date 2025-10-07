import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { servicesApi, componentsApi, areasApi } from '../../services/api';
import type { Service, Component, ComponentType } from '../../services/api';

interface CreateAreaStep {
  step: 'action' | 'reaction' | 'config' | 'complete';
}

interface AreaFormData {
  name: string;
  description: string;
  actionService?: Service;
  actionComponent?: Component;
  reactionService?: Service;
  reactionComponent?: Component;
}

const CreateArea: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CreateAreaStep['step']>('action');
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    description: '',
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [actionComponents, setActionComponents] = useState<Component[]>([]);
  const [reactionComponents, setReactionComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleExplore = () => {
    navigate('/explore');
  };

  const handleMyAreas = () => {
    navigate('/profile');
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('.profile-menu-container')) {
          setIsProfileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const servicesData = await servicesApi.getServices();
        setServices(servicesData.filter((service: Service) => service.is_active));
      } catch (err) {
        setError('Erreur lors du chargement des services');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const loadServiceComponents = async (serviceId: number, type: ComponentType) => {
    try {
      const components = await componentsApi.getComponentsByService(serviceId);
      const filteredComponents = components.filter(
        (component: Component) => component.type === type && component.is_active
      );
      if (type === 'action') {
        setActionComponents(filteredComponents);
      } else {
        setReactionComponents(filteredComponents);
      }
    } catch (err) {
      setError(`Erreur lors du chargement des composants ${type}`);
      console.error(`Error fetching ${type} components:`, err);
    }
  };

  const handleActionServiceSelect = (service: Service) => {
    setFormData(prev => ({
      ...prev,
      actionService: service,
      actionComponent: undefined
    }));
    loadServiceComponents(service.id, 'action');
  };

  const handleReactionServiceSelect = (service: Service) => {
    setFormData(prev => ({
      ...prev,
      reactionService: service,
      reactionComponent: undefined
    }));
    loadServiceComponents(service.id, 'reaction');
  };

  const handleActionComponentSelect = (component: Component) => {
    setFormData(prev => ({
      ...prev,
      actionComponent: component
    }));
    setCurrentStep('reaction');
  };

  const handleReactionComponentSelect = (component: Component) => {
    setFormData(prev => ({
      ...prev,
      reactionComponent: component
    }));
    setCurrentStep('config');
  };

  const handleCreateArea = async () => {
    if (!formData.actionComponent || !formData.reactionComponent) {
      setError('Veuillez sélectionner une action et une réaction');
      return;
    }

    if (!formData.name.trim()) {
      setError('Veuillez entrer un nom pour votre AREA');
      return;
    }

    try {
      setLoading(true);
      await areasApi.createArea({
        component_action_id: formData.actionComponent.id,
        component_reaction_id: formData.reactionComponent.id,
        name: formData.name,
        description: formData.description || undefined,
        is_active: true
      });
      setCurrentStep('complete');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError('Erreur lors de la création de l\'AREA');
      console.error('Error creating area:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'action' ? 'bg-blue-600 text-white' :
          ['reaction', 'config', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          1
        </div>
        <div className="w-16 h-0.5 bg-gray-600">
          <div className={`h-full transition-all duration-300 ${
            ['reaction', 'config', 'complete'].includes(currentStep) ? 'bg-green-600 w-full' : 'bg-gray-600 w-0'
          }`} />
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'reaction' ? 'bg-blue-600 text-white' :
          ['config', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          2
        </div>
        <div className="w-16 h-0.5 bg-gray-600">
          <div className={`h-full transition-all duration-300 ${
            ['config', 'complete'].includes(currentStep) ? 'bg-green-600 w-full' : 'bg-gray-600 w-0'
          }`} />
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'config' ? 'bg-blue-600 text-white' :
          currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  const renderServiceSelection = (
    title: string,
    selectedService: Service | undefined,
    onServiceSelect: (service: Service) => void
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onServiceSelect(service)}
            className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
              selectedService?.id === service.id
                ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              {service.icon_path ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src={service.icon_path}
                    alt={service.name}
                    className="w-6 h-6"
                    crossOrigin="anonymous"
                    onLoad={() => {
                      console.log(`Icon loaded successfully for ${service.name}:`, service.icon_path);
                    }}
                    onError={(e) => {
                      console.error(`Failed to load icon for ${service.name}:`, service.icon_path);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center" style={{ display: 'none' }}>
                    <span className="text-gray-300 text-sm font-medium">
                      {service.name.charAt(0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-gray-300 text-sm font-medium">
                    {service.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-white">{service.name}</p>
                <p className="text-sm text-gray-400">{service.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderComponentSelection = (
    title: string,
    components: Component[],
    selectedComponent: Component | undefined,
    onComponentSelect: (component: Component) => void
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {components.length === 0 ? (
        <p className="text-gray-400">Aucun composant disponible pour ce service.</p>
      ) : (
        <div className="space-y-2">
          {components.map((component) => (
            <button
              key={component.id}
              onClick={() => onComponentSelect(component)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                selectedComponent?.id === component.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700'
              }`}
            >
              <h4 className="font-medium text-white">{component.name}</h4>
              <p className="text-sm text-gray-400 mt-1">{component.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'action':
        return (
          <div className="space-y-8">
            {renderServiceSelection(
              'Choisissez un service pour l\'action (déclencheur)',
              formData.actionService,
              handleActionServiceSelect
            )}
            {formData.actionService && (
              <div>
                {renderComponentSelection(
                  `Actions disponibles pour ${formData.actionService.name}`,
                  actionComponents,
                  formData.actionComponent,
                  handleActionComponentSelect
                )}
              </div>
            )}
          </div>
        );

      case 'reaction':
        return (
          <div className="space-y-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Action sélectionnée ✓</h3>
              <p className="text-green-700">
                {formData.actionService?.name} - {formData.actionComponent?.name}
              </p>
            </div>
            {renderServiceSelection(
              'Choisissez un service pour la réaction',
              formData.reactionService,
              handleReactionServiceSelect
            )}
            {formData.reactionService && (
              <div>
                {renderComponentSelection(
                  `Réactions disponibles pour ${formData.reactionService.name}`,
                  reactionComponents,
                  formData.reactionComponent,
                  handleReactionComponentSelect
                )}
              </div>
            )}
          </div>
        );

      case 'config':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg border border-blue-500">
                <h3 className="font-medium text-blue-300">Action ✓</h3>
                <p className="text-blue-200">
                  {formData.actionService?.name} - {formData.actionComponent?.name}
                </p>
              </div>
              <div className="bg-green-900 bg-opacity-50 p-4 rounded-lg border border-green-500">
                <h3 className="font-medium text-green-300">Réaction ✓</h3>
                <p className="text-green-200">
                  {formData.reactionService?.name} - {formData.reactionComponent?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Nom de l'AREA *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Auto-réponse email"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez ce que fait votre AREA"
                />
              </div>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <p className="text-gray-400">
                  Configuration avancée à venir...
                  <br />
                  <span className="text-sm">
                    (Paramètres spécifiques à l'action/réaction sélectionnée)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('reaction')}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleCreateArea}
                disabled={loading || !formData.name.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Création...' : 'Créer l\'AREA'}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-900 bg-opacity-50 border border-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">AREA créée avec succès !</h2>
            <p className="text-gray-400">Redirection vers votre profil...</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Accès refusé</h1>
          <p className="text-gray-400 mb-4">Vous devez être connecté pour créer une AREA.</p>
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-4xl font-bold">AREA</span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={handleExplore}
              className="text-xl font-semibold text-gray-300 hover:text-white hover:scale-105 transform transition-all duration-300"
            >
              Explore
            </button>
            <button
              onClick={handleMyAreas}
              className="text-xl font-semibold text-gray-300 hover:text-white hover:scale-105 transform transition-all duration-300"
            >
              My Areas
            </button>
            <span className="text-xl font-semibold text-black bg-white bg-opacity-10 px-4 py-2 rounded-lg">
              Create
            </span>
            <div className="relative profile-menu-container">
              <button
                onClick={toggleProfileMenu}
                className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    <div className="font-semibold">
                      {user
                        ? `${user.username}`
                        : 'Loading...'}
                    </div>
                    <div
                      className="text-gray-400 text-xs truncate"
                      title={user?.email || 'Loading...'}
                    >
                      {user?.email || 'Loading...'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      console.log('Profile settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Créer une nouvelle AREA</h1>
            <p className="text-gray-400">
              Configurez une automatisation en choisissant une action déclencheuse et une réaction
            </p>
          </div>

          {renderStepIndicator()}

          {error && (
            <div className="mb-6 bg-red-900 bg-opacity-50 border border-red-700 rounded-md p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {loading && currentStep !== 'config' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 text-sm text-gray-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg shadow-sm p-6">
            {renderStepContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateArea;