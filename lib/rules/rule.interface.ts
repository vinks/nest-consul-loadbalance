import { Loadbalancer } from '../loadbalancer';
import { Server } from '../server';

export interface Rule {
  init(loadbalancer: Loadbalancer);

  choose(): Server;
}
