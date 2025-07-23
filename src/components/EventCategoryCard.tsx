import React from 'react';

interface EventCategoryCardProps {
  category: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const EventCategoryCard: React.FC<EventCategoryCardProps> = ({ category, icon,  onClick }) => {
  return (
    <div
      className="bg-white border-2 border-transparent hover:border-blue-400 transition-all duration-300 shadow-lg rounded-2xl cursor-pointer transform hover:scale-105 flex flex-col items-center justify-center w-full max-w-xs mx-auto p-8 group relative overflow-hidden"
      onClick={onClick}
    >
      <div className="bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 p-4 rounded-full shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1 drop-shadow-sm">{category}</h3>
    </div>
  );
};

export default EventCategoryCard;
