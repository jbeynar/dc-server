import _ = require('lodash');
import {
    TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";

const symbols = ["06MAGNA", "08OCTAA", "11BIT", "4FUNMEDIA", "ABCDATA", "ABPL", "ACAUTOGAZ", "ACTION", "AGORA", "AGROWILL", "AILLERON", "ALCHEMIA", "ALIOR", "ALTA", "ALUMETAL", "AMBRA", "AMICA", "AMREST", "APATOR", "APLISENS", "APLITT", "APSENERGY", "ARCTIC", "ARCUS", "ARTERIA", "ASSECOBS", "BUMECH", "ASSECOPOL", "ASSECOSEE", "ASSECOSLO", "ASTARTA", "ATENDE", "ATLANTAPL", "ATLANTIS", "ATLASEST", "ATM", "ATMGRUPA", "ATREM", "AVIAAML", "BALTONA", "BBIDEV", "BEDZIN", "BENEFIT", "BERLING", "BEST", "BETACOM", "BIOTON", "BOGDANKA", "BORYSZEW", "BOWIM", "BRASTER", "BRIJU", "BSCDRUK", "BUDIMEX", "BYTOM", "BZWBK", "CAPITAL", "CCC", "CCENERGY", "CDPROJEKT", "CDRL", "CELTIC", "CEZ", "CFI", "CHEMOS", "CIECH", "CIGAMES", "CNT", "COLIAN", "COMARCH", "COMP", "COMPERIA", "CORMAY", "CUBEITG", "CYFRPLSAT", "CZTOREBKA", "DEBICA", "DECORA", "DEKPOL", "DELKO", "GRAJEWO", "DGA", "DOMDEV", "DROP", "DROZAPOL", "DTP", "DUDA", "DUON", "ECHO", "EDINVEST", "EFEKT", "EKOEXPORT", "ELBUDOWA", "ELEKTROTI", "ELEMENTAL", "ELKOP", "ELZAB", "EMCINSMED", "EMPERIA", "ENAP", "ENEA", "ENELMED", "ENERGA", "ENERGOINS", "ERBUD", "ERG", "HELIO", "ERGIS", "ESOTIQ", "ESSYSTEM", "EUCO", "EUROCASH", "EUROTEL", "EVEREST", "FAMUR", "FARMACOL", "FASING", "FASTFIN", "FEERUM", "FERRO", "FON", "FORTE", "GLCOSMED", "GPW", "GRAAL", "GRAVITON", "GREMINWES", "GROCLIN", "GRODNO", "GRUPAAZOTY", "HANDLOWY", "HARPER", "HAWE", "HERKULES", "HUBSTYLE", "HUTMEN", "HYDROTOR", "IFCAPITAL", "IFSA", "IMCOMPANY", "IMMOBILE", "IMPEL", "IMPERA", "IMPEXMET", "IMS", "INC", "INDATA", "INDYKPOL", "INGBSK", "INPRO", "INSTALKRK", "INTEGERPL", "INTERAOLT", "INTERBUD", "INTERCARS", "INTERFERI", "INTROL", "INVISTA", "IPOPEMA", "IQP", "IVMX", "IZOBLOK", "IZOLACJA", "IZOSTAL", "JHMDEV", "JWCONSTR", "K2INTERNT", "KANIA", "KBDOM", "KCI", "KERNEL", "KETY", "KGHM", "KINOPOL", "KOFOLA", "KOGENERA", "KOMPAP", "KOMPUTRON", "KONSSTALI", "KOPEX", "KPPD", "KRAKCHEM", "KREC", "KREDYTIN", "KREZUS", "KRUK", "KRUSZWICA", "LCCORP", "LENA", "LENTEX", "LIBET", "LIVECHAT", "LOTOS", "LPP", "LSISOFT", "PATENTUS", "LUBAWA", "MABION", "MAGELLAN", "MAKARONPL", "MARVIPOL", "MBANK", "MCI", "MCLOGIC", "MEDIATEL", "MEDICALG", "MENNICA", "MERCATOR", "MERCOR", "MEXPOLSKA", "MFO", "MILLENNIUM", "MIT", "MLPGROUP", "MNI", "MOJ", "MONNARI", "MOSTALPLC", "MOSTALZAB", "MUZA", "MWTRADE", "NETIA", "NETMEDIA", "NEUCA", "NEWWORLDR", "NFIEMF", "NOVITA", "NOWAGALA", "NTTSYSTEM", "ODLEWNIE", "OEX", "OPENFIN", "OPONEO.PL", "ORANGEPL", "ORBIS", "ORION", "ORZBIALY", "OTLOG", "OTMUCHOW", "OVOSTAR", "PAGED", "PBSFINANSE", "PCCEXOL", "PCCROKITA", "PEGAS", "PEIXIN", "PEKAES", "PEMUG", "PEP", "PEPEES", "PGE", "PGNIG", "PGODLEW", "PHN", "PKNORLEN", "PKPCARGO", "PLASTBOX", "PLATYNINW", "PMPG", "POLCOLORIT", "POLICE", "POLMED", "POLNA", "POLNORD", "POLWAX", "POZBUD", "PRAGMAFA", "PRESCO", "PROCAD", "PROCHEM", "PROCHNIK", "PROJPRZEM", "PROTEKTOR", "PSG", "PULAWY", "PWRMEDIA", "PZU", "QUANTUM", "QUERCUS", "RADPOL", "RAFAKO", "RAFAMET", "RAINBOW", "RAWLPLUG", "STALEXP", "REDAN", "RELPOL", "REMAK", "RESBUD", "ROBYG", "RONSON", "ROPCZYCE", "ROVESE", "RUBICON", "SANOK", "SANWIL", "SCOPAK", "SECOGROUP", "SEKO", "SELENAFM", "SELVITA", "SFINKS", "SILVANO", "SIMPLE", "SKOTAN", "SKYLINE", "SMT", "SNIEZKA", "SOHODEV", "SOLAR", "SONEL", "SOPHARMA", "STALPROD", "STALPROFI", "STARHEDGE", "SUNEX", "SUWARY", "SYGNITY", "SYNEKTIK", "SYNTHOS", "TALEX", "TARCZYNSKI", "TAURONPE", "TERESA", "TERMOREX", "TESGAS", "TFONE", "TIM", "TORPOL", "TOYA", "TRAKCJA", "TRANSPOL", "TRITON", "ULMA", "UNIBEP", "UNIMA", "URSUS", "VANTAGE", "VARIANT", "VIGOSYS", "VINDEXUS", "VISTAL", "VISTULA", "VOTUM", "VOXEL", "WADEX", "WASKO", "WAWEL", "WDX", "WIELTON", "WINVEST", "WISTIL", "WOJAS", "WORKSERV", "ZAMET", "ZASTAL", "ZEPAK", "ZETKAMA", "ZPUE", "ZREMB", "ZUE", "ZYWIEC"];

export class download extends TaskDownload {
    name = 'stockbase-quotations';

    urls() {
        const urls = [];
        _.forEach(symbols, (symbol) => {
            _.times(2, (i) => {
                urls.push('http://www.biznesradar.pl/notowania-historyczne/' + symbol + ',' + i);
            });
        });
        return urls;
    }
}

class exportProducts extends TaskExportElasticsearch {
    transform(document) {
        if (_.isEmpty(document[1])) {
            return;
        }
        return {
            symbol: document[1].symbol,
            date: document[1].date,
            open: parseFloat(document[1].open),
            close: parseFloat(document[1].close),
            high: parseFloat(document[1].high),
            low: parseFloat(document[1].low),
            volume: parseInt(document[1].volume),
            turnover: parseInt(document[1].turnover)
        };
    }

    target: TaskExportElasticsearchTargetConfig = {
        // url: 'http://elastic:changeme@vps404988.ovh.net:9200',
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 50,
        indexName: 'quotation',
        overwrite: true,
        mapping: {
            quotations: {
                dynamic: 'strict',
                properties: {
                    symbol: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    open: {
                        type: 'float',
                    },
                    close: {
                        type: 'float'
                    },
                    high: {
                        type: 'float'
                    },
                    low: {
                        type: 'float'
                    },
                    volume: {
                        type: 'float',
                    },
                    turnover: {
                        type: 'float',
                    },
                    date: {
                        type: 'date'
                    }
                }
            }
        }
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'stockbase-quotations'
    };
    scope = 'table.qTableFull tr';
    map = {
        open: {
            singular: true,
            selector: 'td:nth-child(2)'
        },
        close: {
            singular: true,
            selector: 'td:nth-child(5)'
        },
        high: {
            singular: true,
            selector: 'td:nth-child(3)'
        },
        low: {
            singular: true,
            selector: 'td:nth-child(4)'
        },
        volume: {
            singular: true,
            selector: 'td:nth-child(6)'
        },
        date: {
            singular: true,
            selector: 'td:nth-child(1)'
        },
        turnover: {
            singular: true,
            selector: 'td:nth-child(7)'
        }
    };

    process(dataset, document, meta) {
        dataset.splice(0, 1);
        if (_.isString(meta.path) && !_.isEmpty(meta.path)) {
            const result = meta.path.match(/\/notowania-historyczne\/(.*),/);
            const symbol = _.get(result, [1], '');

            _.forEach(dataset, (item) => {
                item.symbol = symbol;
                item.volume = item.volume.replace(' ', '');
                item.turnover = item.turnover.replace(' ', '');
                const rawDate = item.date.split('.');
                const date = new Date(rawDate[2], parseInt(rawDate[1]) - 1, rawDate[0], 17, 0, 0, 0);
                item.date = date;
            });
        }
        return dataset;
    }

    exportJsonDocuments = new exportProducts();
}
