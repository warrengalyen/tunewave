import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Icons } from '@app/core/utils';
import { Album } from '@app/database/albums/album.model';
import { hash } from '@app/core/utils/hash.util';
import { MatMenuTrigger } from '@angular/material/menu';
import { MenuItem } from '@app/core/components/menu.component';
import { PlayerFacade } from '@app/player/store/player.facade';
import { ComponentHelperService } from '@app/core/services/component-helper.service';
import { LibraryFacade } from '@app/library/store/library.facade';
import { concatMap, map, shareReplay, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Song } from '@app/database/songs/song.model';
import { HistoryService } from '@app/core/services/history.service';
import { PictureFacade } from '@app/database/pictures/picture.facade';
import { getCover } from '@app/database/pictures/picture.model';

@Component({
  selector: 'app-album',
  template: `
    <app-cover
      [title]="album.name"
      [menuItems]="menuItems"
      [coverRouterLink]="['/', 'album', album.hash]"
      (menuOpened)="menuOpened.emit($event)"
      (playlistPlayed)="albumPlayed()"
      tabindex="-1"
      [song]="song$ | async"
      [playlist]="playlist$ | async"
    >
      <img
        *ngIf="cover$ | async as cover; else icon"
        [src]="cover"
        [alt]="album.name"
      />
      <ng-template #icon>
        <app-icon [path]="icons.album" [fullWidth]="true"></app-icon>
      </ng-template>
    </app-cover>
    <app-label
      [topLabel]="{ text: album.name, routerLink: ['/', 'album', album.hash] }"
      [bottomLabel]="[
        'Album',
        album.albumArtist
          ? {
              text: album.albumArtist,
              routerLink: ['/', 'artist', getHash(album.albumArtist)]
            }
          : album.artists.length > 1
          ? 'Various artists'
          : undefined,
        album.year ? album.year.toString(10) : ''
      ]"
      [size]="size"
    ></app-label>
  `,
  styles: [
    `
      :host,
      img {
        display: block;
        width: 100%;
      }
      app-cover {
        margin-bottom: 16px;
        background-color: rgba(255, 255, 255, 0.1);
      }
      app-icon {
        color: rgba(255, 255, 255, 0.5);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumComponent implements OnInit {
  @Input() album!: Album;
  @Input() size: 'small' | 'large' = 'large';
  @Output() menuOpened = new EventEmitter<MatMenuTrigger>();
  // @Output() update = new EventEmitter<Album>();

  icons = Icons;
  menuItems!: MenuItem[];

  song$!: Observable<Song>;
  playlist$!: Observable<Song[]>;
  cover$!: Observable<string | undefined>;

  constructor(
    private library: LibraryFacade,
    private player: PlayerFacade,
    private helper: ComponentHelperService,
    private history: HistoryService,
    private pictures: PictureFacade,
  ) {}

  ngOnInit(): void {
    this.updateMenu();

    this.playlist$ = this.library
      .getAlbumTracks(this.album)
      .pipe(shareReplay(1));

    this.song$ = this.playlist$.pipe(map((pl) => pl[0]));

    this.cover$ = this.pictures.getByHash(this.album.pictureKey as string).pipe(
      concatMap((p) =>
        p ? of(p) : this.library.getPicture(this.album.pictureKey),
      ),
      map((p) => (p ? getCover(p) : undefined)),
    );
  }

  /*play() {
    this.library
      .getAlbumTracks(this.album)
      .pipe(
        tap((tracks) => {
          this.player.setPlaying();
          this.player.setPlaylist(tracks);
          this.player.show();
        })
      )
      .subscribe();
  }*/

  getHash(s: string): string {
    return hash(s);
  }

  updateMenu(): void {
    this.menuItems = [
      {
        icon: Icons.shuffle,
        text: 'Shuffle play',
        click: () => {
          this.library
            .getAlbumTracks(this.album)
            .pipe(
              tap((tracks) => {
                this.player.setPlaying();
                this.player.setPlaylist(tracks);
                this.player.shuffle();
                this.player.show();
              }),
            )
            .subscribe();
          this.history.albumPlayed(this.album);
        },
      },
      {
        icon: Icons.playlistPlay,
        text: 'Play next',
        click: () => {
          this.library
            .getAlbumTracks(this.album)
            .pipe(
              tap((tracks) => {
                this.player.addToPlaylist(tracks, true);
                this.player.show();
              }),
            )
            .subscribe();
        },
      },
      {
        icon: Icons.playlistMusic,
        text: 'Add to queue',
        click: () => {
          this.library
            .getAlbumTracks(this.album)
            .pipe(
              tap((tracks) => {
                this.player.addToPlaylist(tracks);
                this.player.show();
              }),
            )
            .subscribe();
        },
      },
      {
        icon: !!this.album.likedOn ? Icons.heart : Icons.heartOutline,
        text: !!this.album.likedOn
          ? 'Remove from your likes'
          : 'Add to your likes',
        click: () => {
          this.helper.toggleLikedAlbum(this.album); /*.subscribe(() => {
            this.updateMenu();
            // this.update.next(this.album);
          });*/
        },
      },
      {
        icon: Icons.playlistPlus,
        text: 'Add to playlist',
        click: () => {
          this.library
            .getAlbumTracks(this.album)
            .pipe(concatMap((tracks) => this.helper.addSongsToPlaylist(tracks)))
            .subscribe();
        },
      },
      {
        icon: Icons.accountMusic,
        text: 'Go to artist',
        routerLink: this.album.albumArtist
          ? ['/', 'artist', this.getHash(this.album.albumArtist)]
          : undefined,
        disabled: !this.album.albumArtist,
      },
    ];
  }

  albumPlayed(): void {
    this.history.albumPlayed(this.album);
  }
}
