import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Icons } from '@app/core/utils/icons.util';
import { Artist } from '@app/database/artists/artist.model';
import { EMPTY, Observable } from 'rxjs';
import { PictureFacade } from '@app/database/pictures/picture.facade';

@Component({
  selector: 'app-artist',
  template: `
    <div class="image">
      <a
        [routerLink]="['/', 'artist', artist.id]"
        matRipple
        [title]="artist.name"
      >
        <img
          *ngIf="cover$ | async as cover; else icon"
          [src]="cover"
          [alt]="artist.name"
        />
        <ng-template #icon>
          <app-icon [path]="icons.account" [size]="200"></app-icon>
        </ng-template>
      </a>
    </div>
    <app-label
      align="center"
      [topLabel]="{
        text: artist.name,
        routerLink: ['/', 'artist', artist.id]
      }"
      [bottomLabel]=""
    ></app-label>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 226px;
      }
      a,
      img {
        display: block;
      }
      .image {
        margin-bottom: 16px;
        overflow: hidden;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.1);
        width: 100%;
      }
      .image a {
        height: 100%;
        text-align: center;
      }
      app-icon {
        color: rgba(255, 255, 255, 0.33);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistComponent {
  @Input() artist!: Artist;

  cover$!: Observable<string | undefined>;

  icons = Icons;

  constructor(private pictures: PictureFacade) {
    this.cover$ = EMPTY; // TODO this.pictures.getArtistCover(this.artist);
  }
}
