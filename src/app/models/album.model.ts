import { Except } from '@app/utils/types.util';

export interface Album {
  id: string;
  name: string;
  albumArtist?: string;
  artists: string[];
  year?: number;
  pictureKey?: IDBValidKey;
  addedOn: number;
}

export type AlbumWithCover = Except<Album, 'pictureKey'> & { cover?: string };
