import { Metadata, NodeWithScore } from 'llamaindex';
export declare const reformatSourceDocuments: (sourceNodes: NodeWithScore<Metadata>[]) => {
    pageContent: any;
    metadata: Metadata;
}[];
