
import React, { useState } from 'react';

interface CalendarProps {
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ onSelect, onClose }) => {
  const [date, setDate] = useState(new Date());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const changeMonth = (amount: number) => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const renderDays = () => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const totalDays = daysInMonth(month, year);
    const firstDay = firstDayOfMonth(month, year);
    
    const days = [];
    // Blanks for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} className="w-10 h-10"></div>);
    }
    // Month days
    for (let day = 1; day <= totalDays; day++) {
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      days.push(
        <button
          key={day}
          onClick={() => onSelect(new Date(year, month, day))}
          className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors ${isToday ? 'bg-indigo-600' : ''}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="absolute z-50 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700">&lt;</button>
        <div className="font-semibold">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-400 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;
