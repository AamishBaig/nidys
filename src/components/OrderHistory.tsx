// components/OrderHistory.tsx
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from './Modal';
import { SavedOrder } from '../types';
import { 
  ClipboardDocumentListIcon, 
  XMarkIcon, 
  EyeIcon,
  PencilIcon,
  CalendarDaysIcon
} from './Icons';

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, onClose }) => {
  const { orderHistory, loadOrder } = useContext(AppContext);
  const [selectedOrder, setSelectedOrder] = useState<SavedOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'modified' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orderHistory;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Search by customer name or order number
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerDetails.name.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerDetails.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orderHistory, filterStatus, searchQuery]);

  const handleLoadOrder = (order: SavedOrder) => {
    loadOrder(order);
    onClose();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: SavedOrder['status']) => {
    const badges = {
      sent: 'bg-green-500/20 text-green-400 border-green-500/50',
      modified: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return badges[status] || badges.sent;
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Order History" 
        className="max-w-5xl"
      >
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, email, or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              {['all', 'sent', 'modified', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No orders found</p>
                <p className="text-sm">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Orders will appear here after sending'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Order Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-amber-400 text-lg">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1 text-sm text-gray-300">
                        <p className="font-semibold text-white">
                          {order.customerDetails.name}
                        </p>
                        <p className="text-gray-400">{order.customerDetails.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {formatDate(order.timestamp)}
                          </span>
                          <span>
                            {order.eventDays.length} order{order.eventDays.length > 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold text-amber-400">
                            ${order.totals.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => handleLoadOrder(order)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        title="Load & Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          {orderHistory.length > 0 && (
            <div className="border-t border-gray-600 pt-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{orderHistory.length}</p>
                  <p className="text-xs text-gray-400">Total Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {orderHistory.filter(o => o.status === 'sent').length}
                  </p>
                  <p className="text-xs text-gray-400">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {orderHistory.filter(o => o.status === 'modified').length}
                  </p>
                  <p className="text-xs text-gray-400">Modified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    ${orderHistory.reduce((sum, o) => sum + o.totals.total, 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Total Value</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.orderNumber}`}
          className="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Customer Details */}
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-3">Customer Details</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Contact:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.contactNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Attendees:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.attendees}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Service:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Equipment:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.equipmentType}</span>
                  </div>
                </div>
                {selectedOrder.customerDetails.address && (
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <span className="ml-2 text-white">{selectedOrder.customerDetails.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Days */}
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-3">Order Details</h3>
              <div className="space-y-3">
                {selectedOrder.eventDays.map((day, idx) => {
                  const itemCount = Object.keys(day.order).length;
                  const dayTotal = Object.entries(day.order).reduce((sum, [_, qty]) => sum + qty, 0);
                  
                  return (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{day.label}</h4>
                          <div className="text-sm text-gray-400">
                            {day.dayDate && <span>{day.dayDate}</span>}
                            {day.dropTime && <span className="ml-3">{day.dropTime}</span>}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-400">{itemCount} items</p>
                          <p className="text-gray-400">{dayTotal} total qty</p>
                        </div>
                      </div>
                      {day.event && (
                        <p className="text-sm text-gray-300 mt-2">
                          <span className="text-gray-400">Event:</span> {day.event}
                        </p>
                      )}
                      {day.notes && (
                        <p className="text-sm text-gray-300 mt-1">
                          <span className="text-gray-400">Notes:</span> {day.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-3">Order Totals</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">${selectedOrder.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Service Fee:</span>
                  <span className="text-white">${selectedOrder.totals.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">GST (10%):</span>
                  <span className="text-white">${selectedOrder.totals.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                  <span className="text-amber-400">Total:</span>
                  <span className="text-amber-400">${selectedOrder.totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleLoadOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <PencilIcon className="w-5 h-5" />
                Load & Edit Order
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default OrderHistory;
