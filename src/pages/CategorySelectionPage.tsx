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
    <div className="text-center py-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('selectCategoryTitle')}</h2>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{t('selectCategoryDescription')}</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto animate-fade-in-delay">
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
  );
};

export default CategorySelectionPage;
