import { NgModule } from '@angular/core';
import { IndexedDBModule } from '@warrengalyen/ngx-idb';
import { StorageService } from '@app/database/storage.service';
import { ReactiveIDBDatabaseOptions } from '@warrengalyen/reactive-idb';

const tuneWaveDatabase: ReactiveIDBDatabaseOptions = {
  name: 'tunewave',
  schema: [
    {
      version: 1,
      stores: [
        {
          name: 'entries',
          options: { keyPath: 'path' },
          indexes: ['parent'],
        },
        {
          name: 'songs',
          options: { keyPath: 'entryPath' },
          indexes: [
            { name: 'artists', options: { multiEntry: true } },
            { name: 'genre', options: { multiEntry: true } },
            'album',
            'title',
            'likedOn',
            'lastModified',
          ],
        },
        {
          name: 'pictures',
          options: { keyPath: 'hash' },
        },
        {
          name: 'albums',
          options: { keyPath: 'name' },
          indexes: [
            { name: 'artists', options: { multiEntry: true } },
            'hash',
            'year',
            'albumArtist',
            'likedOn',
            'listenedOn',
            'lastModified',
          ],
        },
        {
          name: 'artists',
          options: { keyPath: 'name' },
          indexes: ['hash', 'likedOn', 'listenedOn', 'lastModified'],
        },
        {
          name: 'playlists',
          options: { keyPath: 'hash' },
          indexes: ['title', 'createdOn', 'listenedOn'],
        },
      ],
    },
  ],
};

@NgModule({
  declarations: [],
  imports: [IndexedDBModule.forRoot(tuneWaveDatabase)],
  providers: [StorageService],
})
export class DatabaseModule {}