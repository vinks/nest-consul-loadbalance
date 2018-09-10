import { Server } from "./server";
import { get, keyBy } from 'lodash';
import * as Consul from 'consul';
import { CRITICAL, PASSING, ServerState, WARNING } from "./stats/server.state";
import { Loadbalancer } from "./loadbalancer";
import { Watcher } from './watcher';
import { RuleOptions } from "./loadbalance.options";

export class Loadbalance {
    private readonly consul: Consul;
    private loadbalancers = {};
    private watchers = {};
    private timer;
    private rules: RuleOptions[];
    private globalRuleCls: any;

    constructor(consul: Consul) {
        this.consul = consul;
        this.initialCheck();
    }

    async init(rules: RuleOptions[], globalRuleCls) {
        this.rules = rules;
        this.globalRuleCls = globalRuleCls;
        await this.updateServices();
    }

    chooseLoadbalancer(serviceName: string) {
        const loadbalancer = this.loadbalancers[serviceName];
        if (!loadbalancer) {
            throw new Error(`The service ${serviceName} is not exist`);
        }
        return loadbalancer;
    }

    choose(serviceName: string) {
        const loadbalancer = this.loadbalancers[serviceName];
        if (!loadbalancer) {
            throw new Error(`The service ${serviceName} is not exist`);
        }
        return loadbalancer.chooseService();
    }

    private removeService(serviceName: string) {
        delete this.loadbalancers[serviceName];
        const watcher = this.watchers[serviceName];
        if (watcher) {
            watcher.clear();
        }
    }

    private async updateServices() {
        const newServices = [];
        const services = await this.consul.agent.service.list();
        const ruleMap = keyBy(this.rules, 'service');
        for (const serviceId in services) {
            if (services.hasOwnProperty(serviceId)) {
                const service = get(services[serviceId], 'Service');
                newServices.push(service);
                await this.addService(service, get(ruleMap[service], 'ruleCls', this.globalRuleCls));
            }
        }
        for (const service in this.loadbalancers) {
            if (this.loadbalancers.hasOwnProperty(service)) {
                if (newServices.indexOf(service) === -1) {
                    this.removeService(service);
                }
            }
        }
    }

    private async addService(serviceName: string, ruleCls: any) {
        if (!serviceName || this.loadbalancers[serviceName]) {
            return null;
        }

        const nodes = await this.consul.health.service(serviceName);
        this.createLoadbalancer(serviceName, nodes, ruleCls);
        this.createServiceWatcher(serviceName, ruleCls);
    }

    private initialCheck() {
        this.timer = setInterval(() => {
            for (const key in this.watchers) {
                if (this.watchers.hasOwnProperty(key)) {
                    const watcher = this.watchers[key];
                    const lastChangeTime = watcher.getLastChangeTime();
                    if (lastChangeTime) {
                        const now = new Date().getTime();
                        if (now - lastChangeTime > 300000) {
                            watcher.rewatch();
                        }
                    }
                }
            }
            this.updateServices();
        }, 60000)
    }

    private createServiceWatcher(serviceName, ruleCls) {
        const watcher = this.watchers[serviceName] = new Watcher(this.consul, {
            method: this.consul.health.service,
            params: { service: serviceName }
        });
        watcher.watch((e, nodes) => e ? void 0 : this.createLoadbalancer(serviceName, nodes, ruleCls));
    }

    private createLoadbalancer(serviceName, nodes, ruleCls) {
        const servers = nodes.map(node => {
            let status = CRITICAL;
            if (node.Checks.length) {
                status = PASSING;
            }
            for (let i = 0; i < node.Checks; i++) {
                const check = node.Checks[i];
                if (check.Status === CRITICAL) {
                    status = CRITICAL;
                    break;
                } else if (check.Status === WARNING) {
                    status = WARNING;
                    return true;
                }
            }

            return { ...node, status };
        }).map(node => {
            const server = new Server(get(node, 'Node.Address', '127.0.0.1'), get(node, 'Service.Port'));
            server.name = get(node, 'Node.Node');
            server.state = new ServerState();
            server.state.status = get(node, 'status', CRITICAL);
            return server;
        });

        this.loadbalancers[serviceName] = new Loadbalancer({ id: serviceName, servers, ruleCls });
    }
}