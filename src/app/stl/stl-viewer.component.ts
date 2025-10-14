import { Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { StlLoaderService } from './stl-loader.service';
import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';

@Component({
  selector: 'app-stl-viewer',
  template: `
    <div class="viewer">
      <input type="file" (change)="onFileSelected($event)" accept=".stl" />
      <div #canvasContainer class="canvas-container"></div>
    </div>
  `,
  styles: `
    .viewer { display:flex; flex-direction: column; gap: 8px; }
    .canvas-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
      background: #222;
    }
`,
})
export class StlViewerComponent implements OnDestroy {
  @ViewChild('canvasContainer') public container!: ElementRef<HTMLDivElement>;

  private _cleanupFn: Option.Option<() => void> = Option.none;
  private _loaderService: StlLoaderService = inject(StlLoaderService);

  public onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const task = this._loaderService.loadFile(file, this.container.nativeElement);

    task().then((result) => {
      if (Either.isRight(result)) {
        this._cleanupFn = Option.some(result.right);
      } else {
        alert('Loading error: ' + result.left.message);
      }
    });
  }

  public ngOnDestroy(): void {
    if (Option.isSome(this._cleanupFn)) {
      this._cleanupFn.value();
    }
  }
}
