import * as LoadbalanceClient from 'loadbalance-client';
import * as Consul from 'consul';
import { Options } from './loadbalance.options';

export interface Callbacks {
  preSend?: (request: object) => void;
  postSend?: (err: Error, response: object) => void;
}

export class Loadbalance {
  private readonly callbacks: Callbacks;
  private readonly consul: Consul;
  private readonly clientCache: object;
  private services: object[];
  private readonly options: Options;

  constructor(consul: Consul, options: Options) {
    this.consul = consul;
    this.callbacks = options;
    this.clientCache = {};
    this.options = { strategy: options.strategy, request: options.request };
  }

  get(service: string, force?: boolean, options?: object) {
    let opts = { request: { forever: true } };
    Object.assign(opts, options, this.options);
    if (this.clientCache[service] && !force) {
      return this.clientCache[service];
    } else {
      return (this.clientCache[service] = this.getClient(service, opts));
    }
  }

  getLbServices(): object[] {
    return this.services;
  }

  send(service: string, request: object) {
    return this.get(service, false).send(request);
  }

  private getClient(service: string, options: object) {
    const lbClient = new LoadbalanceClient(service, this.consul, options);
    if (this.callbacks && typeof this.callbacks.preSend === 'function') {
      lbClient.onPreSend(this.callbacks.preSend);
    }
    if (this.callbacks && typeof this.callbacks.postSend === 'function') {
      lbClient.onPostSend(this.callbacks.postSend);
    }

    lbClient.on('refreshing-services', (services, pool) => {
      this.services = services
        .map(item => item.Service)
        .map(item => ({ address: item.Address, port: item.Port }));
    });
    return lbClient;
  }
}
