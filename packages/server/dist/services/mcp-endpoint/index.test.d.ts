/**
 * Unit tests for MCP endpoint service (packages/server/src/services/mcp-endpoint/index.ts)
 *
 * Tests the service layer in isolation: auth error forwarding, config validation,
 * stateless request handling, and the internal chatflow tool callback
 * (result extraction + error handling).
 *
 * Controller tests (controllers/mcp-endpoint/index.test.ts) already cover the
 * Express middleware layer; these tests focus exclusively on the service functions
 * that are NOT exercised there.
 */
export {};
