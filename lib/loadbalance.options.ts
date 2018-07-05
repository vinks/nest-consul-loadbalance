import { HttpException } from '@nestjs/common';

export interface Options {
  preSend?: (request: any) => void;
  postSend?: (e: HttpException, response: any) => void;
  strategy?: string;
  request?: object;
}

export interface BootOptions {
  preSend?: (request: any) => void;
  postSend?: (err: Error, response: any) => void;
  path: string;
}
