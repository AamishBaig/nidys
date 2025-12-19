import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MediaManagerContext } from '../context/MediaManagerContext';
import MenuCard from './MenuCard';
import { PlusIcon } from './Icons';

const Menu: React.FC = () => {
  const { menuData, isAdminMode, addMenuItem } = useContext(AppContext);
  const { imageMap } = useContext(MediaManagerContext);

  // ✅ SAFETY CHECK: Handle undefined/null menuData during Firebase load
  if (!menuData || !Array.isArray(menuData)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading menu...</div>
      </div>
    );
  }

  return (
    <div>
      {menuData.map((category) => {
        const isMainsCategory = category.title.toLowerCase() === 'mains';
        const gridClasses = isMainsCategory
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6";

        const itemsToShow = isAdminMode ? category.items : category.items.filter(item => item.isAvailable);
        
        if (itemsToShow.length === 0 && !isAdminMode) {
            return null;
        }
        
        const categoryBackgroundId = itemsToShow.find(item => item.backgroundImageId)?.backgroundImageId;
        const categoryBackgroundUrl = categoryBackgroundId ? imageMap.get(categoryBackgroundId) : undefined;

        return (
            <div key={category.id} className="mb-12">
                <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-amber-400">{category.title}</h2>
                    {isAdminMode && (
                        <button
                            onClick={() => addMenuItem(category.id)}
                            className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors"
                            title={`Add item to ${category.title}`}
                            aria-label={`Add item to ${category.title}`}
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {itemsToShow.length === 0 && isAdminMode && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
                        <p className="text-gray-500">No items in this category.</p>
                        <button onClick={() => addMenuItem(category.id)} className="mt-4 px-4 py-2 text-sm bg-indigo-600 rounded-md hover:bg-indigo-700">Add First Item</button>
                    </div>
                )}
                <div className={`relative grid ${gridClasses} gap-6`}>
                    {itemsToShow.map((item) => (
                        <MenuCard 
                            key={item.id}
                            item={item}
                            categoryId={category.id}
                            categoryTitle={category.title}
                            size={isMainsCategory ? 'large' : 'small'}
                            categoryBackgroundUrl={categoryBackgroundUrl}
                        />
                    ))}
                </div>
            </div>
        );
      })}
    </div>
  );
};

export default Menu;
