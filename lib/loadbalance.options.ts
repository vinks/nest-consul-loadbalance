export interface Options {
  adapter?: string;
  rules?: RuleOptions[];
}

export interface RuleOptions {
  service: string;
  ruleCls: any;
}
