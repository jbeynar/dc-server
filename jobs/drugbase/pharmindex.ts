import {TaskDownload} from "../../shared/typings";
import _ = require('lodash');

// curl 'http://pharmindex.pl/ws/gData.php'
// -H 'Cookie: _ga=GA1.2.1680048992.1522930933; _gid=GA1.2.1142146142.1522930933; phx=1; OID=%2257148%22; SID=%222%22; cookiesEnabled=true; PHPSESSID=h8jdh9rkrl4bc4605e0qmalvv0; previousPage=%22http%3A%2F%2Fpharmindex.pl%2FsearchResultsSingle.php%3Foper%3Ddc.la%26pkid%3D21%22' -H 'Origin: http://pharmindex.pl' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: application/json, text/javascript, */*; q=0.01' -H 'Referer: http://pharmindex.pl/searchResultsSingle.php?oper=dc.la&pkid=21'
// -H 'X-Requested-With: XMLHttpRequest'
// -H 'Connection: keep-alive' --data 'oper=dc.la&pkid=21&d=1' --compressed
export class Downloadx extends TaskDownload {
    name = 'drugbase';
    autoRemove = true;
    urls() {
        return ['http://pharmindex.pl/searchResultsSingle.php?oper=dc.la&pkid=21']
    };
}


export class Download extends TaskDownload {
    name = 'drugbase';
    autoRemove = true;
    
    const pkid = 21;

    urls() {
        return [`http://pharmindex.pl/searchResultsSingle.php?oper=dc.la&pkid=${pkid}`]
    };

    options = {
        headers: [
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Host': 'pharmindex.pl', 
            'Origin': 'http://pharmindex.pl', 
            'Referer': `http://pharmindex.pl/searchResultsSingle.php?oper=dc.la&pkid=${pkid}`,
            'X-Requested-With': 'XMLHttpRequest',
        ],
        body: {
            'oper': 'dc.la',
            'pkid': pkid,
            'd': 1
        }
        intervalTime: 1250
    }
}
