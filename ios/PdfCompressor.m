#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PdfCompressor, NSObject)

RCT_EXTERN_METHOD(
  compressPdf:(NSString *)inputPath
  quality:(NSString *)quality
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end