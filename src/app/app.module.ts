import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {DateAdapter, MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { SwiperModule } from 'swiper/angular';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalService, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MdePopoverModule } from '@material-extended/mde';
import { MatCardModule } from '@angular/material/card';

import { SearchByComponent } from './search-by/search-by.component';
import { BookingComponent } from './booking/booking.component';
import { SubjectPopUpComponent } from './subject-pop-up/subject-pop-up.component';
import { GraphicMapComponent } from './graphic-map/graphic-map.component';
import { AdminBoardComponent } from './admin-board/admin-board.component';
import { AdminHistoryComponent } from './admin-history/admin-history.component';
import { AdminConfirmedRequestsComponent } from './admin-confirmed-requests/admin-confirmed-requests.component';
import { HomePageComponent } from './home-page/home-page.component';
import { CustomDateAdapter } from './booking/custom-adapter';
import { environment } from 'src/environments/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azureID,
      redirectUri: environment.url
    }
  })
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/beta/me', ['user.read', 'mail.read', 'mail.send', 'contacts.read', 'mail.send.shared']);

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap
  };
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
} 

@NgModule({
  declarations: [
    AppComponent,
    SearchByComponent,
    BookingComponent,
    SubjectPopUpComponent,
    GraphicMapComponent,
    AdminBoardComponent,
    AdminHistoryComponent,
    AdminConfirmedRequestsComponent,
    HomePageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    SwiperModule,
    HttpClientModule,
    MsalModule,
    FormsModule,
    MatDialogModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    MdePopoverModule,
    MatCardModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: LanguageInterceptor,
    //   multi: true
    // },
    // HttpClient
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
