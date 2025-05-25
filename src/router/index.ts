import { ROUTER_CONFIG_KEY } from "@constants/router-config.constant";
import { getMetaData } from "helpers";
import { IRouter, RouterConfig } from "interfaces";
import { Logger } from "logger";
import { Model } from "orm";

export class Router<T extends Model> implements IRouter<T> {
  private logger = Logger;
  routeName: string;
  model: T;
  private config: RouterConfig<T>;
  constructor() {
    this.config = getMetaData(this.constructor, ROUTER_CONFIG_KEY);
    this.routeName =
      "/" + (this.config.route ?? this.constructor.name.toLowerCase());
    this.model = this.config.model;
    this.logger.info(`INITIALIZED ${this.constructor.name}`);
  }
}
