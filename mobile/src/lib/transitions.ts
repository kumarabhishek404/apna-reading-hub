import { StackTransitionConfig } from 'expo-router';

// Modern screen transitions with blur and slide effects
export const screenTransitions: StackTransitionConfig = {
  animation: 'slide_from_right',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationTypeForReplace: 'push',
};

// Fade transition for modal-like screens
export const fadeTransition: StackTransitionConfig = {
  animation: 'fade',
  animationDuration: 300,
  gestureEnabled: true,
};

// Custom slide-up transition for bottom sheets
export const slideUpTransition: StackTransitionConfig = {
  animation: 'slide_from_bottom',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

// Flip transition for special screens
export const flipTransition: StackTransitionConfig = {
  animation: 'flip',
  animationDuration: 500,
  gestureEnabled: false,
};

// Fade-through transition for content switching
export const fadeThroughTransition: StackTransitionConfig = {
  animation: 'fade',
  animationDuration: 250,
  gestureEnabled: false,
};