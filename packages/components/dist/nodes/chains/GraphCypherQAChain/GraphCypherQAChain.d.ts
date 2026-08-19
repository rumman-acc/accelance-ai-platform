/**
 * Validates generated Cypher queries to prevent write operations
 * This is applied to LLM-generated queries before execution
 * Write operations are always blocked for security
 *
 * @param query - The Cypher query to validate
 * @throws Error if query contains write operations
 */
export declare function validateCypherQuery(query: string): void;
/**
 * Normalize and harden user input before sending to the LLM.
 *
 * NOTE:
 * This is NOT a substitute for Cypher validation.
 * It only reduces obvious abuse patterns and normalizes input.
 */
export declare function sanitizeUserInput(input: string, maxLength?: number): string;
/**
 * Enhanced prompt injection detection using multiple techniques
 *
 * This function implements a multi-layered approach to detect injection attempts:
 * 1. Prompt Manipulation: Detects attempts to override system instructions
 * 2. Cypher Injection: Identifies malicious Cypher patterns and commands
 * 3. Comment Injection: Detects attempts to use comments for injection
 * 4. Unicode Smuggling: Catches encoded characters used to bypass filters
 * 5. Obfuscation Detection: Identifies excessive special characters
 * 6. Keyword Clustering: Detects suspicious combinations of Cypher keywords
 *
 * Unlike simple deny-lists, this uses pattern matching and heuristics to catch
 * sophisticated attacks including:
 * - Case variations and whitespace manipulation
 * - Multi-statement injection attempts
 * - Administrative command execution (CALL dbms./db./apoc.)
 * - Database structure manipulation (DROP, CREATE INDEX/CONSTRAINT)
 *
 * @param input - User input to analyze
 * @returns true if potential injection detected, false otherwise
 */
export declare function detectPromptInjection(input: string): boolean;
