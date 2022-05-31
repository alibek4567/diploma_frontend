import { NativeDateAdapter } from '@angular/material/core';

/** Adapts the native JS Date for use with cdk-based components that work with dates. */
export class CustomDateAdapter extends NativeDateAdapter {

  

  // parse the date from input component as it only expect dates in 
  // mm-dd-yyyy format
    
  override getFirstDayOfWeek(): number {
   return 1;
  }

}