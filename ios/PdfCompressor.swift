import Foundation
import PDFKit
import UIKit
import React

@objc(PdfCompressor)
class PdfCompressor: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func compressPdf(
    _ inputPath: String,
    quality: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {

    DispatchQueue.global(qos: .userInitiated).async {

      let renderScale: CGFloat
      let jpegQuality: CGFloat

switch quality.lowercased() {

case "low": // Maximum Compression
    renderScale = 0.60
    jpegQuality = 0.60

case "medium": // Balanced
    renderScale = 0.70
    jpegQuality = 0.70

default: // Best Quality
    renderScale = 0.80
    jpegQuality = 0.80
}

      let cleanPath = inputPath.replacingOccurrences(
        of: "file://",
        with: ""
      )

      let inputURL = URL(fileURLWithPath: cleanPath)

      guard let pdfDocument = PDFDocument(url: inputURL) else {
        reject(
          "LOAD_ERROR",
          "Failed to load PDF",
          nil
        )
        return
      }

      let outputURL = FileManager.default
        .temporaryDirectory
        .appendingPathComponent(
          "compressed_\(UUID().uuidString).pdf"
        )

      let renderer = UIGraphicsPDFRenderer(
        bounds: CGRect(
          x: 0,
          y: 0,
          width: 612,
          height: 792
        )
      )

      do {

        try renderer.writePDF(to: outputURL) { context in

          for index in 0..<pdfDocument.pageCount {

            guard let page = pdfDocument.page(
              at: index
            ) else {
              continue
            }

            let pageRect = page.bounds(
              for: .mediaBox
            )

            context.beginPage(
              withBounds: pageRect,
              pageInfo: [:]
            )

            UIGraphicsBeginImageContextWithOptions(
              pageRect.size,
              true,
              renderScale
            )

            guard let currentContext =
              UIGraphicsGetCurrentContext()
            else {
              continue
            }

            UIColor.white.set()
            currentContext.fill(pageRect)

            currentContext.saveGState()

            currentContext.translateBy(
              x: 0,
              y: pageRect.height
            )

            currentContext.scaleBy(
              x: 1,
              y: -1
            )

            page.draw(
              with: .mediaBox,
              to: currentContext
            )

            currentContext.restoreGState()

            let renderedImage =
              UIGraphicsGetImageFromCurrentImageContext()

            UIGraphicsEndImageContext()

            if let image = renderedImage,
               let compressedData = image.jpegData(
                compressionQuality: jpegQuality
               ),
               let compressedImage = UIImage(
                data: compressedData
               ) {

              compressedImage.draw(
                in: pageRect
              )
            }
          }
        }

        let originalSize =
          (try? FileManager.default
            .attributesOfItem(
              atPath: inputURL.path
            )[.size] as? NSNumber)?
            .intValue ?? 0

        let compressedSize =
          (try? FileManager.default
            .attributesOfItem(
              atPath: outputURL.path
            )[.size] as? NSNumber)?
            .intValue ?? 0

       if compressedSize >= originalSize {

  resolve([
    "outputPath":
      inputURL.absoluteString,
    "originalSize":
      originalSize,
    "compressedSize":
      compressedSize,
    "savedBytes": 0,
    "compressionPercent": 0,
    "wasCompressed": false
  ])

  return
}

        let savedBytes =
          originalSize - compressedSize

        let compressionPercent =
          Double(savedBytes) /
          Double(originalSize) * 100.0

        resolve([
          "outputPath":
            outputURL.absoluteString,
          "originalSize":
            originalSize,
          "compressedSize":
            compressedSize,
          "savedBytes":
            savedBytes,
          "compressionPercent":
            round(
              compressionPercent * 10
            ) / 10,
          "wasCompressed": true
        ])

      } catch {

        reject(
          "COMPRESS_ERROR",
          error.localizedDescription,
          error
        )
      }
    }
  }
}