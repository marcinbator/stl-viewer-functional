import { Component } from '@angular/core';
import { StlViewerComponent } from './stl/stl-viewer.component';
import { StlLoaderService } from './stl/stl-loader.service';

@Component({
  selector: 'app-root',
  imports: [StlViewerComponent],
  providers: [StlLoaderService],
  template: `
    <div style="padding: 16px;">
      <h1>STL Visualizer functional</h1>
      <app-stl-viewer></app-stl-viewer>
    </div>
  `,
})
export class App {}
