import { BaseCommand } from './base';
export default class Start extends BaseCommand {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    stopProcess(): Promise<void>;
}
