import { Injectable } from '@angular/core';

@Injectable()
export class SvgService {
  private cos = Math.cos;
  private sin = Math.sin;
  private π = Math.PI;

  private f_degrees_to_radians = (a: number) => a * (this.π / 180);

  private f_matrix_times = ([[a, b], [c, d]]: number[][], [x, y]: number[]) => [
    a * x + b * y,
    c * x + d * y,
  ];
  private f_rotate_matrix = (x: number) => [
    [this.cos(x), -this.sin(x)],
    [this.sin(x), this.cos(x)],
  ];
  private f_vec_add = ([a1, a2]: number[], [b1, b2]: number[]) => [
    a1 + b1,
    a2 + b2,
  ];

  createElipticArcPathInDegrees = (
    [cx, cy]: number[],
    [rx, ry]: number[],
    [t1, Δ]: number[],
    φ: number
  ) => {
    return this.createElipticArcPath(
      [cx, cy],
      [rx, ry],
      [this.f_degrees_to_radians(t1), this.f_degrees_to_radians(Δ)],
      this.f_degrees_to_radians(φ)
    );
  };

  createElipticArcPath = (
    [cx, cy]: number[],
    [rx, ry]: number[],
    [t1, Δ]: number[],
    φ: number
  ) => {
    /* [
    returns a SVG path element that represent a ellipse.
    cx,cy → center of ellipse
    rx,ry → major minor radius
    t1 → start angle, in radian.
    Δ → angle to sweep, in radian. positive.
    φ → rotation on the whole, in radian
    URL: SVG Circle Arc http://xahlee.info/js/svg_circle_arc.html
    Version 2019-06-19
     ] */
    Δ = Δ % (2 * this.π);
    const rotMatrix = this.f_rotate_matrix(φ);
    const [sX, sY] = this.f_vec_add(
      this.f_matrix_times(rotMatrix, [rx * this.cos(t1), ry * this.sin(t1)]),
      [cx, cy]
    );
    const [eX, eY] = this.f_vec_add(
      this.f_matrix_times(rotMatrix, [
        rx * this.cos(t1 + Δ),
        ry * this.sin(t1 + Δ),
      ]),
      [cx, cy]
    );
    const fA = Δ > this.π ? 1 : 0;
    const fS = Δ > 0 ? 1 : 0;
    const path_2wk2r = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    path_2wk2r.setAttribute(
      'd',
      'M ' +
        sX +
        ' ' +
        sY +
        ' A ' +
        [rx, ry, (φ / (2 * this.π)) * 360, fA, fS, eX, eY].join(' ')
    );
    return path_2wk2r;
  };

  constructor() {}
}
