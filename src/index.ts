/* eslint-disable @typescript-eslint/no-shadow */
import type { Optional } from 'utility-types';

import type { Params, PathParams, ReplaceParams } from './params';

export type { Optional, Params, PathParams, ReplaceParams };

/* Creates a an object type with _at least_ the key TKey */
export type Param<TKey extends string, TValue = string> = {
  [idx in TKey]: TValue;
};

export interface RouteFactory<
  T = unknown,
  P extends string = string,
  C extends string = string,
> {
  (params?: T): P;
  config: C;
}

/**
 * Creates a route or route segment factory from a string.
 *
 * ```ts
 * const orgRoute = route('/organizations')
 *
 * orgRoute() // '/organizations'
 * ```
 *
 * Routes can also include `param`s using the `:name` syntax in
 * your route:
 *
 * ```ts
 * const projectRoute = route('/organizations/:slug/projects/:projectId/')
 *
 * projectRoute({ slug: 'my-org', projectId: '1'}) // '/organizations/my-org/projects/1/'
 * ```
 *
 * @returns a route factory
 */
export function route<S extends string>(path: S) {
  function compiledRoute(params: any) {
    return path.replace(/:(?<param>[^/]+)/g, (_, g) => params[g]);
  }

  compiledRoute.config = path;

  type R = PathParams<S> extends never
    ? { (): ReplaceParams<S>; config: S }
    : {
        <P extends Record<PathParams<S>, string>>(params: P): ReplaceParams<
          S,
          P
        >;
        config: S;
      };
  return compiledRoute as R;
}

export const root = route('');

/**
 * Extract a route params from a string or route factory
 */
export type RouteParams<R extends RouteFactory | string> =
  R extends RouteFactory<infer T> ? T : R extends string ? Params<R> : never;

export type Path<R extends RouteFactory | string> = R extends RouteFactory<
  any,
  any,
  any
>
  ? ReturnType<R>
  : R;

export type Config<R extends RouteFactory | string> = R extends RouteFactory<
  any,
  any,
  infer P
>
  ? P
  : R;

/**
 * Route segments can be mixed and matched to form larger routes. Used in
 * combination `route` and `join` allow you to efficiently define a set of possible
 * URLs an app may navigate to.
 *
 * ```ts
 * import { root, route, join } from '@4c/spa-routing';
 *
 * // root is an included route factory for `'/'`
 *
 * const items = join(root, 'items')     // -> `'/items'`
 *
 * const itemNew = join(items, '-/new')  // -> `'/items/-/new'`
 * const itemUpdate = join(items, ':itemId')  // -> `'/items/:itemId'`
 *
 * ```
 * @param prefix a route factory
 * @param suffix a route factory or string to create a route factory from
 * @returns A combined route factory
 */
export function join<T extends RouteFactory, U extends RouteFactory | string>(
  prefix: T,
  suffix: U,
) {
  type R = RouteParams<T> & RouteParams<U>;
  type RConfig = `${Config<T>}/${Config<U>}`;

  const suffixReal: any = typeof suffix === 'string' ? route(suffix) : suffix;

  function joined(params: RouteParams<T> & RouteParams<U>) {
    return `${prefix(params)}/${suffixReal(params as any)}`;
  }

  joined.config = `${prefix.config}/${suffixReal.config}`;

  return joined as any as keyof R extends never
    ? { (): `${Path<T>}/${Path<U>}`; config: RConfig }
    : {
        <P extends Record<PathParams<RConfig>, string>>(
          params: P,
        ): ReplaceParams<RConfig, P>;
        config: RConfig;
      };
}

/**
 * Partially apply some param(s) to a route factory returning a new factory
 * with the specified param(s) now optional.
 *
 * ```ts
 * import { route, partial } from '@4c/spa-routing';
 *
 * const widgetsRoute = route('/items/:itemId/widgets')
 *
 * const partialItemId = partial(widgetsRoute, { itemId: '1' })
 *
 * partialItemId() // '/items/1/widgets'
 *
 * // you can still override the default id desired
 * partialItemId({ itemId: '2' }) // '/items/2/widgets'
 * ```
 * @param route
 * @param partialParams
 * @returns a route factory
 */
export function partial<
  Route extends RouteFactory,
  P extends RouteParams<Route>,
  K extends string,
>(
  route: Route,
  partialParams: { [PP in K]?: string } & Record<string, string>,
) {
  type Overlap = Extract<keyof P, K>;
  type RConfig = Config<Route>;
  const partialed = (params: any) => {
    return route({ ...partialParams, ...params });
  };

  return partialed as Overlap extends never
    ? typeof route
    : P extends Param<Overlap>
    ? keyof Omit<P, Overlap> extends never
      ? {
          // in which case make the whole parameter optional
          <S extends { [PK in Overlap]: P[PK] }>(
            params?: Partial<S>,
          ): ReplaceParams<RConfig, S & P>;
          config: RConfig;
        }
      : {
          <S extends P>(params: Optional<S, Overlap>): ReplaceParams<
            RConfig,
            S & P
          >;
          config: RConfig;
        }
    : typeof route;
}

export type PartialRoute<
  Route extends RouteFactory,
  ParamKeys extends string,
> = Route extends RouteFactory<infer P, string, infer RConfig>
  ? Extract<keyof P, ParamKeys> extends never
    ? typeof route
    : P extends Param<Extract<keyof P, ParamKeys>>
    ? keyof Omit<P, Extract<keyof P, ParamKeys>> extends never
      ? {
          // in which case make the whole parameter optional
          <S extends { [PK in Extract<keyof P, ParamKeys>]: P[PK] }>(
            params?: Partial<S>,
          ): ReplaceParams<RConfig, S & P>;
          config: RConfig;
        }
      : {
          <S extends P>(
            params: Optional<S, Extract<keyof P, ParamKeys>>,
          ): ReplaceParams<RConfig, S & P>;
          config: RConfig;
        }
    : typeof route
  : never;
