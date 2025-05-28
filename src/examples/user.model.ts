import { BaseModel } from "../orm";
import { Model } from "../decorators";

/**
 * Example User model extending BaseModel
 */
@Model("user")
export class User extends BaseModel {
  id!: string;
  username!: string;
  email!: string;
}
