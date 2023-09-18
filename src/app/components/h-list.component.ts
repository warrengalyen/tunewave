import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { Icons } from '../utils/icons.util';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-h-list',
  template: `
    <button
      mat-mini-fab
      class="button prev"
      (click)="scrollLeft()"
      [disabled]="isPrevDisabled"
      [style.top]="this.buttonsTopPosition"
      #prevButton
    >
      <app-icon [path]="icons.chevronLeft"></app-icon>
    </button>
    <div class="container">
      <div
        #content
        [style.transform]="'translate(' + this.translation + 'px)'"
        class="content"
      >
        <ng-content></ng-content>
      </div>
    </div>
    <button
      mat-mini-fab
      class="button next"
      (click)="scrollRight()"
      [disabled]="isNextDisabled"
      [style.top]="this.buttonsTopPosition"
      #nextButton
    >
      <app-icon [path]="icons.chevronRight"></app-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
      .container {
        display: flex;
        overflow-x: hidden;
        height: 100%;
      }
      .content {
        display: flex;
        transition: transform ease 0.6s;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .button {
        position: absolute;
        z-index: 1;
        opacity: 1;
        transition: opacity 300ms ease;
        transform: translateY(-50%);
      }
      :host:hover .button,
      .button:hover,
      .button:focus {
        opacity: 1;
      }
      .button:focus {
        /*outline: 1px solid red;*/
      }
      button[disabled] {
        opacity: 0 !important;
      }
      .prev {
        left: -20px;
      }
      .next {
        right: -20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HListComponent implements OnInit, OnDestroy, AfterContentInit {
  @Input()
  buttonsTopPosition?: string;

  @ViewChild('prevButton', { static: true })
  prevButton!: MatButton;

  @ViewChild('nextButton', { static: true })
  nextButton!: MatButton;

  @ViewChild('content', { static: true })
  private contentRef!: ElementRef<HTMLElement>;

  @ContentChildren(forwardRef(() => HListItemDirective))
  private items!: QueryList<HListItemDirective>;

  icons = Icons;

  isNextDisabled!: boolean;
  isPrevDisabled!: boolean;

  private translationP!: number;
  private nextListener!: (event: KeyboardEvent) => void;
  private prevListener!: (event: KeyboardEvent) => void;

  private root!: HTMLElement;
  private content!: HTMLElement;

  private subscription: Subscription = new Subscription();

  constructor(
    private rootRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  set translation(value: number) {
    this.translationP = value;
    this.isNextDisabled =
      -this.translationP + this.root.clientWidth >= this.content.clientWidth;
    this.isPrevDisabled = this.translationP === 0;
    this.cdr.markForCheck();
  }

  get translation(): number {
    return this.translationP;
  }

  @HostListener('window:resize', ['$event'])
  update() {
    this.zone.runOutsideAngular(() => (this.translation = this.translationP));
  }

  @HostListener('keydown.arrowRight', ['$event'])
  scrollRight(event?: KeyboardEvent) {
    if (!this.isNextDisabled) {
      const items = this.items.toArray().reverse();
      const firstVisibleIndex = items.findIndex((item) =>
        this.isItemVisible(item.nativeElement)
      );
      const elementToScroll = items[firstVisibleIndex - 1];
      if (elementToScroll) {
        this.scrollRightTo(elementToScroll, !!event);
      }
    }
  }

  @HostListener('keydown.arrowLeft', ['$event'])
  scrollLeft(event?: KeyboardEvent) {
    if (!this.isPrevDisabled) {
      const items = this.items.toArray();
      const firstVisibleIndex = items.findIndex((item) =>
        this.isItemVisible(item.nativeElement)
      );
      const elementToScroll = items[firstVisibleIndex - 1];
      if (elementToScroll) {
        this.scrollLeftTo(elementToScroll, !!event);
      }
    }
  }

  ngOnInit(): void {
    this.buttonsTopPosition = this.buttonsTopPosition || '50%';
    this.root = this.rootRef.nativeElement;
    this.content = this.contentRef.nativeElement;
    this.attachListeners();
  }

  ngOnDestroy(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.nextButton._elementRef.nativeElement.removeEventListener(
      'keydown',
      this.nextListener
    );
    // eslint-disable-next-line no-underscore-dangle
    this.prevButton._elementRef.nativeElement.removeEventListener(
      'keydown',
      this.prevListener
    );
    this.subscription.unsubscribe();
  }

  ngAfterContentInit(): void {
    this.translation = 0;
    this.subscription.add(
      this.items.changes.subscribe(() => (this.translation = 0))
    );
  }

  focusNextItem(
    event: KeyboardEvent,
    current: HListItemDirective,
    scroll = false
  ) {
    const index = this.items.toArray().findIndex((item) => item === current);
    const next = this.items.toArray()[index + 1];
    if (next) {
      if (!this.isItemVisible(next.nativeElement)) {
        if (scroll) {
          this.scrollRightTo(next);
        } else {
          this.nextButton.focus();
        }
        event.preventDefault();
        return false;
      }
    }
    return;
  }

  focusPreviousItem(
    event: KeyboardEvent,
    current: HListItemDirective,
    scroll = false
  ) {
    const index = this.items.toArray().findIndex((item) => item === current);
    const prev = this.items.toArray()[index - 1];
    if (prev) {
      if (!this.isItemVisible(prev.nativeElement)) {
        if (scroll) {
          this.scrollLeftTo(prev);
        } else {
          this.prevButton.focus();
        }
        event.preventDefault();
        return false;
      }
    }
    return;
  }

  private attachListeners(): void {
    this.nextListener = (e) => {
      if (e.shiftKey && e.key === 'Tab') {
        const items = this.items.toArray().reverse();
        const firstVisible = items.find((item) =>
          this.isItemVisible(item.nativeElement)
        );
        if (firstVisible) {
          firstVisible.focusLastTabbable();
          e.preventDefault();
          return false;
        }
      }
      return;
    };

    this.prevListener = (e) => {
      if (!e.shiftKey && e.key === 'Tab') {
        const firstVisible = this.items.find((item) =>
          this.isItemVisible(item.nativeElement)
        );
        if (firstVisible) {
          firstVisible.focusFirstTabbable();
          e.preventDefault();
          return false;
        }
      }
      return;
    };
    this.zone.runOutsideAngular(() => {
      // eslint-disable-next-line no-underscore-dangle
      this.nextButton._elementRef.nativeElement.addEventListener(
        'keydown',
        this.nextListener
      );
      // eslint-disable-next-line no-underscore-dangle
      this.prevButton._elementRef.nativeElement.addEventListener(
        'keydown',
        this.prevListener
      );
    });
  }

  private isItemVisible(item: HTMLElement): boolean {
    const c1 =
      item.offsetLeft + item.offsetWidth + this.translation <=
      this.root.offsetWidth;
    const c2 = item.offsetLeft + this.translation >= 0;
    return c1 && c2;
  }

  private scrollRightTo(element: HListItemDirective, focus = true) {
    const max = this.content.offsetWidth - this.root.offsetWidth;
    this.translation = Math.max(-element.nativeElement.offsetLeft, -max);
    if (focus) {
      element.focusFirstTabbable();
    }
  }

  private scrollLeftTo(element: HListItemDirective, focus = true) {
    const position =
      element.nativeElement.offsetLeft +
      element.nativeElement.clientWidth -
      this.root.clientWidth;
    this.translation = Math.min(-position, 0);
    if (focus) {
      element.focusLastTabbable();
    }
  }
}

@Directive({
  selector: '[appHListItem]',
})
export class HListItemDirective extends ElementRef<HTMLElement>
  implements AfterViewInit, OnDestroy {
  private firstTabbable: HTMLElement | null = null;
  private lastTabbable: HTMLElement | null = null;

  constructor(
    private element: ElementRef<HTMLElement>,
    @Inject(HListComponent) private parent: HListComponent,
    private checker: InteractivityChecker,
    private zone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    super(element.nativeElement);
  }

  ngAfterViewInit(): void {
    this.initFirstTabbableElement();
    this.initLastTabbableElement();
    this.attachListeners();
  }

  ngOnDestroy(): void {
    if (this.lastTabbable) {
      this.lastTabbable.removeEventListener('keydown', this.tabListener);
    }
    if (this.firstTabbable) {
      this.firstTabbable.removeEventListener('keydown', this.shiftTabListener);
    }
  }

  focusFirstTabbable() {
    if (this.firstTabbable) {
      this.firstTabbable.focus({ preventScroll: true });
    }
  }

  focusLastTabbable() {
    if (this.lastTabbable) {
      this.lastTabbable.focus({ preventScroll: true });
    }
  }

  private initLastTabbableElement(): void {
    if (this.lastTabbable) {
      return;
    }
    const last = this.getLastTabbableElement(this.element.nativeElement);
    if (!last) {
      this.element.nativeElement.setAttribute('tabindex', '0');
      this.lastTabbable = this.element.nativeElement;
    } else {
      this.lastTabbable = last;
    }
  }

  private initFirstTabbableElement(): void {
    if (this.firstTabbable) {
      return;
    }
    const first = this.getFirstTabbableElement(this.element.nativeElement);
    if (!first) {
      this.element.nativeElement.setAttribute('tabindex', '0');
      this.firstTabbable = this.element.nativeElement;
    } else {
      this.firstTabbable = first;
    }
  }

  private attachListeners(): void {
    this.tabListener = (e) => {
      if (!e.shiftKey && e.key === 'Tab') {
        this.parent.focusNextItem(e, this);
      }
    };

    this.shiftTabListener = (e) => {
      if (e.shiftKey && e.key === 'Tab') {
        this.parent.focusPreviousItem(e, this);
      }
    };

    this.zone.runOutsideAngular(() => {
      if (this.lastTabbable) {
        this.lastTabbable.addEventListener('keydown', this.tabListener);
      }
      if (this.firstTabbable) {
        this.firstTabbable.addEventListener('keydown', this.shiftTabListener);
      }
    });
  }

  /** Get the first tabbable element from a DOM subtree (inclusive). */
  private getFirstTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this.checker.isFocusable(root) && this.checker.isTabbable(root)) {
      return root;
    }

    // Iterate in DOM order. Note that IE doesn't have `children` for SVG so we fall
    // back to `childNodes` which includes text nodes, comments etc.
    const children = root.children || root.childNodes;

    // tslint:disable-next-line:prefer-for-of
    for (const child of Array.from(children)) {
      const tabbableChild =
        child.nodeType === this.document.ELEMENT_NODE
          ? this.getFirstTabbableElement(child as HTMLElement)
          : null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  /** Get the last tabbable element from a DOM subtree (inclusive). */
  private getLastTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this.checker.isFocusable(root) && this.checker.isTabbable(root)) {
      return root;
    }

    // Iterate in reverse DOM order.
    const children = root.children || root.childNodes;

    for (let i = children.length - 1; i >= 0; i--) {
      const tabbableChild =
        children[i].nodeType === this.document.ELEMENT_NODE
          ? this.getLastTabbableElement(children[i] as HTMLElement)
          : null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  private tabListener: (event: KeyboardEvent) => void = () => {};
  private shiftTabListener: (event: KeyboardEvent) => void = () => {};
}
