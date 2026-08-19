import { Request } from 'express';
declare const _default: {
    createAttachment: (req: Request) => Promise<{
        name: string;
        mimeType: string;
        size: number;
        content: string;
    }[]>;
};
export default _default;
