import {TaskScript} from "../../shared/typings";

export class Freestyle extends TaskScript {
    script() {
        console.log('Hello world');
        return Promise.resolve();
    };
}
