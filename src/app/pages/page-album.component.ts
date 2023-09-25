import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { Album } from '@app/models/album.model';
import { concatMap, map, tap } from 'rxjs/operators';
import { Song, SongWithCover$ } from '@app/models/song.model';
import { Icons } from '@app/utils/icons.util';
import { hash } from '@app/utils/hash.util';
import { PlayerFacade } from '@app/store/player/player.facade';
import { MenuItem } from '@app/components/menu.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { PlaylistAddComponent } from '@app/dialogs/playlist-add.component';
import { LibraryFacade } from '@app/store/library/library.facade';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export type PageAlbumData = {
  album: Album;
  songs: SongWithCover$[];
  cover: string | undefined;
};

@Component({
  selector: 'app-page-album',
  template: `
    <ng-container *ngIf="info$ | async as info">
      <header>
        <app-container-page class="header-container">
          <div class="info">
            <div class="cover" style="--aspect-ratio:1">
              <img [src]="info.cover" alt="cover" *ngIf="info.cover" />
            </div>
            <div class="metadata">
              <app-title [title]="info.album.name"></app-title>
              <p>
                <span>Album</span> •
                <a
                  *ngIf="info.album.albumArtist"
                  [routerLink]="[
                    '/',
                    'artist',
                    getHash(info.album.albumArtist)
                  ]"
                  >{{ info.album.albumArtist }}</a
                >
                <span
                  *ngIf="
                    !info.album.albumArtist && info.album.artists.length > 1
                  "
                >
                  Various artists
                </span>
                • <span>{{ info.album.year }}</span>
              </p>
              <p class="stats">
                {{ info.songs.length }} songs •
                {{ getLength(info.songs) }} minutes
              </p>
            </div>
          </div>
          <div class="actions">
            <button mat-raised-button color="accent" (click)="play(info.songs)">
              <app-icon [path]="icons.play"></app-icon>
              <span>Play</span>
            </button>
            <button mat-stroked-button>
              <app-icon [path]="icons.heartOutline"></app-icon>
              <span>Add to your likes</span>
            </button>
            <app-menu
              [disableRipple]="true"
              [menuItems]="menuItems$ | async"
            ></app-menu>
          </div>
        </app-container-page>
      </header>
      <app-container-page>
        <div class="track-list">
          <app-track-list-item
            [song]="song"
            *ngFor="let song of info.songs; let i = index"
            [trackNumber]="i + 1"
            (playClicked)="play(info.songs, i)"
            [class.selected]="(currentSongsPath$ | async) === song.entryPath"
            (menuOpened)="menuOpened($event)"
            cdkMonitorSubtreeFocus
          ></app-track-list-item>
        </div>
      </app-container-page>
    </ng-container>
  `,
  styleUrls: ['../styles/page-header.component.scss'],
  styles: [
    `
      .track-list {
        display: flex;
        flex-direction: column;
      }
      app-track-list-item.selected {
        background-color: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageAlbumComponent implements OnInit {
  icons = Icons;
  info$!: Observable<PageAlbumData>;

  currentSongsPath$ = this.player
    .getCurrentSong$()
    .pipe(map((song) => song?.entryPath));

  menuItems$!: Observable<MenuItem[]>;

  trigger?: MatMenuTrigger;

  constructor(
    private route: ActivatedRoute,
    private player: PlayerFacade,
    private library: LibraryFacade,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  @HostListener('window:scroll')
  @HostListener('click')
  closeMenu() {
    if (this.trigger) {
      this.trigger.closeMenu();
      this.trigger = undefined;
    }
  }

  menuOpened(trigger: MatMenuTrigger) {
    if (this.trigger && this.trigger !== trigger) {
      this.trigger.closeMenu();
    }
    this.trigger = trigger;
  }

  trackBy(index: number, song: SongWithCover$): string {
    return song.entryPath;
  }

  ngOnInit(): void {
    this.info$ = this.route.data.pipe(map((data) => data.info));
    this.menuItems$ = this.info$.pipe(
      map((info) => this.getMenuItem(info.songs))
    );
  }

  getMenuItem(songs: SongWithCover$[]): MenuItem[] {
    return [
      {
        text: 'Shuffle play',
        icon: this.icons.shuffle,
        click: () => {
          this.player.setPlaying(true);
          this.player.setPlaylist(songs);
          this.player.shuffle();
          this.player.show();
        },
      },
      {
        text: 'Play next',
        icon: this.icons.playlistPlay,
        click: () => {
          this.player.addToPlaylist(songs, true);
          this.player.show();
        },
      },
      {
        text: 'Add to queue',
        icon: this.icons.playlistMusic,
        click: () => {
          this.player.addToPlaylist(songs);
          this.player.show();
        },
      },
      {
        text: 'Add to playlist',
        icon: this.icons.playlistPlus,
        click: () => this.addAlbumToPlaylist(songs),
      },
    ];
  }

  getLength(songs: Song[]): number {
    const sec = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
    return Math.floor(sec / 60);
  }

  getHash(albumArtist: string) {
    return hash(albumArtist);
  }

  play(songs: SongWithCover$[], index = 0) {
    this.player.setPlaying(true);
    this.player.setPlaylist(songs, index);
    this.player.show();
  }

  addAlbumToPlaylist(songs: Song[]) {
    const ref = this.dialog.open(PlaylistAddComponent, {
      width: '275px',
      maxHeight: '80%',
      height: 'auto',
      panelClass: 'playlists-dialog',
    });

    ref
      .afterClosed()
      .pipe(
        concatMap(
          (result) =>
            result === undefined
              ? EMPTY
              : result === true
                ? EMPTY // Redirect to new playlist and add song
                : this.library
                  .addSongsToPlaylist([...songs].reverse(), result)
                  .pipe(
                    tap(() => this.snack.open(`Added to ${result}`, 'VIEW'))
                  ) // TODO redirect to playlist
        )
      )
      .subscribe();
  }
}
