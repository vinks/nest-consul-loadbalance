import { Module, DynamicModule, Global } from '@nestjs/common';
import * as Consul from 'consul';
import { Loadbalance } from './loadbalance';
import { Options } from './loadbalance.options';
import { Boot } from 'nest-boot';
import { ConsulConfig } from 'nest-consul-config';

@Global()
@Module({})
export class LoadbalanceModule {
  static register(options?: Options): DynamicModule {
    const inject = ['ConsulClient'];
    if (options.adapter === 'boot') {
      inject.push('BootstrapProvider');
    } else if (options.adapter === 'consul') {
      inject.push('ConsulConfigClient');
    }

    const loadbalanceProvider = {
      provide: 'LoadbalanceClient',
      useFactory: async (
        consul: Consul,
        boot: Boot | ConsulConfig,
      ): Promise<Loadbalance> => {
        const loadbalance = new Loadbalance(consul);
        const rules =
          (options.adapter === 'boot'
            ? boot.get('loadbalance.rules')
            : options.adapter === 'consul'
              ? await boot.get('loadbalance.rules')
              : options.rules) || [];

        await Promise.all(
          rules.map(async rule => {
            try {
              await loadbalance.addService(rule.service, rule.ruleCls);
            } catch (e) {}
          }),
        );
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
