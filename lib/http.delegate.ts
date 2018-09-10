import { HttpException } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { ServerCriticalException } from "./exceptions/ServerCriticalException";
import { Server } from "./server";

export class HttpDelegate {
    constructor(
        private readonly server: Server
    ) {
    }

    async send(http: AxiosInstance, config: AxiosRequestConfig): Promise<AxiosResponse> {
        config.url = `http://${this.server.address}:${this.server.port}${config.url}`;
        this.server.state.incrementServerActiveRequests();
        this.server.state.incrementTotalRequests();

        try {
            const response = await http.request(config);
            this.server.state.decrementServerActiveRequests();
            return response;
        } catch (e) {
            this.server.state.decrementServerActiveRequests();
            if (e.response) {
                throw new HttpException(e.response, e.statusCode);
            } else if (e.request) {
                throw new HttpException(e.request.message, 400);
            } else {
                this.server.state.incrementServerFailureCounts();
                throw new ServerCriticalException(e.message);
            }
        }
    }
}