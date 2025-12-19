import React, { useState } from 'react';

interface TimePickerProps {
  onSelect: (time: string) => void;
  onClose: () => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ onSelect, onClose }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('PM');

  const handleSelect = () => {
    onSelect(`${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} ${period}`);
  };

  return (
    <div className="absolute z-50 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Hours */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-semibold text-center mb-2">Hour</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
              <button key={h} onClick={() => setHour(h)} className={`w-full py-1 rounded ${hour === h ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>{h}</button>
            ))}
          </div>
        </div>

        {/* Minutes */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-semibold text-center mb-2">Min</div>
          <div className="space-y-1">
            {[0, 15, 30, 45].map(m => (
              <button key={m} onClick={() => setMinute(m)} className={`w-full py-1 rounded ${minute === m ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>{m.toString().padStart(2,'0')}</button>
            ))}
          </div>
        </div>

        {/* AM/PM */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-semibold text-center mb-2">Period</div>
          <div className="space-y-1">
            {['AM', 'PM'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`w-full py-1 rounded ${period === p ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSelect} className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md font-semibold">
        Set Time
      </button>
    </div>
  );
};

export default TimePicker;
