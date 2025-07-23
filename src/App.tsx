import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { Languages } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useLabelManagement } from './hooks/useLabelManagement';
import useKeyInitialization from './hooks/useKeyInitialization';
import EventForm from './components/EventForm';
import WelcomeScreen from './components/WelcomeScreen';
import CategorySelectionPage from './pages/CategorySelectionPage';

// Loading spinner component
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-primary-100 flex items-center justify-center font-[Inter] antialiased">
    <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-lg rounded-2xl px-6 py-8 max-w-md w-full text-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-700">{message}</p>
    </div>
  </div>
);

// Error display component
const ErrorDisplay = ({
  error,
  onRetry
}: {
  error: Error;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-primary-100 flex items-center justify-center font-[Inter] antialiased">
    <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-lg rounded-2xl px-6 py-8 max-w-md w-full">
      <h2 className="text-lg font-medium text-gray-900 mb-2">
        Error Initializing Application
      </h2>
      <p className="text-red-600 mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Main App component
const App = memo(() => {
  const { t, i18n } = useTranslation();
  const { keyPair, keyStatus, error, isLoading } = useKeyInitialization();
  const { labels } = useLabelManagement();
  const navigate = useNavigate();

  const handleRetry = useCallback(() => window.location.reload(), []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner message={keyStatus} />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  if (!keyPair || labels.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading application data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-100 flex items-center justify-center font-[Inter] antialiased">
      <Toaster position="top-center" />
      <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-lg rounded-2xl px-6 py-10 max-w-6xl w-full relative">
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <Languages className="w-6 h-6" />
        </button>
        <header className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">
            {t("appTitle")}
          </h1>
          <p className="text-sm text-gray-500">{t("appSubtitle")}</p>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<WelcomeScreen onGetStarted={() => navigate('/select-category')} i18n={i18n} />} />
            <Route path="/select-category" element={<CategorySelectionPage onSelectCategory={(category) => navigate(`/event-form/${category}`)} />} />
            <Route path="/event-form/:category" element={<EventForm labels={labels} keyPair={keyPair} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
});

App.displayName = "App";

export default App;
