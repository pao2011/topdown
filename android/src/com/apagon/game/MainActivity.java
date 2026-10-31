package com.apagon.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

// Envoltorio mínimo: el juego es la misma página web (assets/index.html + game.js) a pantalla completa
public class MainActivity extends Activity {
  private WebView web;

  @Override
  protected void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    if (Build.VERSION.SDK_INT >= 28) getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true); // la partida se guarda en localStorage
    s.setAllowFileAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    setContentView(web);
    if (state != null) web.restoreState(state); else web.loadUrl("file:///android_asset/index.html");
  }

  @Override
  public void onWindowFocusChanged(boolean focus) {
    super.onWindowFocusChanged(focus);
    if (focus) web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
  }

  @Override
  public void onBackPressed() { // atrás = Esc: pausa o reanuda; no cierra la partida
    web.evaluateJavascript("dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}))", null);
  }

  @Override protected void onPause() { super.onPause(); web.onPause(); }
  @Override protected void onResume() { super.onResume(); web.onResume(); }
  @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
}
