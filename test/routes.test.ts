/* eslint-disable @typescript-eslint/no-unused-vars */
import { join, partial, root, route } from '../src';

describe('route utils', () => {
  const widgetsRoot = join(root, 'widgets');
  const widgetRoute = join(widgetsRoot, ':widgetId');
  const widgetItemRoute = join(widgetRoute, route('items'));
  const widgetItemDetailRoute = join(widgetItemRoute, ':subId');

  it('should work', () => {
    // $ExpectType "/widgets"
    const w1 = widgetsRoot();
    expect(w1).toEqual('/widgets');

    // $ExpectType "/widgets/40"
    const w2 = widgetRoute({ widgetId: '40' } as const);
    expect(w2).toEqual('/widgets/40');

    const w3 = widgetItemDetailRoute({ widgetId: '40', subId: 'id' } as const);

    expect(w3).toEqual('/widgets/40/items/id');
  });

  it('should make all params optional', () => {
    const fullyOptional = partial(widgetItemDetailRoute, {
      widgetId: 'foo',
      subId: 'hey',
    });

    // no ts error for other params
    const e1 = partial(widgetItemDetailRoute, { foo: 'bar' });

    // $ExpectError
    e1();

    // $ExpectError
    e1({ widgetId: 'bar' });
    // $ExpectError
    e1({ subId: 'bar' });

    // no Error
    e1({ widgetId: 'bar', subId: 'baz' });

    // $ExpectType `/widgets/${string}/items/${string}`
    const op1 = fullyOptional();
    expect(op1).toEqual('/widgets/foo/items/hey');

    // $ExpectType `/widgets/${string}/items/${string}`
    const op2 = fullyOptional({ widgetId: 'bar' } as const);
    expect(op2).toEqual('/widgets/bar/items/hey');

    // $ExpectType `/widgets/foo/items/baz`
    const op3 = fullyOptional({ widgetId: 'bar', subId: 'baz' });
    expect(op3).toEqual('/widgets/bar/items/baz');
  });

  it('should make some params optional', () => {
    const optional = partial(widgetItemDetailRoute, {
      widgetId: 'foo',
      asfasf: 'hmm',
    });

    // $ExpectError missing params
    const er1 = optional();

    // $ExpectError missing key
    const er2 = optional({});

    // $ExpectError an unknown param
    const er3 = optional({ foo: 'bar' });

    // should be better
    // $ExpectType `/widgets/${string}/items/${string}`
    const op1 = optional({ subId: 'baz' } as const);

    expect(op1).toEqual('/widgets/foo/items/baz');

    // $ExpectType `/widgets/foo/items/baz`
    const op2 = optional({ widgetId: 'bar', subId: 'baz' });
    expect(op2).toEqual('/widgets/bar/items/baz');
  });
});
