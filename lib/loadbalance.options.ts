import { HttpException } from '@nestjs/common';

export interface Options {
  preSend?: (request: any) => void;
  postSend?: (e: HttpException, response: any) => void;
  strategy?: string;
  request?: object;
}

export interface BootOptions {
  preSend?: (request: any) => void;
  postSend?: (err: any, response: any, request: any) => void;
  path: string;
}
