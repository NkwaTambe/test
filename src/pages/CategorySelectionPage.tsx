import React from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Trophy, Brush } from 'lucide-react';
import EventCategoryCard from '../components/EventCategoryCard';

interface CategorySelectionPageProps {
  onSelectCategory: (category: string) => void;
}

const CategorySelectionPage: React.FC<CategorySelectionPageProps> = ({ onSelectCategory }) => {
  const { t } = useTranslation();

  const categoryDetails = [
    { name: 'Music', icon: <Music className="w-8 h-8 mb-4" /> },
    { name: 'Sports', icon: <Trophy className="w-8 h-8 mb-4" /> },
    { name: 'Art', icon: <Brush className="w-8 h-8 mb-4" /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="bg-white/80 shadow-xl rounded-3xl px-8 py-12 max-w-3xl w-full flex flex-col items-center relative overflow-hidden animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight drop-shadow-sm">
          {t('selectCategoryTitle')}
        </h2>
        <p className="text-lg text-gray-600 mb-8 font-medium max-w-2xl mx-auto">
          {t('selectCategoryDescription')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full animate-fade-in-delay">
          {categoryDetails.map(category => (
            <EventCategoryCard
              key={category.name}
              category={category.name}
              icon={category.icon}
              onClick={() => onSelectCategory(category.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySelectionPage;
