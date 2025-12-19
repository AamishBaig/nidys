import React, { createContext, useState, ReactNode, useCallback, useRef, useMemo, useContext, useEffect } from 'react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { MenuCategory, Order, CustomerDetails, Theme, MenuItem, EventDay, SavedOrder, OrderStatus } from '../types';
import { INITIAL_MENU_DATA, INITIAL_THEMES } from '../constants';
import { MediaManagerContext } from './MediaManagerContext';

type MediaManagerCallback = (fileId: string) => void;

interface AppContextProps {
  // Admin State
  isAdminMode: boolean;
  setAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  appTitle: string;
  setAppTitle: React.Dispatch<React.SetStateAction<string>>;

  // Menu State
  menuData: MenuCategory[];
  updateMenuItem: (categoryId: string, itemId: string, updatedItem: Partial<MenuItem>) => void;
  addMenuItem: (categoryId: string) => void;
  deleteMenuItem: (categoryId: string, itemId: string) => void;

  // Multi-Day Order State (NON-PERSISTENT)
  eventDays: EventDay[];
  activeEventDayId: string;
  handleQuantityChange: (itemId: string, newQuantity: number) => void;
  clearOrder: () => void;
  addEventDay: () => void;
  removeEventDay: (dayId: string) => void;
  setActiveEventDay: (dayId: string) => void;
  updateEventDayDetails: (dayId: string, field: keyof EventDay, value: string) => void;

  // Customer Details State (NON-PERSISTENT)
  customerDetails: CustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;

  // Theme State
  theme: Theme;
  setTheme: (themeId: string) => void;
  updateTheme: (themeId: string, updatedFields: Partial<Theme>) => void;
  addTheme: (theme: Theme) => void;
  deleteTheme: (themeId: string) => void;
  processedThemes: Theme[];
  themes: Theme[];

    // Media Manager Modal State
  isMediaManagerOpen: boolean;
  setMediaManagerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMediaManager: (callback: MediaManagerCallback) => void;
  mediaManagerCallback: MediaManagerCallback;

   // Order History State
  orderHistory: SavedOrder[];
  saveCurrentOrder: () => Promise<string>;
  loadOrder: (order: SavedOrder) => void;
  currentOrderId: string | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

  

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

const INITIAL_CUSTOMER_DETAILS: CustomerDetails = {
  name: '',
  email: '',
  business: '',
  address: '',
  contactNumber: '',
  attendees: 1,
  equipmentType: 'Takeaway',
  serviceType: 'Delivery',
  notes: '',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { imageMap } = useContext(MediaManagerContext);

  // --- SAVING INDICATOR ---
  const [isSaving, setIsSaving] = useState(false);
  const savingTimeoutRef = useRef<number | null>(null);

  const signalSaving = useCallback(() => {
    setIsSaving(true);
    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    savingTimeoutRef.current = window.setTimeout(() => setIsSaving(false), 1000);
  }, []);

    // --- FIREBASE PERSISTENT STATE (replaces useLocalStorage) ---
  const [isAdminMode, setAdminMode] = useState(false); // Keep local for security
  const [menuData, setMenuData] = useFirebaseData<MenuCategory[]>('appData', 'menuData', INITIAL_MENU_DATA, signalSaving);
  const [appTitle, setAppTitle] = useFirebaseData<string>('appData', 'appTitle', 'Nidys Thai Van and Catering', signalSaving);
  const [themes, setThemes] = useFirebaseData<Theme[]>('appData', 'themes', INITIAL_THEMES, signalSaving);
  const [activeThemeId, setActiveThemeId] = useFirebaseData<string>('appData', 'activeThemeId', INITIAL_THEMES[0].id, signalSaving);

  // --- ORDER HISTORY (Firebase) ---
  const { orders, saveOrder, updateOrderStatus, generateOrderNumber } = useOrderHistory();
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);


  // --- NON-PERSISTENT USER STATE (useState - resets on refresh) ---
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(INITIAL_CUSTOMER_DETAILS);
  const [eventDays, setEventDays] = useState<EventDay[]>([
    {
      id: 'day-1',
      label: 'Order 1',  // ✅ CHANGED
      dayDate: '',
      dropTime: '',
      event: '',
      notes: '',
      order: {},
    }
  ]);
  const [activeEventDayId, setActiveEventDayId] = useState<string>('day-1');

