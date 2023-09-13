import { Injectable } from '@angular/core';
import { merge, Observable, of, OperatorFunction } from 'rxjs';
import { concatMap, publish, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private dbName = 'tunewave';
  private dbVersion = 1;
  private db?: IDBDatabase;

  getDb(): Observable<IDBDatabase> {
    if (this.db) {
      return of(this.db);
    }
    return this.openDB((db) => {
      db.createObjectStore('entries', { keyPath: 'path' });
      db.createObjectStore('songs', { keyPath: 'entryPath' });
      db.createObjectStore('pictures', { autoIncrement: true });
      // db.createObjectStore('songs');
      // db.createObjectStore('albums');
      // db.createObjectStore('artists');
      // db.createObjectStore('covers');
    }).pipe(tap((db) => (this.db = db)));
  }

  openTransaction(
    stores: string[],
    mode: IDBTransactionMode = 'readonly'
  ): OperatorFunction<IDBDatabase, IDBTransaction> {
    const r = (db: IDBDatabase) =>
      new Observable<IDBTransaction>((subscriber) => {
        const transaction = db.transaction(stores, mode);
        transaction.onerror = (ev) => subscriber.error(ev);
        transaction.oncomplete = (_) => subscriber.complete();
        subscriber.next(transaction);
      });
    return concatMap(r);
  }

  open(
      stores: string[],
      mode: IDBTransactionMode = 'readonly'
  ): Observable<IDBTransaction> {
    return this.getDb().pipe(this.openTransaction(stores, mode));
  }

  execute<T>(
    stores: string[],
    mode: IDBTransactionMode,
    ...transactions: OperatorFunction<IDBTransaction, T>[]
  ): Observable<T> {
    return this.getDb().pipe(
      this.openTransaction(stores, mode),
      publish((m$) => merge(...transactions.map((t) => m$.pipe(t))))
    );
  }

  get<T>(store: string, key: IDBValidKey): OperatorFunction<IDBTransaction, T> {
    return concatMap(
      this.wrap((transaction) => transaction.objectStore(store).get(key))
    );
  }

  add(
    store: string,
    value: any,
    key?: IDBValidKey
  ): OperatorFunction<IDBTransaction, IDBValidKey> {
    return concatMap(
      this.wrap((transaction) => transaction.objectStore(store).add(value, key))
    );
  }

  put(
    store: string,
    value: any,
    key?: IDBValidKey
  ): OperatorFunction<IDBTransaction, IDBValidKey> {
    return concatMap(
      this.wrap((transaction) => transaction.objectStore(store).put(value, key))
    );
  }

  update<T>(
    store: string,
    value: Partial<T>,
    key: IDBValidKey
  ): OperatorFunction<IDBTransaction, IDBValidKey> {
    return (obs) =>
      obs.pipe(
        this.get<T>(store, key),
        // @ts-ignore
        concatMap((obj: T) => this.put(store, { ...obj, ...value }, key))
      );
  }

  delete(
    store: string,
    key: IDBValidKey | IDBKeyRange
  ): OperatorFunction<IDBTransaction, undefined> {
    return concatMap(
      this.wrap((transaction) => transaction.objectStore(store).delete(key))
    );
  }

  getAll<T>(store: string): OperatorFunction<IDBTransaction, T[]> {
    return concatMap(
      this.wrap((transaction) => transaction.objectStore(store).getAll())
    );
  }

  wrap<T>(
    action: (_: IDBTransaction) => IDBRequest<T>
  ): (_: IDBTransaction) => Observable<T> {
    return (transaction: IDBTransaction) =>
      new Observable((observer) => {
        const request = action(transaction);
        request.onsuccess = (_) => {
          observer.next(request.result);
          observer.complete();
        };
        request.onerror = (ev) => observer.error(ev);
      });
  }

  exec<T>(request: IDBRequest<T>): Observable<T> {
    return new Observable((observer) => {
      request.onsuccess = (_) => {
        observer.next(request.result);
        observer.complete();
      };
      request.onerror = (ev) => observer.error(ev);
    });
  }

  walkAll<T>(transaction: IDBTransaction, store: string): Observable<T> {
    return new Observable((observer) => {
      const request = transaction.objectStore(store).openCursor();
      request.onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor && !observer.closed) {
          observer.next(cursor.value);
          cursor.continue();
        } else {
          observer.complete();
        }
      };
      request.onerror = (ev) => observer.error(ev);
    });
  }

  findOne<T>(
      transaction: IDBTransaction,
      store: string,
      predicate: (_: T) => boolean
  ): Observable<(T & { key: IDBValidKey }) | undefined> {
    return new Observable((observer) => {
      const request = transaction.objectStore(store).openCursor();
      request.onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor && cursor.value && !observer.closed) {
          if (predicate(cursor.value)) {
            observer.next({
              ...(cursor.value as T),
              key: cursor.key,
            });
            observer.complete();
          }
          cursor.continue();
        } else {
          observer.next(undefined);
          observer.complete();
        }
      };
      request.onerror = (ev) => observer.error(ev);
    });
  }

  addOne(
    store: string,
    value: any,
    key?: IDBValidKey
  ): Observable<IDBValidKey> {
    return this.getDb().pipe(
      this.openTransaction([store], 'readwrite'),
      this.add(store, value, key)
    );
  }

  putOne(
    store: string,
    value: any,
    key?: IDBValidKey
  ): Observable<IDBValidKey> {
    return this.getDb().pipe(
      this.openTransaction([store], 'readwrite'),
      this.put(store, value, key)
    );
  }

  getOne<T>(store: string, key: IDBValidKey): Observable<T> {
    return this.getDb().pipe(
      this.openTransaction([store], 'readonly'),
      this.get<T>(store, key)
    );
  }

  private openDB(
    onUpgradeNeeded: (_: IDBDatabase) => void
  ): Observable<IDBDatabase> {
    return new Observable<IDBDatabase>((subscriber) => {
      console.log('opening db');
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (_) => onUpgradeNeeded(request.result);
      request.onsuccess = (_) => {
        subscriber.next(request.result);
        subscriber.complete();
      };
      request.onerror = (ev) => subscriber.error(ev);
    });
  }
}
