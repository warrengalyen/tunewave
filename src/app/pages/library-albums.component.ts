import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { LibraryFacade } from '@app/store/library/library.facade';
import { Observable } from 'rxjs';
import { AlbumWithCover } from '@app/models/album.model';
import { map, scan, switchMap, take, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectOption } from '@app/components/select.component';

@Component({
  selector: 'app-library-albums',
  template: `
    <app-library-content
      [selectedSortOption]="selectedSortOption"
      [sortOptions]="sortOptions"
    >
      <div class="albums">
        <div
          class="album"
          *ngFor="let album of albums$ | async; trackBy: trackBy"
        >
          <app-album
            [name]="album.name"
            [cover]="album.cover"
            [artist]="album.artist"
            [year]="album.year"
            [artistRouterLink]="['/', 'artist', album.artistId]"
            [albumRouterLink]="['/', 'album', album.id]"
            size="small"
          ></app-album>
        </div>
      </div>
    </app-library-content>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 1200px;
      }
      .albums {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -12px;
        padding: 0 0 64px;
      }
      .album {
        margin: 0 12px 32px;
      }
      app-album {
        width: 160px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryAlbumsComponent implements OnInit {
  albums$!: Observable<AlbumWithCover[]>;

  sortOptions: SelectOption[] = [
    { name: 'Latest releases', value: 'year_desc' },
    { name: 'Oldest releases', value: 'year_asc' },
    { name: 'A to Z', value: 'name_asc' },
    { name: 'Z to A', value: 'name_desc' },
  ];
  selectedSortOption = this.sortOptions[0];

  constructor(
    private library: LibraryFacade,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        take(1),
        tap(
          (params) =>
            (this.selectedSortOption =
              this.sortOptions.find(
                (o) => o.value === `${params.get('sort')}_${params.get('dir')}`
              ) || this.sortOptions[0])
        )
      )
      .subscribe();

    const sort$ = this.route.queryParamMap.pipe(
      map((params) => ({
        index: params.get('sort') || 'year',
        direction: ((params.get('dir') || 'desc') === 'asc'
          ? 'next'
          : 'prev') as IDBCursorDirection,
      }))
    );

    this.albums$ = sort$.pipe(
      switchMap((sort) =>
        this.library
          .getAlbums(sort.index, null, sort.direction)
          .pipe(scan((acc, cur) => [...acc, cur], [] as AlbumWithCover[]))
      )
    );
  }

  trackBy = (index: number, album: AlbumWithCover) => album.id;
}