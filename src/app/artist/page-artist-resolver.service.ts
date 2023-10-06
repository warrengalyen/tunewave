import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { PageArtistData } from '@app/artist/page-artist.component';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { LibraryFacade } from '@app/library/store/library.facade';
import { catchError, concatMap, first, map, take } from 'rxjs/operators';
import { getCover } from '@app/database/pictures/picture.model';
import { scanArray } from '@app/core/utils/scan-array.util';

@Injectable()
export class PageArtistResolverService implements Resolve<PageArtistData> {
  constructor(
    private library: LibraryFacade,
    private router: Router,
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    // state: RouterStateSnapshot
  ): Observable<PageArtistData> | Observable<never> {
    const id = route.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/']);
      return EMPTY;
    }

    return this.library.getArtistByHash(id).pipe(
      concatMap((artist) =>
        !artist ? throwError(() => 'not found') : of(artist),
      ),
      catchError(() => {
        this.router.navigate(['/library']);
        return EMPTY;
      }),
      concatMap((artist) => {
        const cover$ = this.library.getPicture(artist.pictureKey).pipe(
          first(),
          map((picture) => (picture ? getCover(picture) : undefined)),
        );
        return cover$.pipe(
          map((cover) => ({
            artist,
            cover,
            albums$: this.library.getArtistAlbums(artist).pipe(
              scanArray(),
              map((albums) =>
                [...albums].sort((a1, a2) => (a2.year || 0) - (a1.year || 0)),
              ),
            ),
            foundOn$: this.library.getAlbumsWithArtist(artist).pipe(
              scanArray(),
              map((albums) =>
                [...albums].sort((a1, a2) => (a2.year || 0) - (a1.year || 0)),
              ),
            ),
            songs$: this.library.getSongs('artists', artist.name).pipe(
              map(({ value }) => value),
              take(5),
              scanArray(),
            ),
          })),
        );
      }),
    );
  }
}
