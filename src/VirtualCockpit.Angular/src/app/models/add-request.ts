import { ParamaterType } from './paramater-type';

export class AddRequest {
  public paramaterType?: ParamaterType;
  public name?: string;
  public units?: string;
  public precision?: number;
}
