import React from 'react';

interface EventCategoryCardProps {
  category: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const EventCategoryCard: React.FC<EventCategoryCardProps> = ({ category, icon, description, onClick }) => {
  return (
    <div
      className="bg-gradient-to-r from-primary-500 to-primary-700 text-white p-6 rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center w-full max-w-xs mx-auto"
      onClick={onClick}
    >
      {icon}
      <h3 className="text-xl font-bold">{category}</h3>
      
    </div>
  );
};

export default EventCategoryCard;
