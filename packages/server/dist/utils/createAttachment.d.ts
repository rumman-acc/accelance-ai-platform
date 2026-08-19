import { Request } from 'express';
/**
 * Create attachment
 * @param {Request} req
 */
export declare const createFileAttachment: (req: Request) => Promise<{
    name: string;
    mimeType: string;
    size: number;
    content: string;
}[]>;
