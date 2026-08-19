import { Request } from 'express';
import { ChatFlow } from '../database/entities/ChatFlow';
import { ApiKey } from '../database/entities/ApiKey';
/**
 * Validate flow API Key, this is needed because Prediction/Upsert API is public
 * @param {Request} req
 * @param {ChatFlow} chatflow
 */
export declare const validateFlowAPIKey: (req: Request, chatflow: ChatFlow) => Promise<boolean>;
/**
 * Validate and Get API Key Information
 * @param {Request} req
 * @returns {Promise<{isValid: boolean, apiKey?: ApiKey}>}
 */
export declare const validateAPIKey: (req: Request) => Promise<{
    isValid: boolean;
    apiKey?: ApiKey;
}>;
