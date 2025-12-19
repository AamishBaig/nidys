// hooks/useOrderHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { SavedOrder } from '../types';

const ORDERS_COLLECTION = 'orders';

export const useOrderHistory = () => {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time subscription to orders
  useEffect(() => {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SavedOrder[];

        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save new order
  const saveOrder = useCallback(async (order: Omit<SavedOrder, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...order,
        timestamp: order.timestamp || new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, status: SavedOrder['status']) => {
      try {
        await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { status });
      } catch (error) {
        console.error('Error updating order:', error);
        throw error;
      }
    },
    []
  );

  // Generate unique order number
  const generateOrderNumber = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = orders.filter((o) => o.timestamp.startsWith(year.toString())).length + 1;
    return `ORD-${year}${month}-${String(count).padStart(3, '0')}`;
  }, [orders]);

  return {
    orders,
    loading,
    saveOrder,
    updateOrderStatus,
    generateOrderNumber,
  };
};
