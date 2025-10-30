// src/navigationRef.js
import { createNavigationContainerRef, DrawerActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function openDrawer() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(DrawerActions.openDrawer());
  } else {
    console.log('Navigation not ready yet');
  }
}
