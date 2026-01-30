import { create } from 'zustand';

export type AudienceFilter = 'pending' | 'sent' | 'all';

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    previewUrl?: string;
}

interface CampaignState {
    presenterName: string;
    audienceFilter: AudienceFilter;
    batchSize: number;
    targetSuccessCount: number;
    totalAvailable: number;
    
    // Content Studio State
    messageBody: string;
    attachments: Attachment[];

    // Actions
    setPresenterName: (name: string) => void;
    setAudienceFilter: (filter: AudienceFilter) => void;
    setBatchSize: (size: number) => void;
    setTargetSuccessCount: (count: number) => void;
    setTotalAvailable: (total: number) => void;
    
    // Content Actions
    setMessageBody: (text: string) => void;
    addAttachment: (file: Attachment) => void;
    removeAttachment: (id: string) => void;

    // Helpers
    resetCampaign: () => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
    presenterName: '',
    audienceFilter: 'pending',
    batchSize: 50,
    targetSuccessCount: 10,
    totalAvailable: 0,
    
    messageBody: '',
    attachments: [],

    setPresenterName: (name) => set({ presenterName: name }),
    setAudienceFilter: (filter) => set({ audienceFilter: filter }),
    setBatchSize: (size) => set({ batchSize: size }),
    setTargetSuccessCount: (count) => set({ targetSuccessCount: count }),
    setTotalAvailable: (total) => set({ totalAvailable: total }),
    
    setMessageBody: (text) => set({ messageBody: text }),
    addAttachment: (file) => set((state) => ({ attachments: [...state.attachments, file] })),
    removeAttachment: (id) => set((state) => ({ 
        attachments: state.attachments.filter(a => a.id !== id) 
    })),

    resetCampaign: () => set({
        presenterName: '',
        audienceFilter: 'pending',
        batchSize: 50,
        targetSuccessCount: 10,
        totalAvailable: 0,
        messageBody: '',
        attachments: []
    })
}));