import { Module, DynamicModule, Global } from '@nestjs/common';
import * as Consul from 'consul';
import { Loadbalance, Callbacks } from './loadbalance.class';
import { Options, BootOptions } from './loadbalance.options';
import { Boot } from 'nest-boot';

@Global()
@Module({})
export class LoadbalanceModule {
  static init(options?: Options): DynamicModule {
    const loadbalanceProvider = {
      provide: 'LoadbalanceClient',
      useFactory: (consul: Consul): Loadbalance => {
        return new Loadbalance(consul, options);
      },
      inject: ['ConsulClient'],
    };

    return {
      module: LoadbalanceModule,
      components: [loadbalanceProvider],
      exports: [loadbalanceProvider],
    };
  }

  static initWithBoot(options?: BootOptions): DynamicModule {
    const loadbalanceProvider = {
      provide: 'LoadbalanceClient',
      useFactory: (boot: Boot, consul: Consul): Loadbalance => {
        const opts = boot.get(options.path) || {};
        Object.assign(opts, options);
        return new Loadbalance(consul, opts);
      },
      inject: ['BootstrapProvider', 'ConsulClient'],
    };

    return {
      module: LoadbalanceModule,
      components: [loadbalanceProvider],
      exports: [loadbalanceProvider],
    };
  }
}
