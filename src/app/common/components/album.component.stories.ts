import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { AlbumComponent } from './album.component';
import { LabelComponent } from './label.component';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from './icon.component';
import { MenuComponent } from './menu.component';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayerButtonComponent } from './player-button.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';

export default {
  title: 'Home/Album',
  component: AlbumComponent,
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [
        RouterModule.forRoot([], { useHash: true }),
        MatRippleModule,
        MatButtonModule,
        MatMenuModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
        A11yModule,
      ],
      declarations: [
        LabelComponent,
        IconComponent,
        MenuComponent,
        PlayerButtonComponent,
      ],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<AlbumComponent> = (args: AlbumComponent) => ({
  component: AlbumComponent,
  props: args,
});

export const Simple = Template.bind({});
Simple.args = {
  name: 'Endless Forms Most Beautiful',
  artist: 'Nightwish',
  routerLink: './',
  artistRouterLink: './',
  cover: '/assets/tests/nightwish_endless_forms.jpg',
};
