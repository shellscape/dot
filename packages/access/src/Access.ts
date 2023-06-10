export interface IAccessInfo {
  action: string;
  resource: string;
  roles: Array<string>;
}

export class Access {
  private readonly _roles: Array<string>;
  private readonly _action: string;
  private readonly _resource: string;

  constructor(access: IAccessInfo) {
    this._roles = access.roles;
    this._action = access.action;
    this._resource = access.resource;
  }

  get roles(): Array<string> {
    return this._roles;
  }

  get action(): string {
    return this._action;
  }

  get resource(): string {
    return this._resource;
  }
}
