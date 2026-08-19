import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
type CSVLoaderOptions = {
    column?: string | number;
    separator?: string;
};
/**
 * A class that extends the TextLoader class. It represents a document
 * loader that loads documents from a CSV file. It has a constructor that
 * takes a `filePathOrBlob` parameter representing the path to the CSV
 * file or a Blob object, and an optional `options` parameter of type
 * `CSVLoaderOptions` or a string representing the column to use as the
 * document's pageContent.
 */
export declare class CSVLoader extends TextLoader {
    protected options: CSVLoaderOptions;
    constructor(filePathOrBlob: ConstructorParameters<typeof TextLoader>[0], options?: CSVLoaderOptions | string);
    /**
     * A protected method that parses the raw CSV data and returns an array of
     * strings representing the pageContent of each document. It uses the
     * `papaparse` to parse the CSV data. If
     * the `column` option is specified, it checks if the column exists in the
     * CSV file and returns the values of that column as the pageContent. If
     * the `column` option is not specified, it converts each row of the CSV
     * data into key/value pairs and joins them with newline characters.
     * @param raw The raw CSV data to be parsed.
     * @returns An array of strings representing the pageContent of each document.
     */
    parse(raw: string): Promise<string[]>;
}
export {};
