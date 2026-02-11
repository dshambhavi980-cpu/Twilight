import React from 'react';
import { motion } from 'framer-motion';

interface RelationshipWeatherProps {
  phase: string;
  cycleDay: number;
  nextPeriodIn: number;
  mood?: string;
}

const RelationshipWeather: React.FC<RelationshipWeatherProps> = ({ 
  phase, 
  cycleDay, 
  nextPeriodIn,
  mood
}) => {
  // Determine status color and message
  let statusColor = 'bg-green-500';
  let message = 'Smooth Sailing';
  let icon = 'sunny';
  
  if (phase === 'Menstrual') {
    statusColor = 'bg-red-500';
    message = 'Period Care Mode';
    icon = 'water_drop';
  } else if (phase === 'Luteal' && nextPeriodIn <= 5) {
    statusColor = 'bg-yellow-500';
    message = 'PMS Warning';
    icon = 'thunderstorm';
  } else if (phase === 'Ovulation') {
    statusColor = 'bg-pink-500';
    message = 'High Energy'; 
    icon = 'favorite';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#121014] dark:text-white">Relationship Forecast</h3>
          <p className="text-sm text-gray-400">Based on her cycle</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${statusColor}/20 flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-2xl ${statusColor.replace('bg-', 'text-')}`}>
            {icon}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-3 h-full absolute left-0 top-0 bottom-0 ${statusColor}`} />
        <div className="pl-2">
          <h2 className="text-3xl font-bold text-[#121014] dark:text-white mb-1">{message}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {phase} Phase • Day {cycleDay}
          </p>
        </div>
      </div>

      {nextPeriodIn <= 7 && (
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-gray-400">event</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Next period expected in <span className="font-bold">{nextPeriodIn} days</span>
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default RelationshipWeather;
