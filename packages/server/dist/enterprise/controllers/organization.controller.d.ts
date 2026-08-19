import { Request, Response, NextFunction } from 'express';
export declare class OrganizationController {
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    read(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getAdditionalSeatsQuantity(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getCustomerWithDefaultSource(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getAdditionalSeatsProration(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getPlanProration(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateAdditionalSeats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateSubscriptionPlan(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUsage(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
