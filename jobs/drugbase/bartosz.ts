import { TaskDownload, TaskExtract, IJsonSearchConfig } from "../../shared/typings";
import _ = require('lodash');
import { getJsonDocuments } from "../../libs/repo";



export class DownloadBartoszDocumentsMeta extends TaskDownload {
    name = 'drugbase-bartosz-documents-meta';
    autoRemove = true;

    urls() { // 613
        return _.map(_.range(40), (v) => {
            return `http://www.bartoszmowi.pl/phx_drugs/glossary/page:${v}`
        })
    };
}

export class ExtractBartoszDocumentsMeta extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-bartosz-documents-meta'
    };
    targetJsonDocuments = {
        typeName: 'drugbase-bartosz-products-meta',
        autoRemove: true
    };

    scope = '#phx-glossary-sorting tr';
    map = {
        href: {
            singular: true,
            attribute: 'href',
            selector: 'td:first-child a'
        },
    }


    process(extracted) {
        return _.map(extracted, (v) => {
            return {
                id: parseInt(v.href.replace('/phx_preparat/', ''))
            }
        });
    };
}

export class DownloadBartoszDocuments extends TaskDownload {
    name = 'drugbase-bartosz-products';
    autoRemove = true;
    options = {
        intervalTime: 500
    };

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-bartosz-products-meta',
            sort: { id: 'ASC' }
        };
        return getJsonDocuments(query).then((data) => {
            let urls = _.map(data.results, (row) => {
                let id = _.get(row, 'body.id');
                return `http://www.bartoszmowi.pl/phx_preparat/${id}`

            })
            return _.chain(urls)
                .uniq()
        });
    }
}

export class ExtractBartoszDocuments extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-bartosz-documents-meta'
    };
    targetJsonDocuments = {
        typeName: 'drugbase-bartosz-products-meta',
        autoRemove: true
    };

    scope = 'div.textContent table.lista tr';
    map = {
        row: { singular:true, selector: "td.even" }
    }
    // scope = 'table.listaLeft tr';
    // map = {
    //     title: {
    //         singular: true,
    //         selector: 'th'
    //     },
    //     value: {
    //         singular: true,
    //         selector: 'td'
    //     }
    // }


    process(extracted) {
        console.log("i");
        
        console.log(JSON.stringify(extracted, null, 3));
        return undefined;
    };
}