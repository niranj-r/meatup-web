import { db } from '@/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';
import { UserService } from './UserService';

export const OrderService = {
    createOrder: async (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {
        try {
            const today = new Date();
            const yy = today.getFullYear().toString().slice(-2);
            const mm = (today.getMonth() + 1).toString().padStart(2, '0');
            const dd = today.getDate().toString().padStart(2, '0');
            const dateStr = `${dd}${mm}${yy}`; // DDMMYY

            let display_id = '';
            let newOrderRef: any;

            await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, 'counters', 'daily_orders');
                const counterSnap = await transaction.get(counterRef);

                let currentCount = 0;

                if (counterSnap.exists()) {
                    const data = counterSnap.data();
                    if (data.date === dateStr) {
                        currentCount = data.count || 0;
                    }
                    // If date doesn't match, currentCount stays 0 (reset)
                }

                currentCount++;
                const countStr = currentCount.toString().padStart(2, '0');
                display_id = `MU-${dateStr}-${countStr}`;

                transaction.set(counterRef, {
                    date: dateStr,
                    count: currentCount
                });

                const newOrder = {
                    ...orderData,
                    display_id,
                    status: 'pending',
                    created_at: Date.now()
                };

                // Create a ref for the new order and set it within transaction
                // Note: addDoc cannot be used directly in transaction, so we use doc() to generate ID and set()
                newOrderRef = doc(collection(db, 'orders'));
                transaction.set(newOrderRef, newOrder);
            });

            // Post-transaction updates (points etc) - these are best effort after order creation

            // Deduct wallet points if used
            if (orderData.wallet_used > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, Math.max(0, user.wallet_points - orderData.wallet_used));
                }
            }

            // Points will be credited upon delivery
            // if (orderData.earned_points > 0) {
            //     const user = await UserService.getUser(orderData.user_id);
            //     if (user) {
            //         await UserService.updateWallet(orderData.user_id, user.wallet_points + orderData.earned_points);
            //     }
            // }

            // Update first order status
            const user = await UserService.getUser(orderData.user_id);
            if (user && !user.is_first_order_completed) {
                await UserService.updateUser(orderData.user_id, { is_first_order_completed: true });
            }

            return { id: newOrderRef.id, display_id };
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    getUserOrders: async (userId: string): Promise<Order[]> => {
        try {
            const q = query(collection(db, 'orders'), where("user_id", "==", userId));
            // Note: Composite index might be needed for ordering by date with a filter on user_id
            // For now simpler query
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return [];
        }
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data() as Order;
            const updates: any = { status };

            // Check if delivering and points haven't been credited
            if (status === 'delivered' && !orderData.points_credited && (orderData.earned_points || 0) > 0) {
                const user = await UserService.getUser(orderData.user_id);
                if (user) {
                    await UserService.updateWallet(orderData.user_id, user.wallet_points + orderData.earned_points);
                    updates.points_credited = true;
                }
            }

            await updateDoc(orderRef, updates);
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    },

    subscribeToUserOrders: (userId: string, callback: (orders: Order[]) => void) => {
        const q = query(collection(db, 'orders'), where("user_id", "==", userId));
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            callback(orders);
        }, (error) => {
            console.error("Error subscribing to user orders:", error);
        });
    },

    // Safe update for demo simulation to prevent overwriting 'cancelled' status
    advanceDemoOrderStatus: async (orderId: string, nextStatus: any) => {
        try {
            console.log(`[OrderService] advanceDemoOrderStatus called for ${orderId} -> ${nextStatus}`);
            const orderRef = doc(db, 'orders', orderId);
            // Use standard getDoc import
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data() as Order;
                const currentStatus = orderData.status;

                if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
                    console.log(`Skipping auto-update for order ${orderId} as it is ${currentStatus}`);
                    return;
                }

                const updates: any = { status: nextStatus };

                // Credit points on delivery simulation
                if (nextStatus === 'delivered') {
                    console.log(`[OrderService] Checking points for order ${orderId}: earned=${orderData.earned_points}, credited=${orderData.points_credited}`);
                    if (!orderData.points_credited && (orderData.earned_points || 0) > 0) {
                        const user = await UserService.getUser(orderData.user_id);
                        if (user) {
                            const newTotal = (user.wallet_points || 0) + orderData.earned_points;
                            await UserService.updateWallet(orderData.user_id, newTotal);
                            updates.points_credited = true;
                            console.log(`[OrderService] Credited ${orderData.earned_points} points to user ${orderData.user_id}. New total: ${newTotal}`);
                        } else {
                            console.error(`[OrderService] User ${orderData.user_id} not found for point crediting`);
                        }
                    } else {
                        console.log(`[OrderService] Skipping point credit. Reason: ${orderData.points_credited ? 'Already credited' : 'Earned points is 0 or undefined'}`);
                    }
                }

                await updateDoc(orderRef, updates);
            }
        } catch (error) {
            console.error("Error advancing order status:", error);
        }
    },

    ensurePointsCredited: async (orderId: string) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data() as Order;
                if (orderData.status === 'delivered' && !orderData.points_credited && (orderData.earned_points || 0) > 0) {
                    console.log(`[OrderService] Catch-up crediting points for order ${orderId}`);
                    const user = await UserService.getUser(orderData.user_id);
                    if (user) {
                        const newTotal = (user.wallet_points || 0) + orderData.earned_points;
                        await UserService.updateWallet(orderData.user_id, newTotal);
                        await updateDoc(orderRef, { points_credited: true });
                        console.log(`[OrderService] Catch-up success: Credited ${orderData.earned_points} points.`);
                    }
                }
            }
        } catch (error) {
            console.error("Error ensuring points credited:", error);
        }
    }
};
