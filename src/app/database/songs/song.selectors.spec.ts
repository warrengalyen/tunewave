import * as fromSong from './song.reducer';
import { selectSongState } from './song.selectors';

describe('Song Selectors', () => {
  it('should select the feature state', () => {
    const result: any = selectSongState({
      [fromSong.songFeatureKey]: {},
    });

    expect(result).toEqual({});
  });
});
