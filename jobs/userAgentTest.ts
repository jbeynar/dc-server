import {TaskDownload} from "../shared/typings";

export class download extends TaskDownload {
    name = 'userAgentTest';
    autoremove = true;
    options = {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36']
    };
    urls() {
        return ['http://vaio.hakier.pl/test.php'];
    }
}
