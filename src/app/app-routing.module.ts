import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchByComponent } from './search-by/search-by.component';

const routes: Routes = [
  {
    path: '',
    component: SearchByComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
