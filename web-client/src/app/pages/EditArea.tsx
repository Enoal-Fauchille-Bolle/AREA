import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { areasApi, areaParametersApi } from '../../services/api';
import type { Area, AreaParameter } from '../../services/api';

type ParameterVariable = NonNullable<AreaParameter['variable']>;

function EditArea() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [actionVariables, setActionVariables] = useState<ParameterVariable[]>(
    [],
  );
  const [reactionVariables, setReactionVariables] = useState<
    ParameterVariable[]
  >([]);
  const [parameters, setParameters] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadArea = async () => {
      if (!id) {
        setError('No area ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const areaData = await areasApi.getArea(Number(id));
        setArea(areaData);
        setFormData({
          name: areaData.name,
          description: areaData.description || '',
          is_active: areaData.is_active,
        });

        const existingParams = await areaParametersApi.getParametersByArea(
          Number(id),
        );

        const actionVarsList: ParameterVariable[] = [];
        const reactionVarsList: ParameterVariable[] = [];
        const paramsMap: Record<number, string> = {};

        existingParams.forEach((param) => {
          if (param.variable) {
            if (param.variable.component_id === areaData.component_action_id) {
              actionVarsList.push(param.variable);
            } else if (
              param.variable.component_id === areaData.component_reaction_id
            ) {
              reactionVarsList.push(param.variable);
            }
            paramsMap[param.variable_id] = param.value;
          }
        });

        setActionVariables(actionVarsList);
        setReactionVariables(reactionVarsList);
        setParameters(paramsMap);

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load area:', err);
        setError('Failed to load area');
        setIsLoading(false);
      }
    };

    loadArea();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await areasApi.updateArea(Number(id), formData);

      const parametersList = Object.entries(parameters).map(
        ([variableId, value]) => ({
          variable_id: Number(variableId),
          value: value,
        }),
      );

      if (parametersList.length > 0) {
        await areaParametersApi.bulkCreateOrUpdate(Number(id), parametersList);
      }

      navigate('/profile');
    } catch (err) {
      console.error('Failed to update area:', err);
      setError('Failed to update area');
    }
  };

  const handleParameterChange = (variableId: number, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [variableId]: value,
    }));
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Loading area...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error</div>
          <div className="text-gray-400 mb-6">{error || 'Area not found'}</div>
          <button
            onClick={handleCancel}
            className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Edit Area</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Area Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter area name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe what this area does"
                rows={4}
              />
            </div>

            {actionVariables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-400">
                  Action Parameters
                </h3>
                {actionVariables.map((variable) => (
                  <div key={variable.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {variable.name}
                      {!variable.nullable && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {variable.description}
                      </p>
                    )}
                    <input
                      type={
                        variable.type === 'number'
                          ? 'number'
                          : variable.type === 'email'
                            ? 'email'
                            : variable.type === 'url'
                              ? 'url'
                              : 'text'
                      }
                      value={parameters[variable.id] || ''}
                      onChange={(e) =>
                        handleParameterChange(variable.id, e.target.value)
                      }
                      placeholder={
                        variable.placeholder || `Enter ${variable.name}`
                      }
                      required={!variable.nullable}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {reactionVariables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-green-400">
                  Reaction Parameters
                </h3>
                {reactionVariables.map((variable) => (
                  <div key={variable.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {variable.name}
                      {!variable.nullable && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {variable.description}
                      </p>
                    )}
                    <input
                      type={
                        variable.type === 'number'
                          ? 'number'
                          : variable.type === 'email'
                            ? 'email'
                            : variable.type === 'url'
                              ? 'url'
                              : 'text'
                      }
                      value={parameters[variable.id] || ''}
                      onChange={(e) =>
                        handleParameterChange(variable.id, e.target.value)
                      }
                      placeholder={
                        variable.placeholder || `Enter ${variable.name}`
                      }
                      required={!variable.nullable}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-5 h-5 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 text-blue-600"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Active (Area will execute when triggered)
              </label>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Created {new Date(area.created_at).toLocaleDateString()} • Last
            updated {new Date(area.updated_at).toLocaleDateString()}
          </p>
          {area.last_triggered_at && (
            <p className="text-sm text-gray-500 mt-1">
              Last triggered{' '}
              {new Date(area.last_triggered_at).toLocaleDateString()} •
              Triggered {area.triggered_count} times
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default EditArea;