  // One-time effect to update legacy app title from local storage
  useEffect(() => {
    if (appTitle === 'My Restaurant') {
      setAppTitle('Nidys Thai Van and Catering');
    }
  }, []);

  // --- MEDIA MANAGER MODAL STATE ---
  const [isMediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [mediaManagerCallback, setMediaManagerCallback] = useState<MediaManagerCallback>(() => () => {});

  const openMediaManager = useCallback((callback: MediaManagerCallback) => {
    setMediaManagerCallback(() => callback);
    setMediaManagerOpen(true);
  }, []);

  // --- THEME DERIVED STATE & ACTIONS ---
const processedThemes = useMemo(() => {
  return themes.map(t => ({ ...t, backgroundImage: imageMap.get(t.backgroundImage) || '' }));
}, [themes, imageMap]);

const theme = useMemo(() => {
  // Try to find the active theme
  const foundTheme = processedThemes.find(t => t.id === activeThemeId);
  if (foundTheme) return foundTheme;
  
  // Fallback to first processed theme
  if (processedThemes.length > 0) return processedThemes[0];
  
  // FINAL FALLBACK: Use initial theme if Firebase hasn't loaded yet
  return {
    ...INITIAL_THEMES[0],
    backgroundImage: imageMap.get(INITIAL_THEMES[0].backgroundImage) || ''
  };
}, [activeThemeId, processedThemes, imageMap]);


  const setTheme = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
  }, [setActiveThemeId]);

  const updateTheme = useCallback((themeId: string, updatedFields: Partial<Theme>) => {
    setThemes(prevThemes => prevThemes.map(t => t.id === themeId ? { ...t, ...updatedFields } : t));
  }, [setThemes]);

  const addTheme = useCallback((newTheme: Theme) => {
    setThemes(prevThemes => [...prevThemes, newTheme]);
    setActiveThemeId(newTheme.id);
  }, [setThemes, setActiveThemeId]);

  const deleteTheme = useCallback((themeId: string) => {
    setThemes(prevThemes => {
      const filtered = prevThemes.filter(t => t.id !== themeId);
      if (activeThemeId === themeId && filtered.length > 0) {
        setActiveThemeId(filtered[0].id);
      }
      return filtered;
    });
  }, [setThemes, activeThemeId, setActiveThemeId]);

  // --- MENU ACTIONS ---
  const updateMenuItem = useCallback((categoryId: string, itemId: string, updatedFields: Partial<MenuItem>) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id === categoryId) {
          if ('backgroundImageId' in updatedFields) {
            return {
              ...category,
              items: category.items.map(item => ({ ...item, backgroundImageId: updatedFields.backgroundImageId || null })),
            };
          }
          return {
            ...category,
            items: category.items.map(item => item.id === itemId ? { ...item, ...updatedFields } : item),
          };
        }
        return category;
      });
    });
  }, [setMenuData]);

  const addMenuItem = useCallback((categoryId: string) => {
    const newMenuItem: MenuItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: 'New Menu Item',
      description: 'Enter a description for this item.',
      price: 9.99,
      backgroundImageId: null,
      foregroundImageId: null,
      dietary: { glutenFree: false, vegetarian: false, vegan: false, noSeafood: true, spicyLevel: 0 },
      isAvailable: true,
    };
    setMenuData(prevData =>
      prevData.map(category =>
        category.id === categoryId
          ? { ...category, items: [...category.items, newMenuItem] }
          : category
      )
    );
  }, [setMenuData]);

  const deleteMenuItem = useCallback((categoryId: string, itemId: string) => {
    setMenuData(prevData =>
      prevData.map(category =>
        category.id === categoryId
          ? { ...category, items: category.items.filter(item => item.id !== itemId) }
          : category
      )
    );
  }, [setMenuData]);

  // --- MULTI-DAY ORDER ACTIONS (NON-PERSISTENT) ---
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    setEventDays(prevDays =>
      prevDays.map(day => {
        if (day.id === activeEventDayId) {
          const updatedOrder = { ...day.order };
          if (newQuantity <= 0) {
            delete updatedOrder[itemId];
          } else {
            updatedOrder[itemId] = newQuantity;
          }
          return { ...day, order: updatedOrder };
        }
        return day;
      })
    );
  }, [activeEventDayId]);

  const clearOrder = useCallback(() => {
    setEventDays(prevDays =>
      prevDays.map(day =>
        day.id === activeEventDayId ? { ...day, order: {} } : day
      )
    );
  }, [activeEventDayId]);

  const addEventDay = useCallback(() => {
    const newDayNumber = eventDays.length + 1;
    const newDay: EventDay = {
      id: `day-${Date.now()}`,
      label: `Order ${newDayNumber}`,  // ✅ CHANGED
      dayDate: '',
      dropTime: '',
      event: '',
      notes: '', 
      order: {},
    };
    setEventDays(prev => [...prev, newDay]);
    setActiveEventDayId(newDay.id);
  }, [eventDays.length]);

  const removeEventDay = useCallback((dayId: string) => {
    setEventDays(prev => {
      const filtered = prev.filter(d => d.id !== dayId);
      if (filtered.length === 0) {
        return [{
          id: 'day-1',
          label: 'Order 1',  // ✅ CHANGED
          dayDate: '',
          dropTime: '',
          event: '',
          notes: '',
          order: {},
        }];
      }
      if (activeEventDayId === dayId && filtered.length > 0) {
        setActiveEventDayId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeEventDayId]);

  const setActiveEventDay = useCallback((dayId: string) => {
    setActiveEventDayId(dayId);
  }, []);

    const updateEventDayDetails = useCallback((dayId: string, field: keyof EventDay, value: string) => {
    setEventDays(prevDays =>
      prevDays.map(day =>
        day.id === dayId ? { ...day, [field]: value } : day
      )
    );
  }, []);

  // --- 🆕 ORDER HISTORY ACTIONS ---
  const saveCurrentOrder = useCallback(async (): Promise<string> => {
    const orderNumber = generateOrderNumber();

    const grandSubtotal = eventDays.reduce((sum, day) => {
      const dayTotal = Object.entries(day.order).reduce((daySum, [itemId, qty]) => {
        const item = menuData.flatMap((c) => c.items).find((i) => i.id === itemId);
        return daySum + (item ? item.price * qty : 0);
      }, 0);
      return sum + dayTotal;
    }, 0);

    const serviceFee = customerDetails.serviceType === 'Delivery' ? 40 : customerDetails.serviceType === 'Full Service' ? 100 : 0;
    const gst = grandSubtotal * 0.1;
    const total = grandSubtotal + gst + serviceFee;

    const savedOrder: Omit<SavedOrder, 'id'> = {
      orderNumber,
      timestamp: new Date().toISOString(),
      status: 'sent',
      customerDetails: { ...customerDetails },
      eventDays: eventDays.map((day) => ({ ...day })),
      totals: { subtotal: grandSubtotal, serviceFee, gst, total },
      modifiedFrom: currentOrderId || undefined,
    };

    const newOrderId = await saveOrder(savedOrder);
    setCurrentOrderId(newOrderId);
    return newOrderId;
  }, [eventDays, customerDetails, menuData, currentOrderId, generateOrderNumber, saveOrder]);

  const loadOrder = useCallback((order: SavedOrder) => {
    setCustomerDetails(order.customerDetails);
    setEventDays(order.eventDays);
    setCurrentOrderId(order.id);
    setActiveEventDayId(order.eventDays[0]?.id || 'day-1');
  }, []);

  return (
    <AppContext.Provider value={{
      isAdminMode,
      setAdminMode,
      isSaving,
      appTitle,
      setAppTitle,
      menuData,
      updateMenuItem,
      addMenuItem,
      deleteMenuItem,
      eventDays,
      activeEventDayId,
      handleQuantityChange,
      clearOrder,
      addEventDay,
      removeEventDay,
      setActiveEventDay,
      updateEventDayDetails,
      customerDetails,
      setCustomerDetails,
      theme,
      setTheme,
      updateTheme,
      addTheme,
      deleteTheme,
      processedThemes,
      themes,
      isMediaManagerOpen,
      setMediaManagerOpen,
      openMediaManager,
      mediaManagerCallback,
      orderHistory: orders,
      saveCurrentOrder,
      loadOrder,
	  updateOrderStatus,
      currentOrderId,
    }}>
      {children}
    </AppContext.Provider>

  );
};
