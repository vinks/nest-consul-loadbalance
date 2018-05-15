import { Inject } from '@nestjs/common';

export const InjectLoadbalance = () => Inject('LoadbalanceClient');
