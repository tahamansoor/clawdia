import { BaseModel } from "../orm";

export interface RouterConfigOptions<T extends typeof BaseModel> {
  model: T;
  route: string;
}
