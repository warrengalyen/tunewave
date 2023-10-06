import { NgModule } from '@angular/core';

import { MainComponent } from './main.component';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { CoreModule } from '@app/core/core.module';
import { PlayerModule } from '@app/player/player.module';
import { RouterModule, Routes } from '@angular/router';
import { MainGuard } from '@app/core/guards/main.guard';
import { PagePlaylistLikesComponent } from '@app/playlist/page-playlist-likes.component';
import { ScrollerService } from '@app/main/scroller.service';
import { LibraryModule } from '@app/library/library.module';
import { AlbumModule } from '@app/album/album.module';
import { ArtistModule } from '@app/artist/artist.module';
import { PlaylistModule } from '@app/playlist/playlist.module';
import { DatabaseModule } from '@app/database/database.module';

/*const routes: Routes = [
  {
    path: 'welcome',
    loadChildren: () =>
      import('./welcome/welcome.module').then((m) => m.WelcomeModule),
  },
  // {
  //   outlet: 'dialog',
  //   path: 'settings',
  //   component: SettingsComponent,
  //   children: [
  //     { path: '', redirectTo: 'library', pathMatch: 'full' },
  //     { path: 'library', component: LibrarySettingsComponent },
  //   ],
  // },
  {
    outlet: 'dialog',
    path: 'new-playlist',
    component: PlaylistNewComponent,
  },
  {
    path: '',
    component: AppComponent,
    canActivate: [MainGuard],
    canActivateChild: [MainGuard],
    children: [
      {
        path: '',
        redirectTo: 'library',
        pathMatch: 'full',
        data: { animation: 'default' },
      },
      {
        path: 'library',
        loadChildren: () =>
          import('./library/library.module').then((m) => m.LibraryModule),
      },
      {
        path: 'album',
        loadChildren: () =>
          import('./album/album.module').then((m) => m.AlbumModule),
      },
      {
        path: 'artist',
        loadChildren: () =>
          import('./artist/artist.module').then((m) => m.ArtistModule),
      },
      {
        path: 'playlist',
        loadChildren: () =>
          import('./playlist/playlist.module').then((m) => m.PlaylistModule),
      },
      {
        path: 'likes',
        data: { animation: 'default' },
        component: PagePlaylistLikesComponent,
      },
      {
        path: 'play',
        loadChildren: () => PlayerModule,
      },
    ],
  },
  { path: '**', component: WelcomeComponent }, // TODO Not found component
];*/

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [MainGuard],
    canActivateChild: [MainGuard],
    children: [
      {
        path: '',
        redirectTo: 'library',
        pathMatch: 'full',
        data: { animation: 'default' },
      },
      {
        path: 'library',
        loadChildren: () => LibraryModule,
      },
      {
        path: 'album',
        loadChildren: () => AlbumModule,
      },
      {
        path: 'artist',
        loadChildren: () => ArtistModule,
      },
      {
        path: 'playlist',
        loadChildren: () => PlaylistModule,
      },
      {
        path: 'likes',
        data: { animation: 'default' },
        component: PagePlaylistLikesComponent,
      },
      {
        path: 'play',
        loadChildren: () => PlayerModule,
      },
    ],
  },
];

@NgModule({
  declarations: [MainComponent],
  imports: [
    RouterModule.forChild(routes),
    // StoreModule.forRoot(reducers, {
    //   runtimeChecks: {
    //     strictStateSerializability: false,
    //     strictActionSerializability: false,
    //     strictStateImmutability: false,
    //     strictActionImmutability: false,
    //     strictActionWithinNgZone: false,
    //     strictActionTypeUniqueness: false,
    //   },
    // }),
    // EffectsModule.forRoot([]),
    // StoreDevtoolsModule.instrument({ maxAge: 150, logOnly: true }),
    CoreModule,
    PlayerModule,
    DatabaseModule,
  ],
  providers: [
    MainGuard,
    ScrollerService,
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 2500,
        panelClass: 'snack',
        horizontalPosition: 'left',
      },
    },
  ],
})
export class MainModule {}