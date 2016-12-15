// TODO
// WIP

import {TaskNightmare} from "../shared/typings";

function loginIfRequired() {

}

function checkBalance() {

}

function bet() {

}

function getQuotes() {

}

function extractSymbols() {

}

function logout() {

}

export class TaskBet extends TaskNightmare{
    tasks = [{fn: loginIfRequired, params: []}, {fn: bet}, {fn: logout}];
}

export class CheckBalance extends TaskNightmare{
    tasks = [loginIfRequired, checkBalance, logout];
}
