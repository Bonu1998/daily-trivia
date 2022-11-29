import { IContext } from "@flairlabs/flair-infra";

export function FetchArray<T>(context: IContext, path: string, clazz: new (...args: any[]) => T): Promise<T[]> {
    return new Promise((resolve, reject) => {
        context.cacheClient.getArray(path, clazz, (err: any, data: T[]) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

export function FetchObj<T>(context: IContext, path: string, clazz: new (...args: any[]) => T): Promise<T> {
    return new Promise((resolve, reject) => {
        context.cacheClient.getArray(path, clazz, (err: any, data: T) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}