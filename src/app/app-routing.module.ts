import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent } from './booking/booking.component';
import { SearchByComponent } from './search-by/search-by.component';

const routes: Routes = [
  {
    path: '',
    component: SearchByComponent
  },
  {
    path: 'booking',
    component: BookingComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
