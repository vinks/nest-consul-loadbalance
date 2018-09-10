import { HttpService, HttpException } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Loadbalancer } from './loadbalancer';
import { ServerCriticalException } from './exceptions/ServerCriticalException';

export class HttpDelegate {
  constructor(private readonly loadbalancer: Loadbalancer) {}

  async send(
    http: HttpService,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    const server = this.loadbalancer.chooseService();
    config.url = `http://${server.address}:${server.port}${config.url}`;
    server.state.incrementServerActiveRequests();
    server.state.incrementTotalRequests();

    return await new Promise<AxiosResponse>(async (resolve, reject) => {
      const observer = await http.request(config);
      observer.subscribe(
        response => {
          resolve(response);
        },
        e => {
          if (e.response) {
            reject(new HttpException(e.response, e.statusCode));
          } else if (e.request) {
            reject(new HttpException(e.request.message, 400));
          } else {
            server.state.incrementServerFailureCounts();
            reject(new ServerCriticalException(e.message));
          }
        },
        () => server.state.decrementServerActiveRequests(),
      );
    });
  }
}
