import { ParamaterType } from './paramater-type';

export class Simvar {
  public paramaterType?: ParamaterType;
  public name: string = '';
  public description?: string;
  public units?: string;
  public precision?: number;
}
