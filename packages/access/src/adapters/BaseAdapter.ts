import { Role } from '../types';

export abstract class BaseAdapter {
  // eslint-disable-next-line no-useless-constructor
  protected constructor(public name: string) {
    // noop
  }

  abstract getRolesByName(names: Array<string>): Promise<Array<Role>> | Array<Role>;
}
