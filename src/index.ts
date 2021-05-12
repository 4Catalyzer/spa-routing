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
 * Creates a Route factory from a string path
 * url segment.
 *
 * ```ts
 * const route = join(() => '/api/v1/org', paramRoute('slug'))
 *
 * route({ slug: 'a-slug' }) // '/api/v1/org/a-slug'
 * ```
 *
 * @param param The parameter key used to extract the param value from a set of route params
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
