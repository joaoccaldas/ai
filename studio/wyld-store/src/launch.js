// Launched from the home screen? Open the app, not the website.
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
  location.replace('./app/' + location.hash);
}
