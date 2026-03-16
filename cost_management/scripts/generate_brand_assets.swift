import AppKit
import Foundation

struct BrandPalette {
  static let forest = NSColor(calibratedRed: 0.12, green: 0.35, blue: 0.26, alpha: 1)
  static let forestSoft = NSColor(calibratedRed: 0.17, green: 0.30, blue: 0.22, alpha: 1)
}

func font(_ name: String, size: CGFloat, weight: NSFont.Weight = .bold) -> NSFont {
  if let custom = NSFont(name: name, size: size) {
    return custom
  }
  return NSFont.systemFont(ofSize: size, weight: weight)
}

func centeredStyle(lineHeight: CGFloat = 1.0) -> NSMutableParagraphStyle {
  let style = NSMutableParagraphStyle()
  style.alignment = .center
  style.minimumLineHeight = lineHeight
  style.maximumLineHeight = lineHeight
  return style
}

func drawText(_ text: String, in rect: CGRect, font: NSFont, color: NSColor, kern: CGFloat = 0, paragraph: NSParagraphStyle) {
  let attributed = NSAttributedString(
    string: text,
    attributes: [
      .font: font,
      .foregroundColor: color,
      .kern: kern,
      .paragraphStyle: paragraph
    ]
  )
  attributed.draw(in: rect)
}

func makeTransparentCanvas(size: CGSize) -> NSImage {
  let image = NSImage(size: size)
  image.lockFocus()
  defer { image.unlockFocus() }
  NSColor.clear.setFill()
  NSBezierPath(rect: CGRect(origin: .zero, size: size)).fill()
  return image
}

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff) else {
    return nil
  }
  return bitmap.representation(using: .png, properties: [:])
}

func writeImage(_ image: NSImage, to path: String) throws {
  guard let data = pngData(from: image) else {
    throw NSError(domain: "brand", code: 1, userInfo: [NSLocalizedDescriptionKey: "Falha ao gerar PNG"])
  }
  try data.write(to: URL(fileURLWithPath: path))
}

func generateWordmark() -> NSImage {
  let size = CGSize(width: 980, height: 320)
  let image = makeTransparentCanvas(size: size)
  image.lockFocus()
  defer { image.unlockFocus() }

  let topStyle = centeredStyle(lineHeight: 24)
  let mainStyle = centeredStyle(lineHeight: 82)
  let subStyle = centeredStyle(lineHeight: 28)

  drawText("EST. 2015", in: CGRect(x: 0, y: 252, width: size.width, height: 28), font: font("AvenirNextCondensed-DemiBold", size: 24, weight: .semibold), color: BrandPalette.forestSoft, kern: 2.8, paragraph: topStyle)
  drawText("DUNAMIS", in: CGRect(x: 0, y: 150, width: size.width, height: 86), font: font("AvenirNextCondensed-Heavy", size: 82, weight: .heavy), color: BrandPalette.forest, kern: 3.4, paragraph: mainStyle)
  drawText("FARM", in: CGRect(x: 0, y: 72, width: size.width, height: 86), font: font("AvenirNextCondensed-Heavy", size: 82, weight: .heavy), color: BrandPalette.forest, kern: 3.6, paragraph: mainStyle)
  drawText("AGRO", in: CGRect(x: 0, y: 24, width: size.width, height: 30), font: font("AvenirNextCondensed-DemiBold", size: 30, weight: .semibold), color: BrandPalette.forestSoft, kern: 6.2, paragraph: subStyle)

  return image
}

func generateMark() -> NSImage {
  let size = CGSize(width: 260, height: 220)
  let image = makeTransparentCanvas(size: size)
  image.lockFocus()
  defer { image.unlockFocus() }

  let topStyle = centeredStyle(lineHeight: 16)
  let mainStyle = centeredStyle(lineHeight: 42)
  let subStyle = centeredStyle(lineHeight: 18)

  drawText("EST. 2015", in: CGRect(x: 0, y: 182, width: size.width, height: 18), font: font("AvenirNextCondensed-DemiBold", size: 13, weight: .semibold), color: BrandPalette.forestSoft, kern: 1.4, paragraph: topStyle)
  drawText("DUNAMIS", in: CGRect(x: 0, y: 110, width: size.width, height: 46), font: font("AvenirNextCondensed-Heavy", size: 41, weight: .heavy), color: BrandPalette.forest, kern: 2.2, paragraph: mainStyle)
  drawText("FARM", in: CGRect(x: 0, y: 68, width: size.width, height: 46), font: font("AvenirNextCondensed-Heavy", size: 41, weight: .heavy), color: BrandPalette.forest, kern: 2.2, paragraph: mainStyle)
  drawText("AGRO", in: CGRect(x: 0, y: 28, width: size.width, height: 20), font: font("AvenirNextCondensed-DemiBold", size: 18, weight: .semibold), color: BrandPalette.forestSoft, kern: 3.4, paragraph: subStyle)

  return image
}

let outputDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("cost_management/src/shared/assets/brand")
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

try writeImage(generateWordmark(), to: outputDir.appendingPathComponent("dunamis-farm-agro-wordmark.png").path)
try writeImage(generateMark(), to: outputDir.appendingPathComponent("dunamis-farm-agro-mark.png").path)

print("ok")
