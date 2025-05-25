import { ROUTER_CONFIG_KEY } from "../constants";
import { getMetaData } from "../helpers";
import { IRouter, RouterConfigOptions } from "../interfaces";
import { Logger } from "../logger";
import { BaseModel } from "../orm";

export abstract class Router<TModel extends typeof BaseModel>
  implements IRouter<TModel>
{
  private logger = Logger;
  routeName: string;
  private config: RouterConfigOptions<TModel>;
  constructor() {
    this.config = getMetaData(this.constructor, ROUTER_CONFIG_KEY);
    this.routeName =
      "/" + (this.config.route ?? this.constructor.name.toLowerCase());
    this.logger.info(`INITIALIZED ${this.constructor.name}`);
  }
  get model(): TModel {
    const config: RouterConfigOptions<TModel> = getMetaData(
      this.constructor,
      ROUTER_CONFIG_KEY,
    );
    return config.model;
  }
}
