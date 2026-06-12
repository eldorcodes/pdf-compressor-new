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

      let cleanPath = inputPath.replacingOccurrences(
        of: "file://",
        with: ""
      )

      let inputURL = URL(fileURLWithPath: cleanPath)

      guard let pdfDocument = PDFDocument(url: inputURL) else {
        reject("LOAD_ERROR", "Failed to load PDF", nil)
        return
      }

      let outputURL = FileManager.default.temporaryDirectory
        .appendingPathComponent(
          "compressed_\(UUID().uuidString).pdf"
        )

      let renderer = UIGraphicsPDFRenderer(
        bounds: CGRect(x: 0, y: 0, width: 612, height: 792)
      )

      do {

        try renderer.writePDF(to: outputURL) { context in

          for index in 0..<pdfDocument.pageCount {

            guard let page = pdfDocument.page(at: index) else {
              continue
            }

            let pageRect = page.bounds(for: .mediaBox)

            context.beginPage(
              withBounds: pageRect,
              pageInfo: [:]
            )

            UIGraphicsBeginImageContextWithOptions(
              pageRect.size,
              true,
              0.5
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
              x: 1.0,
              y: -1.0
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
                 compressionQuality: 0.5
               ),
               let compressedImage = UIImage(
                 data: compressedData
               ) {

              compressedImage.draw(in: pageRect)
            }
          }
        }

        let originalSize =
          (try? FileManager.default.attributesOfItem(
            atPath: inputURL.path
          )[.size] as? NSNumber)?.intValue ?? 0

        let compressedSize =
          (try? FileManager.default.attributesOfItem(
            atPath: outputURL.path
          )[.size] as? NSNumber)?.intValue ?? 0

        resolve([
          "outputPath": outputURL.absoluteString,
          "originalSize": originalSize,
          "compressedSize": compressedSize
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