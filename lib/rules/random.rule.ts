import * as Random from 'random-js';
import { IRule } from "./rule.interface";
import { ILoadbalancer } from "../loadbalancer.interface";
import { Server } from "../server";

export class RandomRule implements IRule {
    private readonly randomEngine = new Random();
    private loadbalancer: ILoadbalancer;

    init(loadbalancer: ILoadbalancer) {
        this.loadbalancer = loadbalancer;
    }

    choose(): Server {
        let server = null;

        while (server === null) {
            const reachableServers = this.loadbalancer.servers;
            const allServers = this.loadbalancer.servers;
            const upCount = reachableServers.length;
            const serverCount = allServers.length;

            if (upCount === 0 || serverCount === 0) {
                return null;
            }

            const index = this.randomEngine.integer(0, serverCount - 1);
            server = reachableServers[index];

            if (server === null) {
                continue;
            }

            if (server.state.isAlive()) {
                return server;
            }

            server = null;
        }

        return server;
    }
}