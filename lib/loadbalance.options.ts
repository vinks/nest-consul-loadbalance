export interface Options {
  preSend?: (request: object) => void;
  postSend?: (err: Error, response: object) => void;
  strategy?: string;
  request?: object;
}

export interface BootOptions {
  preSend?: (request: object) => void;
  postSend?: (err: Error, response: object) => void;
  path: string;
}
