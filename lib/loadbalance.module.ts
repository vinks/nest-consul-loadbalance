import { Module, DynamicModule, Global } from '@nestjs/common';
import { Loadbalance } from './loadbalance';
import { Options } from './loadbalance.options';
import {
    BOOT_ADAPTER,
    BOOTSTRAP_PROVIDER, CONSUL_ADAPTER,
    CONSUL_CONFIG_PROVIDER,
    CONSUL_SERVICE_PROVIDER,
    LOADBALANCE_PROVIDER
} from "./constants";
import { IBoot } from "./boot.interface";
import { ConsulService } from "nest-consul-service";

@Global()
@Module({})
export class LoadbalanceModule {
    static register(options?: Options): DynamicModule {
        const inject = [CONSUL_SERVICE_PROVIDER];
        if (options.adapter === BOOT_ADAPTER) {
            inject.push(BOOTSTRAP_PROVIDER);
        } else if (options.adapter === CONSUL_ADAPTER) {
            inject.push(CONSUL_CONFIG_PROVIDER);
        }

        const loadbalanceProvider = {
            provide: LOADBALANCE_PROVIDER,
            useFactory: async (service: ConsulService, boot: IBoot): Promise<Loadbalance> => {
                const loadbalance = new Loadbalance(service);
                const rules = (
                    options.adapter === 'boot' ? boot.get('loadbalance.rules') :
                        options.adapter === 'consul' ? (await boot.get('loadbalance.rules')
                        ) : options.rules) || [];
                await loadbalance.init(rules, options.ruleCls);
                return loadbalance;
            },
            inject,
        };

        return {
            module: LoadbalanceModule,
            components: [loadbalanceProvider],
            exports: [loadbalanceProvider],
        };
    }
}
