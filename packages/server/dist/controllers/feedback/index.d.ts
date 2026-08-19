import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getAllChatMessageFeedback: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createChatMessageFeedbackForChatflow: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateChatMessageFeedbackForChatflow: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
