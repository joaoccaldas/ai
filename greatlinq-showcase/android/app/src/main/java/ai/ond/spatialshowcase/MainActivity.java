package ai.ond.spatialshowcase;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/** Android wrapper of the approved visitor-only HTML projection, not the private Studio app. */
public final class MainActivity extends Activity {
    private static final String APP_DOMAIN = "appassets.androidplatform.net";
    private static final String HOME = "https://" + APP_DOMAIN + "/assets/index.html";
    private WebView webView;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(247, 248, 245));
        getWindow().setNavigationBarColor(Color.rgb(247, 248, 245));
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        FrameLayout shell = new FrameLayout(this);
        shell.setFitsSystemWindows(true);
        shell.setBackgroundColor(Color.rgb(247, 248, 245));
        webView = new WebView(this);
        shell.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(shell);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);  // Showcase does not store tokens or login state.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setSafeBrowsingEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        webView.setBackgroundColor(Color.rgb(247, 248, 245));

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return loader.shouldInterceptRequest(Uri.parse(url));
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && APP_DOMAIN.equals(uri.getHost())) {
                    return false;
                }
                if ("https".equals(uri.getScheme()) && "joaoccaldas.github.io".equals(uri.getHost())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (ActivityNotFoundException ex) {
                        // Remain in the showcase if no browser can handle this URL.
                    }
                }
                return true; // Deny other top-level navigations from untrusted content.
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                if (!HOME.equals(url)) return;
                // External examples use target=_blank on the web. Within the app, turn a
                // user click into a same-window navigation that the native client opens
                // with the Android browser. No Javascript bridge is exposed.
                view.evaluateJavascript("document.addEventListener('click', function(e) {" +
                    "const a=e.target.closest('a[href]');if(!a)return;" +
                    "if(a.hostname==='joaoccaldas.github.io'){e.preventDefault();" +
                    "window.location.assign(a.href);}},true);", null);
            }

        });
        webView.loadUrl(HOME);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
