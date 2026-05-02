import {FirebaseError} from 'firebase/app';

/** رسائل مبسّطة بالعربية لأخطاء تسجيل الدخول الشائعة */
export function firebaseErrorToArabic(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    if (
      error instanceof Error &&
      typeof error.message === 'string' &&
      error.message.length > 0
    ) {
      return error.message;
    }
    return 'حدث خطأ غير متوقّع.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    case 'auth/user-disabled':
      return 'تم إيقاف هذا الحساب. تواصل مع الدعم.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد أو كلمة المرور غير صحيحة.';
    case 'auth/email-already-in-use':
      return 'هذا البريد مسجّل مسبقاً. سجّل الدخول أو استخدم بريداً آخر.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
    case 'auth/network-request-failed':
      return 'مشكلة في الاتصال بالإنترنت.';
    default:
      return error.message || 'حدث خطأ غير متوقّع.';
  }
}
