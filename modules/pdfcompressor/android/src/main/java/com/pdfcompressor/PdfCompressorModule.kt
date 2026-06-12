package com.pdfcompressor

import android.graphics.Bitmap
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class PdfCompressorModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "PdfCompressor"
  }

  @ReactMethod
  fun compressPdf(
    inputPath: String,
    quality: String,
    promise: Promise
  ) {

    try {

      val cleanPath = inputPath.replace(
        "file://",
        ""
      )

      val inputFile = File(cleanPath)

      val descriptor = ParcelFileDescriptor.open(
        inputFile,
        ParcelFileDescriptor.MODE_READ_ONLY
      )

      val renderer = PdfRenderer(descriptor)

      val outputFile = File(
        reactApplicationContext.cacheDir,
        "compressed_${System.currentTimeMillis()}.pdf"
      )

      val document = PdfDocument()

      for (i in 0 until renderer.pageCount) {

        val page = renderer.openPage(i)

        val bitmap = Bitmap.createBitmap(
          page.width,
          page.height,
          Bitmap.Config.ARGB_8888
        )

        page.render(
          bitmap,
          null,
          null,
          PdfRenderer.Page.RENDER_MODE_FOR_PRINT
        )

        val pageInfo = PdfDocument.PageInfo.Builder(
          page.width,
          page.height,
          i + 1
        ).create()

        val pdfPage = document.startPage(pageInfo)

        pdfPage.canvas.drawBitmap(
          bitmap,
          0f,
          0f,
          null
        )

        document.finishPage(pdfPage)

        bitmap.recycle()
        page.close()
      }

      document.writeTo(FileOutputStream(outputFile))

      document.close()
      renderer.close()
      descriptor.close()

      val result = Arguments.createMap()

      result.putString(
        "outputPath",
        outputFile.absolutePath
      )

      result.putInt(
        "originalSize",
        inputFile.length().toInt()
      )

      result.putInt(
        "compressedSize",
        outputFile.length().toInt()
      )

      promise.resolve(result)

    } catch (e: Exception) {
      promise.reject("COMPRESS_ERROR", e)
    }
  }
}