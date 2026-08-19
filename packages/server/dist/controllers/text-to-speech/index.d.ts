import { NextFunction, Request, Response } from 'express';
declare const _default: {
    generateTextToSpeech: (req: Request, res: Response) => Promise<void>;
    abortTextToSpeech: (req: Request, res: Response) => Promise<void>;
    getVoices: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
