import { ServerState } from './stats/server.state';
import { Rule, RandomRule } from './rules';
import { Server } from './server';

export class Loadbalancer {
  private readonly id: string;
  private readonly name: string;
  servers: Server[];
  private rule: Rule;

  constructor(options: {
    id: string;
    name?: string;
    servers?: Server[];
    ruleCls?;
  }) {
    this.id = options.id;
    this.name = options.name || options.id;
    this.servers = this.initialServers(options.servers);
    if (
      typeof options.ruleCls === 'function' &&
      options.ruleCls.prototype.constructor
    ) {
      this.rule = new options.ruleCls(this);
    } else if (typeof options.ruleCls === 'string') {
    } else {
      this.rule = new RandomRule();
    }
    this.rule.init(this);
  }

  chooseService() {
    if (!this.rule) {
      throw new Error('The rule is not exist.');
    }

    return this.rule.choose();
  }

  updateRule(RuleCls) {
    if (typeof RuleCls === 'function' && RuleCls.prototype.constructor) {
      this.rule = new RuleCls(this);
      this.rule.init(this);
    }
  }

  addServer(server: Server) {
    if (server) {
      this.servers.push(this.initialServer(server));
    }
  }

  removeServer(serverId: string) {
    if (serverId) {
      this.servers = this.servers.filter(server => server.id !== serverId);
    }
  }

  private initialServers(servers: Server[]): Server[] {
    if (!servers) {
      return [];
    }
    return servers.map(server => this.initialServer(server));
  }

  private initialServer(server: Server): Server {
    if (!server.address || !server.port) {
      throw new Error('Service does not has address or port');
    }

    server.state = new ServerState();
    return server;
  }
}
