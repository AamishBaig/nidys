import React, { useContext, useMemo, useRef, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { MenuItem } from '../types';
import { MinusIcon, PlusIcon, XMarkIcon, TrashIcon } from './Icons';
import CustomerDetailsForm from './CustomerDetailsForm';
import ConfirmDialog from './ConfirmDialog';
import SendOrderModal from './SendOrderModal';
import Calendar from './Calendar';
import TimePicker from './TimePicker';

declare const html2canvas: any;

const CheckoutPane: React.FC = () => {
  const {
    eventDays,
    activeEventDayId,
    menuData,
    handleQuantityChange,
    clearOrder,
    customerDetails,
    addEventDay,
    removeEventDay,
    setActiveEventDay,
    updateEventDayDetails,
  } = useContext(AppContext);

  const printRef = useRef<HTMLDivElement>(null);
  const customerDetailsRef = useRef<HTMLDivElement>(null);

  const [showClearOrderDialog, setShowClearOrderDialog] = useState(false);
  const [isSendOrderModalOpen, setSendOrderModalOpen] = useState(false);
  const [showDeleteDayDialog, setShowDeleteDayDialog] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);

  // Calendar and Time Picker states for each day
  const [calendarOpenFor, setCalendarOpenFor] = useState<string | null>(null);
  const [timePickerOpenFor, setTimePickerOpenFor] = useState<string | null>(null);

  type OrderItem = MenuItem & { quantity: number; categoryTitle: string };

  // Get active day
  const activeDay = eventDays.find(d => d.id === activeEventDayId) || eventDays[0];

  // Check if we're on summary tab
  const isSummaryTab = activeEventDayId === 'summary';

  // Calculate totals for a specific day
  const calculateDayTotals = (order: Record<string, number>) => {
  // ✅ ADD NULL CHECK
  if (!menuData || menuData.length === 0) {
    return { orderedItems: [], subtotal: 0 };
  }
  
  const allItems = menuData?.flatMap(category =>
    category.items.map(item => ({ ...item, categoryTitle: category.title }))
  );


    const itemsInOrder = Object.keys(order)
      .map(itemId => {
        const item = allItems.find(i => i.id === itemId);
        if (item && item.isAvailable) {
          return { ...item, quantity: order[itemId] };
        }
        return null;
      })
      .filter((item): item is OrderItem => item !== null);

    const subtotal = itemsInOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return { orderedItems: itemsInOrder, subtotal };
  };

 const { orderedItems, subtotal } = useMemo(() => {
  if (isSummaryTab) return { orderedItems: [], subtotal: 0 };
  // ✅ ADD NULL CHECK
  if (!activeDay || !menuData || menuData.length === 0) {
    return { orderedItems: [], subtotal: 0 };
  }
  return calculateDayTotals(activeDay.order);
}, [activeDay, menuData, isSummaryTab]);


  
 const grandTotals = useMemo(() => {
  // ✅ ADD NULL CHECK
  if (!menuData || menuData.length === 0) {
    return { grandSubtotal: 0, allDaysItems: [] };
  }

  let grandSubtotal = 0;
  const allDaysItems: { day: string; items: OrderItem[] }[] = [];

  eventDays.forEach(day => {
    const { orderedItems: dayItems, subtotal: daySubtotal } = calculateDayTotals(day.order);
    grandSubtotal += daySubtotal;
    // ? ALWAYS INCLUDE THE DAY (even if empty)
    allDaysItems.push({ day: day.label, items: dayItems });
  });

  return { grandSubtotal, allDaysItems };
}, [eventDays, menuData]);



  const serviceFee = useMemo(() => {
    const baseSubtotal = isSummaryTab ? grandTotals.grandSubtotal : subtotal;
    if (baseSubtotal === 0) return 0;
    switch (customerDetails.serviceType) {
      case 'Delivery':
        return 40;
      case 'Full Service':
        return 100;
      case 'Pickup':
      default:
        return 0;
    }
  }, [customerDetails.serviceType, subtotal, grandTotals.grandSubtotal, isSummaryTab]);

  const currentSubtotal = isSummaryTab ? grandTotals.grandSubtotal : subtotal;
  const gst = currentSubtotal * 0.10;
  const total = currentSubtotal + gst + serviceFee;
  const attendees = customerDetails.attendees > 0 ? customerDetails.attendees : 1;
  const perHeadPrice = total / attendees;

  const groupedItems = useMemo(() => {
    return orderedItems.reduce((acc, item) => {
      const key = item.categoryTitle;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, OrderItem[]>);
  }, [orderedItems]);

  const handleClearOrderClick = () => {
    setShowClearOrderDialog(true);
  };

  const confirmClearOrder = () => {
    clearOrder();
  };

  const handleDeleteDayClick = (dayId: string) => {
    setDayToDelete(dayId);
    setShowDeleteDayDialog(true);
  };

  const confirmDeleteDay = () => {
    if (dayToDelete) {
      removeEventDay(dayToDelete);
      setDayToDelete(null);
    }
  };

  const getQuantityColorClass = (qty: number) => {
    return qty < 6 ? 'text-red-500' : 'text-green-500';
  };

  const handleDateSelect = (dayId: string, date: Date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const formattedDate = `${dayOfWeek} ${day}/${month}/${year}`;
    updateEventDayDetails(dayId, 'dayDate', formattedDate);
    setCalendarOpenFor(null);
  };

  const handleTimeSelect = (dayId: string, time: string) => {
    updateEventDayDetails(dayId, 'dropTime', time);
    setTimePickerOpenFor(null);
  };

  return (
    <>
      {/* HIDDEN: Complete order summary for PDF */}
      <div ref={printRef} style={{ display: 'none', width: '794px', padding: '40px', backgroundColor: '#1f2937', color: '#e5e7eb', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
        {/* Customer Details */}
        <div style={{ marginBottom: '24px', backgroundColor: '#374151', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '16px', fontWeight: 'bold' }}>Customer Details</h3>
          <div style={{ display: 'flex', gap: '24px', lineHeight: '1.8', fontSize: '14px' }}>
            <div style={{ flex: 1 }}>
              {customerDetails.name && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Name:</strong> {customerDetails.name}</div>}
              {customerDetails.email && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Email:</strong> {customerDetails.email}</div>}
              {customerDetails.contactNumber && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Contact:</strong> {customerDetails.contactNumber}</div>}
              {customerDetails.address && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Address:</strong> {customerDetails.address}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Attendees:</strong> {customerDetails.attendees}</div>
              <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Service:</strong> {customerDetails.serviceType}</div>
              <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Equipment:</strong> {customerDetails.equipmentType}</div>
            </div>
          </div>
        </div>

        {/* All Days Orders */}
        {grandTotals.allDaysItems.map(({ day, items }) => {
          const daySubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
          const groupedDayItems = items.reduce((acc, item) => {
            const key = item.categoryTitle;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {} as Record<string, OrderItem[]>);

          // ? Find the day object to get date/time/event/notes
          const dayObj = eventDays.find(d => d.label === day);

          return (
            <div key={day} style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '16px', fontWeight: 'bold' }}>{day}</h3>
              
              {/* ? Day Details (Event, Date, Time, Notes) */}
              {dayObj && (
                <div style={{ marginBottom: '12px', fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', backgroundColor: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                  {dayObj.event && <div><strong style={{ color: '#d1d5db' }}>Event:</strong> {dayObj.event}</div>}
                  {dayObj.dayDate && <div><strong style={{ color: '#d1d5db' }}>Date:</strong> {dayObj.dayDate}</div>}
                  {dayObj.dropTime && <div><strong style={{ color: '#d1d5db' }}>Time:</strong> {dayObj.dropTime}</div>}
                  {dayObj.notes && <div style={{ fontStyle: 'italic', marginTop: '4px' }}><strong style={{ color: '#d1d5db' }}>Notes:</strong> {dayObj.notes}</div>}
                </div>
              )}

              {Object.entries(groupedDayItems).map(([categoryTitle, categoryItems]) => (
                <div key={categoryTitle} style={{ marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#374151', padding: '8px 12px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '8px', fontSize: '14px' }}>{categoryTitle}</div>
                  {(categoryItems as OrderItem[]).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #374151', fontSize: '14px' }}>
                      <span>{item.name}   {item.quantity}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>A${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 'bold', color: '#fbbf24', fontSize: '14px' }}>
                Subtotal: A${daySubtotal.toFixed(2)}
              </div>
            </div>
          );
        })}

        {/* Grand Totals */}
        <div style={{ backgroundColor: '#374151', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#9ca3af' }}>Grand Subtotal:</span>
            <span>A${grandTotals.grandSubtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#9ca3af' }}>Service Fee ({customerDetails.serviceType}):</span>
            <span>A${serviceFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', paddingBottom: '12px', borderBottom: '1px solid #4b5563' }}>
            <span style={{ color: '#9ca3af' }}>GST (10%):</span>
            <span>A${gst.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>
            <span>TOTAL:</span>
            <span>A${total.toFixed(2)}</span>
          </div>
          {total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#fbbf24', backgroundColor: '#1f2937', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
              <span>Price Per Head ({attendees} {attendees === 1 ? 'person' : 'people'}):</span>
              <span>A${perHeadPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN: Customer details only for JPG */}
      <div ref={customerDetailsRef} style={{ display: 'none', padding: '16px', backgroundColor: '#374151', color: '#e5e7eb', fontFamily: 'Arial, sans-serif', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '16px', fontWeight: 'bold' }}>Customer Details</h3>
        <div style={{ lineHeight: '1.8', fontSize: '14px' }}>
          {customerDetails.name && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Name:</strong> {customerDetails.name}</div>}
          {customerDetails.email && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Email:</strong> {customerDetails.email}</div>}
          {customerDetails.contactNumber && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Contact:</strong> {customerDetails.contactNumber}</div>}
          {customerDetails.address && <div style={{ marginBottom: '8px' }}><strong style={{ color: '#9ca3af' }}>Address:</strong> {customerDetails.address}</div>}
        </div>
      </div>

      {/* VISIBLE: Checkout UI with Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-[calc(100vh-7rem)] flex flex-col">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-700 overflow-x-auto">
          {/* Summary Tab */}
          <button
            onClick={() => setActiveEventDay('summary')}
            className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              isSummaryTab
                ? 'bg-amber-400 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            type="button"
          >
            Summary
          </button>

          {/* Individual Day Tabs */}
          {eventDays.map(day => (
            <div key={day.id} className="relative flex items-center">
              <button
                onClick={() => setActiveEventDay(day.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeEventDayId === day.id && !isSummaryTab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                type="button"
              >
                {day.label}
              </button>
              {eventDays.length > 1 && (
                <button
                  onClick={() => handleDeleteDayClick(day.id)}
                  className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  type="button"
                  title="Remove this day"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

         {/* Add Order Button */}
			<button
			  onClick={addEventDay}
			  className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
			  type="button"
			>
			  + Add Order  {/* ? CHANGED */}
			</button>


        </div>

        <div className="p-6 overflow-y-auto">
          <div className="text-white">
            {/* Customer Details Form (always visible) */}
            <div className="mb-6">
              <CustomerDetailsForm />
            </div>

            {/* Summary Tab Content */}
            {isSummaryTab ? (
              <div>
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Multi-Day Order Summary</h3>
                {grandTotals.allDaysItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No orders placed yet.</p>
                ) : (
                  <div className="space-y-6">
                    {grandTotals.allDaysItems.map(({ day, items }) => {
                      const daySubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                      const groupedDayItems = items.reduce((acc, item) => {
                        const key = item.categoryTitle;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(item);
                        return acc;
                      }, {} as Record<string, OrderItem[]>);

                      return (
                        <div key={day} className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-amber-400 mb-3">{day}</h4>
                          {Object.entries(groupedDayItems).map(([categoryTitle, categoryItems]) => (
                            <div key={categoryTitle} className="mb-3">
                              <h5 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2">{categoryTitle}</h5>
                              <ul className="space-y-2">
                                {(categoryItems as OrderItem[]).map(item => (
                                  <li key={item.id} className="flex items-center justify-between text-sm gap-2">
								  <div className="flex items-center gap-2 flex-1 min-w-0">
									<span className="font-normal truncate">{item.name}</span>
									<span className="text-gray-400 text-xs whitespace-nowrap">${item.price.toFixed(2)}</span>
									<span className="text-gray-400 text-xs whitespace-nowrap">  {item.quantity}</span>
									{item.quantity < 6 && (
									  <span className="text-red-500 text-xs italic whitespace-nowrap">Min 6!</span>
									)}
								  </div>
								  <span className="font-semibold whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
								</li>

                                ))}
                              </ul>
                            </div>
                          ))}
                          <div className="text-right mt-2 pt-2 border-t border-gray-600">
                            <span className="text-sm font-bold text-amber-400">Day Subtotal: ${daySubtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Individual Day Tab Content */
              <div>
                {/* Day-Specific Event Details */}
                <div className="mb-4 bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-amber-400 mb-3">{activeDay.label} Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Event Name</label>
                      <input
						  type="text"
						  value={activeDay.event}
						  onChange={(e) => updateEventDayDetails(activeDay.id, 'event', e.target.value)}
						  className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
						  placeholder="e.g. AGM....Lunch"  
						/>

                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Date</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={activeDay.dayDate}
                          onClick={() => setCalendarOpenFor(activeDay.id)}
                          readOnly
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          placeholder="Select date"
                        />
                        {calendarOpenFor === activeDay.id && (
                          <Calendar
                            onSelect={(date) => handleDateSelect(activeDay.id, date)}
                            onClose={() => setCalendarOpenFor(null)}
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Drop Time</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={activeDay.dropTime}
                          onClick={() => setTimePickerOpenFor(activeDay.id)}
                          readOnly
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          placeholder="Select time"
                        />
                        {timePickerOpenFor === activeDay.id && (
                          <TimePicker
                            onSelect={(time) => handleTimeSelect(activeDay.id, time)}
                            onClose={() => setTimePickerOpenFor(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ? NEW: Day-specific notes field */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-400 block mb-1">Notes for {activeDay.label}</label>
                    <textarea
                      value={activeDay.notes}
                      onChange={(e) => updateEventDayDetails(activeDay.id, 'notes', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Special instructions for this day..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Order Items for Current Day */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-amber-400">Your Order</h3>
                  {orderedItems.length > 0 && (
                    <button
                      onClick={handleClearOrderClick}
                      className="flex items-center space-x-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                      type="button"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Clear Order</span>
                    </button>
                  )}
                </div>

                {orderedItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No items in this day's order.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedItems).map(([categoryTitle, items]) => (
                      <div key={categoryTitle}>
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">{categoryTitle}</h4>
                        <ul className="space-y-3">
                          {(items as OrderItem[]).map(item => (
                            <li key={item.id} className="flex items-center justify-between text-sm gap-2 py-1">
							  {/* ? ALL ON ONE LINE */}
							  <div className="flex items-center gap-2 flex-1 min-w-0">
								<span className="font-normal truncate">{item.name}</span>
								<span className="text-gray-400 text-xs whitespace-nowrap">${item.price.toFixed(2)}</span>
								{item.quantity < 6 && (
								  <span className="text-red-500 text-xs font-medium italic whitespace-nowrap">Min 6!</span>
								)}
							  </div>
							  <div className="flex items-center space-x-2 shrink-0">

                                <div className="flex items-center bg-gray-700 rounded-full">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    className="p-1 text-white rounded-full hover:bg-gray-600 transition-colors"
                                    type="button"
                                  >
                                    <MinusIcon className="w-2.5 h-2.5" />
                                  </button>
                                  <span className={`w-6 text-center text-xs font-bold ${getQuantityColorClass(item.quantity)}`}>{item.quantity}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    className="p-1 text-white rounded-full hover:bg-gray-600 transition-colors"
                                    type="button"
                                  >
                                    <PlusIcon className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <p className="w-16 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                <button
                                  onClick={() => handleQuantityChange(item.id, 0)}
                                  className="text-gray-500 hover:text-red-500 transition-colors"
                                  type="button"
                                >
                                  <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Totals Footer */}
        {(isSummaryTab ? grandTotals.allDaysItems.length > 0 : orderedItems.length > 0) && (
          <div className="p-6 mt-auto border-t border-gray-700 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{isSummaryTab ? 'Grand Subtotal' : 'Subtotal'}</span>
              <span>${currentSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Service ({customerDetails.serviceType})</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">GST (10%)</span>
              <span>${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-amber-400">
              <span>{isSummaryTab ? 'Grand Total' : 'Total'}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {total > 0 && (
              <div className="flex justify-between text-md font-bold text-amber-400 border-t border-gray-700 pt-3 mt-3">
                <span>Price Per Head ({attendees} {attendees === 1 ? 'person' : 'people'})</span>
                <span>${perHeadPrice.toFixed(2)}</span>
              </div>
            )}
            <button
              onClick={() => setSendOrderModalOpen(true)}
              className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              type="button"
            >
              Send Order
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={showClearOrderDialog}
        onClose={() => setShowClearOrderDialog(false)}
        onConfirm={confirmClearOrder}
        title="Clear Order"
        message={`Are you sure you want to clear ${isSummaryTab ? 'all orders' : 'this day\'s order'}?`}
        confirmText="Clear Order"
        isDangerous={true}
      />

      <ConfirmDialog
        isOpen={showDeleteDayDialog}
        onClose={() => {
          setShowDeleteDayDialog(false);
          setDayToDelete(null);
        }}
        onConfirm={confirmDeleteDay}
        title="Remove Day"
        message="Are you sure you want to remove this day/event?"
        confirmText="Remove"
        isDangerous={true}
      />

      <SendOrderModal
        isOpen={isSendOrderModalOpen}
        onClose={() => setSendOrderModalOpen(false)}
        orderSummaryRef={printRef}
        customerDetailsRef={customerDetailsRef}
      />
    </>
  );
};

export default CheckoutPane;