import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { ParamaterType } from 'src/app/models/paramater-type';
import { SimConnectService } from 'src/app/services/simconnect.service';
import { SvgService } from 'src/app/services/svg.service';

@Component({
  selector: 'app-airspeed-indicator',
  templateUrl: './airspeed-indicator.component.html',
})
export class AirspeedIndicatorComponent implements OnInit, AfterViewInit {
  readFrom = ['AIRSPEED INDICATED', 'DEBUG COMMAND'];

  public v: number = 0;
  public vMin: number = 0;
  public vMax: number = 240;
  public tickMajor: number = 10;
  public tickMinor: number = 5;

  public vS0: number = 40;
  public vS1: number = 45;
  public vFE: number = 85;
  public vN0: number = 130;
  public vNE: number = 156;
  public vNEs: number = 160;

  public range = 0;
  public rangeFactor = 0;
  public smallScale = 0.5;
  public smallScaleFactor = 0;
  public standardScale = 1.0;
  public standardScaleFactor = 0;

  public needle: SVGLineElement;

  constructor(
    private simConnect: SimConnectService,
    private svgService: SvgService,
    private elementRef: ElementRef<HTMLElement>
  ) {
    this.needle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
  }

  ngOnInit(): void {
    this.simConnect.subscribeTo(this.readFrom).subscribe((result) => {
      this.v = result.valueAsDecimal;
      this.updateNeedle();
    });

    this.simConnect
      .add([
        {
          paramaterType: ParamaterType.SimVar,
          name: 'AIRSPEED INDICATED',
          units: 'knots',
          precision: 1,
        },
      ])
      .pipe(
        switchMap((_) => this.simConnect.connect()),
        switchMap((_) => this.simConnect.send())
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.setupSvg();
    this.updateNeedle();
  }

  setupSvg() {
    let elements = this.elementRef.nativeElement.querySelectorAll('svg');
    if (elements.length == 1) {
      let element = elements[0];

      this.range = this.vMax - this.vMin;
      this.rangeFactor = 360 / this.range;

      let smallScaleRange = this.range - this.vNEs + this.vS0;
      this.smallScaleFactor = this.rangeFactor * this.smallScale;
      let smallScaleAngle = smallScaleRange * this.smallScaleFactor;

      let standardScaleAngle = 360 - smallScaleAngle;
      let standardScaleRange = this.range - smallScaleRange;
      this.standardScaleFactor = standardScaleAngle / standardScaleRange;

      let vS0Angle = (this.vS0 - this.vMin) * this.smallScaleFactor;
      let vS1Angle =
        (this.vS1 - this.vS0) * this.standardScaleFactor + vS0Angle;
      let vFEAngle =
        (this.vFE - this.vS0) * this.standardScaleFactor + vS0Angle;
      let vN0Angle =
        (this.vN0 - this.vS0) * this.standardScaleFactor + vS0Angle;
      let vNEAngle =
        (this.vNE - this.vS0) * this.standardScaleFactor + vS0Angle;
      let vNEsAngle =
        (this.vNEs - this.vS0) * this.standardScaleFactor + vS0Angle;

      this.addArc(element, '#fff', 12, 156, [vS0Angle, vFEAngle - vS0Angle]);
      this.addArc(element, '#0f0', 12, 144, [vS1Angle, vN0Angle - vS1Angle]);
      this.addArc(element, '#ff0', 12, 144, [vN0Angle, vNEAngle - vN0Angle]);
      this.addArc(element, '#f00', 24, 150, [vNEAngle, vNEsAngle - vNEAngle]);

      this.addTitle(element);
      this.addLabel(element);
      this.addTicks(element);
      this.addNeedle(element);
    }
  }

  addArc(
    element: SVGSVGElement,
    stroke: string,
    strokeWidth: number,
    r: number,
    [t1, Δ]: number[]
  ) {
    var path = this.svgService.createElipticArcPathInDegrees(
      [180, 180],
      [r, r],
      [t1, Δ],
      270
    );
    path.setAttribute('fill', 'transparent');
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', strokeWidth.toString());
    element.appendChild(path);
  }

  addNeedle(element: SVGSVGElement) {
    this.needle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    this.needle.setAttribute('x1', '180');
    this.needle.setAttribute('y1', '180');
    this.needle.setAttribute('x2', '180');
    this.needle.setAttribute('y2', '20');
    this.needle.setAttribute(
      'style',
      'stroke:#fff; stroke-width:3;stroke-linecap:round'
    );
    element.appendChild(this.needle);
  }

  addTicks(element: SVGSVGElement) {
    for (let value = this.vS0; value <= this.vNEs; value += this.tickMajor) {
      let smallScaleAngle = this.vS0 * this.smallScaleFactor;
      let angle =
        (value - this.vS0) * this.standardScaleFactor + smallScaleAngle;
      this.addTick(element, angle, 3, 30, 130);
      this.addTickLabel(element, angle, 115, value.toString());
    }

    for (let value = this.vS0; value <= this.vNEs; value += this.tickMinor) {
      if (value % this.tickMajor !== 0) {
        let smallScaleAngle = this.vS0 * this.smallScaleFactor;
        let angle =
          (value - this.vS0) * this.standardScaleFactor + smallScaleAngle;
        this.addTick(element, angle, 1, 5, 130);
      }
    }
  }

  addTick(
    element: SVGSVGElement,
    angle: number,
    strokeWidth: number,
    length: number,
    distance: number
  ) {
    let tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', '180');
    tick.setAttribute('y1', '180');
    tick.setAttribute('x2', '180');
    tick.setAttribute('y2', (180 - length).toString());
    tick.setAttribute(
      'style',
      'stroke:#fff; stroke-width:' +
        strokeWidth.toString() +
        ';stroke-linecap:round'
    );
    tick.setAttribute(
      'transform',
      'rotate(' +
        angle.toString() +
        ' 180 180) translate(0 -' +
        distance.toString() +
        ')'
    );

    element.appendChild(tick);
  }

  addTickLabel(
    element: SVGSVGElement,
    angle: number,
    distance: number,
    value: string
  ) {
    let tickLabel = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text'
    );
    tickLabel.innerHTML = value;
    tickLabel.setAttribute('x', '180');
    tickLabel.setAttribute('y', '180');
    tickLabel.setAttribute('dominant-baseline', 'middle');
    tickLabel.setAttribute('text-anchor', 'middle');
    tickLabel.setAttribute('class', 'label');
    tickLabel.setAttribute(
      'transform',
      'rotate(' +
        angle.toString() +
        ' 180 180) translate(0 -' +
        distance.toString() +
        ')'
    );

    element.appendChild(tickLabel);
  }

  addTitle(element: SVGSVGElement) {
    let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    text.setAttribute('x', '50%');
    text.setAttribute('y', '40');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'title');

    text.innerHTML = 'AIRSPEED';

    element.appendChild(text);
  }

  addLabel(element: SVGSVGElement) {
    let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    text.setAttribute('x', '50%');
    text.setAttribute('y', '240');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'title');

    text.innerHTML = 'KNOTS';

    element.appendChild(text);
  }

  updateNeedle() {
    let angle = 0;
    if (this.v <= this.vS0) {
      angle = (this.v - this.vMin) * this.smallScaleFactor;
    } else {
      let smallScaleAngle = this.vS0 * this.smallScaleFactor;
      angle = (this.v - this.vS0) * this.standardScaleFactor + smallScaleAngle;
    }

    this.needle.setAttribute(
      'transform',
      'rotate(' + angle.toString() + ' 180 180)'
    );
  }
}
