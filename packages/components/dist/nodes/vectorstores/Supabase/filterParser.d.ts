/**
 * This parser safely handles Supabase filter strings without allowing arbitrary code execution
 */
export declare class FilterParser {
    private static readonly ALLOWED_METHODS;
    private static readonly ALLOWED_OPERATORS;
    /**
     * Safely parse a Supabase RPC filter string into a function
     * @param filterString The filter string (e.g., 'filter("metadata->a::int", "gt", 5).filter("metadata->c::int", "gt", 7)')
     * @returns A function that can be applied to an RPC object
     * @throws Error if the filter string contains unsafe patterns
     */
    static parseFilterString(filterString: string): (rpc: any) => any;
    private static cleanFilterString;
    private static parseFilterChain;
    private static parseArguments;
    private static parseArgument;
    private static buildFilterFunction;
}
