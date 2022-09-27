import { ParamaterType } from './paramater-type';

export class Simvar {
  public category: string = '';
  public paramaterType?: ParamaterType;
  public name: string = '';
  public description?: string;
  public units?: string;
  public precision?: number;
  public valueAsDecimal?: number;
  public valueAsString?: string;
  public writable?: boolean;
  //
  public valueToSend?: string;
}
