import { LoginActivity } from '../../database/entities/EnterpriseEntities';
import { LoginActivityCode } from '../../Interface.Enterprise';
declare const _default: {
    recordLoginActivity: (username: string, activityCode: LoginActivityCode, message: string, ssoProvider?: string, organizationId?: string) => Promise<LoginActivity | undefined>;
    fetchLoginActivity: (body: any, organizationId: string) => Promise<{
        data: LoginActivity[];
        count: number;
        currentPage: number;
        pageSize: number;
    }>;
};
export default _default;
