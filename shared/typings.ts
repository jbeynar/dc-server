import {downloadHttpDocuments} from "../libs/downloader";
import * as Promise from 'bluebird';
import {extractFromRepo} from "../libs/extractor";
import {exportIntoMongo} from "../libs/exporterMongo";
import {exportIntoElasticsearch} from "../libs/exporterElasticsearch";

export interface IDocumentHttp {
    id?: number;
    name: string;
    type: string
    url: string;
    host: string;
    path: string;
    query: string;
    code: number;
    headers: string;
    body: string;
    length: number;
    retry_count?: number;
    ts?: Date|string;
}

export interface IDocumentJson {
    id: number,
    type: string,
    body: any,
    length: number,
    ts: Date|string
}

export interface IJsonSearchConfig {
    type?: string;
    whitelist?: any[];
    blacklist?: any[];
    random?: boolean;
    sort?: {
        [key: string]: string;
    },
    from?: number,
    size?: number
}

export interface IJsonSearchResults {
    properties: string[],
    results: any[]
}

export abstract class Task {
    abstract type: string;

    abstract execute(): Promise<any>;
}

export abstract class TaskDownload extends Task {
    type: string = 'TaskDownload';
    name: string;
    autoRemove?: boolean;

    abstract urls(): any;

    options?: {
        headers?: string[];
        intervalTime?: number;
    };

    execute(): Promise<any> {
        return downloadHttpDocuments(this);
    }
}

export interface ITaskExtractDefinition {
    attribute?: string,
    singular?: boolean;
    selector: string;
    process?: any;
    default?: any;
}

export abstract class TaskExtract extends Task {
    type: string = 'TaskExtract';
    sourceHttpDocuments: {
        host?: string;
        name?: string;
    };
    targetJsonDocuments: {
        typeName: string;
        autoRemove?: boolean;
    };
    scope?: string;
    map: {
        [key: string]: string|ITaskExtractDefinition;
    };
    process(extracted: any, doc: IDocumentHttp): any{
        return extracted;
    }

    execute(): Promise<any> {
        return extractFromRepo(this);
    }
}

export abstract class TaskScript extends Task {
    type: string = 'TaskScript';
    abstract script():any;

    execute(): Promise<any> {
        return this.script();
    }
}

abstract class TaskExport extends Task {
    type: string = 'TaskExport';
    sourceJsonDocuments: {
        typeName: string;
        order?: string;
        bufferSize?: string;
    };

    target: {
        url: string;
        bulkSize: number;
    }
}

export abstract class TaskExportElasticsearch extends TaskExport {
    type: string = 'TaskExportElasticsearch';
    target: {
        url: string;
        bulkSize: number;
        indexName: string;
        mapping: any;
    };

    transform?(document: any): any {
        return Promise.resolve(document.body);
    }

    execute(): Promise<any> {
        return exportIntoElasticsearch(this);
    }
}

export abstract class TaskExportMongodb extends TaskExport {
    type: string = 'TaskExportMongodb';
    target: {
        url: string;
        bulkSize: number;
        collectionName: string
        autoRemove?: boolean;
        indicies?: any;
    };

    execute(): Promise<any> {
        return exportIntoMongo(this);
    }
}
