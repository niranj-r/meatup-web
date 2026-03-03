import { db } from '@/config/firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Product } from '@/types';

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    subscribeToProducts: (callback: (products: Product[]) => void) => {
        const q = collection(db, 'products');
        // Return the unsubscribe function
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            callback(products);
        }, (error) => {
            console.error("Error subscribing to products:", error);
        });
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            const docRef = doc(db, 'products', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Product;
            }
            return null;
        } catch (error) {
            console.error("Error fetching product:", error);
            return null;
        }
    },

    // Helper to seed data if needed
    seedProduct: async (product: Omit<Product, 'id'>) => {
        try {
            await addDoc(collection(db, 'products'), product);
        } catch (error) {
            console.error("Error seeding product:", error);
        }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
            const docRef = doc(db, 'products', id);
            await updateDoc(docRef, updates);
            console.log(`Product ${id} updated successfully`);
        } catch (error) {
            console.error("Error updating product:", error);
        }
    }
};
