import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { 
  documentText, 
  mic, 
  settings 
} from 'ionicons/icons';

import NotesPage from '../pages/NotesPage';
import RecordPage from '../pages/RecordPage';
import SettingsPage from '../pages/SettingsPage';

const Tabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/tabs/notes" component={NotesPage} />
      <Route exact path="/tabs/record" component={RecordPage} />
      <Route exact path="/tabs/settings" component={SettingsPage} />
      <Route exact path="/tabs">
        <Redirect to="/tabs/notes" />
      </Route>
    </IonRouterOutlet>
    
    <IonTabBar slot="bottom">
      <IonTabButton tab="notes" href="/tabs/notes">
        <IonIcon icon={documentText} />
        <IonLabel>Notes</IonLabel>
      </IonTabButton>
      
      <IonTabButton tab="record" href="/tabs/record">
        <IonIcon icon={mic} />
        <IonLabel>Record</IonLabel>
      </IonTabButton>
      
      <IonTabButton tab="settings" href="/tabs/settings">
        <IonIcon icon={settings} />
        <IonLabel>Settings</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default Tabs;