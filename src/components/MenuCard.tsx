import React, { memo, useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { MediaManagerContext } from '../context/MediaManagerContext';
import { MenuItem, Dietary } from '../types';
import { ChiliIcon, MinusIcon, PlusIcon, EyeIcon, EyeSlashIcon, PhotoIcon, CameraIcon, TrashIcon } from './Icons';
import EditableField from './EditableField';
import ConfirmDialog from './ConfirmDialog';

interface MenuCardProps {
  item: MenuItem;
  categoryId: string;
  categoryTitle: string;
  size?: 'large' | 'small';
  categoryBackgroundUrl?: string;
}

const dietaryLabels: Record<keyof Omit<Dietary, 'spicyLevel'>, string> = {
    glutenFree: 'GF', vegetarian: 'VEG', vegan: 'VGN', noSeafood: 'SFD',
};

const MenuCard: React.FC<MenuCardProps> = ({ item, categoryId, categoryTitle, size = 'large', categoryBackgroundUrl }) => {
  const { 
    handleQuantityChange, 
    isAdminMode, 
    updateMenuItem, 
    openMediaManager, 
    deleteMenuItem,
    eventDays, 
    activeEventDayId 
  } = useContext(AppContext);
  const { imageMap } = useContext(MediaManagerContext);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const activeDay = eventDays.find(d => d.id === activeEventDayId) || eventDays[0];
  const quantity = (activeDay?.order[item.id] || 0);
  const isSmall = size === 'small';

  // Minimum Order Quantity Logic for Visuals
  const getQuantityColorClass = (qty: number) => {
    if (qty === 0) return 'text-white';
    if (qty < 6) return 'text-red-500';
    return 'text-green-500';
  };

  const handleFieldChange = (field: keyof MenuItem, value: any) => {
    updateMenuItem(categoryId, item.id, { [field]: value });
  };
  
  const handleDietaryChange = (field: keyof Dietary, value: any) => {
    handleFieldChange('dietary', { ...item.dietary, [field]: value });
  };
  
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMenuItem(categoryId, item.id);
  };
  
  const foregroundImageUrl = item.foregroundImageId ? imageMap.get(item.foregroundImageId) : '';

  const SpiceLevel: React.FC<{ level: number }> = ({ level }) => (
    <div className="flex items-center">
      {[1, 2, 3].map((i) => {
          const isFilled = i <= level;
          const bodyColor = isFilled ? '#DC2626' : '#6B7281';
          const stemColor = isFilled ? '#16A34A' : '#6B7281';

          return (
              <button
                  key={i}
                  onClick={isAdminMode ? () => handleDietaryChange('spicyLevel', isFilled && i === level ? level - 1 : i) : undefined}
                  className={`cursor-pointer disabled:cursor-default transition-transform duration-150 ${isAdminMode ? 'hover:scale-125' : ''}`}
                  disabled={!isAdminMode}
                  type="button"
              >
                  <ChiliIcon className="w-4 h-4" bodyColor={bodyColor} stemColor={stemColor} />
              </button>
          );
      })}
    </div>
);

  return (
    <>
      <div className={`rounded-lg shadow-lg flex flex-col h-full border border-gray-700/50 transition-all duration-300 relative ${isAdminMode ? 'hover:shadow-indigo-500/10 hover:border-indigo-700' : 'hover:shadow-amber-500/10'}`}>
          {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/60 rounded-lg z-30 flex items-center justify-center">
                  {isAdminMode ? 
                      <span className="text-white font-bold text-lg bg-red-600/50 px-3 py-1 rounded-md">UNAVAILABLE</span>
                      : <span className="text-white font-bold text-lg">SOLD OUT</span>
                  }
              </div>
          )}
          
          {isAdminMode && (
              <div className="absolute top-2 right-2 z-40 flex items-center space-x-2">
                  <button 
                      onClick={handleDeleteClick}
                      className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                      title="Delete menu item"
                      type="button"
                  >
                      <TrashIcon className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          handleFieldChange('isAvailable', !item.isAvailable);
                      }} 
                      className="p-1.5 bg-black/50 rounded-full text-white hover:bg-black"
                      type="button"
                  >
                      {item.isAvailable ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                  </button>
              </div>
          )}

          <div className="relative w-full aspect-[4/3] flex-shrink-0 group rounded-t-lg overflow-hidden bg-transparent">
              {categoryBackgroundUrl && (
				<div 
					className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
					style={{ 
						backgroundImage: `url(${categoryBackgroundUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center center',
						filter: 'brightness(0.3)',
					}}
				/>
			)}

              <div className="absolute inset-0 z-10">
                  {foregroundImageUrl && <img loading="lazy" decoding="async" className="w-full h-full object-contain [filter:drop-shadow(0_4px_4px_rgba(0,0,0,0.5))]" src={foregroundImageUrl} alt={isAdminMode ? item.name : ''} />}
              </div>
              {isAdminMode && (
                  <div className="absolute inset-0 z-20 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              openMediaManager((fileId) => handleFieldChange('foregroundImageId', fileId));
                          }} 
                          className="flex flex-col items-center text-white bg-black/50 p-2 rounded-lg hover:bg-indigo-600"
                          type="button"
                      >
                          <CameraIcon className="w-6 h-6 mb-1"/>
                          <span className="text-xs font-semibold">Foreground</span>
                      </button>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              openMediaManager((fileId) => handleFieldChange('backgroundImageId', fileId));
                          }} 
                          className="flex flex-col items-center text-white bg-black/50 p-2 rounded-lg hover:bg-indigo-600"
                          type="button"
                      >
                          <PhotoIcon className="w-6 h-6 mb-1"/>
                          <span className="text-xs font-semibold">Background</span>
                      </button>
                  </div>
              )}
          </div>
          <div className="flex flex-col flex-grow bg-gray-900/70 backdrop-blur-sm rounded-b-lg">
              <div className={`flex flex-col flex-grow ${isSmall ? 'p-3' : 'p-4'}`}>
                  <div className={`flex justify-between items-start mb-1 ${isSmall ? 'min-h-12 flex-col' : ''}`}>
                      {isAdminMode ? (
                          <EditableField value={item.name} onChange={(v) => handleFieldChange('name', v)} className={`font-bold text-amber-400 ${isSmall ? 'text-sm' : 'text-lg'}`} />
                      ) : (
                          <h3 className={`font-bold text-amber-400 ${isSmall ? 'text-sm' : 'text-lg'}`}>{item.name}</h3>
                      )}
                      {categoryTitle !== 'Drinks' && <SpiceLevel level={item.dietary.spicyLevel} />}
                  </div>
                  
                  <div className="flex-grow">
                      {!isSmall && (
                          isAdminMode ? (
                              <EditableField value={item.description} onChange={(v) => handleFieldChange('description', v)} className="text-gray-400 text-sm mt-1" isTextarea />
                          ) : (
                              <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                          )
                      )}
                  </div>
                  
                  <div className={`flex items-center flex-wrap gap-1.5 ${isSmall ? 'my-2' : 'my-3'}`}>
                      {Object.entries(dietaryLabels)
                          .filter(([key]) => isAdminMode || item.dietary[key as keyof typeof dietaryLabels])
                          .map(([key, label]) => {
                              const dietaryKey = key as keyof typeof dietaryLabels;
                              const isChecked = item.dietary[dietaryKey];
                              return (
                                  <button key={key} 
                                      onClick={isAdminMode ? () => handleDietaryChange(dietaryKey, !isChecked) : undefined}
                                      disabled={!isAdminMode}
                                      className={`flex items-center justify-center border-2 rounded-full ${isSmall ? 'w-6 h-6' : 'w-7 h-7'} ${isChecked ? 'border-gray-600 bg-gray-600/10' : 'border-gray-800'} ${isAdminMode ? 'cursor-pointer hover:border-gray-500' : 'cursor-default'}`}
                                      type="button"
                                  >
                                      <span className={`font-bold ${isSmall ? 'text-[10px]' : 'text-xs'} ${isChecked ? 'text-gray-400': 'text-gray-600'}`}>{label}</span>
                                  </button>
                              );
                      })}
                  </div>
              </div>
              <div className={`bg-black/50 ${isSmall ? 'p-3' : 'p-4'}`}>
                  <div className="flex justify-between items-center">
                      <div className={`flex items-center font-bold text-amber-400 ${isSmall ? 'text-base' : 'text-xl'}`}>
                          <span>$</span>
                          {isAdminMode ? (
                            <EditableField value={item.price.toFixed(2)} onChange={(v) => handleFieldChange('price', parseFloat(v) || 0)} className={isSmall ? 'w-12' : 'w-16'} />
                          ) : (
                            <span>{item.price.toFixed(2)}</span>
                          )}
                      </div>
                      <div className="flex items-center bg-gray-800 rounded-full">
                          <button 
                              onClick={() => handleQuantityChange(item.id, quantity - 1)} 
                              className={`text-gray-400 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 ${isSmall ? 'p-1' : 'p-2'}`} 
                              disabled={quantity === 0}
                              type="button"
                          >
                              <MinusIcon className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>
                          <span className={`text-center font-semibold ${getQuantityColorClass(quantity)} ${isSmall ? 'w-5 text-xs' : 'w-8 text-sm'}`}>{quantity}</span>
                          <button 
                              onClick={() => handleQuantityChange(item.id, quantity + 1)} 
                              className={`text-gray-900 bg-amber-400 rounded-full hover:bg-amber-500 transition-colors ${isSmall ? 'p-1' : 'p-2'}`}
                              type="button"
                          >
                              <PlusIcon className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Menu Item"
          message={`Are you sure you want to delete "${item.name}"?`}
          confirmText="Delete"
          isDangerous={true}
      />
    </>
  );
};

export default memo(MenuCard);