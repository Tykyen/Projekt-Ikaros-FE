import { describe, it, expect, beforeEach } from 'vitest';
import { systemEntitySchemaRegistry } from '../registry';
import type { SystemEntitySchema } from '../types';

describe('SystemEntitySchemaRegistry', () => {
  beforeEach(() => {
    systemEntitySchemaRegistry._clearForTesting();
  });

  it('register + get returns same schema', () => {
    const schema: SystemEntitySchema = {
      systemId: 'test',
      entityType: 'bestie',
      version: 1,
      sections: [],
    };
    systemEntitySchemaRegistry.register(schema);
    expect(systemEntitySchemaRegistry.get('test', 'bestie')).toBe(schema);
  });

  it('get returns null for missing key', () => {
    expect(systemEntitySchemaRegistry.get('foo', 'bestie')).toBeNull();
  });

  it('duplicate register throws', () => {
    const schema: SystemEntitySchema = {
      systemId: 'test',
      entityType: 'bestie',
      version: 1,
      sections: [],
    };
    systemEntitySchemaRegistry.register(schema);
    expect(() => systemEntitySchemaRegistry.register(schema)).toThrow();
  });

  it('list filters by systemId', () => {
    systemEntitySchemaRegistry.register({
      systemId: 'a',
      entityType: 'bestie',
      version: 1,
      sections: [],
    });
    systemEntitySchemaRegistry.register({
      systemId: 'a',
      entityType: 'token',
      version: 1,
      sections: [],
    });
    systemEntitySchemaRegistry.register({
      systemId: 'b',
      entityType: 'bestie',
      version: 1,
      sections: [],
    });
    expect(systemEntitySchemaRegistry.list('a')).toHaveLength(2);
    expect(systemEntitySchemaRegistry.list('b')).toHaveLength(1);
  });

  it('listSystems returns unique sorted', () => {
    systemEntitySchemaRegistry.register({
      systemId: 'z',
      entityType: 'bestie',
      version: 1,
      sections: [],
    });
    systemEntitySchemaRegistry.register({
      systemId: 'a',
      entityType: 'bestie',
      version: 1,
      sections: [],
    });
    expect(systemEntitySchemaRegistry.listSystems()).toEqual(['a', 'z']);
  });
});
