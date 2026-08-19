export declare class Permissions {
    private categories;
    constructor();
    toJSON(): {
        [key: string]: {
            key: string;
            value: string;
        }[];
    };
}
export declare class PermissionCategory {
    category: string;
    permissions: any[];
    constructor(category: string);
    addPermission(permission: Permission): void;
    toJSON(): {
        [x: string]: any[];
    };
}
export declare class Permission {
    name: string;
    description: string;
    isOpenSource: boolean;
    isEnterprise: boolean;
    isCloud: boolean;
    constructor(name: string, description: string, isOpenSource?: boolean, isEnterprise?: boolean, isCloud?: boolean);
    toJSON(): {
        key: string;
        value: string;
        isOpenSource: boolean;
        isEnterprise: boolean;
        isCloud: boolean;
    };
}
