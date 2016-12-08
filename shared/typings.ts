import {downloadHttpDocuments} from "../libs/downloader";
import * as Promise from 'bluebird';
import {extractFromRepo} from "../libs/extractor";
import {exportIntoMongo} from "../libs/exporter";

export interface IDocumentHttp {
    id?: number;
    name?: string;
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
    ts?: Date;
}

export interface IJsonSearchConfig {
    type?: string;
    whitelist?: [any];
    blacklist?: [any];
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

export abstract class TaskNightmare extends Task {
    type: string = 'TaskNightmare';
    name: string;
    map: {
        [key: string]: any;
    };
    $inject: any[];
    execute() : Promise<any> {
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

export abstract class TaskExport extends Task {
    type: string = 'TaskExport';
    sourceJsonDocuments: {
        typeName: string;
        order: string;
    };
    targetMongo: {
        url: string;
        collectionName: string;
        autoRemove: boolean;
    };

    execute(): Promise<any> {
        return exportIntoMongo(this);
    }
}
