import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const GitHubInstallCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');

    if (window.opener) {
      if (installationId && setupAction === 'install') {
        window.opener.postMessage(
          {
            type: 'GITHUB_APP_INSTALLED',
            installationId: installationId,
          },
          window.location.origin,
        );
      }

      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Installation réussie !
        </h1>
        <p className="text-gray-300 mb-6">
          L'application GitHub AREA a été installée avec succès sur votre
          compte.
        </p>
        <p className="text-sm text-gray-400">
          {window.opener
            ? 'Cette fenêtre va se fermer automatiquement...'
            : "Vous allez être redirigé vers la page d'accueil..."}
        </p>
      </div>
    </div>
  );
};

export default GitHubInstallCallback;
