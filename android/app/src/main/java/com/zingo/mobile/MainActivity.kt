package com.zingo.mobile

import android.app.Activity
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var splashLogo: ImageView

    private val appBackground = Color.parseColor("#09111F")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.setBackgroundDrawable(ColorDrawable(appBackground))
        window.statusBarColor = appBackground
        window.navigationBarColor = appBackground

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            visibility = View.VISIBLE
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(match(), match())
            configureSettings(this, settings)
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isLongClickable = false
            isHapticFeedbackEnabled = false
            setBackgroundColor(appBackground)
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            setOnLongClickListener { true }
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    progressBar.progress = newProgress
                    progressBar.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE
                    if (newProgress >= 100) {
                        hideSplashLogo()
                    }
                }
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val target = request?.url ?: return false
                    return handleNavigation(target)
                }

                override fun onPageCommitVisible(view: WebView?, url: String?) {
                    hideSplashLogo()
                }
            }
            setDownloadListener(DownloadHandler())
        }

        splashLogo = ImageView(this).apply {
            setImageResource(R.drawable.zingo_logo)
            scaleType = ImageView.ScaleType.FIT_CENTER
            alpha = 1f
        }

        val root = FrameLayout(this).apply {
            setBackgroundColor(appBackground)
            addView(webView)
            addView(
                progressBar,
                FrameLayout.LayoutParams(match(), dp(3))
            )
            addView(
                splashLogo,
                FrameLayout.LayoutParams(dp(190), dp(230), Gravity.CENTER)
            )
        }

        setContentView(root)

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(BuildConfig.START_URL)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
            return
        }
        super.onBackPressed()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun configureSettings(webView: WebView, settings: WebSettings) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.loadsImagesAutomatically = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = false
        settings.allowContentAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
    }

    private fun handleNavigation(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        val currentHost = Uri.parse(BuildConfig.START_URL).host.orEmpty()
        val targetHost = uri.host.orEmpty()

        if (scheme == "http" || scheme == "https") {
            if (targetHost == currentHost || targetHost.endsWith("localhost") || targetHost == "127.0.0.1") {
                return false
            }

            val action = Intent(Intent.ACTION_VIEW, uri)
            runCatching { startActivity(action) }
            return true
        }

        if (scheme == "intent") {
            return try {
                val intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                startActivity(intent)
                true
            } catch (_: Exception) {
                true
            }
        }

        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: ActivityNotFoundException) {
            true
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT

    private fun hideSplashLogo() {
        if (!::splashLogo.isInitialized || splashLogo.visibility != View.VISIBLE) return
        splashLogo.animate()
            .alpha(0f)
            .setDuration(180)
            .withEndAction { splashLogo.visibility = View.GONE }
            .start()
    }

    private inner class DownloadHandler : DownloadListener {
        override fun onDownloadStart(
            url: String?,
            userAgent: String?,
            contentDisposition: String?,
            mimeType: String?,
            contentLength: Long
        ) {
            if (url.isNullOrBlank()) return

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType))
                setDescription("Downloading from Zingo")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                allowScanningByMediaScanner()
                setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    URLUtil.guessFileName(url, contentDisposition, mimeType)
                )

                val cookie = CookieManager.getInstance().getCookie(url)
                if (!cookie.isNullOrBlank()) {
                    addRequestHeader("Cookie", cookie)
                }
                if (!userAgent.isNullOrBlank()) {
                    addRequestHeader("User-Agent", userAgent)
                }
            }

            val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            manager.enqueue(request)
        }
    }
}
