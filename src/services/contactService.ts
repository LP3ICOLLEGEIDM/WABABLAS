import { databases } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../lib/appwriteConfig';
import { ID, Query } from 'appwrite';
import { RawContact } from './excelService';

export type ContactStatus = 'pending' | 'sent' | 'failed';

export const contactService = {
    // 1. Bulk Import (Safe Batching + Delay)
    bulkImportContacts: async (
        userId: string, 
        contacts: RawContact[], 
        onProgress: (percent: number) => void,
        onStatus: (msg: string) => void
    ) => {
        const BATCH_SIZE = 10;
        const DELAY_MS = 1500;
        let successCount = 0;
        let failCount = 0;
        const validContacts = contacts.filter(c => c.isValid);
        const total = validContacts.length;

        if (total === 0) return { successCount: 0, failCount: 0 };
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = validContacts.slice(i, i + BATCH_SIZE);
            const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(total / BATCH_SIZE);

            onStatus(`Mengunggah batch ${currentBatchNum} dari ${totalBatches} (${batch.length} data)...`);

            await Promise.all(batch.map(async (contact) => {
                try {
                    const existing = await databases.listDocuments(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_CONTACTS,
                        [Query.equal('userId', userId), Query.equal('phone', contact.phone)]
                    );

                    if (existing.total > 0) {
                        await databases.updateDocument(
                            APPWRITE_CONFIG.DATABASE_ID,
                            APPWRITE_CONFIG.COLLECTION_CONTACTS,
                            existing.documents[0].$id,
                            { name: contact.name, school: contact.school }
                        );
                    } else {
                        await databases.createDocument(
                            APPWRITE_CONFIG.DATABASE_ID,
                            APPWRITE_CONFIG.COLLECTION_CONTACTS,
                            ID.unique(),
                            {
                                userId, name: contact.name, phone: contact.phone, school: contact.school,
                                status: 'pending', createdAt: new Date().toISOString()
                            }
                        );
                    }
                    successCount++;
                } catch (error) { failCount++; }
            }));

            if (i + BATCH_SIZE < total) {
                onStatus(`Menunggu ${DELAY_MS/1000} detik...`);
                await wait(DELAY_MS);
            }
            onProgress(Math.min(100, Math.round(((i + batch.length) / total) * 100)));
        }
        return { successCount, failCount };
    },

    // 2. Ambil Data (Pagination + Universal Search)
    getContacts: async (userId: string, status: ContactStatus, limit = 50, offset = 0, searchKeyword = '') => {
        const queries = [
            Query.equal('userId', userId),
            Query.equal('status', status),
            Query.orderDesc('createdAt'),
            Query.limit(limit),
            Query.offset(offset)
        ];

        // Jika ada pencarian, tambahkan logika OR
        if (searchKeyword.trim()) {
            // Appwrite butuh Fulltext Index untuk search, tapi contains bisa jalan pelan tanpa index (tergantung versi)
            // Kita coba pakai contains dulu untuk fleksibilitas.
            queries.push(
                Query.or([
                    Query.contains('name', searchKeyword),
                    Query.contains('phone', searchKeyword),
                    Query.contains('school', searchKeyword)
                ])
            );
        }

        return await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTION_CONTACTS,
            queries
        );
    },

    // 3. Tambah Manual
    addContact: async (userId: string, name: string, phone: string, school: string = '') => {
        return await databases.createDocument(
            APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTION_CONTACTS, ID.unique(),
            { userId, name, phone, school, status: 'pending', createdAt: new Date().toISOString() }
        );
    },

    // 4. Update Kontak
    updateContact: async (documentId: string, data: any) => {
        return await databases.updateDocument(
            APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTION_CONTACTS, documentId, data
        );
    },

    // 5. Hapus Kontak
    deleteContact: async (documentId: string) => {
        return await databases.deleteDocument(
            APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTION_CONTACTS, documentId
        );
    },

    // 6. Reset Database (Safe Batch Delete)
    deleteAllContacts: async (userId: string, onProgress?: (percent: number) => void) => {
        let deletedCount = 0;
        let allIds: string[] = [];
        let hasMore = true;
        let offset = 0;

        while (hasMore) {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTION_CONTACTS,
                [Query.equal('userId', userId), Query.limit(100), Query.offset(offset)]
            );
            const ids = res.documents.map(d => d.$id);
            allIds = [...allIds, ...ids];
            if (ids.length < 100) hasMore = false;
            else offset += 100;
        }

        const total = allIds.length;
        if (total === 0) return 0;
        const BATCH_SIZE = 5;
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = allIds.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(id => databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTION_CONTACTS, id
            ).catch(e => console.log('Gagal hapus id:', id))));
            
            deletedCount += batch.length;
            if (onProgress) onProgress(Math.round((deletedCount / total) * 100));
            await wait(500); 
        }
        return deletedCount;
    }
};
