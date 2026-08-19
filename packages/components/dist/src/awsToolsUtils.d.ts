import { ICommonObject, INodeData } from './Interface';
export declare const AWS_REGIONS: {
    label: string;
    name: string;
}[];
export declare const DEFAULT_AWS_REGION = "us-east-1";
export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}
export interface AWSCredentialConfig {
    credentials?: AWSCredentials;
    region?: string;
}
/**
 * Get AWS credential configuration from node data, supporting both static credentials
 * and STS AssumeRole flows.
 *
 * This is the **primary entry point** for all AWS nodes to obtain credentials. It handles
 * three scenarios:
 *
 * 1. **AssumeRole** — When `roleArn` is present in the credential, calls STS `AssumeRole`
 *    using either the provided static keys or the SDK default credential chain as base
 *    credentials, and returns temporary session credentials.
 * 2. **Static credentials** — When `awsKey` and `awsSecret` are present (no `roleArn`),
 *    returns them directly (backward-compatible with pre-AssumeRole behavior).
 * 3. **SDK default chain** — When neither keys nor `roleArn` are provided, returns
 *    `{ credentials: undefined }` so the caller can fall back to the AWS SDK default
 *    credential provider chain (EC2 instance profile, EKS IRSA, environment variables, etc.).
 *
 * @param {INodeData} nodeData - Node data containing credential information
 * @param {ICommonObject} options - Options containing appDataSource and databaseEntities
 * @param {string} [region] - AWS region (defaults to DEFAULT_AWS_REGION)
 * @returns {Promise<AWSCredentialConfig>} Resolved credential configuration with optional
 *   `credentials` and `region` fields
 * @throws {Error} If STS AssumeRole fails (e.g., access denied, invalid Role ARN, wrong
 *   External ID) — The full error is logged server-side.
 */
export declare function getAWSCredentialConfig(nodeData: INodeData, options: ICommonObject, region?: string): Promise<AWSCredentialConfig>;
/**
 * Get AWS credentials from node data (backward-compatible wrapper).
 *
 * This function preserves the original API used by **Pattern A** nodes (AWS SNS,
 * DynamoDB KV Storage). Internally it delegates to {@link getAWSCredentialConfig}
 * and unwraps the credentials.
 *
 * **Behavior**:
 * - When `roleArn` is configured: returns temporary credentials from STS AssumeRole
 * - When static keys (`awsKey` + `awsSecret`) are provided: returns them directly
 * - When neither keys nor `roleArn` are provided: returns `undefined`, allowing the
 *   AWS SDK to use its default credential provider chain (EC2 instance profiles,
 *   EKS IRSA, environment variables, ~/.aws/credentials, etc.)
 *
 * @param {INodeData} nodeData - Node data containing credential information
 * @param {ICommonObject} options - Options containing appDataSource and databaseEntities
 * @returns {Promise<AWSCredentials | undefined>} Resolved credentials (static, from STS AssumeRole, or undefined)
 * @throws {Error} When STS AssumeRole fails (propagated from {@link getAWSCredentialConfig})
 */
export declare function getAWSCredentials(nodeData: INodeData, options: ICommonObject): Promise<AWSCredentials | undefined>;
