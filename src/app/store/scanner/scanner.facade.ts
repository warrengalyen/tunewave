import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectError,
  selectProgress,
  selectProgressDisplay,
  selectProgressDisplaySub,
  selectState,
  selectStep,
  selectStepSub,
} from '@app/store/scanner/scanner.selectors';
import { abortScan, openDirectory } from '@app/store/scanner/scanner.actions';
import { concatMap, filter, map, mapTo } from 'rxjs/operators';
import { StorageService } from '@app/services/storage.service';
import { from, Observable, of } from 'rxjs';
import { Song } from '@app/models/song.model';
import { Picture } from '@app/models/picture.model';
import { Entry, FileEntry } from '@app/models/entry.model';
import { hash } from '@app/utils/hash.util';

@Injectable()
export class ScannerFacade {
  error$ = this.store.select(selectError);
  state$ = this.store.select(selectState);
  step$ = this.store.select(selectStep);
  stepSub$ = this.store.select(selectStepSub);
  progress$ = this.store.select(selectProgress);
  progressDisplay$ = this.store.select(selectProgressDisplay);
  progressDisplaySub$ = this.store.select(selectProgressDisplaySub);

  constructor(private store: Store, private storage: StorageService) {}

  abort(): void {
    this.store.dispatch(abortScan());
  }

  openDirectory(): void {
    this.store.dispatch(openDirectory());
  }

  saveSong(song: Song, pictures?: Picture[]): Observable<Song> {
    return this.storage.open$(['pictures', 'songs'], 'readwrite').pipe(
      concatMap((transaction) => {
        const makeSong = (key?: IDBValidKey): Song => ({
          ...song,
          pictureKey: key,
        });

        const saveSong = (pictureKey?: IDBValidKey) => {
          const song1 = makeSong(pictureKey);
          return (
            this.storage
              .add$('songs', song1)
              // .exec$(transaction.objectStore('songs').add(song1))
              .pipe(mapTo(song1))
          );
        };

        if (!pictures || pictures.length === 0) {
          return this.searchForCover(makeSong()).pipe(
            concatMap((coverKey) => saveSong(coverKey))
          );
        }

        return transaction
          .objectStore('pictures')
          .getKey$(pictures[0].hash)
          .pipe(
            concatMap((key) =>
              key
                ? saveSong(key)
                : transaction
                  .objectStore('pictures')
                  .add$(pictures[0])
                  .pipe(concatMap((pictKey) => saveSong(pictKey)))
            )
          );
      })
    );
  }

  searchForCover(song: Song): Observable<IDBValidKey | undefined> {
    if (!song.album) {
      return of(undefined);
    }

    return this.storage.open$(['entries']).pipe(
      concatMap((t) =>
        t
          .objectStore<Entry>('entries')
          .get$(song.entryPath)
          .pipe(
            filter((entry): entry is FileEntry => !!entry && !!entry.parent),
            map((entry) => entry.parent),
            concatMap((parent) =>
              t
                .objectStore<Entry>('entries')
                .index('parent')
                .getAll$(parent as string)
            ),
            map((files) =>
              files.filter(
                (file) =>
                  file.name.endsWith('.jpg') || file.name.endsWith('.png')
              )
            ),
            concatMap((files) => {
              if (files.length === 0) {
                return of(undefined);
              }
              const bestFit = this.getBestFit(files, song.album as string);
              return from((bestFit as FileEntry).handle.getFile()).pipe(
                concatMap((file: File) => file.arrayBuffer()),
                map((buffer: ArrayBuffer) => this.arrayBufferToBase64(buffer)),
                concatMap((base64) =>
                  this.storage.put$('pictures', {
                    data: base64,
                    hash: hash(base64),
                    format: this.getFormat(bestFit as FileEntry),
                  })
                )
              );
            })
          )
      )
    );
  }

  private getBestFit(files: Entry[], name: string): Entry {
    return (
      files.find((file) => file.name.toLowerCase().includes(name)) ||
      files.find(
        (file) =>
          file.name.toLowerCase().includes('cover') ||
          file.name.toLowerCase().includes('front') ||
          file.name.toLowerCase().includes('folder')
      ) ||
      files[0]
    );
  }

  private getFormat = (best: FileEntry): string =>
    best.name.endsWith('png') ? 'image/png' : 'image/jpeg';

  private arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
}
