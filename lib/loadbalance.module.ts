import { Module, DynamicModule, Global } from '@nestjs/common';
import * as Consul from 'consul';
import { Loadbalance, Callbacks } from './loadbalance.class';

@Global()
@Module({})
export class LoadbalanceModule {
  static forRoot(options: Callbacks): DynamicModule {
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
}
