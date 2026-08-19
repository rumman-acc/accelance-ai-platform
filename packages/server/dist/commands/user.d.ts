import { QueryRunner } from 'typeorm';
import { BaseCommand } from './base';
export default class user extends BaseCommand {
    static args: {
        email: import("@oclif/core/lib/interfaces").Arg<string | undefined, Record<string, unknown>>;
        password: import("@oclif/core/lib/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    run(): Promise<void>;
    listUserEmails(queryRunner: QueryRunner): Promise<void>;
    resetPassword(queryRunner: QueryRunner, email: string, password: string): Promise<void>;
}
