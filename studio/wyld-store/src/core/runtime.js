// Build-time settings. The source values suit the website and web app, which
// load everything from their own origin. The Android build overwrites this
// file with the public site URL and its own version number.
export const runtime = {
  remoteBase: '',     // absolute URL of the published site, e.g. https://example.com/store/
  appVersionCode: 0,  // Android versionCode of this build (0 = not a native build)
  appVersionName: '',
};
