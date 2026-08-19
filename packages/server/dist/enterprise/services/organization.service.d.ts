import { QueryRunner } from 'typeorm';
import { Organization } from '../database/entities/organization.entity';
export declare const enum OrganizationErrorMessage {
    INVALID_ORGANIZATION_ID = "Invalid Organization Id",
    INVALID_ORGANIZATION_NAME = "Invalid Organization Name",
    ORGANIZATION_NOT_FOUND = "Organization Not Found",
    ORGANIZATION_FOUND_MULTIPLE = "Organization Found Multiple",
    ORGANIZATION_RESERVERD_NAME = "Organization name cannot be Default Organization - this is a reserved name",
    ORGANIZATION_HAS_NO_SUBSCRIPTION = "Organization has no subscription"
}
export declare class OrganizationService {
    private telemetry;
    private dataSource;
    private userService;
    constructor();
    validateOrganizationId(id: string | undefined): void;
    readOrganizationById(id: string | undefined, queryRunner: QueryRunner): Promise<Organization | null>;
    validateOrganizationName(name: string | undefined, isRegister?: boolean): void;
    readOrganizationByName(name: string | undefined, queryRunner: QueryRunner): Promise<Organization | null>;
    readOrganizationBySlug(slug: string | undefined, queryRunner: QueryRunner): Promise<Organization | null>;
    private slugifyOrganizationName;
    private generateOrganizationSlug;
    countOrganizations(queryRunner: QueryRunner): Promise<number>;
    readOrganization(queryRunner: QueryRunner): Promise<Organization[]>;
    createNewOrganization(data: Partial<Organization>, queryRunner: QueryRunner, isRegister?: boolean): Organization;
    saveOrganization(data: Partial<Organization>, queryRunner: QueryRunner): Promise<Partial<Organization> & Organization>;
    createOrganization(data: Partial<Organization>): Promise<Organization>;
    updateOrganization(newOrganizationData: Partial<Organization>): Promise<Partial<Organization>>;
}
