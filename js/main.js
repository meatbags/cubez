/** App init and main loop. */

import Logic from './modules/logic';
import Renderer from './modules/renderer';
import ControlSurface from './ui/control_surface';
import Menu from './overlay/menu';

class App {
  constructor() {
    // init
    this.renderer = new Renderer();
    this.logic = new Logic();
    this.controlSurface = new ControlSurface();
    this.menu = new Menu();

    // bind events
    this.renderer.bind(this);
    this.logic.bind(this);
    this.controlSurface.bind(this);
    this.bindEvents();

    // run
    this.time = {now: performance.now(), maxDelta: 0.1};
    this.active = true;
    this.loop();
  }

  bindEvents() {
    // catch resize lag on fullscreen change
    window.addEventListener('resize', () => {
      if (window.innerHeight === screen.height && !this.isFullscreen) {
        this.isFullscreen = true;
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 50);
      }
      this.isFullscreen = false;
    });
    
    // call initial resize
    window.dispatchEvent(new Event('resize'));
  }

  loop() {
    requestAnimationFrame(() => { this.loop(); });
    if (this.active) {
      const t = performance.now();
      const delta = Math.min(this.time.maxDelta, (t - this.time.now) / 1000);
      this.time.now = t;
      this.logic.update(delta);
      this.renderer.render(delta);
      this.logic.draw(delta);
    }
  }
}

window.onload = () => {
  const app = new App();
};
