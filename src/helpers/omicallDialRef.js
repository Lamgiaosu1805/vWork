let openDialPadHandler = null;

export function registerOpenDialPad(handler) {
  openDialPadHandler = handler;
}

export function openDialPad() {
  if (openDialPadHandler) {
    openDialPadHandler();
  } else {
    console.log("Omikit not ready yet");
  }
}
