import { Server } from './server';
import { get } from 'lodash';
import * as Consul from 'consul';
import { CRITICAL } from './stats/server.state';
import { Loadbalancer } from './loadbalancer';

export class Loadbalance {
  private readonly consul: Consul;
  private loadbalancers = {};

  constructor(consul: Consul) {
    this.consul = consul;
  }

  async addService(serviceName: string, ruleCls: any) {
    if (!serviceName) {
      return null;
    }

    const servers = await this.consul.health
      .service(serviceName)
      .filter(node => {
        for (let i = 0; i < node.Checks; i++) {
          const check = node.Checks[i];
          if (check.Status === CRITICAL) {
            return false;
          }
        }
        return true;
      })
      .map(node => {
        const server = new Server(
          get(node, 'Node.Status', CRITICAL),
          get(node, 'Service.Port'),
        );
        server.name = get(node, 'Node.Node');
        return server;
      });

    this.loadbalancers[serviceName] = new Loadbalancer({
      id: serviceName,
      servers,
      ruleCls,
    });
  }

  removeService(serviceName: string) {
    delete this.loadbalancers[serviceName];
  }

  choose(serviceName: string) {
    const loadbalancer = this.loadbalancers[serviceName];
    if (!loadbalancer) {
      throw new Error(`The service ${serviceName} is not exist`);
    }
    return loadbalancer.chooseService();
  }
}
