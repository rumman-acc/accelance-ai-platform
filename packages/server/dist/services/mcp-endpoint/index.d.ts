import { Request, Response } from 'express';
declare const _default: {
    handleMcpRequest: (chatflowId: string, token: string, req: Request, res: Response) => Promise<void>;
    handleMcpDeleteRequest: (chatflowId: string, req: Request, res: Response) => Promise<void>;
};
export default _default;
