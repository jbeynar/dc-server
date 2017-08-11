import {TaskDownload, TaskExtract} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'dog-breed';
    autoRemove = true;

    urls() {
        return ['https://pl.wikipedia.org/wiki/Owczarek_niemiecki',
            'https://pl.wikipedia.org/wiki/Shiba',
            'https://pl.wikipedia.org/wiki/Golden_retriever',
            'https://pl.wikipedia.org/wiki/Labrador_retriever'];
    }
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'dog-breed'
    };

    targetJsonDocuments = {
        typeName: 'dog-breed',
        autoRemove: true
    };

    map = {
        name: {
            selector: '.infobox tr:nth-child(2) td',
            singular: true
        },
        alternativeName: {
            selector: '.infobox tr:nth-child(3) td:nth-child(2)',
            singular: true
        },
        country: {
            selector: '.infobox tr:nth-child(4) td:nth-child(2)',
            singular: true
        }
    }
}
