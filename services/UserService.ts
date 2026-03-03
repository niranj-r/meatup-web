import { db } from '@/config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '@/types';

export const UserService = {
    createUser: async (uid: string, data: Omit<UserProfile, 'id' | 'created_at'>) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userData = {
                id: uid,
                ...data,
                phone: data.phone || '', // Ensure phone is saved, default to empty if missing but expected to be provided
                email: data.email,
                address: data.address || '',
                wallet_points: data.wallet_points || 0,
                is_first_order_completed: false,
                created_at: Date.now()
            };
            await setDoc(userRef, userData, { merge: true });
            return userData as UserProfile;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    getUser: async (uid: string): Promise<UserProfile | null> => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return userSnap.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error getting user:", error);
            throw error;
        }
    },

    subscribeToUser: (uid: string, callback: (user: UserProfile | null) => void) => {
        const userRef = doc(db, 'users', uid);
        return onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as UserProfile);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Error subscribing to user:", error);
        });
    },

    updateWallet: async (uid: string, points: number) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                wallet_points: points
            });
        } catch (error) {
            throw error;
        }
    },

    updateUser: async (uid: string, data: Partial<UserProfile>) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, data);
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }
};
