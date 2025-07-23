import React from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  i18n: I18nInstance;
}

const WelcomeScreen: FC<WelcomeScreenProps> = ({ onGetStarted, i18n }) => {
  const { t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="bg-white/80 shadow-xl rounded-3xl px-8 py-12 max-w-lg w-full flex flex-col items-center relative overflow-hidden">
        {/* Animated Icon/Illustration */}
        <div className="mb-6 animate-fade-in-up">
          <div className="bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 p-4 rounded-full shadow-lg">
            <Sparkles className="w-16 h-16 text-white drop-shadow-lg animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight drop-shadow-sm">
          {t("welcomeTitle")}
        </h2>
        <p className="text-lg text-gray-600 mb-8 font-medium">
          {t("welcomeDescription")}
        </p>
        <div className="flex justify-center space-x-2 mb-8">
          <button
            onClick={() => changeLanguage("en")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border border-gray-300 shadow-sm ${
              i18n.language === "en"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage("fr")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border border-gray-300 shadow-sm ${
              i18n.language === "fr"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
          >
            Français
          </button>
        </div>
        <p className="text-gray-700 text-base mb-8 italic">
          {t("welcomeMoreInfo")}
        </p>
        <button
          onClick={onGetStarted}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl font-bold px-10 py-4 rounded-full shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          {t("getStartedButton")}
        </button>
        {/* Decorative sparkles */}
        <div className="absolute -top-8 -left-8 opacity-20">
          <Sparkles className="w-20 h-20 text-blue-300 animate-spin-slow" />
        </div>
        <div className="absolute -bottom-8 -right-8 opacity-20">
          <Sparkles className="w-20 h-20 text-purple-300 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(WelcomeScreen);
