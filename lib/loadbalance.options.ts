export interface Options {
    adapter?: string;
    ruleCls?: any;
    rules?: RuleOptions[];
}

export interface RuleOptions {
    service: string;
    ruleCls: any;
}
