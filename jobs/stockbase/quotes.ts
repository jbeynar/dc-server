import _ = require('lodash');
import {
    TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";

const symbols = ['11-BIT-STUDIOS', 'AAT', 'ASSECO-POLAND', 'AMICA', 'APR', 'ARTIFEX', 'ATM-GRUPA', 'ATLAS-ESTATES', 'ATLANTA-POLAND', 'ATREM', 'AUGAGROUP', 'BUDIMEX', 'BORYSZEW', 'BYTOM', 'CCC', 'CASH-FLOW', 'CYFROWY-POLSAT', 'CUBE-ITG', 'CTS', 'DOM-DEVELOPMENT', 'ELKOP', 'ENEA', 'ENEL-MED', 'E-STAR', 'FAM', 'FERRUM', 'FAMUR', 'FON', 'FASING', 'GRAVITON-CAPITAL', 'HELIO', 'IALBGR', 'IBSM', 'INDYGOTECH-MINERALS', 'INDATA-SOFTWARE', 'IZOSTAL', 'JWW-INVEST', 'K2-INTERNET', 'KCI', 'KDM-SHIPPING-PUBLIC-LIMITED', 'KINO-POLSKA-TV', 'KRUSZWICA', 'KETY', 'MABION', 'MCI', 'MACROLOGIC', 'SKYSTONE', 'BANK-MILLENNIUM', 'MILKILAND', 'MNI', 'MOL-MAGYAR-OLAJ', 'MORIZON', 'ODLEWNIE-POLSKIE', 'OPEN-FINANCE', 'ORION-INVESTMENT', 'PATENTUS', 'PBG', 'PRIME-CAR-MANAGEMENT', 'ROKITA', 'PRAIRIE-MINING-LIMITED', 'PAGED', 'POLSKA-GRUPA-ODLEWNICZA', 'PROJPRZEM', 'PKN-ORLEN', 'PKO', 'PKPCARGO', 'PRIMA-MODA', 'PEMUG', 'PROCAD', 'QUANTUM-SOFTWARE', 'QUERCUS', 'RADPOL', 'SCO-PAK', 'SETANTA-FINANCE', 'SFINKS', 'SYGNITY', 'SADOVAYA', 'SKOTAN', 'STOMIL-SANOK', 'SYNTHOS', 'SYNEKTIK', 'SOLAR-COMPANY', 'SOPHARMA', 'STALPRODUKT', 'SWISSMED-CENTRUM-ZDROWIA', 'TIM', 'TRANS-POLONIA', 'TESGAS', 'UNICREDIT', 'WADEX', 'WANDALEX', 'WISTIL', 'WARIMPEX', 'ZAMET-INDUSTRY', 'ZREMB-CHOJNICE', 'ZYWIEC', 'AVIAAM', 'ABC-DATA', 'ABE', 'AGORA', 'ALCHEMIA', 'WIND-MOBILE', 'ALMA', 'ALIOR-BANK', 'ALUMETAL', 'APLISENS', 'APATOR', 'ARH', 'ARTERIA', 'ARCTIC-PAPER', 'ZAKLADY-AZOTOWE-TARNOW', 'B3SYSTEM', 'BETACOM', 'BUDOPOL-WROCLAW', 'BENEFIT-SYSTEMS', 'BGZ-BNP-PARIBAS', 'BANK-HANDLOWY', 'BUMECH', 'BMP', 'INTER-CARS', 'CLEAN-CARBON-ENERGY', 'CI-GAMES', 'CLNPHARMA', 'CPD', 'CAPITAL-PARK', 'EKO-EXPORT', 'ELZAB', 'EMPERIA', 'ENERGA', 'ENERGOINSTAL', 'EUROPEJSKIE-CENTRUM-ODSZKODOWAN', 'EVEREST-INVESTMENTS', 'EXILLON-ENERGY', 'FEERUM', 'FORTUNA-ENTERTAINMENT', 'POLISH-SERVICES-GROUP', 'GBKA', 'IMMOBILE', 'GEKOPLAST', 'GLOBAL-COSMED', 'GETIN-NOBLE-BANK', 'IDEON', 'INVESTMENT-FRIENDS', 'IMMOFINANZ', 'INDUSTRIAL-MILK-COMPANY', 'IMPEL', 'INTER-RAO-LIETUVA', 'IZO-BLOK', 'HENRYK-KANIA', 'KGL', 'KRYNICKI-RECYKLING', 'KRKA', 'KRUK', 'LABO-PRINT', 'LOTOS', 'BOGDANKA', 'MEDICALGORITHMICS', 'MOJ', 'MOSTOSTAL-PLOCK', 'NTT', 'NWR-NEW-WORLD-RESOURCES', 'ORZEL-BIALY', 'ORCO-PROPERTY', 'OTMUCHOW', 'PBS-FINANSE', 'PEKABEX', 'PCC-EXOL', 'PELION', 'PEKAO', 'PGNIG', 'PEGAS', 'PLATYNOWE-INWESTYCJE', 'POLMED', 'ZPUE', 'RAINBOW-TOURS', 'RAFAKO', 'RELPOL', 'ROBYG', 'RONSON', 'SEKO', 'AS-SILVANO-FASHION', 'SKARBIEC-HOLDING', 'SELVITA', 'STALPROFIL', 'TALEX', 'TORPOL', 'TERMO-REX', 'UNIMA-2000', 'VISTULA', 'WASKO', 'WIELTON', 'WIRTUALNA-POLSKA', 'WORK-SERVICE', 'XTB', 'ZAKLADY-AZOTOWE-PULAWY', 'ZASTAL', 'STAPORKOW', '4FUN-MEDIA', 'ABADONRE', 'ABM-SOLID', 'AAT-HOLDING', 'ALTUS', 'AMBRA', 'ASM-GROUP', 'ATENDE', 'ATM', 'AWBUD', 'BACD', 'BALTONA', 'BIOTON', 'BKM', 'BANK-OCHRONY-SRODOWISKA', 'BUWOG', 'CD-PROJEKT', 'CHEMOSERVIS-DWORY', 'CIECH', 'COAL-ENERGY', 'CERAMIKA-NOWA-GALA', 'CENTRUM-NOWOCZESNYCH-TECHNOLOGII', 'CZERWONA-TOREBKA', 'DECORA', 'DEKPOL', 'DGA', 'DROP', 'AMREST', 'EFEKT', 'ELEKTROTIM', 'ENERGOAPARATURA', 'ERG', 'ES-SYSTEM', 'FORTE', 'GPW', 'HYDROTOR', 'IMS', 'INC', 'INVISTA', 'INTERBUD-LUBLIN', 'JHM-DEVELOPMENT', 'JJ-AUTO', 'JW-CONSTRUCTION', 'KOPEX', 'KREDYT-INKASO', 'KVT', 'LIBET', 'LC-CORP', 'LENA-LIGHTING', 'LKD', 'LPP', 'LARK-PL', 'LENTEX', 'LIVECHAT', 'MEDIACAP', 'MEGARON', 'MEX-POLSKA', 'MIRACULUM', 'MLP-GROUP', 'MW-TRADE', 'NETIA', 'PANOVA', 'NOVITA', 'OLYMPIC-ENTERTAINMENT', 'OPONEO-PL', 'ORBIS', 'PC-GUARD', 'PGE', 'POINT-GROUP', 'POLSKI-HOLDING-NIERUCHOMOSCI', 'PLAYWAY', 'PRAGMA-INKASO', 'PROTEKTOR', 'POLWAX', 'PZU', 'REDAN', 'REMAK', 'ROBA', 'ROPCZYCE', 'REDWOOD-HOLDING', 'RAWLPLUG', 'SECO-WARWICK', 'TRAKCJA', 'ULMA-CONSTRUCCION', 'UNIBEP', 'UNIMOT-GAZ', 'URSUS', 'VIGO-SYSTEM', 'VINDEXUS', 'VOTUM', 'VIVID-GAMES', 'WIKANA', 'WILBO', 'YOLO', '06N', 'OCTAVA', 'ATAL', 'ACTION', 'APS-ENERGIA', 'ARCUS', 'ASSECO-SOUTH-EASTERN-EUROPE', 'AVIA-SOLUTIONS-GROUP', 'ATLANTIS', 'BIK', 'BIOMED-LUBLIN', 'BRASTER', 'BRIJU', 'BSC-DRUKARNIA-OPAKOWAN', 'BEST', 'BZW', 'CDL', 'CFI-HOLDING', 'COMP', 'COMARCH', 'COGNOR', 'COLIAN', 'CAPITAL-PARTNERS', 'CORMAY', 'CALATRAVA-CAPITAL', 'DELKO', 'DREWEX', 'ESOTIQ-HENDERSON', 'ECHO-INVESTMENT', 'EUROHOLD-BULGARIA', 'EUROCASH', 'FENGHUA-SOLETECH', 'GBK', 'GRODNO', 'GORENJE', 'HARPER-HYGIENICS', 'HERKULES', 'HYPERION', 'IDEA-BANK', 'INVESTMENT-FRIENDS-CAPITAL', 'POWER-MEDIA', 'IMPERA', 'INTERFERIE', 'INSTAL-KRAKOW', 'INPRO', 'INTERNATIONAL-PERSONAL-FINANCE-PLC', 'IMPEXMETAL', 'INTEGER-PL', 'KBD', 'KERNEL', 'KREZUS', 'LUBAWA', 'CAM-MEDIA', 'LSI-SOFTWARE', 'MAKARONY-POLSKIE', 'MBANK', 'MBR', 'MERCOR', 'MFO', 'ZETKAMA', 'MONNARI-TRADE', 'MPH', 'MIRBUD', 'MERCATOR', 'MOSTOSTAL-WARSZAWA', 'MOSTOSTAL-ZABRZE', 'MEDIATEL', 'MXC', 'MUZA', 'MZNA', 'NORTH-COAST', 'NEWAG', 'TELL', 'OT-LOGISTICS', 'POLICE', 'PEM', 'PFLEIDERER-GRAJEWO', 'PLAZACNTR', 'PAMAPOL', 'POLNORD', 'PEPEES', 'PROCHNIK', 'PRAGMA-FAKTORING', 'PROCHEM', 'RAFAMET', 'RUBICON-PARTNERS', 'REINHOLD', 'SANTANDER', 'SARE', 'SELENA-FM', 'SERINUS', 'SOHO-DEVELOPMENT', 'SIMPLE', 'SANWIL-HOLDING', 'STELMET', 'SUWARY', 'TARCZYNSKI', 'TATRY-MOUNTAIN-RESORTS', 'TXM', 'VOXEL', 'WOJAS', 'ZEPAK', 'ASSECO-BUSINESS-SOLUTIONS', 'ACG', 'ADIUVO-INVESTMENT', 'AGROTON', 'AMPLI', 'ASBISC', 'ASTARTA', 'AIRWAY-MEDIX', 'BBI-DEVELOPMENT', 'ELEKTROCIEPLOWNIA-BEDZIN', 'BOWIM', 'BERLING', 'CEZ', 'COMPERIA-PL', 'DEBICA', 'DNP', 'DROZAPOL-PROFIL', 'ED-INVEST', 'ERGIS-EUROFILMS', 'ELEKTROBUDOWA', 'EMC', 'ELEMENTAL-HOLDING', 'ENT', 'ERBUD', 'EUROTEL', 'FAST-FINANCE', 'FOTA', 'FERRO', 'GROCLIN', 'GOBARTO', 'GPR', 'GINO-ROSSI', 'GTC', 'GETIN-HOLDING', 'HUBSTYLE', 'HAWE', 'I2D', 'IDM', 'INDYKPOL', 'ING-BANK-SLASKI', 'INTROL', 'IPOPEMA', 'INTERSPORT', 'IPT', 'IQ-PARTNERS', 'IZOLACJA-JAROCIN', 'JSW-JASTRZEBSKA-SPOLKA-WEGLOWA', 'KRAKCHEMIA', 'KGHM', 'KOGENERACJA', 'KOMPAP', 'KOMPUTRONIK', 'KPD', 'KERDOS-GROUP', 'KSG-AGRO', 'KONSORCJUM-STALI', 'MARIE-BRIZARD-WINE-SPIRITS', 'MENNICA-POLSKA', 'MARVIPOL', 'NETMEDIA', 'NEUCA', 'PETROLINVEST', 'ORANGE', 'OPTEAM', 'OVOSTAR', 'PCC-INTERMODAL', 'POLENERGIA', 'PEIXIN', 'POLNA', 'PLAST-BOX', 'POZBUD', 'PGS-SOFTWARE', 'POLIMEX', 'QUMAK', 'REGNON', 'RESBUD', 'RANK-PROGRESS', 'STARHEDGE', 'SNIEZKA', 'SKYLINE-INVESTMENT', 'SUNEX', 'SONEL', 'STALEXPORT-AUTOSTRADY', 'TNX', 'TOYA', 'TAURON', 'TRITON-DEVELOPMENT', 'TRNA', 'UNIWHEELS', 'VANTAGE-DEVELOPMENT', 'VISTAL', 'W-INVESTMENTS', 'WTN', 'WAWEL', 'ZUE']

export class download extends TaskDownload {
    name = 'stockbase-quotations';
    autoRemove = true;

    urls() {
        const urls = [];
        _.forEach(symbols, (symbol) => {
            _.times(40, (i) => {
                urls.push('http://www.biznesradar.pl/notowania-historyczne/' + symbol + ',' + (i+1));
            });
        });
        return urls;
    }
}

class exportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 4,
        indexName: 'quotation-december',
        overwrite: true,
        mapping: {
            'quotation-december': {
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
                    },
                    stats: {
                        dynamic: true,
                        properties: {
                            ema20: {
                                type: 'float'
                            }
                        }
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
        dataset.splice(0, 1); // remove first item cause it is a header
        if (_.isString(meta.path) && !_.isEmpty(meta.path)) {
            const result = meta.path.match(/\/notowania-historyczne\/(.*),/);
            const symbol = _.get(result, [1], '');

            _.forEach(dataset, (item) => {
                const rawDate = item.date.split('.');
                const date = new Date(rawDate[2], parseInt(rawDate[1]) - 1, rawDate[0], 17, 0, 0, 0);
                item.symbol = symbol;
                item.date = date;
                item.volume = parseInt(item.volume.replace(' ', ''));
                item.turnover = parseInt(item.turnover.replace(' ', ''));
                item.open = parseFloat(item.open);
                item.close = parseFloat(item.close);
                item.high = parseFloat(item.high);
                item.low = parseFloat(item.low);
            });
        }
        return dataset;
    }

    exportJsonDocuments = new exportProducts();
}
