/* Authored by iqbserve.de */

/**
 * JS object.
 */
export type JSObject = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * JS flat object with string values.
 */
export type PropertiesObject = {
    [key: string]: string;
}

/**
 * Config object.
 */
export type ConfigObject = {
    [key: string]: string | Array<ConfigObject>;
}

/**
 * JS class.
 */
export type JSClass = {
    new(...args: unknown[]): unknown;
}

/**
 * ES module.
 */
export type ESModule = {
    default: unknown;
}

/**
 * Function arguments.
 */
export type FncArgs = {
    [index: number]: unknown;
}

/**
 * Dynamic function methods expect a callback receiving the result of the invocation.
 * @see LazyFunction
 */
export interface DynamicFunction {
    invoke(cb: (retVal: unknown) => void): void;
}

/**
 * Extender functions expect a callback receiving the object to extend.
 */
export type ExtenderFunction<T> = (obj: T) => void;

/**
 * User profile.
 */
export type UserProfile = {
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}

/**
 * Dialog message.
 */
export type DialogMessage = {
    title?: string;
    message: string;
    data?: string;
}
