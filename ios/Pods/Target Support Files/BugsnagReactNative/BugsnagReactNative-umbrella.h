#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "BugsnagReactNative.h"
#import "BSG_KSCrashReportWriter.h"
#import "Bugsnag.h"
#import "BugsnagBreadcrumb.h"
#import "BugsnagConfiguration.h"
#import "BugsnagCrashReport.h"
#import "BugsnagMetaData.h"
#import "BugsnagReactNative.h"

FOUNDATION_EXPORT double BugsnagReactNativeVersionNumber;
FOUNDATION_EXPORT const unsigned char BugsnagReactNativeVersionString[];

