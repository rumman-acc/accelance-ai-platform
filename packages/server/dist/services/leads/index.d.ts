import { Lead } from '../../database/entities/Lead';
import { ILead } from '../../Interface';
declare const _default: {
    createLead: (body: Partial<ILead>) => Promise<Lead>;
    getAllLeads: (chatflowid: string) => Promise<Lead[]>;
};
export default _default;
