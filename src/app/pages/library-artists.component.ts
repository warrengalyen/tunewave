import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { SelectOption } from '@app/components/select.component';
import { LibraryFacade } from '@app/store/library/library.facade';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ArtistWithCover$ } from '@app/models/artist.model';
import { map, scan, switchMap, take, tap } from 'rxjs/operators';
import { Icons } from '@app/utils/icons.util';

@Component({
  selector: 'app-library-artists',
  template: `
    <a id="top"></a>
    <div class="filters" #filters [class.scrolled-top]="scrolledTop">
      <app-container>
        <app-select
          [options]="sortOptions"
          [selected]="selectedSortOption"
          (selectionChange)="sort($event)"
        ></app-select>
      </app-container>
    </div>
    <app-container>
      <div class="artists">
        <div
          *ngFor="let artist of artists$ | async; trackBy: trackBy"
          class="artist"
        >
          <a [routerLink]="['/', 'artist', artist.id]" matRipple>
            <div class="cover" style="--aspect-ratio:1">
              <img
                [src]="cover"
                [alt]="artist.name"
                *ngIf="artist.cover$ | async as cover; else icon"
              />
              <ng-template #icon>
                <app-icon [path]="icons.account" [size]="56"></app-icon>
              </ng-template>
            </div>
            <div class="meta">
              <span>{{ artist.name }}</span>
              <span class="sub">30 songs</span>
            </div>
          </a>
          <div class="controls">
            <app-menu [disableRipple]="false"></app-menu>
          </div>
        </div>
      </div>
    </app-container>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 1200px;
      }
      #top {
        position: relative;
        top: -112px;
        display: block;
      }
      .filters {
        position: sticky;
        top: 112px;
        z-index: 101;
        display: flex;
        align-items: center;
        padding: 16px 0;
      }
      .filters.scrolled-top {
        background-color: #212121;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .artists {
        display: flex;
        flex-direction: column;
        padding: 0 0 64px;
      }
      .artist {
        flex: 0 0 80px;
        position: relative;
      }
      .artist a {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0 8px;
        height: 80px;
        text-decoration: none;
      }
      .cover {
        width: 56px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 16px;
        position: relative;
        z-index: 1;
      }
      app-icon {
        opacity: 0.25;
      }
      .meta {
        display: flex;
        flex-direction: column;
      }
      .sub {
        color: #aaa;
      }
      .controls {
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryArtistsComponent implements OnInit, AfterViewInit {
  @ViewChild('filters', { static: true })
  filters!: ElementRef;

  icons = Icons;

  artists$!: Observable<ArtistWithCover$[]>;

  sortOptions: SelectOption[] = [
    { name: 'A to Z', value: 'name_asc' },
    { name: 'Z to A', value: 'name_desc' },
  ];
  selectedSortOption = this.sortOptions[0];

  scrolledTop = true;

  constructor(
    private library: LibraryFacade,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:scroll')
  update() {
    this.scrolledTop =
      this.filters.nativeElement.getBoundingClientRect().y <= 112;
    this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    setTimeout(() => this.update());
  }

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
        index: params.get('sort') || 'name',
        direction: ((params.get('dir') || 'asc') === 'asc'
          ? 'next'
          : 'prev') as IDBCursorDirection,
      }))
    );

    this.artists$ = sort$.pipe(
      switchMap((sort) =>
        this.library
          .getArtists(sort.index, null, sort.direction)
          .pipe(scan((acc, cur) => [...acc, cur], [] as ArtistWithCover$[]))
      )
    );
  }

  trackBy = (index: number, artist: ArtistWithCover$) => artist.id;

  async sort(option: string) {
    const [sort, dir] = option.split('_');
    await this.router.navigate([], {
      queryParams: { sort, dir },
      preserveFragment: true,
    });
  }
}
