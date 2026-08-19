import { Request } from 'express';
type Pagination = {
    page: number;
    limit: number;
};
export declare const getPageAndLimitParams: (req: Request) => Pagination;
export {};
