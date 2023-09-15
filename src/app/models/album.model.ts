import { Except } from '@app/utils/types.util';

export interface Album {
  id: string;
  name: string;
  artistId: string;
  year?: number;
  pictureKey?: IDBValidKey;
}

export type AlbumWithCover = Except<Album, 'pictureKey'> & { cover?: string };
