let drawerNavigation = null;

export function registerDrawerNavigation(navigation) {
  drawerNavigation = navigation;
}

export function openDrawer() {
  if (drawerNavigation?.openDrawer) {
    drawerNavigation.openDrawer();
  } else {
    console.log("Drawer not ready yet");
  }
}
