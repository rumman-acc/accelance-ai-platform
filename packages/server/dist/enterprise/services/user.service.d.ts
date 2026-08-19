import { QueryRunner } from 'typeorm';
import { User } from '../database/entities/user.entity';
export declare const enum UserErrorMessage {
    EXPIRED_TEMP_TOKEN = "Expired Temporary Token",
    INVALID_TEMP_TOKEN = "Invalid Temporary Token",
    INVALID_USER_ID = "Invalid User Id",
    INVALID_USER_EMAIL = "Invalid User Email",
    INVALID_USER_CREDENTIAL = "Invalid User Credential",
    INVALID_USER_NAME = "Invalid User Name",
    INVALID_USER_TYPE = "Invalid User Type",
    INVALID_USER_STATUS = "Invalid User Status",
    USER_EMAIL_ALREADY_EXISTS = "User Email Already Exists",
    USER_EMAIL_UNVERIFIED = "User Email Unverified",
    USER_NOT_FOUND = "User Not Found",
    USER_FOUND_MULTIPLE = "User Found Multiple",
    INCORRECT_USER_EMAIL_OR_CREDENTIALS = "Incorrect Email or Password",
    PASSWORDS_DO_NOT_MATCH = "Passwords do not match",
    EMAIL_CHANGE_USE_CONFIRM_LINK = "Use the confirm email change link from your email to complete this action."
}
export declare class UserService {
    private telemetry;
    private dataSource;
    constructor();
    validateUserId(id: string | undefined): void;
    readUserById(id: string | undefined, queryRunner: QueryRunner): Promise<User | null>;
    validateUserName(name: string | undefined): void;
    validateUserEmail(email: string | undefined): void;
    readUserByEmail(email: string | undefined, queryRunner: QueryRunner): Promise<User | null>;
    readUserByToken(token: string | undefined, queryRunner: QueryRunner): Promise<User | null>;
    validateUserStatus(status: string | undefined): void;
    readUser(queryRunner: QueryRunner): Promise<User[]>;
    encryptUserCredential(credential: string | undefined): string;
    createNewUser(data: Partial<User>, queryRunner: QueryRunner): Promise<User>;
    saveUser(data: Partial<User>, queryRunner: QueryRunner): Promise<Partial<User> & User>;
    createUser(data: Partial<User>): Promise<User>;
    updateUser(newUserData: Partial<User> & {
        oldPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }, options?: {
        onEmailChanged?: (userId: string, newEmail: string) => Promise<void>;
    }): Promise<Partial<User>>;
}
