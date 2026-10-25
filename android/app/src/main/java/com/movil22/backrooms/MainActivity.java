package com.movil22.backrooms;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/** Pantalla única: el juego corre en un WebView a pantalla completa, desde los archivos del APK. */
public class MainActivity extends Activity {
    private static final int PEDIR_MIC = 22;
    private WebView web;
    private PermissionRequest pendiente;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        setContentView(web);
        pantallaCompleta();

        final WebViewAssetLoader cargador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return cargador.shouldInterceptRequest(r.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest req) {
                runOnUiThread(() -> {
                    if (tieneMic()) {
                        req.grant(req.getResources());
                    } else {
                        pendiente = req;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PEDIR_MIC);
                    }
                });
            }
        });
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
    }

    private boolean tieneMic() {
        return Build.VERSION.SDK_INT < 23
                || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        if (code == PEDIR_MIC && pendiente != null) {
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pendiente.grant(pendiente.getResources());
            else pendiente.deny();
            pendiente = null;
        }
    }

    private void pantallaCompleta() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean f) {
        super.onWindowFocusChanged(f);
        if (f) pantallaCompleta();
    }

    @Override
    public void onBackPressed() {
        // el botón atrás abre la pausa del juego
        web.evaluateJavascript("if (window.G && G.ready) { INPUT.press('pause'); }", null);
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.evaluateJavascript("if (window.G && G.ready && !G.paused && G.mode==='solo') { G.togglePause(); }", null);
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        pantallaCompleta();
    }
}
