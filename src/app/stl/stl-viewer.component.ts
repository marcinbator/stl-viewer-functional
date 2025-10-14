import { Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { StlLoaderService } from './stl-loader.service';
import * as Either from 'fp-ts/Either';
import * as Maybe from 'fp-ts/Option';

@Component({
  selector: 'app-stl-viewer',
  template: `
    <div class="viewer">
      <input type="file" (change)="onFileSelected($event)" accept=".stl" />
      <div #canvas class="canvas"></div>
    </div>
  `,
  styles: `
    .viewer { display:flex; flex-direction: column; gap: 8px; }
    .canvas {
      width: 100%;
      height: 500px;
      border: 1px solid #ccc;
      background: #222;
    }
`,
})
export class StlViewerComponent implements OnDestroy {
  @ViewChild('canvas') public container!: ElementRef<HTMLDivElement>;

  private _cleanupFn: Maybe.Option<() => void> = Maybe.none;
  private _loaderService: StlLoaderService = inject(StlLoaderService);

  public onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const task = this._loaderService.loadFile(file, this.container.nativeElement);

    task().then((result) => {
      if (Either.isRight(result)) {
        this._cleanupFn = Maybe.some(result.right);
      } else {
        alert('Loading error: ' + result.left.message);
      }
    });
  }

  public ngOnDestroy(): void {
    if (Maybe.isSome(this._cleanupFn)) {
      this._cleanupFn.value();
    }
  }
}
