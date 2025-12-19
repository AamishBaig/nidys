import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  isTextarea?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onChange, className, isTextarea = false }) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if(localValue.trim() !== value) {
            onChange(localValue.trim());
        } else {
           setLocalValue(value); // revert if unchanged or just spaces
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isTextarea) {
            (e.target as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
            setLocalValue(value);
            (e.target as HTMLElement).blur();
        }
    };

    const Element = isTextarea ? 'textarea' : 'input';

    return (
        <Element
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`bg-transparent p-0 m-0 border-none focus:ring-0 w-full focus:bg-gray-800 rounded px-1 ${isTextarea ? 'resize-none' : ''} ${className}`}
            rows={isTextarea ? 1 : undefined}
        />
    );
};

export default EditableField;
