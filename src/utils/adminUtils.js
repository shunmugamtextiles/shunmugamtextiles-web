import { collection, getDocs, doc, updateDoc, setDoc, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection name
const ADMIN_COLLECTION = 'admin_credentials';
const ADMIN_DOC_ID = 'main_admin'; // Single document for main admin

/**
 * Get admin credentials from Firestore.
 * If not found, it attempts to seed them using environment variables.
 * @returns {Promise<{username: string, password: string} | null>}
 */
export const getAdminCredentials = async () => {
    try {
        const adminRef = doc(db, ADMIN_COLLECTION, ADMIN_DOC_ID);
        const adminSnap = await getDocs(query(collection(db, ADMIN_COLLECTION), limit(1)));

        // If collection is empty or doc doesn't exist
        if (adminSnap.empty) {
            console.log("Admin credentials not found in DB. Seeding from env...");
            return await seedAdminCredentials();
        }

        // We assume there's one main admin doc, or specifically look for ADMIN_DOC_ID
        // But since we did a query, let's try to get specific doc for cleaner management
        const specificDoc = adminSnap.docs.find(d => d.id === ADMIN_DOC_ID) || adminSnap.docs[0];

        if (!specificDoc) {
            return await seedAdminCredentials();
        }

        return specificDoc.data();
    } catch (error) {
        console.error("Error fetching admin credentials:", error);
        throw error;
    }
};

/**
 * Seeds the Firestore with admin credentials from environment variables.
 * Should only run if DB is empty.
 */
const seedAdminCredentials = async () => {
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!envUsername || !envPassword) {
        console.error("No environment variables found for admin credentials.");
        return null;
    }

    const credentials = {
        username: envUsername,
        password: envPassword,
        updatedAt: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, ADMIN_COLLECTION, ADMIN_DOC_ID), credentials);
        console.log("Admin credentials seeded successfully.");
        return credentials;
    } catch (error) {
        console.error("Error seeding admin credentials:", error);
        throw error;
    }
};

/**
 * Update admin credentials in Firestore.
 * @param {string} newUsername 
 * @param {string} newPassword 
 * @returns {Promise<void>}
 */
export const updateAdminCredentials = async (newUsername, newPassword) => {
    try {
        const adminRef = doc(db, ADMIN_COLLECTION, ADMIN_DOC_ID);
        await updateDoc(adminRef, {
            username: newUsername,
            password: newPassword,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating admin credentials:", error);
        throw error;
    }
};
