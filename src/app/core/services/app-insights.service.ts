import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppInsightsService {
  private appInsights: ApplicationInsights | null = null;

  constructor() {
    if (environment.appInsightsConnectionString) {
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: environment.appInsightsConnectionString,
          enableAutoRouteTracking: true,
        },
      });
      this.appInsights.loadAppInsights();
    }
  }

  trackEvent(name: string, properties?: Record<string, string>): void {
    this.appInsights?.trackEvent({ name }, properties);
  }
}
