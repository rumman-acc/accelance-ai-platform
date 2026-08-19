import { z } from 'zod/v3';
/**
 * This parser safely handles Zod schema strings without allowing arbitrary code execution
 */
export declare class SecureZodSchemaParser {
    private static readonly ALLOWED_TYPES;
    /**
     * Safely parse a Zod schema string into a Zod schema object
     * @param schemaString The Zod schema as a string (e.g., "z.object({name: z.string()})")
     * @returns A Zod schema object
     * @throws Error if the schema is invalid or contains unsafe patterns
     */
    static parseZodSchema(schemaString: string): z.ZodTypeAny;
    private static cleanSchemaString;
    private static parseSchemaStructure;
    private static parseObjectProperties;
    private static splitProperties;
    private static parseProperty;
    private static parseZodType;
    private static parseArray;
    private static validateTypeInfo;
    private static parseArguments;
    private static parseArrayContent;
    private static extractArrayWithModifiers;
    private static extractObjectWithModifiers;
    private static parseComplexArguments;
    private static parseObjectLiteral;
    private static buildZodSchema;
    private static buildZodType;
    private static applyModifiers;
}
