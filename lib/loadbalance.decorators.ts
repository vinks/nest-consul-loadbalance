import { Inject } from '@nestjs/common';
import { LOADBALANCE_PROVIDER } from "./constants";

export const InjectLoadbalance = () => Inject(LOADBALANCE_PROVIDER);
