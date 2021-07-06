# spa-routing

Route helpers that just make sense.

[spa-routing](https://github.com/4Catalyzer/spa-routing) is a heavily-typed set of helpers for creating reliable pathnames

## Usage

- [route](#route)
- [join](#join)
- [partial](#partial)

### `route(path: S extends String)`

Creates a route or route segment factory from a string.

```ts
const orgRoute = route('/organizations');

orgRoute(); // '/organizations'
```

Routes can also include `param`s using the `:name` syntax in
your route:

```ts
const projectRoute = route('/organizations/:slug/projects/:projectId/');

projectRoute({ slug: 'my-org', projectId: '1' }); // '/organizations/my-org/projects/1/'
```

### `join(prefix: T extends RouteFactory, suffix: U extends RouteFactory | string)`

Route segments can be mixed and matched to form larger routes. Used in
combination `route` and `join` allow you to efficiently define a set of possible
URLs an app may navigate to.

```ts
import { root, route, join } from '@4c/spa-routing';

// root is an included route factory for `'/'`

const items = join(root, 'items'); // -> `'/items'`

const itemNew = join(items, '-/new'); // -> `'/items/-/new'`
const itemUpdate = join(items, ':itemId'); // -> `'/items/:itemId'`
```

### `partial<Route extends RouteFactory, P extends RouteParams<Route>, K extends string>(route: Route extends RouteFactory, partialParams: { [PP in K]?: string } & Record<string, string>,)`

Partially apply some param(s) to a route factory returning a new factory
with the specified param(s) now optional.

```ts
import { route, partial } from '@4c/spa-routing';

const widgetsRoute = route('/items/:itemId/widgets');

const partialItemId = partial(widgetsRoute, { itemId: '1' });

partialItemId(); // '/items/1/widgets'

// you can still override the default id desired
partialItemId({ itemId: '2' }); // '/items/2/widgets'
```
