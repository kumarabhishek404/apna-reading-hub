// Screen transitions configuration for Expo Router
// Note: Transitions are configured per-screen in app.config for Expo Router

export const screenOptions = {
  animation: 'slide_from_right',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationTypeForReplace: 'push',
};

export const fadeOptions = {
  animation: 'fade',
  animationDuration: 300,
  gestureEnabled: true,
};

export const slideUpOptions = {
  animation: 'slide_from_bottom',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'vertical',
};