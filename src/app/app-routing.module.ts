import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminBoardComponent } from './admin-board/admin-board.component';
import { AdminConfirmedRequestsComponent } from './admin-confirmed-requests/admin-confirmed-requests.component';
import { AdminHistoryComponent } from './admin-history/admin-history.component';
import { SearchByComponent } from './search-by/search-by.component';
import { BookingComponent } from './booking/booking.component';
import { HomePageComponent } from './home-page/home-page.component';

const routes: Routes = [
  {
    path: '',
    component: SearchByComponent
  },
  {
    path: 'search',
    component: SearchByComponent
  },
  {
    path: 'booking',
    component: BookingComponent
  },
  {
    path: 'admin-board',
    component: AdminBoardComponent
  },
  {
    path: 'admin-history',
    component: AdminHistoryComponent
  },
  {
    path: 'admin-confirmed',
    component: AdminConfirmedRequestsComponent
  },
  {
    path: 'home-page',
    component: HomePageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
