import { ILead } from '../../Interface';
export declare class Lead implements ILead {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    chatflowid: string;
    chatId: string;
    createdDate: Date;
}
